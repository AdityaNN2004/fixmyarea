import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Allow our React app (port 5173) to call this API, and allow cookies
// (we'll need that for JWT auth later)
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json()); // parse JSON request bodies

// Health check — proof the server is alive.
// Later we'll extend this to also report MongoDB connection status.
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'fixmyarea-api',
    time: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});