import { Router } from 'express';
import Issue from '../models/Issue.js';
import { requireAuth } from '../middleware/auth.js';
import { upload, uploadToCloudinary } from '../middleware/upload.js';

const router = Router();

// POST /api/issues — create a report (auth + photo required)
router.post('/', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    const { title, description, category, lat, lng, address } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'title, description and category are required' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Photo is required' });
    }

    const longitude = parseFloat(lng);
    const latitude = parseFloat(lat);
    if (Number.isNaN(longitude) || Number.isNaN(latitude)) {
      return res.status(400).json({ message: 'Valid lat/lng are required' });
    }

    const result = await uploadToCloudinary(req.file.buffer);

    const issue = await Issue.create({
      title,
      description,
      category,
      photoUrl: result.secure_url,
      location: { type: 'Point', coordinates: [longitude, latitude] }, // lng FIRST
      address,
      reportedBy: req.user.id,
    });

    res.status(201).json({ issue });
  } catch (err) {
  console.error('❌ Issue creation failed:', err);  
  res.status(500).json({ message: 'Failed to create issue' });
}
});

// GET /api/issues — public feed with filters + pagination
router.get('/', async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const issues = await Issue.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('reportedBy', 'name');

    const total = await Issue.countDocuments(filter);

    res.json({ issues, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch issues' });
  }
});

export default router;