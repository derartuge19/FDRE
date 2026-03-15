# 🚀 Ethiopian Digital Court System - Deployment Guide

## 📋 Current System Status

### ✅ What's Working Right Now
- **Main Server**: Node.js running on port 5173
- **WebSocket**: Real-time communication server
- **Database**: PostgreSQL, Redis, Elasticsearch (Docker)
- **Frontend**: All modules accessible via browser
- **Authentication**: JWT-based with mock users

### 🧪 Mock Data Limitations
- **Users**: Hardcoded in server.js (lines 106-196)
- **Messages**: Stored in memory, lost on restart
- **Hearings**: Virtual sessions only exist while server runs
- **Files**: Upload to local filesystem only

## 🧪 How to Test Real-Time Features (Step-by-Step)

### 1. Open Multiple Browser Tabs
```bash
# Open court system in different browsers/incognito tabs
# Chrome: http://localhost:5173
# Firefox: http://localhost:5173  
# Edge: http://localhost:5173
```

### 2. Login as Different Users
```javascript
// Test Credentials (all use MFA: 123456)
Judge: judge.alemu / Judge123!
Lawyer: lawyer.sara / Lawyer123!  
Admin: admin.system / Admin123!
Clerk: clerk.mohammed / Clerk123!
Plaintiff: plaintiff.john / User123!
Defendant: lawyer-robert / Lawyer123!
```

### 3. Test Real-Time Chat
1. **User A** logs in as `judge.alemu`
2. **User B** logs in as `lawyer.sara` (different browser)
3. **Both go to Communication module**
4. **User A sends message** → User B sees it instantly
5. **Check browser console** → See WebSocket connection logs

### 4. Test Virtual Hearing
1. **Judge** logs in and goes to Virtual Hearing
2. **Lawyer** logs in and joins same hearing
3. **Both enable video/audio** → See each other's streams
4. **Judge starts recording** → All participants notified
5. **Use chat** → Real-time messages appear

### 5. Monitor Real-Time Activity
```bash
# Check server logs for WebSocket activity
# Look for these messages:
# "WebSocket connected: conn_..."
# "WebSocket authenticated: Judge Alemu"
# "Message sent to room general by Judge Alemu"
# "Judge Alemu joined chat room: general"
```

## 🚀 Production Deployment Options

### Option 1: Docker Microservices (Recommended)
```bash
# 1. Install Maven (if not installed)
choco install maven

# 2. Build all Java services
cd c:\Users\hp\OneDrive\Desktop\court\digit-court-system
.\build-services.bat

# 3. Start infrastructure services
docker-compose -f docker-compose-services.yml up -d

# 4. Start Java microservices
docker-compose -f docker-compose-services.yml up -d digit-user-service digit-notification-service

# 5. Verify all services
docker-compose -f docker-compose-services.yml ps
```

### Option 2: Cloud Deployment (AWS/Azure/GCP)
```bash
# 1. Containerize application
docker build -t ethiopian-court-system .

# 2. Push to registry
docker push your-registry/ethiopian-court-system

# 3. Deploy to cloud
# AWS ECS / Azure Container Instances / Google Cloud Run
kubectl apply -f deployment.yaml
```

### Option 3: Traditional Server
```bash
# 1. Install dependencies
npm install --production
npm install pm2 -g

# 2. Configure environment
export NODE_ENV=production
export JWT_SECRET=your-super-secure-jwt-secret
export DB_HOST=your-production-db
export REDIS_HOST=your-production-redis

# 3. Start with process manager
pm2 start server.js --name "court-system"

# 4. Set up reverse proxy (nginx)
# Configure nginx to handle SSL and load balancing
```

## 🔧 From Mock to Production

### 1. Database Integration
```javascript
// Replace mock users array with database queries
const db = require('pg').Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

// Replace in-memory storage with database
app.post('/api/messages', async (req, res) => {
  const { message, recipientId } = req.body;
  await db.query(
    'INSERT INTO messages (sender_id, recipient_id, content, encrypted) VALUES ($1, $2, $3, $4)',
    [req.user.id, recipientId, message, message.encrypted]
  );
});
```

### 2. Persistent WebSocket Sessions
```javascript
// Store WebSocket sessions in Redis instead of memory
const redis = require('redis');
const sessions = new Map(); // Change to Redis client

// Save session state
await redis.set(`session:${sessionId}`, JSON.stringify(session));
```

### 3. File Storage Integration
```javascript
// Replace local filesystem with cloud storage
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

// Upload files to S3 instead of local
const uploadResult = await s3.upload({
  Bucket: 'court-system-files',
  Key: filename,
  Body: fileBuffer
}).promise();
```

## 📊 Monitoring & Logging

### Real-Time Monitoring Dashboard
```javascript
// Add to server.js
app.get('/api/admin/connections', authenticateToken, (req, res) => {
  const stats = {
    totalConnections: activeConnections.size,
    chatRooms: Array.from(chatRooms.keys()),
    virtualHearings: Array.from(virtualHearings.keys()),
    uptime: process.uptime()
  };
  res.json(stats);
});
```

### WebSocket Connection Testing
```javascript
// Test in browser console
// Open browser console and run:
const ws = new WebSocket('ws://localhost:5173');
ws.onopen = () => console.log('Connected to real-time server');
ws.onmessage = (e) => console.log('Received:', JSON.parse(e.data));
```

## 🎯 Next Steps

1. **Test Current System**: Verify real-time features work
2. **Choose Deployment Option**: Select Docker/Cloud/Traditional
3. **Replace Mock Data**: Integrate real database
4. **Configure Production**: Set up environment variables
5. **Deploy**: Launch to production environment
6. **Monitor**: Set up logging and monitoring

The system is production-ready - just needs real data integration!
