import jwt from 'jsonwebtoken';

// Blocks the request unless a valid JWT cookie is present.
// On success, attaches { id, role } to req.user for downstream handlers.
export function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, role, iat, exp }
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired session' });
  }
}

// Usage: router.patch('/...', requireAuth, requireRole('admin'), handler)
export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}