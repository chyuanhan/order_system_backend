const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

exports.register = async (req, res) => {
  const { username, password } = req.body;

  try {
    // check if username already exists
    let admin = await Admin.findOne({ username });
    if (admin) {
      return res.status(400).json({ message: 'USERNAME ALREADY EXISTS' });
    }

    // create new admin
    admin = new Admin({
      username,
      password
    });

    // save to database
    await admin.save();

    // generate JWT
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token, adminId: admin._id });
  } catch (error) {
    res.status(500).json({ message: 'REGISTRATION FAILED', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // find admin
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'USERNAME OR PASSWORD ERROR' });
    }

    // validate password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'USERNAME OR PASSWORD ERROR' });
    }

    // generate token (7 days valid)
    const token = jwt.sign(
      {
        id: admin._id,
        username: admin.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // return user information and token
    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ message: 'LOGIN FAILED', error: error.message });
  }
};

// verify token
exports.verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // find admin
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      return res.status(401).json({ message: 'Admin not found' });
    }

    // return admin information
    res.json({
      admin: {
        id: admin._id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// logout
exports.logout = async (req, res) => {
  try {
    // Since JWT is used, no action is needed on the backend
    // The frontend will clear the token in localStorage
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout failed:', error);
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
};
