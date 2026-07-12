const asyncWrapper = require('../../middleware/asyncWrapper');
const Bookmark = require('../../models/Bookmark');
const pick = require('../../utils/pick');
const { BOOKMARK_WRITABLE_FIELDS } = require('../../utils/writableFields');

// @desc      Create new bookmark
// @route     POST /api/bookmarks
// @access    Private
const createBookmark = asyncWrapper(async (req, res, next) => {
  let bookmark;

  let body = {
    ...pick(req.body, BOOKMARK_WRITABLE_FIELDS),
    categoryId: parseInt(req.body.categoryId),
  };

  if (body.icon) {
    body.icon = body.icon.trim();
  }

  if (req.file) {
    body.icon = req.file.filename;
  }

  bookmark = await Bookmark.create(body);

  res.status(201).json({
    success: true,
    data: bookmark,
  });
});

module.exports = createBookmark;
