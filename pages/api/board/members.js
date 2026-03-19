import dbConnect from '@/src/DB/connection';
import Member from '@/src/DB/models/Member';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const { companyId } = req.query;
    const filter = { isDeleted: false };
    if (companyId) filter.companyId = companyId;
    const members = await Member.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(members);
  }

  if (req.method === 'POST') {
    const { companyId, name, role, type, reportsTo, notifyVia, adapterConfig, skills, rules, heartbeatCron } = req.body;
    if (!companyId || !name || !role || !type) {
      return res.status(400).json({ error: 'companyId, name, role, and type are required' });
    }

    const memberData = {
      companyId,
      name,
      role,
      type,
      reportsTo: reportsTo || null,
    };

    if (type === 'human') {
      memberData.notifyVia = notifyVia || 'email';
    }

    if (type === 'agent') {
      memberData.adapterType = 'api-key';
      memberData.adapterConfig = adapterConfig || { provider: 'anthropic', model: 'claude-sonnet-4-20250514' };
      memberData.skills = skills || [];
      memberData.rules = rules || [];
      memberData.heartbeatCron = heartbeatCron || '*/30 * * * *';
      memberData.apiKey = `cb_${uuidv4().replace(/-/g, '')}`;
      memberData.status = 'idle';
    }

    const member = await Member.create(memberData);
    return res.status(201).json(member);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
