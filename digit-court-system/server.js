const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

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
      connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://jsdelivr.net"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Rate limiting - increased limits for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased limit for development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

app.use(limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// No static file serving needed for Next.js app
// app.use(express.static(path.join(__dirname, 'public'), ...));

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, PNG files are allowed.'));
    }
  }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Mock user database for authentication
const users = [
  {
    id: 'judge-alemu',
    username: 'judge.alemu',
    password: 'Judge123!', // In production, use proper hashing
    name: 'Judge Alemu Bekele',
    email: 'a.bekele@court.gov.et',
    roles: ['judge', 'court_admin'],
    permissions: ['case_management', 'hearing_control', 'virtual_hearing', 'user_management', 'reporting', 'system_config'],
    mfaEnabled: true,
    mfaSecret: '123456', // In production, use proper MFA
    isActive: true,
    lastLogin: new Date().toISOString(),
    failedAttempts: 0,
    isLocked: false
  },
  {
    id: 'lawyer-sara',
    username: 'lawyer.sara',
    password: 'Lawyer123!',
    name: 'Lawyer Sara Ahmed',
    email: 's.ahmed@lawfirm.et',
    roles: ['lawyer'],
    permissions: ['case_management', 'virtual_hearing', 'communication'],
    mfaEnabled: true,
    mfaSecret: '123456',
    isActive: true,
    lastLogin: new Date().toISOString(),
    failedAttempts: 0,
    isLocked: false
  },
  {
    id: 'admin-system',
    username: 'admin.system',
    password: 'Admin123!',
    name: 'System Administrator',
    email: 'admin@court.gov.et',
    roles: ['admin'],
    permissions: ['user_management', 'case_management', 'hearing_control', 'virtual_hearing', 'communication', 'reporting', 'system_config', 'security'],
    mfaEnabled: true,
    mfaSecret: '123456',
    isActive: true,
    lastLogin: new Date().toISOString(),
    failedAttempts: 0,
    isLocked: false
  },
  {
    id: 'clerk-mohammed',
    username: 'clerk.mohammed',
    password: 'Clerk123!',
    name: 'Clerk Mohammed Hassan',
    email: 'm.hassan@court.gov.et',
    roles: ['clerk'],
    permissions: ['case_management', 'communication'],
    mfaEnabled: false,
    mfaSecret: '123456',
    isActive: true,
    lastLogin: new Date().toISOString(),
    failedAttempts: 0,
    isLocked: false
  },
  {
    id: 'plaintiff-john',
    username: 'plaintiff.john',
    password: 'User123!',
    name: 'John Doe',
    email: 'john.doe@email.com',
    roles: ['plaintiff'],
    permissions: ['case_management', 'virtual_hearing'],
    mfaEnabled: false,
    mfaSecret: '123456',
    isActive: true,
    lastLogin: new Date().toISOString(),
    failedAttempts: 0,
    isLocked: false
  },
  {
    id: 'lawyer-robert',
    username: 'lawyer.robert',
    password: 'Lawyer123!',
    name: 'Lawyer Robert Johnson',
    email: 'r.johnson@lawfirm.et',
    roles: ['lawyer'],
    permissions: ['case_management', 'virtual_hearing', 'communication'],
    mfaEnabled: true,
    mfaSecret: '123456',
    isActive: true,
    lastLogin: new Date().toISOString(),
    failedAttempts: 0,
    isLocked: false
  }
];

// JWT Secret (in production, use environment variable)
const JWT_SECRET = 'ethiopian-court-system-jwt-secret-2024';

