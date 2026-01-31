// Centralized error handler
module.exports = (err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  // Return JSON for API routes, HTML/text for others
  if (req.originalUrl.startsWith('/api')) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
  res.status(500).send('Internal Server Error');
};
