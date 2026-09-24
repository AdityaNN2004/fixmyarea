import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // 'Aditya@x.com' and 'aditya@x.com' become the same account
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['citizen', 'admin'], default: 'citizen' },
  },
  { timestamps: true }
);

// Used at login: compare a plaintext attempt against the stored hash
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

// SECURITY: never let passwordHash leak into any JSON response
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

export default mongoose.model('User', userSchema);