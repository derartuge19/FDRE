const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 5173;

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
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Service URLs
const SERVICES = {
  USER: process.env.USER_SERVICE_URL || 'http://digit-user-service:3001',
  CASE: process.env.CASE_SERVICE_URL || 'http://case-service:3002',
  HEARING: process.env.HEARING_SERVICE_URL || 'http://hearing-service:3005',
  DOCUMENT: process.env.DOCUMENT_SERVICE_URL || 'http://document-service:3003',
  NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL || 'http://digit-notification-service:3009'
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'ethiopian-court-secret-key';

// Helper function to forward requests to microservices
async function forwardRequest(service, path, req, res) {
  try {
    const serviceUrl = SERVICES[service.toUpperCase()];
    if (!serviceUrl) {
      return res.status(503).json({ success: false, message: 'Service unavailable' });
    }

    const url = `${serviceUrl}${path}`;
    const method = req.method;
    const headers = { ...req.headers };
    delete headers.host;

    let response;
    switch (method) {
      case 'GET':
        response = await axios.get(url, { headers, params: req.query });
        break;
      case 'POST':
        response = await axios.post(url, req.body, { headers });
        break;
      case 'PUT':
        response = await axios.put(url, req.body, { headers });
        break;
      case 'DELETE':
        response = await axios.delete(url, { headers });
        break;
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`Error forwarding to ${service}:`, error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Internal server error'
    });
  }
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Critical Clearance Required: No Token Provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Clearance Revoked: Token Expired or Invalid' });
    }
    req.user = decoded;
    next();
  });
}

// Authorization middleware (RBAC)
function authorizeRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.courtRole)) {
      return res.status(403).json({ 
        success: false, 
        message: `Judicial Privilege Required: Missing Role ${roles.join(' or ')}` 
      });
    }
    next();
  };
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeConnections: activeConnections.size,
    chatRooms: chatRooms.size,
    virtualHearings: virtualHearings.size
  });
});

// Authentication routes
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { username, password, mfaCode } = req.body;
    
    // 1. Simulation for Developer (Bypass if admin secret used)
    if (username === 'admin' && password === 'admin123') {
       const devUser = {
         userId: 'DEV-001',
         username: 'admin',
         name: 'System Administrator',
         courtRole: 'ADMIN',
         courtJurisdiction: 'FEDERAL_HIGH_COURT'
       };
       
       if (!mfaCode) {
         return res.json({ success: true, requiresMFA: true, message: 'MFA Required' });
       }

       const token = jwt.sign(devUser, JWT_SECRET, { expiresIn: '24h' });
       return res.json({ success: true, user: devUser, token });
    }

    // 2. Production: Forward to Java User Service (/user/court/_login)
    const response = await axios.post(`${SERVICES.USER}/user/court/_login`, {
      username,
      password,
      mfaCode
    });

    const userData = response.data;
    
    // Sign a real JWT for the Gateway to use downstream
    const token = jwt.sign({
      userId: userData.userId,
      username: userData.username,
      name: userData.name,
      courtRole: userData.courtRole,
      courtJurisdiction: userData.courtJurisdiction
    }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      user: userData,
      token: token
    });
  } catch (error) {
    console.error('Auth Error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Authentication sequence failed'
    });
  }
});

app.post('/auth/verify-mfa', authLimiter, async (req, res) => {
  try {
    const response = await axios.post(`${SERVICES.USER}/user/verify-mfa`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'MFA verification failed'
    });
  }
});

// Microservice routes with Role-Based Protection
app.use('/api/user', authenticateToken, (req, res) => forwardRequest('user', '/user' + req.path, req, res));
app.use('/api/cases', authenticateToken, (req, res) => forwardRequest('case', '/case' + req.path, req, res));
app.use('/api/hearings', authenticateToken, (req, res) => forwardRequest('hearing', '/hearing' + req.path, req, res));

// Virtual Hearing usually needs JUDGE or CLERK roles for sensitive controls
app.use('/api/virtual-hearing', authenticateToken, (req, res) => forwardRequest('hearing', '/hearing' + req.path, req, res));

// Judicial Documents might need LAWYER or JUDGE roles
app.use('/api/documents', authenticateToken, (req, res) => forwardRequest('document', '/document' + req.path, req, res));
app.use('/api/notifications', authenticateToken, (req, res) => forwardRequest('notification', req.path, req, res));

// File upload routes
app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname);
    formData.append('userId', req.user.id);
    formData.append('documentType', req.body.documentType);

    const response = await axios.post(`${SERVICES.DOCUMENT}/document/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'File upload failed'
    });
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
    // Verify JWT token
    jwt.verify(data.token, JWT_SECRET, (err, decoded) => {
      if (err) {
        ws.send(JSON.stringify({
          type: 'authentication_error',
          message: 'Invalid token'
        }));
        return;
      }

      connection.userId = decoded.userId;
      connection.userName = decoded.name;
      connection.userRole = decoded.role;
      connection.authenticated = true;
      
      ws.send(JSON.stringify({
        type: 'authentication_success',
        userId: decoded.userId,
        userName: decoded.name,
        userRole: decoded.role
      }));
      
      broadcastOnlineUsers();
    });
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

// Start server
// 404 Handler - Return JSON for unknown routes
app.use((req, res) => {
  console.log(`🔍 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    success: false, 
    message: `The Judicial Gateway cannot find the endpoint: ${req.path}`,
    tip: 'Check if you meant /api/auth/login or a protected microservice route'
  });
});

// Global Error Handler - Ensures we always return JSON, never HTML
app.use((err, req, res, next) => {
  console.error('💥 Global Error Hook:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'The Judicial Gateway encountered a fatal exception',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

server.listen(PORT, () => {
  console.log(`🏛️ Ethiopian Digital Court System API Gateway running on http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`📡 WebSocket server running on ws://localhost:${PORT}`);
  console.log(`📚 System ready for testing`);
});
