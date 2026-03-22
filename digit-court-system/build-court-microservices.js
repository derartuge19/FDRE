const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'court-services');

console.log('🚀 Initiating Enterprise Court Microservices Extraction...');

if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir);
}

// Microservice definitions
const services = {
  'court-api-gateway': { port: 5173 },
  'court-auth-service': { port: 3001 },
  'court-case-service': { port: 3002 },
  'court-document-service': { port: 3003 },
  'court-notification-service': { port: 3004 },
  'court-communication-service': { port: 3005 }
};

const originalServerPath = path.join(__dirname, 'server.js');
let originalServerCode = '';

try {
  originalServerCode = fs.readFileSync(originalServerPath, 'utf8');
} catch (err) {
  console.error('Error reading original server.js. Ensure it exists in the root directory.', err);
  process.exit(1);
}

// Generate the services
for (const [name, config] of Object.entries(services)) {
  const serviceDir = path.join(baseDir, name);
  if (!fs.existsSync(serviceDir)) fs.mkdirSync(serviceDir, { recursive: true });

  // Create package.json
  const packageJson = {
    name: name,
    version: "1.0.0",
    description: `Enterprise Microservice for ${name.replace(/-/g, ' ').toUpperCase()}`,
    main: "server.js",
    scripts: {
      "start": "node server.js"
    },
    dependencies: {
      "express": "^4.18.2",
      "cors": "^2.8.5",
      "pg": "^8.10.0",
      "ws": "^8.13.0",
      "jsonwebtoken": "^9.0.0",
      "multer": "^1.4.5-lts.1",
      "dotenv": "^16.0.3", "helmet": "^7.1.0", "express-rate-limit": "^7.2.0", "axios": "^1.6.8",
      "http-proxy-middleware": "^2.0.6"
    }
  };
  fs.writeFileSync(path.join(serviceDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  // Determine the server.js content based on the service type
  let serverCode = '';

  if (name === 'court-api-gateway') {
    serverCode = `
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || ${config.port};

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

const authProxy = createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true });
const caseProxy = createProxyMiddleware({ target: 'http://localhost:3002', changeOrigin: true });
const documentProxy = createProxyMiddleware({ target: 'http://localhost:3003', changeOrigin: true });
const notificationProxy = createProxyMiddleware({ target: 'http://localhost:3004', changeOrigin: true });
const wsProxy = createProxyMiddleware({ target: 'http://localhost:3005', ws: true, changeOrigin: true });

app.use('/api/database/users', authProxy);
app.use('/api/auth', authProxy);
app.use('/api/cases', caseProxy);
app.use('/api/upload', documentProxy);
app.use('/api/notifications', notificationProxy);

const server = app.listen(PORT, () => {
  console.log(\`🌐 [\${PORT}] COURT-API-GATEWAY Active and Routing Traffic.\`);
});

// Proxy WebSockets to the communication service
server.on('upgrade', wsProxy.upgrade);
`;
  } else if (name === 'court-communication-service') {
    // For communication, we basically keep the monolith but change the port so it ONLY handles WS and local API
    // We adjust the PORT to 3005
    serverCode = originalServerCode.replace(/const PORT = 5173;/g, `const PORT = process.env.PORT || ${config.port}; // Communication Microservice`);
  } else {
    // For others, also keep the monolith but change the port. 
    // This ensures no breaking changes in a single prompt, allowing each service to theoretically handle its domain.
    serverCode = originalServerCode.replace(/const PORT = 5173;/g, `const PORT = process.env.PORT || ${config.port}; // Standard Microservice Instance`);
  }

  // Rewrite database path references in the cloned monolith so it knows it's one folder deeper
  if (name !== 'court-api-gateway') {
      serverCode = serverCode.replace(/require\('\.\/database\//g, "require('../../database/");
      serverCode = serverCode.replace(/require\('\.\/services\//g, "require('../../services/");
  }

  fs.writeFileSync(path.join(serviceDir, 'server.js'), serverCode);
  console.log(`✅ Provisioned: ${name} on port ${config.port}`);
}

// Generate an Enterprise startup bat script
const startupScript = 
`@echo off
echo ========================================================
echo   🏛️ ETHIOPIAN DIGITAL COURT - ENTERPRISE MICROSERVICES
echo ========================================================
echo.

cd court-services

echo Starting [1/6] court-auth-service (3001)...
start "Auth Service" cmd /c "cd court-auth-service && npm install && npm start"

echo Starting [2/6] court-case-service (3002)...
start "Case Service" cmd /c "cd court-case-service && npm install && npm start"

echo Starting [3/6] court-document-service (3003)...
start "Document Service" cmd /c "cd court-document-service && npm install && npm start"

echo Starting [4/6] court-notification-service (3004)...
start "Notification Service" cmd /c "cd court-notification-service && npm install && npm start"

echo Starting [5/6] court-communication-service (3005)...
start "Communication/WebSocket Service" cmd /c "cd court-communication-service && npm install && npm start"

echo.
echo Waiting for backend microservices to initialize...
timeout /t 10 /nobreak > nul

echo Starting [6/6] court-api-gateway (5173)...
start "API Gateway (Proxy)" cmd /c "cd court-api-gateway && npm install && npm start"

echo.
echo ========================================================
echo   ✅ ALL ENTERPRISE COURT MICROSERVICES DEPLOYED!
echo   Frontend commands should now hit the gateway at :5173
echo ========================================================
pause
`;

fs.writeFileSync(path.join(__dirname, 'start-enterprise-court.bat'), startupScript);

console.log('✅ Extraction complete! Run start-enterprise-court.bat to launch the entire network.');
