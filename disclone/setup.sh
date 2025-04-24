#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Discord Clone - Installation Script${NC}"
echo -e "${GREEN}=====================================${NC}"

# Create project directory
echo -e "${YELLOW}Creating project directory...${NC}"
PROJECT_DIR="$HOME/discord-clone"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Update system and install dependencies
echo -e "${YELLOW}Updating system and installing dependencies...${NC}"
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y curl git nodejs npm mongodb build-essential

# Start MongoDB service
echo -e "${YELLOW}Starting MongoDB service...${NC}"
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Install PM2 globally
echo -e "${YELLOW}Installing PM2 for process management...${NC}"
sudo npm install -g pm2

# Install Ngrok
echo -e "${YELLOW}Installing Ngrok...${NC}"
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update
sudo apt install -y ngrok

# Create project structure
echo -e "${YELLOW}Creating project structure...${NC}"
mkdir -p $PROJECT_DIR/{client/{public,src/{components,context,pages}},server/{controllers,models,routes,utils}}

# Create necessary files for the server
echo -e "${YELLOW}Creating server files...${NC}"

# Server main file
cat > $PROJECT_DIR/server/server.js << 'EOL'
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
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

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

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
EOL

# Create utils/users.js
mkdir -p $PROJECT_DIR/server/utils
cat > $PROJECT_DIR/server/utils/users.js << 'EOL'
const users = [];

const addUser = ({ id, userId, channelId }) => {
  const existingUser = users.find((user) => 
    user.userId === userId && user.channelId === channelId);

  if (existingUser) {
    return existingUser;
  }

  const user = { id, userId, channelId };
  users.push(user);
  return user;
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

const getUser = (id) => users.find((user) => user.id === id);

const getUsersInRoom = (channelId) => users.filter((user) => user.channelId === channelId);

module.exports = { addUser, removeUser, getUser, getUsersInRoom };
EOL

# Create models directory
mkdir -p $PROJECT_DIR/server/models

# Create User model
cat > $PROJECT_DIR/server/models/User.js << 'EOL'
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  status: {
    type: String,
    enum: ['online', 'idle', 'dnd', 'invisible'],
    default: 'online'
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
EOL

# Create Server model
cat > $PROJECT_DIR/server/models/Server.js << 'EOL'
const mongoose = require('mongoose');

const ServerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    default: 'default-server.png'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },