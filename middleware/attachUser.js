const User = require('../models/user');

module.exports = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId).select('-password');
      if (user) req.user = user;
    } catch (err) {
      console.error('attachUser error', err);
    }
  }
  next();
};
