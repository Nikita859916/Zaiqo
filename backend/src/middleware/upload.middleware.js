import multer from 'multer';
import { badRequest } from '../utils/apiError.js';

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Store in memory buffer so vision providers can analyze without disk persistence
const storage = multer.memoryStorage();

export const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      badRequest('Invalid file format. Only JPEG, PNG, and WebP images are supported.'),
      false
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
});

/**
 * Middleware for single image upload named 'image'
 */
export const uploadFoodPhoto = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(badRequest('File size exceeds the maximum limit of 10 MB.'));
        }
        return next(badRequest(`Upload error: ${err.message}`));
      }
      return next(err);
    }
    next();
  });
};

export default uploadFoodPhoto;
