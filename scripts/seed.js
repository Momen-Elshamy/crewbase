const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crewbase';

// Define schemas inline for the seed script (CommonJS)
const CompanySchema = new mongoose.Schema({
  name: String,
  mission: String,
  goals: [String],
  issuePrefix: { type: String, unique: true },
  brandColor: String,
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const MemberSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  name: String,
  role: String,
  type: { type: String, enum: ['human', 'agent'] },
  reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
  isDeleted: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, default: null },
  notifyVia: { type: String, default: 'email' },
  adapterType: { type: String, default: null },
  adapterConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
  skills: [String],
  rules: [String],
  heartbeatCron: { type: String, default: null },
  status: { type: String, default: 'idle' },
  apiKey: { type: String, index: true, sparse: true },
}, { timestamps: true });

const TaskSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  title: String,
  description: { type: String, default: '' },
  assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  status: { type: String, default: 'todo' },
  priority: { type: String, default: 'medium' },
  isDeleted: { type: Boolean, default: false },
  hasApproval: { type: Boolean, default: false },
  checkoutBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  startedAt: Date,
  completedAt: Date,
}, { timestamps: true });

const Company = mongoose.models.Company || mongoose.model('Company', CompanySchema);
const Member = mongoose.models.Member || mongoose.model('Member', MemberSchema);
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);

  // Clear existing data
  await Company.deleteMany({});
  await Member.deleteMany({});
  await Task.deleteMany({});

  console.log('Creating demo company...');
  const company = await Company.create({
    name: 'Acme Corp',
    mission: 'Build the future with human-agent collaboration',
    goals: ['Ship MVP', 'Onboard first customer', 'Reach 100 tasks processed'],
    issuePrefix: 'ACM',
    brandColor: '#6366f1',
  });

  console.log('Creating members...');
  const ceo = await Member.create({
    companyId: company._id,
    name: 'Alice Chen',
    role: 'CEO',
    type: 'human',
    notifyVia: 'email',
  });

  const coder = await Member.create({
    companyId: company._id,
    name: 'CodeBot',
    role: 'Senior Engineer',
    type: 'agent',
    reportsTo: ceo._id,
    adapterType: 'api-key',
    adapterConfig: { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
    skills: ['javascript', 'react', 'node.js', 'mongodb'],
    rules: ['Always write tests', 'Follow Premast conventions'],
    heartbeatCron: '*/30 * * * *',
    status: 'idle',
    apiKey: `cb_${uuidv4().replace(/-/g, '')}`,
  });

  const reviewer = await Member.create({
    companyId: company._id,
    name: 'ReviewBot',
    role: 'QA Engineer',
    type: 'agent',
    reportsTo: ceo._id,
    adapterType: 'api-key',
    adapterConfig: { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
    skills: ['code-review', 'testing', 'security-audit'],
    rules: ['Check for security vulnerabilities', 'Verify test coverage'],
    heartbeatCron: '0 * * * *',
    status: 'idle',
    apiKey: `cb_${uuidv4().replace(/-/g, '')}`,
  });

  console.log('Creating tasks...');
  await Task.create([
    {
      companyId: company._id,
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment.',
      assigneeId: coder._id,
      status: 'todo',
      priority: 'high',
    },
    {
      companyId: company._id,
      title: 'Implement user authentication',
      description: 'Add login/signup flow with NextAuth.js credentials provider.',
      assigneeId: coder._id,
      status: 'in_progress',
      priority: 'critical',
      startedAt: new Date(),
    },
    {
      companyId: company._id,
      title: 'Review authentication PR',
      description: 'Review the auth implementation for security issues.',
      assigneeId: reviewer._id,
      status: 'todo',
      priority: 'high',
    },
    {
      companyId: company._id,
      title: 'Design landing page',
      description: 'Create a clean, modern landing page for Crewbase.',
      status: 'done',
      priority: 'medium',
      completedAt: new Date(),
    },
    {
      companyId: company._id,
      title: 'Fix MongoDB connection timeout',
      description: 'Connection drops after idle period. Need to implement reconnection logic.',
      assigneeId: coder._id,
      status: 'blocked',
      priority: 'high',
    },
  ]);

  console.log('Seed complete!');
  console.log(`  Company: ${company.name} (${company.issuePrefix})`);
  console.log(`  Members: ${ceo.name}, ${coder.name} (key: ${coder.apiKey}), ${reviewer.name} (key: ${reviewer.apiKey})`);
  console.log(`  Tasks: 5 created`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
