const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../schema/LoginScema');
const bcrypt = require('bcrypt');
const { validateRegister, validateLogin } = require('../middleware/validateAuth');
const { signToken } = require('../middleware/authJwt');

function dbReady() {
    return mongoose.connection.readyState === 1;
}

// Register
router.post('/register', async (req, res) => {
    if (!dbReady()) {
        return res.status(503).json({ message: 'Service temporarily unavailable. Please try again in a moment.' });
    }
    try {
        const { valid, email, password, message } = validateRegister(req.body);
        if (!valid) {
            return res.status(400).json({ message });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        const user = await User.create({ email, password });
        res.status(201).json({ message: 'User created', userId: user._id, email: user.email });
    } catch (err) {
        // Don't leak DB/validation details to client
        const msg = err.code === 11000 ? 'Email already registered' : 'Registration failed';
        res.status(500).json({ message: msg });
    }
});

// Login
router.post('/login', async (req, res) => {
    if (!dbReady()) {
        return res.status(503).json({ message: 'Service temporarily unavailable. Please try again in a moment.' });
    }
    try {
        const { valid, email, password, message } = validateLogin(req.body);
        if (!valid) {
            return res.status(400).json({ message });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = signToken(user._id);
        res.json({ message: 'Login successful', userId: user._id, email: user.email, token });
    } catch (err) {
        res.status(500).json({ message: 'Login failed' });
    }
});

module.exports = router;
