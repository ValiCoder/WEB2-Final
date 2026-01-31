# Web2 Assignment 4 - User and Course Management System

A full-stack Node.js application with Express, MongoDB, and session-based authentication. Supports role-based access control (admin, teacher, learner) with complete CRUD operations for users and courses.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- Node.js v18 or higher (download from https://nodejs.org/)
- npm v9 or higher (comes with Node.js)
- MongoDB v6 or higher (local or cloud instance via MongoDB Atlas)

To verify your installations, run:

```bash
node --version
npm --version
```

## Installation Steps

1. Clone or download the project folder to your local machine.

2. Navigate to the project directory in PowerShell or Command Prompt:

```bash
cd path\to\WEB2Assignment4
```

3. Install dependencies:

```bash
npm install
```

This will install:
- express (web framework)
- mongoose (MongoDB ODM)
- express-session (session management)
- connect-mongo (MongoDB session store)
- bcryptjs (password hashing)
- dotenv (environment variables)

## Environment Setup

1. Create a `.env` file in the project root:

```bash
Copy-Item .env.example .env
```

Or manually create `.env` with the following variables:

```
MONGO_URI=mongodb://localhost:27017/web2assignment4
PORT=3000
SESSION_SECRET=your_secret_key_here
```

2. Replace values as needed:

- **MONGO_URI**: Connection string to your MongoDB instance.
  - Local: `mongodb://localhost:27017/web2assignment4`
  - MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/web2assignment4`

- **PORT**: Server port (default: 3000). Change if port is already in use.

- **SESSION_SECRET**: Random secret key for session encryption. Use a long, random string.

## Running the Server

1. Ensure MongoDB is running:

```bash
# If running MongoDB locally (Windows):
# Open MongoDB Compass or use mongod command in another terminal

# If using MongoDB Atlas, ensure your IP is whitelisted in the cluster settings
```

2. Start the server in development mode with auto-reload:

```bash
npx nodemon server.js
```

Or run directly:

```bash
node server.js
```

Expected output:

```
Server is running on port 3000
MongoDB connected
[nodemon] watching path(s): *.*
```

3. Open your browser and navigate to:

```
http://localhost:3000
```

## Project Structure

```
WEB2Assignment4/
├── server.js                 # Main application entry point
├── db.js                     # Database connection setup
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables (create locally)
├── models/
│   ├── user.js              # User schema with roles (admin, teacher, learner)
│   └── course.js            # Course schema with owner reference
├── routes/
│   ├── auth.js              # Authentication routes (login, register, logout)
│   └── api.js               # REST API routes (CRUD for users and courses)
├── middleware/
│   ├── auth.js              # Session authentication check
│   ├── attachUser.js        # Attach current user to request
│   ├── logger.js            # Request logging
│   └── errorHandler.js      # Centralized error handling
└── public/
    ├── index.html           # Home page
    ├── loginpage.html       # Login form
    ├── regpage.html         # Registration form with role selection
    ├── user.html            # User profile page
    ├── dashboard.html       # Dashboard (users and courses management)
    └── css/
        └── style.css        # Global styles
```

## User Roles and Permissions

### Learner
- Register and log in
- View own profile
- View own courses
- Cannot create courses
- Cannot view other users

### Teacher
- Register and log in as teacher
- View own profile
- Create, edit, and delete own courses
- View own courses
- Cannot view other users

### Admin
- Full system access
- View all users
- View all courses
- Create, edit, delete any user
- Create, edit, delete any course
- Change user roles

## API Endpoints

All endpoints require authentication (valid session). Base URL: `http://localhost:3000/api`

### Authentication

- `GET /` - Home page
- `GET /register` - Registration form
- `POST /register` - Register new user (accepts: name, email, password, role)
- `GET /login` - Login form
- `POST /login` - Login (accepts: email, password)
- `GET /logout` - Logout and destroy session
- `GET /user` - User profile page
- `GET /dashboard` - Dashboard (protected, requires authentication)

### Users API (Admin only)

- `GET /api/users` - List all users (admin only)
- `GET /api/users/:id` - Get user details (admin or owner)
- `POST /api/users` - Create user (admin only, accepts: name, email, password, role)
- `PUT /api/users/:id` - Update user (admin or owner; only admin can change role)
- `DELETE /api/users/:id` - Delete user (admin or owner)

### Courses API

- `GET /api/courses` - List courses (admin: all, user: own courses)
- `GET /api/courses/:id` - Get course details (admin or owner)
- `POST /api/courses` - Create course (accepts: name, topic)
- `PUT /api/courses/:id` - Update course (owner or admin; accepts: name, topic)
- `DELETE /api/courses/:id` - Delete course (owner or admin)

### Current User

- `GET /api/me` - Get current logged-in user info (returns: id, name, email, role)

## Usage Workflow

### First Time Setup

1. Start the server.
2. Navigate to `http://localhost:3000/register`.
3. Create an account as a Teacher or Learner.
4. Log in with your credentials.
5. You will be redirected to your profile page.
6. Click "Dashboard" to access the management interface.

### As a Teacher

1. Log in as a teacher.
2. Go to Dashboard.
3. Use the "Create Course" form to add new courses.
4. Edit or delete your courses using the action buttons in the Courses table.

### As a Learner

1. Log in as a learner.
2. Go to Dashboard.
3. View your courses (will show "No courses found" if none assigned).
4. Cannot create or edit courses.

### As an Admin

1. Contact a system administrator to create an admin account via direct database manipulation or POST to `/api/users` with role='admin'.
2. Log in as admin.
3. Go to Dashboard.
4. View and manage all users and courses.
5. Edit any user's role or delete users as needed.

## Password Management

Passwords are hashed using bcryptjs with 10 salt rounds before storage. Plain-text passwords stored in the database (from previous versions) will be automatically migrated to hashed on first login.

## Session Management

- Session duration: 24 hours
- Sessions are stored in MongoDB using connect-mongo
- Session cookie name: `connect.sid`
- Destroying a session logs out the user and clears the cookie

## Troubleshooting

### "MongoDB connected" but server crashes shortly after

- Verify MONGO_URI is correct in `.env`
- Ensure MongoDB is running and accessible
- Check firewall and network connectivity

### "Cannot find module" error

- Run `npm install` again
- Delete `node_modules` folder and `package-lock.json`, then run `npm install`

### Port 3000 already in use

- Change PORT in `.env` to an available port (e.g., 3001)
- Or kill the process using port 3000

### "Invalid email or password" on login

- Ensure email and password are correct
- Check that the account exists (try registering a new account to test)
- Passwords are case-sensitive

### Dashboard shows "Unexpected error"

- Open browser DevTools (F12) and check the Console tab
- Verify API endpoints are responding: check server logs for errors
- Ensure user session is valid (try logging out and back in)

### Cannot create courses as teacher

- Verify you are logged in as a teacher (check profile page)
- Try refreshing the dashboard page
- Check browser console for JavaScript errors

## Development Notes

- The application uses nodemon for auto-reload during development. File changes will trigger a restart.
- Logging is done to the console via the logger middleware.
- All API responses are in JSON format (except HTML pages served to browser).
- Error responses include an `error` field with a descriptive message.

## Security Considerations

- Store SESSION_SECRET in `.env`, never commit it to version control
- Use HTTPS in production (current setup is HTTP only)
- Implement rate limiting for login attempts in production
- Add CORS configuration if serving frontend from a different domain
- Use environment-specific settings for production vs. development

## Performance Tips

- Index MongoDB fields for frequently queried attributes (email, owner)
- Implement pagination for large user and course lists
- Use caching middleware for frequently accessed data
- Monitor session collection size in MongoDB and implement cleanup

## License

This is an educational project for Web2 Assignment 4.
