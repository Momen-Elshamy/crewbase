import mongoose from 'mongoose';

const RunSchema = new mongoose.Schema(
  {
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    status: {
      type: String,
      enum: ['running', 'done', 'failed'],
      default: 'running',
    },
    log: { type: String, default: '' },
    costCents: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Run || mongoose.model('Run', RunSchema);
