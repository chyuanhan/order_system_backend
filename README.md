# Order System Backend

A restaurant ordering system backend service based on Node.js and Express.

## Features

- 🔐 User Authentication & Authorization (JWT)
- 📋 Menu Management
- 🛒 Order Processing
- 📊 Sales Reports
- 🏷️ Category Management
- 💳 Payment Processing

## Tech Stack

- Node.js
- Express.js
- MongoDB
- JWT Authentication
- RESTful API

## Getting Started

### Prerequisites

- Node.js (version >= 14)
- MongoDB
- npm or yarn

### Installation

1. Clone repository

```bash
git clone https://github.com/chyuanhan/order-system-backend.git
cd order-system-backend
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

```bash
cp .env.example .env
```

Then edit the `.env` file with your configuration:

```bash
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
FRONTEND_URL=your_frontend_url
ADMIN_URL=your_admin_url
```

4. Start the service

```bash
npm run dev # development environment
npm start # production environment
```

## Project Structure

order-system-backend/
├── config/ # Configuration files
├── controllers/ # Controllers
├── middleware/ # Middleware
├── models/ # Data models
├── routes/ # Routes
├── utils/ # Utility functions
├── app.js # Application entry
└── package.json
