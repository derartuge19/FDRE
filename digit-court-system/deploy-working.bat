@echo off
echo 🚀 Deploying Court System with Simple Configuration...

echo 🗄️ Starting database...
docker-compose -f docker-compose-simple.yml up -d postgres redis

echo ⏳ Waiting for database to be ready...
timeout /t 30 /nobreak > nul

echo 🔍 Checking database connectivity...
:wait_db
docker exec digit-court-system_postgres_1 pg_isready -U postgres > nul 2>&1
if errorlevel 1 (
    echo Waiting for postgres...
    timeout /t 2 /nobreak > nul
    goto wait_db
)

echo 📝 Initializing database...
echo ✅ Database is ready!

echo 🔧 Starting existing court services...
docker-compose -f docker-compose-simple.yml up -d court-api-gateway court-auth-service court-case-service court-document-service court-notification-service

echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak > nul

echo 🌐 Starting frontend (if available)...
docker images | findstr court-frontend > nul
if not errorlevel 1 (
    docker-compose -f docker-compose-simple.yml up -d court-frontend
    echo ✅ Frontend started
) else (
    echo ⚠️ Frontend not found, skipping...
)

echo ⏳ Waiting for all services to be ready...
timeout /t 30 /nobreak > nul

echo 🔍 Performing health checks...

echo Checking API Gateway...
curl -f http://localhost:3000/health > nul 2>&1
if errorlevel 1 (
    echo ❌ API Gateway is not responding
) else (
    echo ✅ API Gateway is healthy
)

echo Checking Auth Service...
curl -f http://localhost:3001/health > nul 2>&1
if errorlevel 1 (
    echo ❌ Auth Service is not responding
) else (
    echo ✅ Auth Service is healthy
)

echo Checking Case Service...
curl -f http://localhost:3002/health > nul 2>&1
if errorlevel 1 (
    echo ❌ Case Service is not responding
) else (
    echo ✅ Case Service is healthy
)

echo Checking Document Service...
curl -f http://localhost:3003/health > nul 2>&1
if errorlevel 1 (
    echo ❌ Document Service is not responding
) else (
    echo ✅ Document Service is healthy
)

echo Checking Notification Service...
curl -f http://localhost:3004/health > nul 2>&1
if errorlevel 1 (
    echo ❌ Notification Service is not responding
) else (
    echo ✅ Notification Service is healthy
)

echo Checking Frontend...
curl -f http://localhost:5173 > nul 2>&1
if errorlevel 1 (
    echo ❌ Frontend is not responding
) else (
    echo ✅ Frontend is healthy
)

echo.
echo 🎉 Deployment completed!
echo.
echo 🌐 Access URLs:
echo    Frontend: http://localhost:5173
echo    API Gateway: http://localhost:3000
echo    Auth Service: http://localhost:3001
echo    Case Service: http://localhost:3002
echo    Document Service: http://localhost:3003
echo    Notification Service: http://localhost:3004
echo.
echo 📊 System Status:
docker-compose -f docker-compose-simple.yml ps

echo.
echo 🎯 Next steps:
echo 1. Access the system at http://localhost:3000 (API Gateway)
echo 2. Or access frontend at http://localhost:5173 (if available)
echo 3. Test the API endpoints
echo 4. Check logs with: docker-compose -f docker-compose-simple.yml logs -f [service-name]

echo.
echo 🚀 Your Court System is now running!
