import dbConnect from '@/src/DB/connection';
import Task from '@/src/DB/models/Task';
import { authenticateAgent } from '@/src/lib/agentAuth';

export default async function handler(req, res) {
  const agent = await authenticateAgent(req);
  if (!agent) return res.status(401).json({ error: 'Unauthorized' });

  await dbConnect();

  if (req.method === 'GET') {
    const tasks = await Task.find({
      assigneeId: agent._id,
      isDeleted: false,
    }).sort({ priority: 1, createdAt: -1 });
    return res.status(200).json(tasks);
  }

  if (req.method === 'POST') {
    const { title, description, parentId, priority } = req.body;
    const task = await Task.create({
      companyId: agent.companyId,
      title,
      description: description || '',
      assigneeId: agent._id,
      parentId: parentId || null,
      priority: priority || 'medium',
    });
    return res.status(201).json(task);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
