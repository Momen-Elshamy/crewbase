import dbConnect from '@/src/DB/connection';
import Comment from '@/src/DB/models/Comment';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await dbConnect();
  const { taskId } = req.query;
  if (!taskId) return res.status(400).json({ error: 'taskId is required' });

  const comments = await Comment.find({ taskId, isDeleted: false })
    .populate('authorId', 'name type role')
    .sort({ createdAt: 1 });

  return res.status(200).json(comments);
}
