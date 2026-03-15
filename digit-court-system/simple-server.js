const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url} [${req.headers['accept'] || '-'}]`);
  next();
});

// No static file serving needed for Next.js app
// app.use(express.static(path.join(__dirname, 'public')));

// Mock API routes to prevent 404s
app.get('/api/health', (req, res) => {
  res.json({ status: 'vibrant', mode: 'Next.js Transitioned' });
});

// Mock API routes to prevent 404s
app.get('/api/cases/:id/timeline', (req, res) => {
  res.json({ success: true, data: [] });
});

app.post('/api/documents/upload', (req, res) => {
  res.json({ success: true, message: 'File uploaded (mock)' });
});

app.get('/api/me', (req, res) => {
  res.json({ success: true, user: { id: 'USR-002', name: 'Lawyer Sara' } });
});

// WebSocket handling
const activeConnections = new Map();
const chatMessages = [];

wss.on('connection', (ws, req) => {
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(`✅ WebSocket connected: ${connectionId}`);

  activeConnections.set(connectionId, {
    ws: ws,
    userId: null,
    userName: null,
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
    console.log(`❌ WebSocket disconnected: ${connectionId}`);
    const connection = activeConnections.get(connectionId);
    if (connection && connection.userId) {
      // Broadcast user left
      broadcast({
        type: 'user_left',
        userId: connection.userId,
        userName: connection.userName,
        timestamp: new Date().toISOString()
      }, connectionId);
    }
    activeConnections.delete(connectionId);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${connectionId}:`, error);
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

  switch (data.type) {
    case 'authenticate':
      connection.userId = data.userId;
      connection.userName = data.userName;

      console.log(`🔐 Authenticated: ${data.userName} (${data.userId})`);

      // Broadcast user joined
      broadcast({
        type: 'user_joined',
        userId: data.userId,
        userName: data.userName,
        timestamp: new Date().toISOString()
      }, connectionId);
      break;

    case 'join_chat_room':
      console.log(`📝 ${connection.userName} joined room: ${data.roomId}`);
      // Send existing messages to new user
      chatMessages.forEach(msg => {
        if (msg.userId !== connection.userId) {
          connection.ws.send(JSON.stringify(msg));
        }
      });
      break;

    case 'send_message':
      const chatMsg = {
        type: 'new_message',
        id: data.messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId: connection.userId,
        userName: connection.userName,
        message: data.message || data.text,
        text: data.text || data.message,
        timestamp: data.timestamp || new Date().toISOString(),
        targetUserId: data.targetUserId,
        encrypted: data.encrypted
      };

      chatMessages.push(chatMsg);

      if (data.targetUserId) {
        // Find the target user's connection
        activeConnections.forEach((conn, id) => {
          if (conn.userId === data.targetUserId && conn.ws.readyState === WebSocket.OPEN) {
            conn.ws.send(JSON.stringify(chatMsg));
          }
        });
      } else {
        // Broadcast to all other users
        broadcast(chatMsg, connectionId);
      }

      console.log(`💬 ${connection.userName} -> ${data.targetUserId || 'all'}: ${data.message}`);
      break;

    case 'typing':
      broadcast({
        type: 'typing_indicator',
        userId: connection.userId,
        userName: connection.userName,
        isTyping: data.isTyping,
        timestamp: new Date().toISOString()
      }, connectionId);
      break;

    case 'mark_seen':
      console.log(`👁️ ${connection.userName} marked messages from ${data.senderId} as seen`);
      // Notify the sender that their messages were seen
      activeConnections.forEach((conn, id) => {
        if (conn.userId === data.senderId && conn.ws.readyState === WebSocket.OPEN) {
          conn.ws.send(JSON.stringify({
            type: 'message_seen',
            seenBy: connection.userId,
            timestamp: new Date().toISOString()
          }));
        }
      });
      break;

    case 'delete_message':
      console.log(`🗑️ ${connection.userName} deleted message ${data.messageId} for everyone`);
      // Only broadcast the deletion to the other participant
      if (data.targetUserId) {
        activeConnections.forEach((conn, id) => {
          if (conn.userId === data.targetUserId && conn.ws.readyState === WebSocket.OPEN) {
            conn.ws.send(JSON.stringify({
              type: 'message_deleted',
              messageId: data.messageId,
              deletedBy: connection.userId
            }));
          }
        });
      }
      break;

    case 'update_message':
      console.log(`✏️ ${connection.userName} edited message ${data.messageId}`);
      if (data.targetUserId) {
        activeConnections.forEach((conn, id) => {
          if (conn.userId === data.targetUserId && conn.ws.readyState === WebSocket.OPEN) {
            conn.ws.send(JSON.stringify({
              type: 'message_updated',
              messageId: data.messageId,
              text: data.text,
              updatedAt: new Date().toISOString()
            }));
          }
        });
      }
      break;

    case 'signaling_message':
      // Forward WebRTC signaling (offer, answer, ice-candidate) to the specific target user
      if (data.targetUserId) {
        // Find the connection for the target user
        let targetConnectionId = null;
        for (const [id, conn] of activeConnections.entries()) {
          if (conn.userId === data.targetUserId) {
            targetConnectionId = id;
            break;
          }
        }

        if (targetConnectionId) {
          const targetConnection = activeConnections.get(targetConnectionId);
          if (targetConnection && targetConnection.ws.readyState === WebSocket.OPEN) {
            targetConnection.ws.send(JSON.stringify({
              type: 'signaling_message',
              userId: connection.userId,
              userName: connection.userName,
              signalingData: data.signalingData
            }));
          }
        }
      }
      break;
  }
}

function broadcast(message, excludeConnectionId) {
  const messageStr = JSON.stringify(message);

  activeConnections.forEach((connection, id) => {
    if (id !== excludeConnectionId && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(messageStr);
    }
  });
}

const PORT = 5174;

server.listen(PORT, () => {
  console.log(`🚀 Simple Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server running on ws://localhost:${PORT}`);
  console.log(`📚 System ready for testing`);
});