// Mock JWT functions (in production, use jsonwebtoken)
const jwt = {
  sign: (payload, secret) => {
    return Buffer.from(JSON.stringify({...payload, iat: Date.now()})).toString('base64');
  },
  decode: (token) => {
    try {
      return JSON.parse(Buffer.from(token, 'base64').toString());
    } catch (error) {
      return null;
    }
  }
};

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const user = users.find(u => u.id === decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Middleware for role-based access control
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const connectionId = 'conn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  console.log('WebSocket connected: ' + connectionId);
  
  // Store connection
  activeConnections.set(connectionId, {
    ws: ws,
    userId: null,
    userRole: null,
    connectedAt: new Date().toISOString()
  });
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleWebSocketMessage(connectionId, data);
    } catch (error) {
      console.error('Invalid WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket disconnected: ' + connectionId);
    const connection = activeConnections.get(connectionId);
    if (connection && connection.userId) {
      // Remove from chat rooms
      chatRooms.forEach((participants, roomId) => {
        if (participants.has(connectionId)) {
          participants.delete(connectionId);
          broadcastToRoom(roomId, {
            type: 'user_left',
            userId: connection.userId,
            userName: connection.userName,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      // Broadcast updated online users list
      broadcastOnlineUsers();
    }
    activeConnections.delete(connectionId);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error for ' + connectionId + ':', error);
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection_established',
    connectionId: connectionId,
    timestamp: new Date().toISOString()
  }));
});

function handleWebSocketMessage(connectionId, data) {
  const connection = activeConnections.get(connectionId);
  if (!connection) return;
  
  console.log(`📨 Received message type: "${data.type}" from connection ${connectionId}`);
  
  switch (data.type) {
    case 'authenticate':
      // Authenticate WebSocket connection
      connection.userId = data.userId;
      connection.userName = data.userName;
      connection.userRole = data.userRole;
      
      console.log('WebSocket authenticated: ' + data.userName + ' (' + data.userId + ')');
      
      // Send updated online users list to all clients
      broadcastOnlineUsers();
      
      // Join default chat room
      joinChatRoom(connectionId, 'general', data.userName);
      break;
      
    case 'join_hearing':
      joinVirtualHearing(connectionId, data.hearingId, data.userName, connection.userId);
      break;
      
    case 'leave_hearing':
      leaveVirtualHearing(connectionId, data.hearingId, data.userName);
      break;
      
    case 'send_message':
      // Handle direct messages between users
      if (data.recipientId) {
        // Find the recipient's connection
        let recipientConnection = null;
        activeConnections.forEach((conn, connId) => {
          if (conn.userId === data.recipientId) {
            recipientConnection = conn;
          }
        });
        
        const message = {
          type: 'chat_message',
          messageId: data.messageId || Date.now(),
          senderId: connection.userId,
          senderName: connection.userName,
          content: data.content,
          timestamp: new Date().toISOString(),
          encrypted: data.encrypted || false
        };
        
        // Send to recipient if online
        if (recipientConnection && recipientConnection.ws.readyState === WebSocket.OPEN) {
          recipientConnection.ws.send(JSON.stringify(message));
          console.log(`📤 Message sent from ${connection.userName} to ${data.recipientId}`);
          
          // Send delivery confirmation back to sender
          connection.ws.send(JSON.stringify({
            type: 'message_delivered',
            messageId: message.messageId,
            recipientId: data.recipientId,
            timestamp: new Date().toISOString()
          }));
        } else {
          console.log(`📪 Recipient ${data.recipientId} is offline, message queued`);
          // Send offline notification back to sender
          connection.ws.send(JSON.stringify({
            type: 'message_queued',
            messageId: data.messageId,
            recipientId: data.recipientId,
            timestamp: new Date().toISOString()
          }));
        }
      } else {
        // Room-based message (existing functionality)
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
      }
      break;
      
    case 'typing':
      broadcastToRoom(data.roomId, {
        type: 'typing_indicator',
        userId: connection.userId,
        userName: connection.userName,
        isTyping: data.isTyping,
        timestamp: new Date().toISOString()
      });
      break;
      
    case 'virtual_hearing_action':
      handleVirtualHearingAction(connectionId, data);
      break;
      
    case 'signaling_message':
      handleSignalingMessage(connectionId, data);
      break;
      
    case 'media_stream_data':
      handleMediaStreamData(connectionId, data);
      break;
      
    case 'recording_consent':
      handleRecordingConsent(connectionId, data);
      break;
      
    default:
      console.log('Unknown WebSocket message type:', data.type);
  }
}

function joinChatRoom(connectionId, roomId, userName) {
  const connection = activeConnections.get(connectionId);
  if (!connection) return;
  
  if (!chatRooms.has(roomId)) {
    chatRooms.set(roomId, new Map());
  }
  
  chatRooms.get(roomId).set(connectionId, connection);
  
  // Notify room participants
  broadcastToRoom(roomId, {
    type: 'user_joined',
    userId: connection.userId,
    userName: userName,
    timestamp: new Date().toISOString()
  });
  
  console.log(userName + ' joined chat room: ' + roomId);
}

function sendMessageToRoom(connectionId, roomId, message) {
  broadcastToRoom(roomId, message);
  console.log('Message sent to room ' + roomId + ' by ' + message.userName);
}

function broadcastToRoom(roomId, message) {
  const room = chatRooms.get(roomId);
  if (!room) return;
  
  const messageStr = JSON.stringify(message);
  
  room.forEach((connection) => {
    if (connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(messageStr);
    }
  });
  
  console.log('Message sent to room ' + roomId + ' by ' + message.userName);
}

function broadcastOnlineUsers() {
  const onlineUsers = [];
  
  activeConnections.forEach((connection, connectionId) => {
    if (connection.userId && connection.userName) {
      onlineUsers.push({
        id: connection.userId,
        name: connection.userName,
        role: connection.userRole,
        status: 'online',
        avatar: getAvatarForRole(connection.userRole)
      });
    }
  });
  
  const message = {
    type: 'online_users_update',
    users: onlineUsers,
    timestamp: new Date().toISOString()
  };
  
  // Send to all connected clients
  activeConnections.forEach((connection) => {
    if (connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify(message));
    }
  });
  
  console.log('Broadcasted online users update:', onlineUsers.length, 'users online');
}

function getAvatarForRole(role) {
  const avatarMap = {
    'judge': '⚖️',
    'lawyer': '💼',
    'clerk': '📋',
    'admin': '👑',
    'plaintiff': '👤',
    'defendant': '👤'
  };
  return avatarMap[role] || '👤';
}

