const express = require('express');
const path = require('path');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const ensureAuth = require('../middleware/auth');

// Serve HTML pages
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'regpage.html'));
});

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'loginpage.html'));
});

router.get('/user', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'user.html'));
});

router.get('/dashboard', ensureAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
});

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.send('User already exists. <a href="/login">Login here</a>');
        }

        const hashed = await bcrypt.hash(password, 10);
        // Accept only allowed roles from registration form; default to 'learner'
        const allowed = ['teacher', 'learner'];
        const assignedRole = allowed.includes(role) ? role : 'learner';
        const newUser = new User({ name, email, password: hashed, role: assignedRole });
        await newUser.save();
        res.send('Registration successful! <a href="/login">Login now</a>');
    } catch (err) {
        res.send('Server error: ' + err.message);
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.send('Invalid email or password. <a href="/login">Try again</a>');
        }

        // First try bcrypt compare. If that fails, allow a one-time
        // migration from legacy plaintext password: if stored password
        // equals the submitted password, hash it and save.
        let ok = false;
        try {
            ok = await bcrypt.compare(password, user.password);
        } catch (e) {
            ok = false;
        }

        if (!ok) {
            // legacy plaintext fallback
            if (user.password === password) {
                const hashed = await bcrypt.hash(password, 10);
                user.password = hashed;
                await user.save();
                ok = true;
            }
        }

        if (!ok) return res.send('Invalid email or password. <a href="/login">Try again</a>');

        // create session
        req.session.userId = String(user._id);
        res.redirect('/user?id=' + user._id);

    } catch (err) {
        res.send('Server error: ' + err.message);
    }
});

// Logout
router.get('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) console.error('Session destroy error', err);
            res.clearCookie('connect.sid');
            res.redirect('/');
        });
    } else {
        res.redirect('/');
    }
});

module.exports = router;
