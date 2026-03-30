require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const errorHandler = require('./src/middleware/errorHandler');

// Route imports
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const logRoutes = require('./src/routes/logs');
const waterRoutes = require('./src/routes/water');
const weightRoutes = require('./src/routes/weight');
const statsRoutes = require('./src/routes/stats');
const groupRoutes = require('./src/routes/groups');
const { checkOrCreateBucket } = require('./src/config/s3');

// Initialize S3 bucket check
checkOrCreateBucket();

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all for mobile dev
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attach io to req for use in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket connection
io.on('connection', (socket) => {
  console.log('User connected to socket:', socket.id);
  
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined room user_${userId}`);
  });

  socket.on('join_group_room', (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`Socket ${socket.id} joined room group_${groupId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from socket:', socket.id);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/logs', logRoutes);
app.use('/api/v1/water', waterRoutes);
app.use('/api/v1/weight', weightRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/groups', groupRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Roz API server running on port ${PORT}`);
});

module.exports = app;
