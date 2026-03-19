import dbConnect from '@/src/DB/connection';
import Member from '@/src/DB/models/Member';

export async function authenticateAgent(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const apiKey = authHeader.slice(7);
  await dbConnect();
  const agent = await Member.findOne({ apiKey, type: 'agent', isDeleted: false });
  return agent;
}
