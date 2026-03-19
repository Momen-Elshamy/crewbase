import dbConnect from '@/src/DB/connection';
import Member from '@/src/DB/models/Member';
import { runHeartbeat } from '@/src/lib/heartbeat';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();
  const { agentId } = req.query;

  const agent = await Member.findOne({ _id: agentId, type: 'agent', isDeleted: false });
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  const run = await runHeartbeat(agent);
  return res.status(200).json(run);
}
