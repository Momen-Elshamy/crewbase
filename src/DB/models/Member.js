import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    type: { type: String, enum: ['human', 'agent'], required: true },
    reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
    isDeleted: { type: Boolean, default: false },
    // Human fields
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notifyVia: { type: String, enum: ['email', 'telegram', 'slack'], default: 'email' },
    // Agent fields
    adapterType: { type: String, enum: ['api-key'], default: null },
    adapterConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    skills: [{ type: String }],
    rules: [{ type: String }],
    heartbeatCron: { type: String, default: null },
    status: { type: String, enum: ['idle', 'running', 'paused'], default: 'idle' },
    apiKey: { type: String, index: true, sparse: true },
  },
  { timestamps: true }
);

export default mongoose.models.Member || mongoose.model('Member', MemberSchema);
