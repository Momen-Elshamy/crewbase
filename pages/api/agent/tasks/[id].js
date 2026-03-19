import dbConnect from '@/src/DB/connection';
import Task from '@/src/DB/models/Task';
import Comment from '@/src/DB/models/Comment';
import { authenticateAgent } from '@/src/lib/agentAuth';

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const agent = await authenticateAgent(req);
  if (!agent) return res.status(401).json({ error: 'Unauthorized' });

  await dbConnect();
  const { id } = req.query;
  const { status, comment, priority } = req.body;

  const update = {};
  if (status) {
    update.status = status;
    if (status === 'in_progress' && !update.startedAt) update.startedAt = new Date();
    if (status === 'done') update.completedAt = new Date();
  }
  if (priority) update.priority = priority;

  const task = await Task.findOneAndUpdate(
    { _id: id, assigneeId: agent._id, isDeleted: false },
    { $set: update },
    { new: true }
  );

  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (comment) {
    await Comment.create({
      taskId: task._id,
      authorId: agent._id,
      authorType: 'agent',
      body: comment,
    });
  }

  return res.status(200).json(task);
}
