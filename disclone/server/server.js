
// server/server.js
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const channelRoutes = require('./routes/channels');
const messageRoutes = require('./routes/messages');
const serverRoutes = require('./routes/servers');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/servers', serverRoutes);

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/discord-clone', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

// Socket.io
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('join', ({ userId, channelId }) => {
    const user = addUser({ id: socket.id, userId, channelId });
    
    socket.join(user.channelId);
    
    socket.emit('message', { 
      user: 'system', 
      text: `Welcome to the channel!`, 
      createdAt: new Date() 
    });
    
    socket.broadcast.to(user.channelId).emit('message', { 
      user: 'system', 
      text: `${user.userId} has joined!`, 
      createdAt: new Date() 
    });
    
    io.to(user.channelId).emit('roomData', { 
      room: user.channelId, 
      users: getUsersInRoom(user.channelId) 
    });
  });
  
  socket.on('sendMessage', ({ message, userId, channelId }, callback) => {
    const user = getUser(socket.id);
    
    io.to(channelId).emit('message', { 
      user: userId, 
      text: message, 
      createdAt: new Date() 
    });
    
    callback();
  });
  
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    
    if (user) {
      io.to(user.channelId).emit('message', { 
        user: 'system', 
        text: `${user.userId} has left!`, 
        createdAt: new Date() 
      });
      
      io.to(user.channelId).emit('roomData', { 
        room: user.channelId, 
        users: getUsersInRoom(user.channelId) 
      });
    }
    
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));