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
const hearingDatabase = require('../../database/postgres-database');
const fileStorageService = require('../../services/file-storage');
const mediaCaptureService = require('../../services/media-capture');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3004; // Standard Microservice Instance

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
  max: 50, // increased limit for development
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000'],
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

// Ensure directories exist
const uploadDirPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDirPath)) fs.mkdirSync(uploadDirPath, { recursive: true });

const recordingsDirPath = path.join(__dirname, 'recordings');
if (!fs.existsSync(recordingsDirPath)) fs.mkdirSync(recordingsDirPath, { recursive: true });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/recordings', express.static(path.join(__dirname, 'recordings')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Generic File Upload Endpoint
app.post('/api/upload', upload.array('files'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }
  const files = req.files.map(f => ({
    name: f.originalname,
    filename: f.filename,
    size: f.size,
    type: f.mimetype,
    url: `http://localhost:5173/uploads/${f.filename}`
  }));
  res.json({ success: true, files });
});

// Mock user database for authentication
const users = [
  {
    id: 'admin-system',
    username: 'admin',
    password: 'admin123',
    name: 'System Administrator',
    email: 'admin@court.gov.et',
    roles: ['admin'],
    permissions: ['user_management', 'case_management', 'hearing_control', 'virtual_hearing', 'communication', 'reporting', 'system_config', 'security'],
    isActive: true,
    lastLogin: new Date().toISOString()
  },
  {
    id: 'judge-alemu',
    username: 'judge',
    password: 'judge123',
    name: 'Judge Alemu Bekele',
    email: 'a.bekele@court.gov.et',
    roles: ['judge'],
    permissions: ['case_management', 'hearing_control', 'virtual_hearing', 'reporting'],
    isActive: true,
    lastLogin: new Date().toISOString()
  },
  {
    id: 'clerk-mohammed',
    username: 'clerk',
    password: 'clerk123',
    name: 'Clerk Mohammed Hassan',
    email: 'm.hassan@court.gov.et',
    roles: ['clerk'],
    permissions: ['case_management', 'document_verification', 'record_keeping'],
    isActive: true,
    lastLogin: new Date().toISOString()
  },
  {
    id: 'lawyer-sara',
    username: 'lawyer',
    password: 'lawyer123',
    name: 'Lawyer Sara Ahmed',
    email: 's.ahmed@lawfirm.et',
    roles: ['lawyer'],
    permissions: ['case_filing', 'document_submission', 'virtual_hearing'],
    isActive: true,
    lastLogin: new Date().toISOString()
  },
  {
    id: 'plaintiff-john',
    username: 'plaintiff',
    password: 'user123',
    name: 'John Doe (Plaintiff)',
    email: 'john.doe@email.com',
    roles: ['plaintiff'],
    permissions: ['case_tracking', 'document_upload', 'virtual_hearing'],
    isActive: true,
    lastLogin: new Date().toISOString()
  },
  {
    id: 'defendant-abel',
    username: 'defendant',
    password: 'user123',
    name: 'Abel Tesfaye (Defendant)',
    email: 'abel.t@email.com',
    roles: ['defendant'],
    permissions: ['case_response', 'document_submission', 'virtual_hearing'],
    isActive: true,
    lastLogin: new Date().toISOString()
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
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      await handleWebSocketMessage(connectionId, data);
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

async function handleWebSocketMessage(connectionId, data) {
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
        
        const messageData = {
          sender_id: connection.userId,
          recipient_id: data.recipientId,
          content: data.content,
          attachments: data.attachments || [],
          status: 'sent'
        };

        // Persist to database
        const savedMessage = await hearingDatabase.createMessage(messageData);
        
        const chatMessage = {
          type: 'chat_message',
          id: savedMessage.id,
          senderId: savedMessage.sender_id,
          senderName: connection.userName,
          content: savedMessage.content,
          timestamp: savedMessage.timestamp,
          attachments: savedMessage.attachments,
          status: savedMessage.status,
          encrypted: data.encrypted || false
        };
        
        // Send to recipient if online
        if (recipientConnection && recipientConnection.ws.readyState === WebSocket.OPEN) {
          recipientConnection.ws.send(JSON.stringify(chatMessage));
          console.log(`📤 Message sent from ${connection.userName} to ${data.recipientId}`);
          
          // Update status to delivered
          await hearingDatabase.updateMessage(savedMessage.id, { status: 'delivered' });
          chatMessage.status = 'delivered';
          
          // Send delivery confirmation back to sender
          connection.ws.send(JSON.stringify({
            type: 'message_delivered',
            id: savedMessage.id,
            recipientId: data.recipientId,
            timestamp: new Date().toISOString()
          }));
        } else {
          console.log(`📪 Recipient ${data.recipientId} is offline, message stored`);
          // Notify sender it was stored
          connection.ws.send(JSON.stringify({
            type: 'message_stored',
            id: savedMessage.id,
            recipientId: data.recipientId,
            timestamp: new Date().toISOString()
          }));
        }
        
        // Always send copy back to sender for sync
        connection.ws.send(JSON.stringify({
          ...chatMessage,
          recipientId: data.recipientId,
          isSelf: true
        }));
      }
      break;

    case 'fetch_messages':
      try {
        const history = await hearingDatabase.getMessages({
          sender_id: connection.userId,
          recipient_id: data.recipientId,
          limit: data.limit || 50
        });
        
        connection.ws.send(JSON.stringify({
          type: 'message_history',
          recipientId: data.recipientId,
          messages: history.map(m => ({
            id: m.id,
            senderId: m.sender_id,
            senderName: m.sender_name,
            content: m.content,
            timestamp: m.timestamp,
            attachments: m.attachments,
            status: m.status,
            isSelf: m.sender_id === connection.userId
          }))
        }));
      } catch (error) {
        console.error('Failed to fetch message history:', error);
      }
      break;

    case 'mark_read':
      if (data.messageIds && data.messageIds.length > 0) {
        for (const id of data.messageIds) {
          await hearingDatabase.updateMessage(id, { status: 'read' });
        }
        // Notify the sender that messages were read
        if (data.senderId) {
          activeConnections.forEach(conn => {
            if (conn.userId === data.senderId && conn.ws.readyState === WebSocket.OPEN) {
              conn.ws.send(JSON.stringify({
                type: 'messages_read',
                messageIds: data.messageIds,
                readBy: connection.userId,
                timestamp: new Date().toISOString()
              }));
            }
          });
        }
      }
      break;

    case 'delete_message':
      await hearingDatabase.updateMessage(data.messageId, { is_deleted: true });
      // Notify both parties
      const deletionNotice = {
        type: 'message_deleted',
        messageId: data.messageId,
        deletedBy: connection.userId
      };
      
      // Send to recipient
      activeConnections.forEach(conn => {
        if ((conn.userId === data.recipientId || conn.userId === connection.userId) && conn.ws.readyState === WebSocket.OPEN) {
          conn.ws.send(JSON.stringify(deletionNotice));
        }
      });
      break;

    case 'edit_message':
      const editedMsg = await hearingDatabase.updateMessage(data.messageId, { content: data.content });
      if (editedMsg) {
        const editNotice = {
          type: 'message_edited',
          messageId: data.messageId,
          content: data.content,
          editedAt: editedMsg.edited_at
        };
        activeConnections.forEach(conn => {
          if ((conn.userId === data.recipientId || conn.userId === connection.userId) && conn.ws.readyState === WebSocket.OPEN) {
            conn.ws.send(JSON.stringify(editNotice));
          }
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
  
  activeConnections.forEach((conn) => {
    if (conn.userId === targetUserId && conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(JSON.stringify({
        type: 'signaling_message',
        senderId: connection.userId,
        senderName: connection.userName,
        signalingData: signalingData,
        timestamp: new Date().toISOString()
      }));
    }
  });

  console.log(`📡 Signaling [${signalingData.type}] from ${connection.userName} to ${targetUserId}`);
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
        message: 'Account locked due to multiple failed attempts. Please try again later or contact support.'
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
        attemptsRemaining: Math.max(0, 5 - user.failedAttempts)
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

// Reset account lock (for development/support)
app.post('/api/auth/reset-account', (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({
      success: false,
      message: 'Username required'
    });
  }
  
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  user.failedAttempts = 0;
  user.isLocked = false;
  
  console.log('ACCOUNT_RESET: ' + username + ' at ' + new Date().toISOString());
  
  res.json({
    success: true,
    message: 'Account reset successfully'
  });
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

// Hearings
app.get('/api/hearings', authenticateToken, (req, res) => {
  const mockHearings = [
    {
      id: 'HRG-2026-001',
      caseId: 'CIV-2026-001',
      caseNumber: 'CIV-2026-001',
      title: 'Tekle vs. Ethiopian Airlines',
      type: 'Civil',
      date: '2026-03-20',
      time: '09:00 AM',
      courtroom: 'Courtroom A',
      judge: 'Judge Alemu Bekele',
      status: 'Scheduled',
      participants: ['Judge Alemu Bekele', 'Lawyer Sara Ahmed', 'Lawyer Robert Johnson']
    },
    {
      id: 'HRG-2026-002',
      caseId: 'CRM-2026-002',
      caseNumber: 'CRM-2026-002',
      title: 'State vs. Mohammed Ali',
      type: 'Criminal',
      date: '2026-03-21',
      time: '11:00 AM',
      courtroom: 'Courtroom B',
      judge: 'Judge Alemu Bekele',
      status: 'Scheduled',
      participants: ['Judge Alemu Bekele', 'Prosecutor', 'Defense Counsel']
    },
    {
      id: 'HRG-2026-003',
      caseId: 'FAM-2026-001',
      caseNumber: 'FAM-2026-001',
      title: 'Hailu vs. Hailu (Divorce)',
      type: 'Family',
      date: '2026-03-18',
      time: '02:00 PM',
      courtroom: 'Courtroom C',
      judge: 'Judge Alemu Bekele',
      status: 'Completed',
      participants: ['Judge Alemu Bekele', 'Lawyer Sara Ahmed']
    }
  ];

  res.json({
    success: true,
    data: mockHearings,
    total: mockHearings.length
  });
});

// Documents
app.get('/api/documents', authenticateToken, (req, res) => {
  const mockDocuments = [
    {
      id: 'DOC-2026-001',
      title: 'Case Filing - CIV-2026-001',
      type: 'Petition',
      caseNumber: 'CIV-2026-001',
      uploadedBy: 'Lawyer Sara Ahmed',
      uploadedAt: '2026-03-10T09:15:00Z',
      status: 'Accepted',
      fileSize: '245 KB'
    },
    {
      id: 'DOC-2026-002',
      title: 'Evidence Exhibit A - CRM-2026-002',
      type: 'Evidence',
      caseNumber: 'CRM-2026-002',
      uploadedBy: 'Prosecutor',
      uploadedAt: '2026-03-12T14:30:00Z',
      status: 'Under Review',
      fileSize: '1.2 MB'
    },
    {
      id: 'DOC-2026-003',
      title: 'Divorce Agreement Draft',
      type: 'Agreement',
      caseNumber: 'FAM-2026-001',
      uploadedBy: 'Lawyer Robert Johnson',
      uploadedAt: '2026-03-15T11:00:00Z',
      status: 'Accepted',
      fileSize: '88 KB'
    }
  ];

  res.json({
    success: true,
    data: mockDocuments,
    total: mockDocuments.length
  });
});

// Reports and Analytics
app.get('/api/reports/analytics/comprehensive', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      caseAnalytics: {
        total: 1248,
        closed: 856,
        pending: 392,
        averageResolutionDays: 45
      },
      performanceIndices: [
        { label: 'Clearance Rate', value: '92%' },
        { label: 'Efficiency', value: '88%' }
      ],
      caseVolume: {
        monthly: [120, 145, 132, 168, 154, 192]
      },
      courtPerformance: {
        clearanceRate: 92,
        hearingEfficiency: 88,
        digitalAdoption: 75
      }
    }
  });
});

// Audit Logs
app.get('/api/system/audit-logs', authenticateToken, (req, res) => {
  const mockLogs = [
    {
      id: 'log-1',
      action: 'HEARING_STARTED',
      details: 'Virtual hearing initiated for case CIV-2026-001',
      userId: 'judge-alemu',
      timestamp: new Date().toISOString()
    },
    {
      id: 'log-2',
      action: 'CASE_UPDATING',
      details: 'Evidence submitted for case CIV-2026-002',
      userId: 'lawyer-sara',
      timestamp: new Date().toISOString()
    },
    {
      id: 'log-3',
      action: 'USER_LOGIN',
      details: 'System administrator logged in',
      userId: 'admin-system',
      timestamp: new Date().toISOString()
    },
    {
      id: 'log-4',
      action: 'DOCUMENT_UPLOAD',
      details: 'New brief uploaded for case FAM-2026-001',
      userId: 'lawyer-robert',
      timestamp: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: mockLogs
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

// API 404 Catch-all
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found on judicial server'
  });
});

// SPA Catch-all (for browser navigation)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
