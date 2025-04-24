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
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    }
  }],
  channels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Server', ServerSchema);