import dbConnect from '@/src/DB/connection';
import Member from '@/src/DB/models/Member';
import { runHeartbeat } from '@/src/lib/heartbeat';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = req.headers['x-heartbeat-secret'];
  if (secret !== process.env.HEARTBEAT_SECRET) {
    return res.status(403).json({ error: 'Invalid heartbeat secret' });
  }

  await dbConnect();

  const agents = await Member.find({
    type: 'agent',
    status: 'idle',
    isDeleted: false,
  });

  const results = [];
  for (const agent of agents) {
    const run = await runHeartbeat(agent);
    results.push(run);
  }

  return res.status(200).json({ runs: results });
}
