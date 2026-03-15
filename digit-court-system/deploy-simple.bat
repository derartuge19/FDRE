@echo off
echo 🚀 Deploying DIGIT Smart Court System...

if not exist "docker-compose.yml" (
    echo ❌ Error: docker-compose.yml not found!
    exit /b 1
)

echo 🗄️ Starting database...
docker-compose up -d postgres redis

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

echo 📝 Initializing database with court schema...
if exist "court-customizations\database\init.sql" (
    docker exec digit-court-system_postgres_1 psql -U postgres -d court_system -f /docker-entrypoint-initdb.d/init.sql
)

echo 🔧 Starting existing court services...
docker-compose up -d court-api-gateway court-auth-service court-case-service court-document-service court-notification-service

echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak > nul

echo 🌐 Starting frontend...
if exist "frontend\digit-ui\micro-ui" (
    cd frontend\digit-ui\micro-ui
    docker run -d -p 5173:80 --name court-frontend court-frontend:latest
    cd ..\..\..
)

echo ⏳ Waiting for all services to be ready...
timeout /t 30 /nobreak > nul

echo 🔍 Performing health checks...

echo Checking Auth Service...
curl -f http://localhost:3000/health > nul 2>&1
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
docker-compose ps
docker ps | findstr court-frontend

echo.
echo 🎯 Next steps:
echo 1. Access the frontend at http://localhost:5173
echo 2. Create admin user and test the system
echo 3. Check logs with: docker-compose logs -f [service-name]

echo.
echo 🚀 Your Court System is now running!
