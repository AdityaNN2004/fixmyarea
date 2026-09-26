import { Router } from 'express';
import mongoose from 'mongoose';
import Issue from '../models/Issue.js';
import Comment from '../models/Comment.js';
import StatusEvent from '../models/StatusEvent.js';
// import { requireAuth } from '../middleware/auth.js';
import { upload, uploadToCloudinary } from '../middleware/upload.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// POST /api/issues — create a report (auth + photo required)
router.post('/', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    const { title, description, category, lat, lng, address } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'title, description and category are required' });
    }
    if (!req.file) return res.status(400).json({ message: 'Photo is required' });

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

    // First entry of the timeline — admin status changes will append more later
    await StatusEvent.create({
      issue: issue._id,
      status: 'reported',
      note: 'Issue reported',
      changedBy: req.user.id,
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
    console.error('❌ Feed failed:', err);
    res.status(500).json({ message: 'Failed to fetch issues' });
  }
});

// GET /api/issues/:id — detail + timeline + comments (public)
router.get('/:id', async (req, res) => {
  try {
    // Without this check, a bad id throws a CastError → ugly 500
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid issue id' });
    }

    const issue = await Issue.findById(req.params.id).populate('reportedBy', 'name');
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    // Both queries in parallel — faster than awaiting sequentially
    const [events, comments] = await Promise.all([
      StatusEvent.find({ issue: issue._id }).sort({ createdAt: 1 }).populate('changedBy', 'name'),
      Comment.find({ issue: issue._id }).sort({ createdAt: -1 }).populate('author', 'name'),
    ]);

    res.json({ issue, events, comments });
  } catch (err) {
    console.error('❌ Issue detail failed:', err);
    res.status(500).json({ message: 'Failed to fetch issue' });
  }
});

// POST /api/issues/:id/upvote — toggle "I see this too" (auth)
router.post('/:id/upvote', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Is this user already in the upvotes array?
    const already = await Issue.findOne({ _id: req.params.id, upvotes: userId });

    // $addToSet = add only if absent (no duplicates); $pull = remove
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      already ? { $pull: { upvotes: userId } } : { $addToSet: { upvotes: userId } },
      { new: true }
    );
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    res.json({ upvoteCount: issue.upvotes.length, upvoted: !already });
  } catch (err) {
    console.error('❌ Upvote failed:', err);
    res.status(500).json({ message: 'Failed to update upvote' });
  }
});

// POST /api/issues/:id/comments — add a comment (auth)
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const comment = await Comment.create({
      issue: req.params.id,
      author: req.user.id,
      text: text.trim(),
    });
    await comment.populate('author', 'name');

    res.status(201).json({ comment });
  } catch (err) {
    console.error('❌ Comment failed:', err);
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

const VALID_STATUSES = ['acknowledged', 'in_progress', 'resolved'];

// PATCH /api/issues/:id/status — admin moves an issue through the pipeline
router.patch('/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    if (issue.status === 'resolved') return res.status(400).json({ message: 'Resolved issues are closed' });
    if (issue.status === status) return res.status(400).json({ message: `Issue is already ${status}` });

    issue.status = status;
    await issue.save();

    // The whole point of the StatusEvent model: the public timeline grows
    await StatusEvent.create({
      issue: issue._id,
      status,
      note: note?.trim() || undefined,
      changedBy: req.user.id,
    });

    res.json({ issue });
  } catch (err) {
    console.error('❌ Status update failed:', err);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

export default router;