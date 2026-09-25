import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, maxlength: 2000 },
    category: {
      type: String,
      required: true,
      enum: ['pothole', 'garbage', 'streetlight', 'water', 'traffic', 'other'],
    },
    status: {
      type: String,
      enum: ['reported', 'acknowledged', 'in_progress', 'resolved'],
      default: 'reported',
    },
    photoUrl: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], required: true }, // always 'Point'
      coordinates: {
        type: [Number],
        required: true,
        // ⚠️ GeoJSON order is [LONGITUDE, LATITUDE] — backwards from
        // what you'd expect. Getting this wrong is THE classic bug.
      },
    },
    address: { type: String, trim: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // ready for Phase 3
  },
  { timestamps: true }
);

// THE star of this project: enables $near queries ("issues within 2km of me")
issueSchema.index({ location: '2dsphere' });

export default mongoose.model('Issue', issueSchema);