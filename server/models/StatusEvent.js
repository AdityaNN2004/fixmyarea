import mongoose from 'mongoose';

const statusEventSchema = new mongoose.Schema(
  {
    issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
    status: {
      type: String,
      enum: ['reported', 'acknowledged', 'in_progress', 'resolved'],
      required: true,
    },
    note: { type: String, trim: true, maxlength: 300 },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('StatusEvent', statusEventSchema);