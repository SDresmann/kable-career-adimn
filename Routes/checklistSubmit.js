const router = require('express').Router();
const mongoose = require('mongoose');
const multer = require('multer');
const ChecklistSubmission = require('../schema/ChecklistSubmissionSchema');

const DEFAULT_RECIPIENT_EMAIL = process.env.DEFAULT_RECIPIENT_EMAIL;

function dbReady() {
  return mongoose.connection.readyState === 1;
}

// Use memory storage so we can save buffer to MongoDB and attach to email
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// POST /api/checklist-submit - multipart: file (required), userEmail (optional), assignmentName (optional)
router.post('/', upload.single('file'), async (req, res) => {
  if (!dbReady()) {
    return res.status(503).json({ message: 'Service temporarily unavailable. Please try again in a moment.' });
  }
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please select a file (e.g. your resume or checklist).' });
    }

    const userEmail = req.body.userEmail || 'unknown';
    const assignmentName = req.body.assignmentName || 'Resume v1 Checklist';
    const originalFilename = req.file.originalname || 'attachment';
    const contentType = req.file.mimetype || 'application/octet-stream';
    const fileContent = req.file.buffer;

    // Save to MongoDB
    await ChecklistSubmission.create({
      userEmail,
      assignmentName,
      originalFilename,
      contentType,
      fileContent,
    });

    // Send email to instructor (RECIPIENT_EMAIL or DEFAULT_RECIPIENT_EMAIL in .env)
    const recipient = process.env.RECIPIENT_EMAIL || DEFAULT_RECIPIENT_EMAIL;
    if (recipient) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@kableacademy.com',
        to: recipient,
        subject: `[Kable] ${assignmentName} – ${userEmail}`,
        text: `Submission from ${userEmail} for "${assignmentName}". File attached.`,
        attachments: [
          { filename: originalFilename, content: fileContent, contentType: contentType || undefined },
        ],
      });
    } catch (emailErr) {
      console.error('Checklist submit: email failed', emailErr.message);
      // Still success – file was saved to MongoDB
    }
    }

    res.json({
      message: 'Submission received. Your file has been saved and sent to the instructor.',
      filename: originalFilename,
    });
  } catch (err) {
    console.error('Checklist submit error', err);
    res.status(500).json({ message: 'Submission failed. Please try again.' });
  }
});

module.exports = router;
