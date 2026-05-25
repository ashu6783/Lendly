import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { env } from '../config/env';

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

// Ensure the uploads directory exists.
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const userId = req.user?.id ?? 'anon';
    cb(null, `slip_${userId}_${Date.now()}${ext}`);
  },
});

export const uploadSalarySlip = multer({
  storage,
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024 }, // max 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, and PNG files are allowed.'));
    }
  },
}).single('salarySlip');

export { UPLOAD_DIR };
