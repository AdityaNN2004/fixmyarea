import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Hold the file in RAM just long enough to stream it to Cloudinary —
// nothing touches our server's disk
const upload = multer({
  storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 }, 
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// cloudinary's upload_stream is callback-based; wrap it in a Promise
// so route handlers can use async/await like everywhere else
function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'fixmyarea', resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

export { upload, uploadToCloudinary };