// Virtual hearing management
function joinVirtualHearing(connectionId, hearingId, userName, userId) {
  console.log(`${userName} (${userId}) joined virtual hearing: ${hearingId}`);
  
  // Add to virtual hearing room
  if (!virtualHearings.has(hearingId)) {
    virtualHearings.set(hearingId, new Set());
  }
  virtualHearings.get(hearingId).add(connectionId);
  
  // Notify others in the hearing
  const participants = Array.from(virtualHearings.get(hearingId) || []);
  participants.forEach(participantId => {
    const participantConnection = activeConnections.get(participantId);
    if (participantConnection && participantConnection.ws.readyState === WebSocket.OPEN) {
      participantConnection.ws.send(JSON.stringify({
        type: 'hearing_participant_joined',
        hearingId: hearingId,
        userId: userId,
        userName: userName,
        timestamp: new Date().toISOString()
      }));
    }
  });
}

function leaveVirtualHearing(connectionId, hearingId, userName, userId) {
  console.log(`${userName} (${userId}) left virtual hearing: ${hearingId}`);
  
  // Remove from virtual hearing room
  if (virtualHearings.has(hearingId)) {
    virtualHearings.get(hearingId).delete(connectionId);
    
    // Notify others in the hearing
    const participants = Array.from(virtualHearings.get(hearingId) || []);
    participants.forEach(participantId => {
      const participantConnection = activeConnections.get(participantId);
      if (participantConnection && participantConnection.ws.readyState === WebSocket.OPEN) {
        participantConnection.ws.send(JSON.stringify({
          type: 'hearing_participant_left',
          hearingId: hearingId,
          userId: userId,
          userName: userName,
          timestamp: new Date().toISOString()
        }));
      }
    });
  }
}

function handleVirtualHearingAction(connectionId, data) {
  const connection = activeConnections.get(connectionId);
  if (!connection) return;
  
  const { action, hearingId, targetUserId } = data;
  
  switch (action) {
    case 'join_hearing':
      if (!virtualHearings.has(hearingId)) {
        virtualHearings.set(hearingId, new Map());
      }
      virtualHearings.get(hearingId).set(connectionId, connection);
      
      // Notify all participants
      broadcastToHearing(hearingId, {
        type: 'participant_joined',
        userId: connection.userId,
        userName: connection.userName,
        userRole: connection.userRole,
        timestamp: new Date().toISOString()
      });
      break;
      
    case 'leave_hearing':
      if (virtualHearings.has(hearingId)) {
        virtualHearings.get(hearingId).delete(connectionId);
        
        broadcastToHearing(hearingId, {
          type: 'participant_left',
          userId: connection.userId,
          userName: connection.userName,
          timestamp: new Date().toISOString()
        });
      }
      break;
      
    case 'start_recording':
    case 'stop_recording':
    case 'mute_participant':
    case 'unmute_participant':
      broadcastToHearing(hearingId, {
        type: action,
        userId: connection.userId,
        userName: connection.userName,
        userRole: connection.userRole,
        timestamp: new Date().toISOString()
      });
      break;
  }
}

function broadcastToHearing(hearingId, message) {
  const hearing = virtualHearings.get(hearingId);
  if (!hearing) return;
  
  const messageStr = JSON.stringify(message);
  
  hearing.forEach((connection) => {
    if (connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(messageStr);
    }
  });
}

function handleSignalingMessage(connectionId, data) {
  const connection = activeConnections.get(connectionId);
  if (!connection) return;
  
  const { targetUserId, signalingData } = data;
  
  // Find target user's connection
  let targetConnection = null;
  activeConnections.forEach((conn, connId) => {
    if (conn.userId === targetUserId) {
      targetConnection = conn;
    }
  });
  
  if (targetConnection && targetConnection.ws.readyState === WebSocket.OPEN) {
    // Forward signaling message to target user
    targetConnection.ws.send(JSON.stringify({
      type: 'signaling_message',
      userId: connection.userId,
      userName: connection.userName,
      signalingData: signalingData,
      timestamp: new Date().toISOString()
    }));
    
    console.log('🔗 Signaling: ' + connection.userName + ' → ' + targetConnection.userName + ' (' + signalingData.type + ')');
  }
}

async function handleMediaStreamData(connectionId, data) {
  const connection = activeConnections.get(connectionId);
  if (!connection) return;
  
  const { recordingId, streamData, streamType = 'video' } = data;
  
  try {
    // Process the media stream data through the capture service
    const result = await mediaCaptureService.processStreamData(
      recordingId,
      connection.userId,
      Buffer.from(streamData, 'base64'), // Assuming base64 encoded stream data
      streamType
    );
    
    if (result.success) {
      // Send acknowledgment back to client
      connection.ws.send(JSON.stringify({
        type: 'stream_data_ack',
        recordingId: recordingId,
        participantId: connection.userId,
        streamType: streamType,
        dataSize: result.dataSize,
        timestamp: new Date().toISOString()
      }));
    }
    
  } catch (error) {
    console.error('❌ Failed to handle media stream data:', error);
    
    // Send error back to client
    connection.ws.send(JSON.stringify({
      type: 'stream_data_error',
      recordingId: recordingId,
      error: error.message,
      timestamp: new Date().toISOString()
    }));
  }
}

