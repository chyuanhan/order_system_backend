const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // 从请求头获取token
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: '未提供认证token' });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 将解码后的用户信息添加到请求对象中
    req.user = decoded;

    next();
  } catch (error) {
    console.error('认证失败:', error);
    return res.status(401).json({ message: '认证失败' });
  }
};