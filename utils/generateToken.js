const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_super_secret_key_123', {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
  });
};

module.exports = generateToken;