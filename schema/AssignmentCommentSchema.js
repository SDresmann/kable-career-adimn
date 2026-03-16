const mongoose = require('mongoose');

const assignmentCommentSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, default: 'unknown' },
  assignmentName: { type: String, required: true },
  sectionId: { type: Number, required: true },
  assignmentIndex: { type: Number, required: true },
  comment: { type: String, required: true },
  checklistChecked: { type: [Boolean], default: undefined },
  submittedAt: { type: Date, default: Date.now },
});

const AssignmentComment = mongoose.model('AssignmentComment', assignmentCommentSchema);

module.exports = AssignmentComment;
