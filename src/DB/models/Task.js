import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null, index: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'blocked', 'in_review', 'done', 'cancelled'],
      default: 'todo',
      index: true,
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    isDeleted: { type: Boolean, default: false },
    hasApproval: { type: Boolean, default: false },
    checkoutBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
