import { Router } from 'express';
import Issue from '../models/Issue.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// applies to EVERY route below — one line instead of repeating on each
router.use(requireAuth, requireRole('admin'));

// GET /api/admin/stats — counts grouped by status and category
router.get('/stats', async (_req, res) => {
  try {
    const [byStatus, byCategory, total] = await Promise.all([
      Issue.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Issue.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Issue.countDocuments(),
    ]);
    res.json({ total, byStatus, byCategory });
  } catch (err) {
    console.error('❌ Stats failed:', err);
    res.status(500).json({ message: 'Failed to load stats' });
  }
});

export default router;