const router = require('express').Router();
const User = require('../schema/LoginScema');
const bcrypt = require('bcrypt');
const { validateRegister, validateLogin, validateChangePassword } = require('../middleware/validateAuth');
const { signToken, verifyToken } = require('../middleware/authJwt');
const requireDb = require('../middleware/requireDb');

router.use(requireDb);

// Register
router.post('/register', async (req, res) => {
    try {
        const { valid, email, password, message } = validateRegister(req.body);
        if (!valid) {
            return res.status(400).json({ message });
        }

        const existing = await User.findOne({ email }).select('_id');
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
    try {
        const { valid, email, password, message } = validateLogin(req.body);
        if (!valid) {
            return res.status(400).json({ message });
        }

        const user = await User.findOne({ email }).select('email password');
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

// Change password (requires Authorization: Bearer <token>)
router.post('/change-password', verifyToken, async (req, res) => {
    try {
        const { valid, currentPassword, newPassword, message } = validateChangePassword(req.body);
        if (!valid) {
            return res.status(400).json({ message });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'Account not found' });
        }

        const validCurrent = await bcrypt.compare(currentPassword, user.password);
        if (!validCurrent) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Could not update password' });
    }
});

module.exports = router;
