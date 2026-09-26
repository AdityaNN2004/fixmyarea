import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const email = process.argv[2] || 'admin@fixmyarea.com';
const password = process.argv[3] || 'admin123';

await mongoose.connect(process.env.MONGO_URI);

const existing = await User.findOne({ email });
if (existing) {
  await User.updateOne({ _id: existing._id }, { role: 'admin' });
  console.log(`⬆️  Existing user ${email} promoted to admin`);
} else {
  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ name: 'Admin', email, passwordHash, role: 'admin' });
  console.log(`✅ Admin created → ${email} / ${password}`);
}

await mongoose.disconnect();