
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 5173;

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

const authProxy = createProxyMiddleware({ target: process.env.AUTH_SVC || 'http://localhost:3001', changeOrigin: true });
const caseProxy = createProxyMiddleware({ target: process.env.CASE_SVC || 'http://localhost:3002', changeOrigin: true });
const documentProxy = createProxyMiddleware({ target: process.env.DOC_SVC || 'http://localhost:3003', changeOrigin: true });
const notificationProxy = createProxyMiddleware({ target: process.env.NOTIF_SVC || 'http://localhost:3004', changeOrigin: true });
const wsProxy = createProxyMiddleware({ target: process.env.COMM_SVC || 'http://localhost:3005', ws: true, changeOrigin: true });

app.use('/api/database/users', authProxy);
app.use('/api/auth', authProxy);
app.use('/api/reports', authProxy);
app.use('/api/system', authProxy);
app.use('/api/participant', authProxy);
app.use('/api/hearing', authProxy);
app.use('/api/recording', authProxy);
app.use('/api/cases', caseProxy);
app.use('/api/hearings', caseProxy);
app.use('/api/upload', documentProxy);
app.use('/api/notifications', notificationProxy);

const server = app.listen(PORT, () => {
  console.log(`🌐 [${PORT}] COURT-API-GATEWAY Active and Routing Traffic.`);
});

// Proxy WebSockets to the communication service
server.on('upgrade', wsProxy.upgrade);
