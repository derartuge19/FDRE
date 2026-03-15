#!/bin/bash

# 🚀 Clean Deploy Script for DIGIT Smart Court System

echo "🚀 Deploying DIGIT Smart Court System..."

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found!"
    exit 1
fi

# Start database
echo "🗄️ Starting database..."
docker-compose up -d postgres redis

# Wait for database
echo "⏳ Waiting for database to be ready..."
sleep 30

# Check database connectivity
echo "🔍 Checking database connectivity..."
until docker exec digit-court-system_postgres_1 pg_isready -U postgres; do
    echo "Waiting for postgres..."
    sleep 2
done

# Initialize database
echo "📝 Initializing database with court schema..."
if [ -f "court-customizations/database/init.sql" ]; then
    docker exec digit-court-system_postgres_1 psql -U postgres -d court_system < court-customizations/database/init.sql
fi

# Start DIGIT services
echo "🔧 Starting DIGIT services..."
docker-compose up -d digit-user-service digit-mdms-service digit-workflow-service digit-filestore digit-notification-service digit-indexer digit-persister

# Wait for DIGIT services
echo "⏳ Waiting for DIGIT services to be ready..."
sleep 60

# Load master data
echo "📊 Loading court master data..."
if [ -f "court-customizations/data/court-master-data.json" ]; then
    curl -X POST http://localhost:3007/egov-mdms-service/v1/_create \
        -H "Content-Type: application/json" \
        -d @court-customizations/data/court-master-data.json
fi

# Start court services
echo "🏛️ Starting court services..."
docker-compose up -d case-service hearing-service document-service

# Wait for court services
echo "⏳ Waiting for court services to be ready..."
sleep 30

# Start frontend
echo "🌐 Starting frontend..."
docker-compose up -d court-frontend

# Wait for all services
echo "⏳ Waiting for all services to be ready..."
sleep 30

# Health checks
echo "🔍 Performing health checks..."

services=("digit-user-service:3001" "digit-mdms-service:3007" "digit-workflow-service:3006" "digit-filestore:3011" "digit-notification-service:3009" "case-service:3002" "hearing-service:3005" "document-service:3003")

for service in "${services[@]}"; do
    service_name=$(echo $service | cut -d':' -f1)
    port=$(echo $service | cut -d':' -f2)
    
    if curl -f http://localhost:$port/health > /dev/null 2>&1; then
        echo "✅ $service_name is healthy"
    else
        echo "❌ $service_name is not responding"
    fi
done

# Check frontend
if curl -f http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is not responding"
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://localhost:5173"
echo "   User Service: http://localhost:3001"
echo "   MDMS Service: http://localhost:3007"
echo "   Workflow Service: http://localhost:3006"
echo "   Filestore: http://localhost:3011"
echo "   Notification Service: http://localhost:3009"
echo "   Case Service: http://localhost:3002"
echo "   Hearing Service: http://localhost:3005"
echo "   Document Service: http://localhost:3003"
echo ""
echo "🔧 Court-specific endpoints:"
echo "   POST /user/court/_create - Create court user"
echo "   POST /user/court/_login - Court user login"
echo "   GET /user/court/profile/{userId} - Get court profile"
echo "   GET /user/court/role/{courtRole} - Search by role"
echo ""
echo "📊 System Status:"
docker-compose ps

echo ""
echo "🎯 Next steps:"
echo "1. Access the frontend at http://localhost:5173"
echo "2. Create admin user and test the system"
echo "3. Create court users (judges, lawyers, etc.)"
echo "4. Start creating cases and hearings"
echo "5. Check logs with: docker-compose logs -f [service-name]"

echo ""
echo "🚀 Your DIGIT-based Smart Court System is now running!"
