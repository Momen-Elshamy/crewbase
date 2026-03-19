import dbConnect from '@/src/DB/connection';
import Task from '@/src/DB/models/Task';
import { authenticateAgent } from '@/src/lib/agentAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const agent = await authenticateAgent(req);
  if (!agent) return res.status(401).json({ error: 'Unauthorized' });

  await dbConnect();
  const { id } = req.query;

  const task = await Task.findOneAndUpdate(
    {
      _id: id,
      isDeleted: false,
      $or: [
        { checkoutBy: null },
        { checkoutBy: agent._id },
      ],
    },
    {
      $set: {
        checkoutBy: agent._id,
        status: 'in_progress',
        startedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!task) {
    return res.status(409).json({ error: 'Task already checked out by another agent' });
  }

  return res.status(200).json(task);
}
