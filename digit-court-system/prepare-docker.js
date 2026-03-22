const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const servicesDir = path.join(rootDir, 'court-services');

console.log('🐳 Preparing Dockerization for Court Microservices...');

const services = [
  { name: 'court-api-gateway', port: 5173 },
  { name: 'court-auth-service', port: 3001 },
  { name: 'court-case-service', port: 3002 },
  { name: 'court-document-service', port: 3003 },
  { name: 'court-notification-service', port: 3004 },
  { name: 'court-communication-service', port: 3005 }
];

// 1. Updating the API Gateway to use environment variables for routing inside Docker
const gatewayServerFile = path.join(servicesDir, 'court-api-gateway', 'server.js');
if (fs.existsSync(gatewayServerFile)) {
  let gwCode = fs.readFileSync(gatewayServerFile, 'utf8');
  gwCode = gwCode.replace(/target: 'http:\/\/localhost:3001'/g, "target: process.env.AUTH_SVC || 'http://localhost:3001'");
  gwCode = gwCode.replace(/target: 'http:\/\/localhost:3002'/g, "target: process.env.CASE_SVC || 'http://localhost:3002'");
  gwCode = gwCode.replace(/target: 'http:\/\/localhost:3003'/g, "target: process.env.DOC_SVC || 'http://localhost:3003'");
  gwCode = gwCode.replace(/target: 'http:\/\/localhost:3004'/g, "target: process.env.NOTIF_SVC || 'http://localhost:3004'");
  gwCode = gwCode.replace(/target: 'http:\/\/localhost:3005'/g, "target: process.env.COMM_SVC || 'http://localhost:3005'");
  fs.writeFileSync(gatewayServerFile, gwCode);
  console.log('✅ API Gateway configured for Docker inter-container routing');
}

// 2. We don't individually package each service if they rely on the parent ../../database structure.
// Instead, we create a single generic Dockerfile at the root directory that builds them based on an ARG.
const rootDockerfile = `FROM node:18-alpine

# Use an ARG to specify which service we are building
ARG SERVICE_NAME

WORKDIR /app

# Copy the common files
COPY database/ ./database/
COPY services/ ./services/

# Copy the specific service files
COPY court-services/\${SERVICE_NAME}/ ./court-services/\${SERVICE_NAME}/

# Install dependencies for that specific service
WORKDIR /app/court-services/\${SERVICE_NAME}
RUN npm install

# Expose port (will be defined by docker-compose)
CMD ["node", "server.js"]
`;
fs.writeFileSync(path.join(rootDir, 'Dockerfile.microservice'), rootDockerfile);

// 3. Create the robust docker-compose.yml
// Notice: We use host.docker.internal to allow containers to talk to the local Postgres on your Windows machine!
let composeYaml = `version: '3.8'

services:
`;

services.forEach(svc => {
  // Use host.docker.internal so it connects to the user's running DB without overwriting it!
  composeYaml += `
  ${svc.name}:
    build:
      context: .
      dockerfile: Dockerfile.microservice
      args:
        SERVICE_NAME: ${svc.name}
    container_name: ${svc.name}
    ports:
      - "${svc.port}:${svc.port}"
    environment:
      - NODE_ENV=development
      - PORT=${svc.port}
      - DB_HOST=host.docker.internal
      - DB_USER=postgres
      - DB_PASSWORD=dere2010
      - DB_NAME=court
      - DB_PORT=5432
`;

  // Provide the interconnect routes for the Gateway
  if (svc.name === 'court-api-gateway') {
    composeYaml += `      - AUTH_SVC=http://court-auth-service:3001
      - CASE_SVC=http://court-case-service:3002
      - DOC_SVC=http://court-document-service:3003
      - NOTIF_SVC=http://court-notification-service:3004
      - COMM_SVC=http://court-communication-service:3005
    depends_on:
      - court-auth-service
      - court-case-service
      - court-document-service
      - court-notification-service
      - court-communication-service
`;
  }
});

fs.writeFileSync(path.join(rootDir, 'docker-compose.yml'), composeYaml);

// 4. Also write a .dockerignore to keep the image fast and small
fs.writeFileSync(path.join(rootDir, '.dockerignore'), `node_modules/
ethiopian-court-nextjs/
.git/
recordings/
uploads/
`);

console.log('✅ Dockerfile.microservice, docker-compose.yml, and .dockerignore strictly generated!');
