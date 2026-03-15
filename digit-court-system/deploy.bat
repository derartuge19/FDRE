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

echo 🔧 Starting DIGIT services...
docker-compose up -d digit-user-service digit-mdms-service digit-workflow-service digit-filestore digit-notification-service digit-indexer digit-persister

echo ⏳ Waiting for DIGIT services to be ready...
timeout /t 60 /nobreak > nul

echo 📊 Loading court master data...
if exist "court-customizations\data\court-master-data.json" (
    curl -X POST http://localhost:3007/egov-mdms-service/v1/_create -H "Content-Type: application/json" -d @court-customizations\data\court-master-data.json
)

echo 🏛️ Starting court services...
docker-compose up -d case-service hearing-service document-service

echo ⏳ Waiting for court services to be ready...
timeout /t 30 /nobreak > nul

echo 🌐 Starting frontend...
docker-compose up -d court-frontend

echo ⏳ Waiting for all services to be ready...
timeout /t 30 /nobreak > nul

echo 🔍 Performing health checks...

echo Checking User Service...
curl -f http://localhost:3001/user/_health > nul 2>&1
if errorlevel 1 (
    echo ❌ User Service is not responding
) else (
    echo ✅ User Service is healthy
)

echo Checking MDMS Service...
curl -f http://localhost:3007/egov-mdms-service/v1/_health > nul 2>&1
if errorlevel 1 (
    echo ❌ MDMS Service is not responding
) else (
    echo ✅ MDMS Service is healthy
)

echo Checking Workflow Service...
curl -f http://localhost:3006/workflow/v1/_health > nul 2>&1
if errorlevel 1 (
    echo ❌ Workflow Service is not responding
) else (
    echo ✅ Workflow Service is healthy
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
echo    User Service: http://localhost:3001
echo    MDMS Service: http://localhost:3007
echo    Workflow Service: http://localhost:3006
echo    Filestore: http://localhost:3011
echo    Notification Service: http://localhost:3009
echo    Case Service: http://localhost:3002
echo    Hearing Service: http://localhost:3005
echo    Document Service: http://localhost:3003
echo.
echo 🔧 Court-specific endpoints:
echo    POST /user/court/_create - Create court user
echo    POST /user/court/_login - Court user login
echo    GET /user/court/profile/{userId} - Get court profile
echo    GET /user/court/role/{courtRole} - Search by role
echo.
echo 📊 System Status:
docker-compose ps

echo.
echo 🎯 Next steps:
echo 1. Access the frontend at http://localhost:5173
echo 2. Create admin user and test the system
echo 3. Create court users (judges, lawyers, etc.)
echo 4. Start creating cases and hearings
echo 5. Check logs with: docker-compose logs -f [service-name]

echo.
echo 🚀 Your DIGIT-based Smart Court System is now running!
