const mongoose = require('mongoose');

const checklistSubmissionSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, default: 'unknown' },
  assignmentName: { type: String, required: true, default: 'Resume v1 Checklist' },
  originalFilename: { type: String, required: true },
  contentType: { type: String, default: 'application/octet-stream' },
  fileContent: { type: Buffer, required: true },
  submittedAt: { type: Date, default: Date.now },
});

const ChecklistSubmission = mongoose.model('ChecklistSubmission', checklistSubmissionSchema);

module.exports = ChecklistSubmission;
