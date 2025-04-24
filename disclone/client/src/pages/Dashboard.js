// client/src/pages/Dashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import ServerList from '../components/ServerList';
import ChannelList from '../components/ChannelList';
import ChatArea from '../components/ChatArea';
import UsersList from '../components/UsersList';

const ENDPOINT = 'http://localhost:5000';

const Dashboard = () => {
  const { serverId, channelId } = useParams();
  const { user } = useContext(AuthContext);
  const [servers, setServers] = useState([]);
  const [currentServer, setCurrentServer] = useState(null);
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(ENDPOINT);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Load servers
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const res = await axios.get('/api/servers');
        setServers(res.data);
        
        // Set default server if serverId is not provided
        if (!serverId && res.data.length > 0) {
          setCurrentServer(res.data[0]);
        }
      } catch (err) {
        console.error('Error fetching servers', err);
      }
    };
    
    fetchServers();
  }, [serverId]);

  // Set current server based on URL param
  useEffect(() => {
    if (serverId && servers.length > 0) {
      const server = servers.find(s => s._id === serverId);
      if (server) {
        setCurrentServer(server);
      }
    }
  }, [serverId, servers]);

  // Load channels for current server
  useEffect(() => {
    if (currentServer) {
      const fetchChannels = async () => {
        try {
          const res = await axios.get(`/api/servers/${currentServer._id}/channels`);
          setChannels(res.data);
          
          // Set default channel if channelId is not provided
          if (!channelId && res.data.length > 0) {
            setCurrentChannel(res.data[0]);
          }
        } catch (err) {
          console.error('Error fetching channels', err);
        }
      };
      
      fetchChannels();
    }
  }, [currentServer, channelId]);

  // Set current channel based on URL param
  useEffect(() => {
    if (channelId && channels.length > 0) {
      const channel = channels.find(c => c._id === channelId);
      if (channel) {
        setCurrentChannel(channel);
      }
    }
  }, [channelId, channels]);

  // Load messages for current channel and join socket room
  useEffect(() => {
    if (currentChannel && socket && user) {
      // Fetch messages
      const fetchMessages = async () => {
        try {
          const res = await axios.get(`/api/channels/${currentChannel._id}/messages`);
          setMessages(res.data);
        } catch (err) {
          console.error('Error fetching messages', err);
        }
      };
      
      fetchMessages();
      
      // Join channel room
      socket.emit('join', { userId: user.id, channelId: currentChannel._id });
      
      // Listen for new messages
      socket.on('message', (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });
      
      // Listen for room data updates
      socket.on('roomData', ({ users }) => {
        setUsers(users);
      });
      
      return () => {
        socket.off('message');
        socket.off('roomData');
      };
    }
  }, [currentChannel, socket, user]);

  // Send message function
  const sendMessage = (message) => {
    if (message && socket && user && currentChannel) {
      socket.emit('sendMessage', {
        message,
        userId: user.id,
        channelId: currentChannel._id
      }, () => {
        // Message sent callback
      });
    }
  };

  return (
    <div className="dashboard">
      <ServerList servers={servers} currentServer={currentServer} />
      {currentServer && (
        <ChannelList 
          server={currentServer} 
          channels={channels} 
          currentChannel={currentChannel} 
        />
      )}
      {currentChannel && (
        <ChatArea 
          channel={currentChannel} 
          messages={messages} 
          sendMessage={sendMessage} 
        />
      )}
      {currentChannel && (
        <UsersList users={users} />
      )}
    </div>
  );
};

export default Dashboard;