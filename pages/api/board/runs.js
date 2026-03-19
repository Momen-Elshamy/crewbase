import dbConnect from '@/src/DB/connection';
import Run from '@/src/DB/models/Run';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();
  const { agentId, limit } = req.query;
  const filter = {};
  if (agentId) filter.agentId = agentId;

  const runs = await Run.find(filter)
    .populate('agentId', 'name role')
    .populate('taskId', 'title')
    .sort({ startedAt: -1 })
    .limit(parseInt(limit) || 50);

  return res.status(200).json(runs);
}
