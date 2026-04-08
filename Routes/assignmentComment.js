const router = require('express').Router();
const AssignmentComment = require('../schema/AssignmentCommentSchema');
const requireDb = require('../middleware/requireDb');

const MAX_COMMENT_LENGTH = 100_000;

router.use(requireDb);

// POST /api/assignment-comment - body: { userEmail?, assignmentName, sectionId, assignmentIndex, comment, checklistChecked? }
router.post('/', async (req, res) => {
  try {
    const { userEmail, assignmentName, sectionId, assignmentIndex, comment, checklistChecked } = req.body;

    if (comment == null || String(comment).trim() === '') {
      return res.status(400).json({ message: 'Comment is required.' });
    }

    const commentText = String(comment).trim();
    if (commentText.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({ message: `Comment is too long (max ${MAX_COMMENT_LENGTH} characters).` });
    }

    const sectionIdNum = sectionId != null ? parseInt(sectionId, 10) : 0;
    const assignmentIndexNum = assignmentIndex != null ? parseInt(assignmentIndex, 10) : 0;

    const emailNorm =
      userEmail && String(userEmail).trim()
        ? String(userEmail).trim().toLowerCase()
        : 'unknown';
    const doc = {
      userEmail: emailNorm,
      assignmentName: assignmentName || 'Assignment',
      sectionId: sectionIdNum,
      assignmentIndex: assignmentIndexNum,
      comment: commentText,
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
