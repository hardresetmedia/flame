// Post-upload content validation for icon files, wired directly after the
// multer middleware in routes/apps.js and routes/bookmark.js:
//   - raster/ico formats must start with their magic bytes (the multer
//     fileFilter only sees the client-declared, spoofable mimetype),
//   - SVGs are sanitized in place with DOMPurify — uploaded SVGs render
//     inline in the client via external-svg-loader, so script content
//     inside them would be stored XSS.
// On any mismatch the stored file is deleted and the request fails 400.
const fs = require('fs');
const { extname } = require('path');
const ErrorResponse = require('../utils/ErrorResponse');

const MAGIC_BYTES = {
  '.png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
  '.jpg': [Buffer.from([0xff, 0xd8, 0xff])],
  '.jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  '.ico': [
    Buffer.from([0x00, 0x00, 0x01, 0x00]),
    // some .ico files are actually PNGs; browsers accept both
    Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  ],
};

// DOMPurify needs a DOM implementation; jsdom is heavy to boot, so it is
// created lazily on the first SVG upload and reused afterwards.
let purifier = null;
const getPurifier = () => {
  if (!purifier) {
    const createDOMPurify = require('dompurify');
    const { JSDOM } = require('jsdom');
    purifier = createDOMPurify(new JSDOM('').window);
  }

  return purifier;
};

const validateUpload = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const filePath = req.file.path;
  const ext = extname(req.file.filename).toLowerCase();

  const fail = (message) => {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // best effort — the file may already be gone
    }
    delete req.file;
    next(new ErrorResponse(message, 400));
  };

  try {
    if (ext === '.svg') {
      const original = fs.readFileSync(filePath, 'utf-8');

      if (!/<svg[\s>]/i.test(original)) {
        return fail('Uploaded file is not a valid SVG');
      }

      const sanitized = getPurifier().sanitize(original, {
        USE_PROFILES: { svg: true, svgFilters: true },
      });

      fs.writeFileSync(filePath, sanitized);
      return next();
    }

    const expectedMagic = MAGIC_BYTES[ext];

    if (!expectedMagic) {
      // multer's fileFilter should make this unreachable
      return fail(`Unsupported icon upload type '${ext}'`);
    }

    const fd = fs.openSync(filePath, 'r');
    const header = Buffer.alloc(8);
    fs.readSync(fd, header, 0, header.length, 0);
    fs.closeSync(fd);

    const matches = expectedMagic.some((magic) =>
      header.subarray(0, magic.length).equals(magic)
    );

    if (!matches) {
      return fail('Uploaded file content does not match its extension');
    }

    next();
  } catch (err) {
    fail('Could not validate the uploaded file');
  }
};

module.exports = validateUpload;
