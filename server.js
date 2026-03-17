const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limit auth routes to reduce brute force and abuse
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { message: 'Too many attempts; try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Use "test" database so assignments and users are in the same DB the admin reads from
const uri = process.env.ATLAS_URI;
const dbName = process.env.MONGO_DB_NAME || 'test';

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

// Root – so backend URL doesn’t 404
app.get('/', (req, res) => {
    res.json({ message: 'Kable Career API', login: '/user/login', health: '/health' });
});

// Health check – so you can confirm backend and DB on Render
app.get('/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
    res.json({ ok: true, db: dbStatus });
});

const userRouter = require('./Routes/user');
app.use('/user', authLimiter, userRouter);

const checklistSubmitRouter = require('./Routes/checklistSubmit');
app.use('/api/checklist-submit', checklistSubmitRouter);

const assignmentCommentRouter = require('./Routes/assignmentComment');
app.use('/api/assignment-comment', assignmentCommentRouter);

// Catch unhandled errors so the server doesn't crash and we return 500 with a message
app.use((err, req, res, next) => {
    console.error('Unhandled error', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

// Start listening immediately so Render sees the service up; DB connects in background
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

if (uri) {
    const connectTimeout = 20000; // 20s for cold start
    mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: connectTimeout })
        .then(() => console.log(`MongoDB connected to database "${dbName}"`))
        .catch((err) => console.error('MongoDB connection error:', err.message));
} else {
    console.warn('ATLAS_URI not set in .env – add it to connect to MongoDB. Use double quotes: ATLAS_URI="mongodb+srv://..."');
}