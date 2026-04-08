const mongoose = require('mongoose');

/** Returns 503 until MongoDB is connected (avoids repeating the same check in every route). */
function requireDb(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Service temporarily unavailable. Please try again in a moment.',
    });
  }
  next();
}

module.exports = requireDb;
