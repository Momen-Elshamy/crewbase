import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mission: { type: String, default: '' },
    goals: [{ type: String }],
    issuePrefix: { type: String, required: true, unique: true, uppercase: true },
    brandColor: { type: String, default: '#6366f1' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Company || mongoose.model('Company', CompanySchema);
