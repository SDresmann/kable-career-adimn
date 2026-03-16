/**
 * Lightweight validation/sanitization for auth payloads.
 * Use express-validator for more complex rules if needed.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;
const MAX_PASSWORD = 128;
const MAX_EMAIL_LENGTH = 254;

function validateRegister(body) {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    const errors = [];

    if (!email) errors.push('Email is required');
    else if (email.length > MAX_EMAIL_LENGTH) errors.push('Email is too long');
    else if (!EMAIL_REGEX.test(email)) errors.push('Email format is invalid');

    if (!password) errors.push('Password is required');
    else if (password.length < MIN_PASSWORD) errors.push(`Password must be at least ${MIN_PASSWORD} characters`);
    else if (password.length > MAX_PASSWORD) errors.push('Password is too long');

    return {
        valid: errors.length === 0,
        email,
        password: errors.length ? '' : password,
        message: errors[0] || null,
    };
}

function validateLogin(body) {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
        return { valid: false, email: '', password: '', message: 'Email and password are required' };
    }

    return {
        valid: true,
        email,
        password,
        message: null,
    };
}

module.exports = { validateRegister, validateLogin };
