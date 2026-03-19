import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    authorType: { type: String, enum: ['human', 'agent'], required: true },
    body: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
