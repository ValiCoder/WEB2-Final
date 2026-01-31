// Auth middleware: ensures a user is logged in
module.exports = (req, res, next) => {
  if (req.session && req.session.userId) return next();
  // If API request, return JSON 401
  if (req.originalUrl.startsWith('/api')) return res.status(401).json({ error: 'Unauthorized' });
  // Otherwise redirect to login page
  res.redirect('/login');
};
