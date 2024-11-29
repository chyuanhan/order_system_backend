const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
require('dotenv').config();
const path = require('path');
const fs = require('fs').promises;

const authRoute = require('./routes/auth-route');
const menuRoute = require('./routes/menu-route');
const ordersRoute = require('./routes/orders-route');
const reportsRoute = require('./routes/reports-route');
const paymentsRoute = require('./routes/payments-route');
const categoryRoute = require('./routes/category-route');


const app = express();

async function ensureUploadDirs() {
  const uploadDir = path.join(__dirname, 'uploads', 'images');
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    console.log('Upload directory created successfully');
  } catch (error) {
    console.error('Failed to create upload directory:', error);
  }
}


ensureUploadDirs().then(() => {
  console.log('Init upload directory completed');
}).catch(error => {
  console.error('Failed to initialize upload directory:', error);
});


connectDB();


app.use(cors({
  origin: [
    // 'http://localhost:5173',
    // 'http://localhost:5174',
    process.env.FRONTEND_URL,
    process.env.FRONTEND_DEV_URL,
    process.env.ADMIN_URL,
    process.env.ADMIN_DEV_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// routes
app.use('/api/auth', authRoute);
app.use('/api/menu', menuRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/reports', reportsRoute);
app.use('/api/payments', paymentsRoute);
app.use('/api/categories', categoryRoute);


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
