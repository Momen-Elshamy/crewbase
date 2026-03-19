import dbConnect from '@/src/DB/connection';
import Comment from '@/src/DB/models/Comment';
import { authenticateAgent } from '@/src/lib/agentAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const agent = await authenticateAgent(req);
  if (!agent) return res.status(401).json({ error: 'Unauthorized' });

  await dbConnect();
  const { id } = req.query;
  const { body } = req.body;

  if (!body) return res.status(400).json({ error: 'body is required' });

  const comment = await Comment.create({
    taskId: id,
    authorId: agent._id,
    authorType: 'agent',
    body,
  });

  return res.status(201).json(comment);
}