async function handleRecordingConsent(connectionId, data) {
  const connection = activeConnections.get(connectionId);
  if (!connection) return;
  
  const { recordingId, hearingId, consentGiven } = data;
  
  try {
    if (consentGiven) {
      // Add participant to active recording
      const participant = {
        userId: connection.userId,
        name: connection.userName,
        role: connection.userRole,
        consentGiven: true
      };
      
      await mediaCaptureService.addParticipant(recordingId, participant);
      
      // Update participant consent in database
      const participantId = `part-${recordingId}-${connection.userId}`;
      hearingDatabase.tables.participants.set(participantId, {
        id: participantId,
        hearing_id: hearingId,
        user_id: connection.userId,
        name: connection.userName,
        role: connection.userRole,
        join_time: new Date().toISOString(),
        consent_given: true,
        consent_timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Consent given by ${connection.userName} for recording ${recordingId}`);
    } else {
      console.log(`❌ Consent denied by ${connection.userName} for recording ${recordingId}`);
    }
    
    // Send consent confirmation back to client
    connection.ws.send(JSON.stringify({
      type: 'consent_confirmed',
      recordingId: recordingId,
      consentGiven: consentGiven,
      timestamp: new Date().toISOString()
    }));
    
  } catch (error) {
    console.error('❌ Failed to handle recording consent:', error);
    
    connection.ws.send(JSON.stringify({
      type: 'consent_error',
      recordingId: recordingId,
      error: error.message,
      timestamp: new Date().toISOString()
    }));
  }
}

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'vibrant', platform: 'Next.js Transitioned' });
});

app.get('/courtroom-control', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'courtroom-control.html'));
});

app.get('/real-chat-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'real-chat-test.html'));
});

app.get('/communication', (req, res) => {
  // Force no caching
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.sendFile(path.join(__dirname, 'public', 'communication.html'));
});

app.get('/messages', (req, res) => {
  // Force no caching
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.sendFile(path.join(__dirname, 'public', 'communication.html'));
});

app.get('/notifications', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'notifications.html'));
});

app.get('/reporting', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reporting.html'));
});

app.get('/hearings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'courtroom-control.html'));
});

app.get('/documents', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'integration.html'));
});

app.get('/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'security.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Add navigation functions to all pages
app.get('/navigation.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send('// Navigation functions for all pages' +
'function showDashboard() {' +
'    window.location.href = "dashboard.html";' +
'}' +
'' +
'function showCases() {' +
'    window.location.href = "case-management.html";' +
'}' +
'' +
'function showHearings() {' +
'    window.location.href = "courtroom-control.html";' +
'}' +
'' +
'function showDocuments() {' +
'    window.location.href = "integration.html";' +
'}' +
'' +
'function showVirtualHearing() {' +
'    window.location.href = "virtual-hearing.html";' +
'}' +
'' +
'function showUsers() {' +
'    window.location.href = "security.html";' +
'}' +
'' +
'function showReports() {' +
'    window.location.href = "reporting.html";' +
'}' +
'' +
'function showMessages() {' +
'    window.location.href = "communication.html";' +
'}' +
'' +
'function showSettings() {' +
'    alert("Settings page coming soon!");' +
'}' +
'' +
'function logout() {' +
'    localStorage.removeItem("courtUser");' +
'    window.location.href = "login.html";' +
'}');
});
// Authentication endpoints
app.post('/api/auth/login', authLimiter, (req, res) => {
  const { username, password, mfaCode } = req.body;

  try {
    const user = users.find(u => u.username === username);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account locked due to multiple failed attempts'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    const passwordValid = password === user.password;
    
    if (!passwordValid) {
      user.failedAttempts += 1;
      
      if (user.failedAttempts >= 5) {
        user.isLocked = true;
        console.log('ACCOUNT_LOCKED: ' + username + ' at ' + new Date().toISOString());
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        attemptsRemaining: 5 - user.failedAttempts
      });
    }

    user.failedAttempts = 0;
    user.isLocked = false;

    if (user.mfaEnabled) {
      if (!mfaCode) {
        const mfaToken = jwt.sign(
          { 
            userId: user.id, 
            mfaRequired: true,
            timestamp: Date.now()
          }, 
          JWT_SECRET
        );

        return res.json({
          success: true,
          requiresMFA: true,
          mfaToken: mfaToken,
          message: 'MFA code required'
        });
      }

      if (mfaCode.length !== 6 || !/^\d{6}$/.test(mfaCode)) {
        return res.status(401).json({
          success: false,
          message: 'Invalid MFA code'
        });
      }
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        roles: user.roles,
        permissions: user.permissions
      },
      JWT_SECRET
    );

    user.lastLogin = new Date().toISOString();
    console.log('LOGIN_SUCCESS: ' + username + ' at ' + new Date().toISOString());

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.roles,
          permissions: user.permissions
        },
        expiresIn: 86400
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  console.log('LOGOUT: ' + req.user.username + ' at ' + new Date().toISOString());
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      username: req.user.username,
      name: req.user.name,
      email: req.user.email,
      roles: req.user.roles,
      permissions: req.user.permissions,
      lastLogin: req.user.lastLogin
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Ethiopian Digital Court System is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Mock API endpoints
app.get('/api/cases', authenticateToken, (req, res) => {
  const mockCases = [
    {
      id: 'CIV-2026-001',
      title: 'Contract Dispute',
      type: 'Civil',
      status: 'Active',
      plaintiff: 'John Doe',
      defendant: 'ABC Corporation',
      filedDate: '2026-03-01',
      assignedJudge: 'Judge Alemu Bekele'
    }
  ];
  
  res.json({
    success: true,
    data: mockCases,
    total: mockCases.length
  });
});

app.get('/api/users', authenticateToken, requirePermission('user_management'), (req, res) => {
  const mockUsers = users.map(u => ({
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    roles: u.roles,
    isActive: u.isActive
  }));
  
  res.json({
    success: true,
    data: mockUsers,
    total: mockUsers.length
  });
});

// Virtual Hearing endpoints
app.get('/api/participant/video/:participantId', (req, res) => {
  const { participantId } = req.params;
  
  // Return a simple SVG placeholder for participant video background
  var svgPlaceholder = '<svg width="320" height="240" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="100%" height="100%" fill="#1a1a1a"/>' +
    '<text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#ffffff" font-family="Arial, sans-serif" font-size="18">' +
        participantId.split('-').map(function(word) { return word.charAt(0).toUpperCase() + word.slice(1); }).join(' ') +
      '</text>' +
    '</svg>';
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svgPlaceholder);
});

app.get('/api/participant/video/:participantId/data', authenticateToken, (req, res) => {
  const { participantId } = req.params;
  
  // Mock participant video data
  const participantVideoData = {
    participantId: participantId,
    streamUrl: 'rtmp://court-streams.ethiopia.gov/live/' + participantId,
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ],
    room: 'court-room-' + Date.now(),
    permissions: {
      video: true,
      audio: true,
      screen: true,
      record: req.user.roles.includes('judge') || req.user.roles.includes('clerk')
    },
    sessionInfo: {
      sessionId: 'session-' + Date.now(),
      startTime: new Date().toISOString(),
      duration: 7200, // 2 hours in seconds
      participants: []
    }
  };
  
  console.log('VIDEO STREAM: Participant ' + participantId + ' requested video access');
  
  res.json({
    success: true,
    data: participantVideoData
  });
});

app.post('/api/hearing/join', authenticateToken, (req, res) => {
  const { hearingId, participantId } = req.body;
  
  // Mock hearing session
  const hearingSession = {
    sessionId: 'hearing-' + hearingId + '-' + Date.now(),
    hearingId: hearingId,
    participantId: participantId,
    joinTime: new Date().toISOString(),
    role: req.user.roles[0],
    permissions: {
      speak: true,
      video: true,
      screen: req.user.roles.includes('judge') || req.user.roles.includes('lawyer'),
      record: req.user.roles.includes('judge') || req.user.roles.includes('clerk')
    },
    breakoutRooms: {
      judge: 'judge-chamber-' + hearingId,
      plaintiff: 'plaintiff-room-' + hearingId,
      defendant: 'defendant-room-' + hearingId
    }
  };
  
  console.log('HEARING JOIN: ' + participantId + ' joined hearing ' + hearingId);
  
  res.json({
    success: true,
    data: hearingSession
  });
});

app.post('/api/hearing/leave', authenticateToken, (req, res) => {
  const { hearingId, participantId } = req.body;
  
  console.log('HEARING LEAVE: ' + participantId + ' left hearing ' + hearingId);
  
  res.json({
    success: true,
    message: 'Successfully left hearing',
    timestamp: new Date().toISOString()
  });
});

// Enhanced Recording API Endpoints
app.post('/api/recording/start', authenticateToken, requirePermission('virtual_hearing'), async (req, res) => {
  const { hearingId, caseNumber, participants = [] } = req.body;
  
  try {
    // Validate required fields
    if (!hearingId || !caseNumber) {
      return res.status(400).json({
        success: false,
        message: 'hearingId and caseNumber are required'
      });
    }

    // Check if user has permission to record
    if (!req.user.roles.includes('judge') && !req.user.roles.includes('clerk')) {
      return res.status(403).json({
        success: false,
        message: 'Only judges and clerks can start recordings'
      });
    }

    // Check if hearing exists or create it
    let hearing = hearingDatabase.tables.hearings.get(hearingId);
    if (!hearing) {
      hearing = await hearingDatabase.createHearing({
        id: hearingId,
        case_number: caseNumber,
        title: `Virtual Hearing - ${caseNumber}`,
        start_time: new Date().toISOString(),
        status: 'active',
        presiding_judge: req.user.name
      });
    }

    // Generate file path for recording
    const pathInfo = fileStorageService.generateFilePath(hearingId, caseNumber, 'webm');
    
    // Create recording record
    const recordingId = `rec-${hearingId}-${Date.now()}`;
    const recording = await hearingDatabase.createRecording({
      id: recordingId,
      hearing_id: hearingId,
      filename: pathInfo.filename,
      file_path: pathInfo.relativePath,
      file_size: 0,
      duration: 0,
      format: 'webm',
      start_time: new Date().toISOString(),
      status: 'recording'
    });

    // Start media capture service
    const captureResult = await mediaCaptureService.startCapture(recordingId, hearingId, participants);
    if (!captureResult.success) {
      throw new Error('Failed to start media capture service');
    }

    // Log participants who consented
    for (const participant of participants) {
      if (participant.consentGiven) {
        await hearingDatabase.tables.participants.set(`part-${recordingId}-${participant.userId}`, {
          id: `part-${recordingId}-${participant.userId}`,
          hearing_id: hearingId,
          user_id: participant.userId,
          name: participant.name,
          role: participant.role,
          join_time: new Date().toISOString(),
          consent_given: true,
          consent_timestamp: new Date().toISOString()
        });
      }
    }

    // Broadcast recording start to all participants
    broadcastToHearing(hearingId, {
      type: 'recording_started',
      recordingId: recordingId,
      hearingId: hearingId,
      startedBy: req.user.name,
      timestamp: new Date().toISOString()
    });

    console.log(`🎥 Recording started: ${recordingId} for hearing ${hearingId} by ${req.user.username}`);
    
    res.json({
      success: true,
      message: 'Recording started successfully',
      data: {
        recordingId: recordingId,
        hearingId: hearingId,
        filename: pathInfo.filename,
        startTime: recording.start_time,
        status: 'recording'
      }
    });

  } catch (error) {
    console.error('❌ Failed to start recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start recording',
      error: error.message
    });
  }
});

// Test endpoint without authentication for development
app.post('/api/recording/start-test', async (req, res) => {
  const { hearingId, caseNumber, participants = [] } = req.body;
  
  try {
    // Mock user for testing
    const mockUser = {
      id: 'test-user',
      name: 'Test User',
      username: 'test.user',
      roles: ['judge']
    };

    // Validate required fields
    if (!hearingId || !caseNumber) {
      return res.status(400).json({
        success: false,
        message: 'hearingId and caseNumber are required'
      });
    }

    // Check if hearing exists or create it
    let hearing = hearingDatabase.tables.hearings.get(hearingId);
    if (!hearing) {
      hearing = await hearingDatabase.createHearing({
        id: hearingId,
        case_number: caseNumber,
        title: `Virtual Hearing - ${caseNumber}`,
        start_time: new Date().toISOString(),
        status: 'active',
        presiding_judge: mockUser.name
      });
    }

    // Generate file path for recording
    const pathInfo = fileStorageService.generateFilePath(hearingId, caseNumber, 'webm');
    
    // Create recording record
    const recordingId = `rec-${hearingId}-${Date.now()}`;
    const recording = await hearingDatabase.createRecording({
      id: recordingId,
      hearing_id: hearingId,
      filename: pathInfo.filename,
      file_path: pathInfo.relativePath,
      file_size: 0,
      duration: 0,
      format: 'webm',
      start_time: new Date().toISOString(),
      status: 'recording'
    });

    // Start media capture service
    const captureResult = await mediaCaptureService.startCapture(recordingId, hearingId, participants);
    if (!captureResult.success) {
      throw new Error('Failed to start media capture service');
    }

    console.log(`🎥 Test recording started: ${recordingId} for hearing ${hearingId}`);
    
    res.json({
      success: true,
      message: 'Test recording started successfully',
      data: {
        recordingId: recordingId,
        hearingId: hearingId,
        filename: pathInfo.filename,
        startTime: recording.start_time,
        status: 'recording'
      }
    });

  } catch (error) {
    console.error('❌ Failed to start test recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start test recording',
      error: error.message
    });
  }
});

app.post('/api/recording/stop-test', async (req, res) => {
  const { recordingId } = req.body;
  
  try {
    // Validate required fields
    if (!recordingId) {
      return res.status(400).json({
        success: false,
        message: 'recordingId is required'
      });
    }

    // Get recording record
    const recording = hearingDatabase.tables.recordings.get(recordingId);
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found'
      });
    }

    // Stop media capture service and get final recording
    const hearing = hearingDatabase.tables.hearings.get(recording.hearing_id);
    const caseNumber = hearing ? hearing.case_number : 'UNKNOWN';
    
    const captureResult = await mediaCaptureService.stopCapture(recordingId, caseNumber);
    if (!captureResult.success) {
      throw new Error('Failed to stop media capture service');
    }

    // Update recording with final metadata from capture service
    const endTime = captureResult.endTime;
    const duration = captureResult.duration;
    const fileSize = captureResult.fileInfo.fileSize;

    const updatedRecording = await hearingDatabase.updateRecording(recordingId, {
      end_time: endTime,
      duration: duration,
      file_size: fileSize,
      status: 'completed'
    });

    console.log(`⏹️ Test recording stopped: ${recordingId} (${duration}s)`);
    
    res.json({
      success: true,
      message: 'Test recording stopped successfully',
      data: {
        recordingId: recordingId,
        hearingId: recording.hearing_id,
        duration: duration,
        endTime: endTime,
        status: 'completed',
        fileSize: fileSize
      }
    });

  } catch (error) {
    console.error('❌ Failed to stop test recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop test recording',
      error: error.message
    });
  }
});

app.post('/api/recording/stop', authenticateToken, requirePermission('virtual_hearing'), async (req, res) => {
  const { recordingId, hearingId } = req.body;
  
  try {
    // Validate required fields
    if (!recordingId) {
      return res.status(400).json({
        success: false,
        message: 'recordingId is required'
      });
    }

    // Get recording record
    const recording = hearingDatabase.tables.recordings.get(recordingId);
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found'
      });
    }

    // Check if user has permission to stop recording
    if (!req.user.roles.includes('judge') && !req.user.roles.includes('clerk')) {
      return res.status(403).json({
        success: false,
        message: 'Only judges and clerks can stop recordings'
      });
    }

    // Stop media capture service and get final recording
    const hearing = hearingDatabase.tables.hearings.get(recording.hearing_id);
    const caseNumber = hearing ? hearing.case_number : 'UNKNOWN';
    
    const captureResult = await mediaCaptureService.stopCapture(recordingId, caseNumber);
    if (!captureResult.success) {
      throw new Error('Failed to stop media capture service');
    }

    // Update recording with final metadata from capture service
    const endTime = captureResult.endTime;
    const duration = captureResult.duration;
    const fileSize = captureResult.fileInfo.fileSize;

    const updatedRecording = await hearingDatabase.updateRecording(recordingId, {
      end_time: endTime,
      duration: duration,
      file_size: fileSize,
      status: 'completed'
    });

    // Create recording metadata (already handled by media capture service)
    // The metadata is automatically created when stopping capture

    // Broadcast recording stop to all participants
    broadcastToHearing(recording.hearing_id, {
      type: 'recording_stopped',
      recordingId: recordingId,
      hearingId: recording.hearing_id,
      stoppedBy: req.user.name,
      duration: duration,
      timestamp: endTime
    });

    console.log(`⏹️ Recording stopped: ${recordingId} (${duration}s) by ${req.user.username}`);
    
    res.json({
      success: true,
      message: 'Recording stopped successfully',
      data: {
        recordingId: recordingId,
        hearingId: recording.hearing_id,
        duration: duration,
        endTime: endTime,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('❌ Failed to stop recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop recording',
      error: error.message
    });
  }
});

app.get('/api/recording/:hearingId', authenticateToken, async (req, res) => {
  const { hearingId } = req.params;
  
  try {
    // Get all recordings for the hearing
    const recordings = await hearingDatabase.getRecordings(hearingId);
    
    // Get hearing information
    const hearing = hearingDatabase.tables.hearings.get(hearingId);
    if (!hearing) {
      return res.status(404).json({
        success: false,
        message: 'Hearing not found'
      });
    }

    // Get participants for each recording
    const recordingsWithMetadata = await Promise.all(
      recordings.map(async (recording) => {
        const metadata = hearingDatabase.tables.recording_metadata.get(`meta-${recording.id}`);
        const participants = await hearingDatabase.getParticipants(hearingId);
        
        return {
          ...recording,
          metadata: metadata || {},
          participants: participants.length,
          participantList: participants.map(p => ({
            name: p.name,
            role: p.role,
            consentGiven: p.consent_given
          }))
        };
      })
    );

    res.json({
      success: true,
      data: {
        hearing: hearing,
        recordings: recordingsWithMetadata,
        totalRecordings: recordings.length
      }
    });

  } catch (error) {
    console.error('❌ Failed to get recordings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recordings',
      error: error.message
    });
  }
});

app.post('/api/recording/upload', authenticateToken, requirePermission('virtual_hearing'), async (req, res) => {
  const { recordingId, hearingId, caseNumber } = req.body;
  
  try {
    // This endpoint will be called by the client to upload the actual recording blob
    // For now, we'll simulate the file save process
    
    const recording = hearingDatabase.tables.recordings.get(recordingId);
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found'
      });
    }

    // In a real implementation, you would:
    // 1. Receive the recording blob from the client
    // 2. Save it using fileStorageService.saveRecording()
    // 3. Update the recording with actual file size and checksum
    
    // For now, simulate successful upload
    const mockFileSize = 50 * 1024 * 1024; // 50MB
    const updatedRecording = await hearingDatabase.updateRecording(recordingId, {
      file_size: mockFileSize,
      status: 'completed'
    });

    console.log(`💾 Recording uploaded: ${recordingId} (${mockFileSize} bytes)`);
    
    res.json({
      success: true,
      message: 'Recording uploaded successfully',
      data: {
        recordingId: recordingId,
        fileSize: mockFileSize,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('❌ Failed to upload recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload recording',
      error: error.message
    });
  }
});

// Virtual Hearing Session Management
app.post('/api/virtual-hearing/join', authenticateToken, (req, res) => {
  const { caseNumber, hearingId } = req.body;
  
  // In a real implementation, this would verify the user's access to the specific case/hearing
  console.log(`📡 User ${req.user.name} joining virtual hearing ${hearingId} for case ${caseNumber}`);
  
  res.json({
    success: true,
    message: 'Authorized for neural link establishment',
    data: {
      id: `session-${Date.now()}`,
      hearingId,
      caseNumber,
      startTime: new Date().toISOString(),
      encryption: 'AES-4096-SECURE'
    }
  });
});

app.post('/api/virtual-hearing/:sessionId/control', authenticateToken, (req, res) => {
  const { action } = req.body;
  const { sessionId } = req.params;
  
  console.log(`⚖️ Judicial Control: ${action} in session ${sessionId} by ${req.user.name}`);
  
  res.json({
    success: true,
    message: `Control signal ${action} disseminated`
  });
});

app.post('/api/virtual-hearing/:sessionId/recording', authenticateToken, (req, res) => {
  const { status } = req.body;
  const { sessionId } = req.params;
  
  console.log(`🎥 Recording Status: ${status} for session ${sessionId}`);
  
  res.json({
    success: true,
    message: `Session capture ${status === 'START' ? 'initiated' : 'terminated'}`
  });
});

// Catch-all handler for frontend routes (SPA support)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  }
  
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Database API endpoints for admin interface
app.get('/api/database/schema', async (req, res) => {
  try {
    const schema = hearingDatabase.getTableSchema();
    res.json({
      success: true,
      data: schema,
      database_type: 'PostgreSQL',
      database_name: 'court'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get database schema',
      error: error.message
    });
  }
});

app.get('/api/database/hearings', async (req, res) => {
  try {
    const hearings = await hearingDatabase.getHearings();
    res.json({
      success: true,
      data: hearings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get hearings',
      error: error.message
    });
  }
});

app.get('/api/database/recordings', async (req, res) => {
  try {
    const recordings = await hearingDatabase.getRecordings();
    res.json({
      success: true,
      data: recordings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get recordings',
      error: error.message
    });
  }
});

app.get('/api/database/participants', async (req, res) => {
  try {
    // Get participants from all hearings
    const hearings = await hearingDatabase.getHearings();
    let allParticipants = [];
    
    for (const hearing of hearings) {
      const participants = await hearingDatabase.getParticipants(hearing.id);
      allParticipants = allParticipants.concat(participants);
    }
    
    res.json({
      success: true,
      data: allParticipants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get participants',
      error: error.message
    });
  }
});

app.get('/api/database/storage-info', async (req, res) => {
  try {
    const recordings = await hearingDatabase.getRecordings();
    const totalRecordings = recordings.length;
    const totalSize = recordings.reduce((sum, rec) => sum + (parseInt(rec.file_size) || 0), 0);
    const totalDuration = recordings.reduce((sum, rec) => sum + (parseInt(rec.duration) || 0), 0);
    
    // Update storage usage in database
    await hearingDatabase.updateStorageUsage();
    
    res.json({
      success: true,
      data: {
        totalRecordings,
        totalSize,
        totalDuration,
        storagePath: path.join(__dirname, 'recordings'),
        database: 'PostgreSQL',
        databaseName: 'court'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get storage info',
      error: error.message
    });
  }
});

app.get('/api/database/cases', async (req, res) => {
  try {
    const cases = await hearingDatabase.getCases();
    res.json({
      success: true,
      data: cases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get cases',
      error: error.message
    });
  }
});

app.get('/api/database/users', async (req, res) => {
  try {
    // For security, don't expose password hashes
    const users = [
      { id: 'judge-alemu', name: 'Judge Alemu Bekele', roles: ['judge'], is_active: true },
      { id: 'lawyer-sara', name: 'Lawyer Sara Ahmed', roles: ['lawyer'], is_active: true },
      { id: 'admin-system', name: 'System Administrator', roles: ['admin'], is_active: true },
      { id: 'clerk-mohammed', name: 'Clerk Mohammed Hassan', roles: ['clerk'], is_active: true },
      { id: 'plaintiff-john', name: 'John Doe', roles: ['plaintiff'], is_active: true },
      { id: 'lawyer-robert', name: 'Lawyer Robert Johnson', roles: ['lawyer'], is_active: true }
    ];
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Start server
server.listen(PORT, async () => {
  // Initialize database and file storage
  try {
    await hearingDatabase.initialize();
    await fileStorageService.initialize();
    console.log('🏛️ Ethiopian Digital Court System running on http://localhost:' + PORT);
    console.log('📊 Health check available at http://localhost:' + PORT + '/health');
    console.log('📡 WebSocket server running on ws://localhost:' + PORT);
    console.log('🎥 Virtual Hearing Recording System ready');
    console.log('📚 System ready for testing');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
});
