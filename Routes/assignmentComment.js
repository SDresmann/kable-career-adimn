const router = require('express').Router();
const mongoose = require('mongoose');
const AssignmentComment = require('../schema/AssignmentCommentSchema');

function dbReady() {
  return mongoose.connection.readyState === 1;
}

// POST /api/assignment-comment - body: { userEmail?, assignmentName, sectionId, assignmentIndex, comment, checklistChecked? }
router.post('/', async (req, res) => {
  if (!dbReady()) {
    return res.status(503).json({ message: 'Service temporarily unavailable. Please try again in a moment.' });
  }
  try {
    const { userEmail, assignmentName, sectionId, assignmentIndex, comment, checklistChecked } = req.body;

    if (comment == null || String(comment).trim() === '') {
      return res.status(400).json({ message: 'Comment is required.' });
    }

    const sectionIdNum = sectionId != null ? parseInt(sectionId, 10) : 0;
    const assignmentIndexNum = assignmentIndex != null ? parseInt(assignmentIndex, 10) : 0;

    const doc = {
      userEmail: userEmail || 'unknown',
      assignmentName: assignmentName || 'Assignment',
      sectionId: sectionIdNum,
      assignmentIndex: assignmentIndexNum,
      comment: String(comment).trim(),
    };
    if (Array.isArray(checklistChecked)) {
      doc.checklistChecked = checklistChecked.map((v) => Boolean(v));
    }

    await AssignmentComment.create(doc);

    res.json({
      message: 'Your comment has been saved. We will review it in our one-on-one.',
    });
  } catch (err) {
    console.error('Assignment comment submit error', err);
    res.status(500).json({ message: 'Submission failed. Please try again.' });
  }
});

module.exports = router;
