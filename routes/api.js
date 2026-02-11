const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const User = require('../models/user');
const Course = require('../models/course');
const ensureAuth = require('../middleware/auth');
const Lesson = require('../models/lesson');

function isAdmin(req) {
    return req.user && req.user.role === 'admin';
}

// --- Users CRUD ---
// GET /api/users - admin only: list users
router.get('/users', ensureAuth, async (req, res) => {
    try {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        const users = await User.find().select('-password');
        res.json(users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/users/:id - admin or owner
router.get('/users/:id', ensureAuth, async (req, res) => {
    try {
        if (!isAdmin(req) && String(req.user._id) !== String(req.params.id)) return res.status(403).json({ error: 'Forbidden' });
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/users - admin creates user
router.post('/users', ensureAuth, async (req, res) => {
    try {
        if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
        const { name, email, password, role } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: 'Email already in use' });
        const hashed = await bcrypt.hash(password || 'changeme', 10);
        const user = new User({ name, email, password: hashed, role: role || 'user' });
        await user.save();
        res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/users/:id - update (admin or owner). Only admin may change role
router.put('/users/:id', ensureAuth, async (req, res) => {
    try {
        const targetId = String(req.params.id);
        if (!isAdmin(req) && String(req.user._id) !== targetId) return res.status(403).json({ error: 'Forbidden' });
        const updates = {};
        const { name, email, password, role } = req.body;
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (password) updates.password = await bcrypt.hash(password, 10);
        if (role && isAdmin(req)) updates.role = role;
        const user = await User.findByIdAndUpdate(targetId, updates, { new: true }).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/users/:id - admin or owner (owner can delete themselves)
router.delete('/users/:id', ensureAuth, async (req, res) => {
    try {
        const targetId = String(req.params.id);
        if (!isAdmin(req) && String(req.user._id) !== targetId) return res.status(403).json({ error: 'Forbidden' });
        await User.findByIdAndDelete(targetId);
        // optionally delete courses owned by user
        await Course.deleteMany({ owner: targetId });
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Courses CRUD ---
// GET /api/courses - admin: all, user: own courses
router.get('/courses', ensureAuth, async (req, res) => {
    try {
        let docs;
        if (isAdmin(req)) docs = await Course.find().populate('owner', 'name email');
        else docs = await Course.find({ owner: req.user._id }).populate('owner', 'name email');
        res.json(docs.map(c => ({ id: c._id, name: c.name, topic: c.topic, owner: c.owner }))); 
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/my-courses - teacher/admin: own (admin all), learner: enrolled
router.get('/my-courses', ensureAuth, async (req, res) => {
    try {
        console.log('GET /api/my-courses - User:', req.user.email, 'Role:', req.user.role);
        
        let docs;
        if (req.user.role === 'learner') {
            docs = await Course.find({ students: req.user._id }).populate('owner', 'name email');
        } else if (isAdmin(req)) {
            docs = await Course.find().populate('owner', 'name email');
        } else {
            docs = await Course.find({ owner: req.user._id }).populate('owner', 'name email');
        }
        
        console.log('Found courses:', docs.length);
        
        // Fetch lessons for each course
        const coursesWithLessons = await Promise.all(docs.map(async (c) => {
            const lessons = await Lesson.find({ course: c._id }).sort('order');
            return {
                id: c._id,  // Changed from _id to id for consistency
                _id: c._id,  // Keep both for compatibility
                name: c.name,
                topic: c.topic,
                owner: c.owner,
                students: c.students,
                lessons: lessons
            };
        }));
        
        console.log('Returning courses with lessons:', JSON.stringify(coursesWithLessons, null, 2));
        
        res.json(coursesWithLessons);
    } catch (err) { 
        console.error('Error in /api/my-courses:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// --- Public Catalog ---
// GET /api/catalog/courses - list all courses (public)
router.get('/catalog/courses', async (req, res) => {
    try {
        const courses = await Course.find().populate('owner', 'name email');
        res.json(courses.map(c => ({
            id: c._id,
            name: c.name,
            topic: c.topic,
            owner: c.owner
        })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/catalog/courses/:id - course with lessons (public shows only published, owner sees all)
router.get('/catalog/courses/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('owner', 'name email');
        if (!course) return res.status(404).json({ error: 'Course not found' });
        
        // Check if user is owner or admin
        const isOwner = req.user && (String(req.user._id) === String(course.owner._id) || req.user.role === 'admin');
        
        // Check if user is enrolled
        const isEnrolled = req.user && (course.students || []).some(id => String(id) === String(req.user._id));
        
        // If owner/admin, show all lessons. Otherwise only published
        const lessonFilter = isOwner ? { course: course._id } : { course: course._id, isPublished: true };
        const lessons = await Lesson.find(lessonFilter).sort('order');
        
        res.json({
            id: course._id,
            name: course.name,
            topic: course.topic,
            owner: course.owner,
            isEnrolled: isEnrolled,
            lessons: lessons.map(l => ({
                id: l._id,
                title: l.title,
                type: l.type,
                order: l.order,
                duration: l.duration,
                videoUrl: l.videoUrl,
                attachments: l.attachments,
                isPublished: l.isPublished
            }))
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/courses/:id - admin or owner
router.get('/courses/:id', ensureAuth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('owner', 'name email');
        if (!course) return res.status(404).json({ error: 'Course not found' });
        if (!isAdmin(req) && String(course.owner._id) !== String(req.user._id)) return res.status(403).json({ error: 'Forbidden' });
        res.json({ id: course._id, name: course.name, topic: course.topic, owner: course.owner });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/courses/:id/students - owner/admin only
router.get('/courses/:id/students', ensureAuth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('students', 'name email');
        if (!course) return res.status(404).json({ error: 'Course not found' });
        if (!isAdmin(req) && String(course.owner) !== String(req.user._id)) return res.status(403).json({ error: 'Forbidden' });
        const students = (course.students || []).map(s => ({ id: s._id, name: s.name, email: s.email }));
        res.json(students);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/courses - create course (owner defaults to current user, admin may set ownerId)
router.post('/courses', ensureAuth, async (req, res) => {
    try {
        const { name, topic, ownerId } = req.body;
        const owner = isAdmin(req) && ownerId ? ownerId : req.user._id;
        const course = new Course({ name, topic, owner });
        await course.save();
        res.status(201).json({ id: course._id, name: course.name, topic: course.topic, owner: course.owner });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/courses/:id/enroll - learner enrolls into course
router.post('/courses/:id/enroll', ensureAuth, async (req, res) => {
    try {
        if (req.user.role !== 'learner') return res.status(403).json({ error: 'Forbidden' });
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found' });
        const already = (course.students || []).some(id => String(id) === String(req.user._id));
        if (!already) {
            course.students.push(req.user._id);
            await course.save();
        }
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/courses/:id - update (admin or owner)
router.put('/courses/:id', ensureAuth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found' });
        if (!isAdmin(req) && String(course.owner) !== String(req.user._id)) return res.status(403).json({ error: 'Forbidden' });
        const { name, topic } = req.body;
        if (name) course.name = name;
        if (topic) course.topic = topic;
        await course.save();
        res.json({ id: course._id, name: course.name, topic: course.topic, owner: course.owner });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/courses/:id - admin or owner
router.delete('/courses/:id', ensureAuth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found' });
        if (!isAdmin(req) && String(course.owner) !== String(req.user._id)) return res.status(403).json({ error: 'Forbidden' });
        await course.remove();
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

// --- Lessons CRUD ---
// GET /api/lessons?course=courseId - получить все уроки курса (teacher/admin только свои)
router.get('/lessons', ensureAuth, async (req, res) => {
    try {
        const { course } = req.query;
        if (!course) return res.status(400).json({ error: 'Course id required' });
        let filter = { course };
        if (req.user.role === 'teacher') filter.owner = req.user._id;
        const lessons = await Lesson.find(filter).sort('order');
        res.json(lessons);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/lessons/:id - получить урок
router.get('/lessons/:id', ensureAuth, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
        // Только владелец или админ
        if (req.user.role !== 'admin' && String(lesson.owner) !== String(req.user._id)) return res.status(403).json({ error: 'Forbidden' });
        res.json(lesson);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/lessons - создать урок (только teacher/admin)
router.post('/lessons', ensureAuth, async (req, res) => {
    try {
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const { title, content, type, order, course, videoUrl, attachments, duration } = req.body;
        if (!title || !content || !course || order === undefined) return res.status(400).json({ error: 'Missing fields' });
        const lesson = new Lesson({ title, content, type, order, course, owner: req.user._id, videoUrl, attachments, duration });
        await lesson.save();
        res.status(201).json(lesson);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/lessons/:id - обновить урок (только owner/admin)
router.put('/lessons/:id', ensureAuth, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
        if (req.user.role !== 'admin' && String(lesson.owner) !== String(req.user._id)) return res.status(403).json({ error: 'Forbidden' });
        const { title, content, type, order, videoUrl, attachments, duration, isPublished } = req.body;
        if (title) lesson.title = title;
        if (content) lesson.content = content;
        if (type) lesson.type = type;
        if (order !== undefined) lesson.order = order;
        if (videoUrl) lesson.videoUrl = videoUrl;
        if (attachments) lesson.attachments = attachments;
        if (duration) lesson.duration = duration;
        if (isPublished !== undefined) lesson.isPublished = isPublished;
        await lesson.save();
        res.json(lesson);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/lessons/:id - удалить урок (owner/admin)
router.delete('/lessons/:id', ensureAuth, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
        if (req.user.role !== 'admin' && String(lesson.owner) !== String(req.user._id)) return res.status(403).json({ error: 'Forbidden' });
        await lesson.remove();
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/me - return current logged-in user (without password)
router.get('/me', ensureAuth, (req, res) => {
    if (!req.user) return res.status(404).json({ error: 'No user attached' });
    res.json({ id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, createdAt: req.user.createdAt });
});

