const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { resolveWeekMediaPath } = require('./utils/weekMedia');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Render / reverse proxies: correct client IP for rate limiting
app.set('trust proxy', 1);

app.use(compression());
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
);
app.use(cors());
app.use(express.json({ limit: '512kb' }));

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { message: 'Too many attempts; try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

const submitLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    message: { message: 'Too many submissions; try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

const uri = process.env.ATLAS_URI;
const dbName = process.env.MONGO_DB_NAME || 'test';

app.get('/', (req, res) => {
    res.json({ message: 'Kable Career API', login: '/user/login', health: '/health' });
});

app.get('/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
    res.json({ ok: true, db: dbStatus });
});

function sendWeekMedia(req, res, subdir) {
    const id = parseInt(req.params.id, 10);
    const filename = (req.params.filename || '').replace(/\.\./g, '');
    if (!id || id < 1 || id > 12 || !filename) {
        return res.status(400).send('Invalid request');
    }
    const filePath = resolveWeekMediaPath(id, subdir, filename);
    if (!filePath) {
        return res.status(404).send('Not found');
    }
    res.sendFile(filePath);
}

app.get('/api/media/week/:id/video/:filename', (req, res) => {
    sendWeekMedia(req, res, 'video');
});

app.get('/api/media/week/:id/audio/:filename', (req, res) => {
    sendWeekMedia(req, res, 'audio');
});

const userRouter = require('./Routes/user');
app.use('/user', authLimiter, userRouter);

const checklistSubmitRouter = require('./Routes/checklistSubmit');
app.use('/api/checklist-submit', submitLimiter, checklistSubmitRouter);

const assignmentCommentRouter = require('./Routes/assignmentComment');
app.use('/api/assignment-comment', submitLimiter, assignmentCommentRouter);

app.use((err, req, res, next) => {
    console.error('Unhandled error', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

if (uri) {
    const connectTimeout = 20000;
    mongoose
        .connect(uri, {
            dbName,
            serverSelectionTimeoutMS: connectTimeout,
            maxPoolSize: 10,
            minPoolSize: 1,
            socketTimeoutMS: 45000,
        })
        .then(() => console.log(`MongoDB connected to database "${dbName}"`))
        .catch((err) => console.error('MongoDB connection error:', err.message));
} else {
    console.warn('ATLAS_URI not set in .env – add it to connect to MongoDB. Use double quotes: ATLAS_URI="mongodb+srv://..."');
}
