# 🚀 Clean Deploy Script for DIGIT Smart Court System (Windows PowerShell)

Write-Host "🚀 Deploying DIGIT Smart Court System..."

# Check if docker-compose.yml exists
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ Error: docker-compose.yml not found!"
    exit 1
}

# Start database
Write-Host "🗄️ Starting database..."
docker-compose up -d postgres redis

# Wait for database
Write-Host "⏳ Waiting for database to be ready..."
Start-Sleep -Seconds 30

# Check database connectivity
Write-Host "🔍 Checking database connectivity..."
do {
    Write-Host "Waiting for postgres..."
    Start-Sleep -Seconds 2
    try {
        docker exec digit-court-system_postgres_1 pg_isready -U postgres
        $ready = $true
    } catch {
        $ready = $false
    }
} while (-not $ready)

# Initialize database
Write-Host "📝 Initializing database with court schema..."
if (Test-Path "court-customizations\database\init.sql") {
    docker exec digit-court-system_postgres_1 psql -U postgres -d court_system -f /docker-entrypoint-initdb.d/init.sql
}

# Start DIGIT services
Write-Host "🔧 Starting DIGIT services..."
docker-compose up -d digit-user-service digit-mdms-service digit-workflow-service digit-filestore digit-notification-service digit-indexer digit-persister

# Wait for DIGIT services
Write-Host "⏳ Waiting for DIGIT services to be ready..."
Start-Sleep -Seconds 60

# Load master data
Write-Host "📊 Loading court master data..."
if (Test-Path "court-customizations\data\court-master-data.json") {
    $body = Get-Content "court-customizations\data\court-master-data.json" -Raw
    Invoke-RestMethod -Uri "http://localhost:3007/egov-mdms-service/v1/_create" -Method Post -ContentType "application/json" -Body $body
}

# Start court services
Write-Host "🏛️ Starting court services..."
docker-compose up -d case-service hearing-service document-service

# Wait for court services
Write-Host "⏳ Waiting for court services to be ready..."
Start-Sleep -Seconds 30

# Start frontend
Write-Host "🌐 Starting frontend..."
docker-compose up -d court-frontend

# Wait for all services
Write-Host "⏳ Waiting for all services to be ready..."
Start-Sleep -Seconds 30

# Health checks
Write-Host "🔍 Performing health checks..."

$services = @(
    @{Name="digit-user-service"; Port=3001},
    @{Name="digit-mdms-service"; Port=3007},
    @{Name="digit-workflow-service"; Port=3006},
    @{Name="digit-filestore"; Port=3011},
    @{Name="digit-notification-service"; Port=3009},
    @{Name="case-service"; Port=3002},
    @{Name="hearing-service"; Port=3005},
    @{Name="document-service"; Port=3003}
)

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)/health" -TimeoutSec 5
        Write-Host "✅ $($service.Name) is healthy"
    } catch {
        Write-Host "❌ $($service.Name) is not responding"
    }
}

# Check frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5
    Write-Host "✅ Frontend is healthy"
} catch {
    Write-Host "❌ Frontend is not responding"
}

Write-Host ""
Write-Host "🎉 Deployment completed!"
Write-Host ""
Write-Host "🌐 Access URLs:"
Write-Host "   Frontend: http://localhost:5173"
Write-Host "   User Service: http://localhost:3001"
Write-Host "   MDMS Service: http://localhost:3007"
Write-Host "   Workflow Service: http://localhost:3006"
Write-Host "   Filestore: http://localhost:3011"
Write-Host "   Notification Service: http://localhost:3009"
Write-Host "   Case Service: http://localhost:3002"
Write-Host "   Hearing Service: http://localhost:3005"
Write-Host "   Document Service: http://localhost:3003"
Write-Host ""
Write-Host "🔧 Court-specific endpoints:"
Write-Host "   POST /user/court/_create - Create court user"
Write-Host "   POST /user/court/_login - Court user login"
Write-Host "   GET /user/court/profile/{userId} - Get court profile"
Write-Host "   GET /user/court/role/{courtRole} - Search by role"
Write-Host ""
Write-Host "📊 System Status:"
docker-compose ps

Write-Host ""
Write-Host "🎯 Next steps:"
Write-Host "1. Access the frontend at http://localhost:5173"
Write-Host "2. Create admin user and test the system"
Write-Host "3. Create court users (judges, lawyers, etc.)"
Write-Host "4. Start creating cases and hearings"
Write-Host "5. Check logs with: docker-compose logs -f [service-name]"

Write-Host ""
Write-Host "🚀 Your DIGIT-based Smart Court System is now running!"
