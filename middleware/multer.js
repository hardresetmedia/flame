const crypto = require('crypto');
const fs = require('fs');
const { extname } = require('path');
const multer = require('multer');
const ErrorResponse = require('../utils/ErrorResponse');

if (!fs.existsSync('data/uploads')) {
  fs.mkdirSync('data/uploads', { recursive: true });
}

// extension -> accepted client-declared mimetypes for icon uploads. Both
// must agree here, and middleware/validateUpload.js then verifies the
// actual file content (magic bytes / SVG sanitization) after storage.
const ALLOWED_TYPES = {
  '.png': ['image/png'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.svg': ['image/svg+xml'],
  '.ico': ['image/x-icon', 'image/vnd.microsoft.icon'],
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './data/uploads');
  },
  filename: (req, file, cb) => {
    // Server-generated name: nothing from file.originalname is used except
    // its (allow-listed) extension — stops path traversal via crafted names.
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = extname(file.originalname).toLowerCase();
  const allowedMimetypes = ALLOWED_TYPES[ext];

  if (!allowedMimetypes || !allowedMimetypes.includes(file.mimetype)) {
    return cb(
      new ErrorResponse(
        `Unsupported icon upload type '${ext || file.mimetype}'`,
        400
      )
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
});

module.exports = upload.single('icon');
