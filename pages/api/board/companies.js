import dbConnect from '@/src/DB/connection';
import Company from '@/src/DB/models/Company';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const companies = await Company.find({ isDeleted: false }).sort({ createdAt: -1 });
    return res.status(200).json(companies);
  }

  if (req.method === 'POST') {
    const { name, mission, goals, issuePrefix, brandColor } = req.body;
    if (!name || !issuePrefix) {
      return res.status(400).json({ error: 'name and issuePrefix are required' });
    }
    const company = await Company.create({
      name,
      mission: mission || '',
      goals: goals || [],
      issuePrefix: issuePrefix.toUpperCase(),
      brandColor: brandColor || '#6366f1',
    });
    return res.status(201).json(company);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
