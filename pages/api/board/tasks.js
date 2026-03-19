import dbConnect from '@/src/DB/connection';
import Task from '@/src/DB/models/Task';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const { companyId, status, assigneeId, priority } = req.query;
    const filter = { isDeleted: false };
    if (companyId) filter.companyId = companyId;
    if (status) filter.status = { $in: status.split(',') };
    if (assigneeId) filter.assigneeId = assigneeId;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate('assigneeId', 'name type role')
      .sort({ priority: 1, createdAt: -1 });
    return res.status(200).json(tasks);
  }

  if (req.method === 'POST') {
    const { companyId, title, description, assigneeId, parentId, priority, status } = req.body;
    if (!companyId || !title) {
      return res.status(400).json({ error: 'companyId and title are required' });
    }

    const task = await Task.create({
      companyId,
      title,
      description: description || '',
      assigneeId: assigneeId || null,
      parentId: parentId || null,
      priority: priority || 'medium',
      status: status || 'todo',
    });
    return res.status(201).json(task);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
