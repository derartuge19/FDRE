#!/bin/bash

# 🚀 Clean Build Script for DIGIT Smart Court System

echo "🔧 Building DIGIT Smart Court System..."

# Build DIGIT Services
echo "📦 Building DIGIT services..."
cd core-services

services=("digit-user-service" "digit-mdms-service" "digit-workflow-service" "digit-filestore" "digit-notification-service" "digit-indexer" "digit-persister")

for service in "${services[@]}"; do
    if [ -d "$service" ]; then
        echo "🔧 Building $service..."
        cd $service
        
        # Create Dockerfile if not exists
        if [ ! -f "Dockerfile" ]; then
            echo "📝 Creating Dockerfile for $service..."
            cat > Dockerfile << EOF
FROM openjdk:11-jre-slim
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
EOF
        fi
        
        # Build the service
        docker build -t $service:latest .
        
        cd ..
    else
        echo "⚠️  Service $service not found, skipping..."
    fi
done

cd ..

# Build Court Services
echo "🏛️ Building Court services..."
cd ../services

court_services=("case-service" "hearing-service" "document-service")

for service in "${court_services[@]}"; do
    if [ -d "$service" ]; then
        echo "🔧 Building $service..."
        cd $service
        
        # Create Dockerfile if not exists
        if [ ! -f "Dockerfile" ]; then
            echo "📝 Creating Dockerfile for $service..."
            cat > Dockerfile << EOF
FROM openjdk:11-jre-slim
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
EOF
        fi
        
        # Build the service
        docker build -t $service:latest .
        
        cd ..
    else
        echo "⚠️  Service $service not found, skipping..."
    fi
done

cd ../digit-court-system

# Build Frontend
echo "🎨 Building Frontend..."
cd frontend
if [ -d "digit-ui" ]; then
    cd digit-ui
    
    # Create Dockerfile if not exists
    if [ ! -f "Dockerfile" ]; then
        echo "📝 Creating Frontend Dockerfile..."
        cat > Dockerfile << EOF
FROM node:16-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF
    fi
    
    # Create nginx.conf if not exists
    if [ ! -f "nginx.conf" ]; then
        cat > nginx.conf << EOF
events {
    worker_connections 1024;
}
http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        location / {
            try_files \$uri \$uri/ /index.html;
        }
    }
}
EOF
    fi
    
    docker build -t court-frontend:latest .
    cd ..
fi

cd ..

echo "✅ Build completed successfully!"
echo ""
echo "🖼️  Built Images:"
docker images | grep -E "(digit-|court-|frontend)"

echo ""
echo "🎯 Next step: Run ./deploy.sh to start the system"
