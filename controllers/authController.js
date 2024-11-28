const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

exports.register = async (req, res) => {
  const { username, password } = req.body;

  try {
    // check if username already exists
    let admin = await Admin.findOne({ username });
    if (admin) {
      return res.status(400).json({ message: '用户名已存在' });
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
    res.status(500).json({ message: '注册失败', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // find admin
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // validate password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: '用户名或密码错误' });
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
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// 验证 token
exports.verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 查找管理员
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      return res.status(401).json({ message: 'Admin not found' });
    }

    // 返回管理员信息
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

// 登出
exports.logout = async (req, res) => {
  try {
    // 由于使用的是JWT，后端实际上不需要做任何操作
    // The frontend will clear the token in localStorage
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout failed:', error);
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
};
