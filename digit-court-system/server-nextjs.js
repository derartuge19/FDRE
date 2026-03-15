const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Import recording services
const hearingDatabase = require('./database/postgres-database');
const fileStorageService = require('./services/file-storage');
const mediaCaptureService = require('./services/media-capture');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = 5173;

// Store active connections
const activeConnections = new Map();
const chatRooms = new Map();
const virtualHearings = new Map();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://jsdelivr.net", "ws://localhost:3000"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Proxy to Next.js app
app.use('/', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  ws: false, // WebSocket handling is separate
  pathRewrite: {
    '^/api': '/api', // Keep API routes
  },
  onProxyReq: (proxyReq, req, res) => {
    // Don't proxy API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
      proxyReq.abort();
    }
  }
}));

// API routes (these won't be proxied)
// Note: API routes will be handled by Next.js API routes
// app.use('/api', require('./routes/api'));
// app.use('/auth', require('./routes/auth'));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log('WebSocket connected:', connectionId);
  
  activeConnections.set(connectionId, {
    ws: ws,
    userId: null,
    userName: null,
    userRole: null,
    connectionId: connectionId,
    connectedAt: new Date()
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleWebSocketMessage(connectionId, data, ws);
    } catch (error) {
      console.error('Invalid WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket disconnected:', connectionId);
    const connection = activeConnections.get(connectionId);
    if (connection && connection.userId) {
      // Remove from chat rooms and virtual hearings
      chatRooms.forEach((room, roomId) => {
        room.participants = room.participants.filter(p => p.connectionId !== connectionId);
        if (room.participants.length === 0) {
          chatRooms.delete(roomId);
        }
      });
      
      virtualHearings.forEach((hearing, hearingId) => {
        hearing.participants = hearing.participants.filter(p => p.connectionId !== connectionId);
        if (hearing.participants.length === 0) {
          virtualHearings.delete(hearingId);
        }
      });
    }
    activeConnections.delete(connectionId);
    broadcastOnlineUsers();
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// WebSocket message handler
function handleWebSocketMessage(connectionId, data, ws) {
  const connection = activeConnections.get(connectionId);
  
  switch (data.type) {
    case 'authentication':
      handleAuthentication(connectionId, data, ws);
      break;
    case 'join_room':
      joinChatRoom(connectionId, data.roomId, data.userName, connection.userId);
      break;
    case 'send_message':
      sendMessageToRoom(connectionId, data.roomId, {
        type: 'chat_message',
        senderId: connection.userId,
        senderName: connection.userName,
        content: data.content,
        messageId: data.messageId,
        roomId: data.roomId,
        timestamp: data.timestamp || new Date().toISOString(),
        encrypted: data.encrypted || false
      });
      break;
    case 'join_hearing':
      joinVirtualHearing(connectionId, data.hearingId, data.userName, connection.userId);
      break;
    case 'leave_hearing':
      leaveVirtualHearing(connectionId, data.hearingId, data.userName);
      break;
    case 'hearing_action':
      handleHearingAction(connectionId, data);
      break;
    case 'typing':
      handleTypingIndicator(connectionId, data);
      break;
    default:
      console.log('Unknown WebSocket message type:', data.type);
  }
}

// Authentication handler
function handleAuthentication(connectionId, data, ws) {
  const connection = activeConnections.get(connectionId);
  if (connection) {
    connection.userId = data.userId;
    connection.userName = data.userName;
    connection.userRole = data.userRole;
    connection.authenticated = true;
    
    ws.send(JSON.stringify({
      type: 'authentication_success',
      userId: data.userId,
      userName: data.userName
    }));
    
    broadcastOnlineUsers();
  }
}

// Chat room functions
function joinChatRoom(connectionId, roomId, userName, userId) {
  const connection = activeConnections.get(connectionId);
  if (!connection) return;

  if (!chatRooms.has(roomId)) {
    chatRooms.set(roomId, {
      id: roomId,
      participants: [],
      messages: []
    });
  }

  const room = chatRooms.get(roomId);
  room.participants.push({
    connectionId: connectionId,
    userId: userId,
    userName: userName,
    joinedAt: new Date()
  });

  connection.ws.send(JSON.stringify({
    type: 'room_joined',
    roomId: roomId,
    participants: room.participants
  }));

  // Notify other participants
  room.participants.forEach(participant => {
    if (participant.connectionId !== connectionId) {
      const participantConnection = activeConnections.get(participant.connectionId);
      if (participantConnection) {
        participantConnection.ws.send(JSON.stringify({
          type: 'user_joined',
          userId: userId,
          userName: userName,
          roomId: roomId
        }));
      }
    }
  });
}

function sendMessageToRoom(connectionId, roomId, messageData) {
  const room = chatRooms.get(roomId);
  if (!room) return;

  room.messages.push(messageData);

  // Broadcast to all participants in the room
  room.participants.forEach(participant => {
    const participantConnection = activeConnections.get(participant.connectionId);
    if (participantConnection) {
      participantConnection.ws.send(JSON.stringify(messageData));
    }
  });
}

// Virtual hearing functions
function joinVirtualHearing(connectionId, hearingId, userName, userId) {
  const connection = activeConnections.get(connectionId);
  if (!connection) return;

  if (!virtualHearings.has(hearingId)) {
    virtualHearings.set(hearingId, {
      id: hearingId,
      participants: [],
      status: 'waiting',
      startTime: null
    });
  }

  const hearing = virtualHearings.get(hearingId);
  hearing.participants.push({
    connectionId: connectionId,
    userId: userId,
    userName: userName,
    role: connection.userRole,
    joinedAt: new Date(),
    isAudioMuted: true,
    isVideoMuted: false
  });

  connection.ws.send(JSON.stringify({
    type: 'hearing_joined',
    hearingId: hearingId,
    participants: hearing.participants
  }));

  // Broadcast participant update
  broadcastHearingUpdate(hearingId);
}

function leaveVirtualHearing(connectionId, hearingId, userName) {
  const hearing = virtualHearings.get(hearingId);
  if (hearing) {
    hearing.participants = hearing.participants.filter(p => p.connectionId !== connectionId);
    broadcastHearingUpdate(hearingId);
  }
}

function handleHearingAction(connectionId, data) {
  const hearing = virtualHearings.get(data.hearingId);
  if (!hearing) return;

  const participant = hearing.participants.find(p => p.connectionId === connectionId);
  if (!participant) return;

  switch (data.action) {
    case 'toggle_audio':
      participant.isAudioMuted = !participant.isAudioMuted;
      break;
    case 'toggle_video':
      participant.isVideoMuted = !participant.isVideoMuted;
      break;
    case 'start_recording':
      hearing.isRecording = true;
      hearing.recordingStartTime = new Date();
      break;
    case 'stop_recording':
      hearing.isRecording = false;
      hearing.recordingDuration = Date.now() - hearing.recordingStartTime;
      break;
  }

  broadcastHearingUpdate(data.hearingId);
}

function broadcastHearingUpdate(hearingId) {
  const hearing = virtualHearings.get(hearingId);
  if (!hearing) return;

  const update = {
    type: 'hearing_update',
    hearingId: hearingId,
    participants: hearing.participants,
    status: hearing.status,
    isRecording: hearing.isRecording
  };

  hearing.participants.forEach(participant => {
    const participantConnection = activeConnections.get(participant.connectionId);
    if (participantConnection) {
      participantConnection.ws.send(JSON.stringify(update));
    }
  });
}

function handleTypingIndicator(connectionId, data) {
  const room = chatRooms.get(data.roomId);
  if (!room) return;

  const typingMessage = {
    type: 'typing_indicator',
    userId: data.userId,
    userName: data.userName,
    isTyping: data.isTyping,
    roomId: data.roomId
  };

  room.participants.forEach(participant => {
    if (participant.connectionId !== connectionId) {
      const participantConnection = activeConnections.get(participant.connectionId);
      if (participantConnection) {
        participantConnection.ws.send(JSON.stringify(typingMessage));
      }
    }
  });
}

function broadcastOnlineUsers() {
  const onlineUsers = Array.from(activeConnections.values())
    .filter(conn => conn.authenticated)
    .map(conn => ({
      id: conn.userId,
      name: conn.userName,
      status: 'online',
      avatar: '👤'
    }));

  const message = {
    type: 'online_users_update',
    users: onlineUsers,
    timestamp: new Date().toISOString()
  };

  activeConnections.forEach(connection => {
    if (connection.authenticated) {
      connection.ws.send(JSON.stringify(message));
    }
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeConnections: activeConnections.size,
    chatRooms: chatRooms.size,
    virtualHearings: virtualHearings.size
  });
});

// Start server
server.listen(PORT, () => {
  console.log('🏛️ Ethiopian Digital Court System running on http://localhost:' + PORT);
  console.log('📊 Health check available at http://localhost:' + PORT + '/health');
  console.log('📡 WebSocket server running on ws://localhost:' + PORT);
  console.log('📚 System ready for testing');
});
