const express = require('express');
const path = require('path');
const { connectDB } = require('./db');

const session = require('express-session');
const MongoStore = require('connect-mongo').MongoStore;

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const attachUser = require('./middleware/attachUser');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to DB
connectDB();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
// request logging
app.use(logger);
// sessions (24h)
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'change_this_secret',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
        cookie: { maxAge: 24 * 60 * 60 * 1000 }
    })
);

// Routes
app.use('/', authRoutes);
// attach user (reads session and sets req.user)
app.use(attachUser);
app.use('/api', apiRoutes);

// error handling (after routes)
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});