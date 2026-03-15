# Ethiopian Digital Court System - Microservices Deployment
Write-Host "Starting Ethiopian Digital Court System Microservices..."

# Function to start a service
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [int]$Port,
        [string]$Description = ""
    )
    
    Write-Host "Starting $ServiceName (Port $Port)..."
    Write-Host "Path: $ServicePath"
    
    try {
        # Change to service directory
        Set-Location $ServicePath -ErrorAction Stop
        
        # Check if Maven wrapper exists
        if (-not (Test-Path "mvnw")) {
            Write-Host "ERROR: Maven wrapper (mvnw) not found in $ServicePath"
            Write-Host "Please ensure Maven is installed and mvnw is in your PATH"
            return
        }
        
        # Start the service
        $process = Start-Process -FilePath "mvnw" -ArgumentList "spring-boot:run" -PassThru -NoNewWindow -Wait
        Write-Host "Process started with PID: $($process.Id)"
        
        # Wait a moment to see if it starts successfully
        Start-Sleep -Seconds 3
        
        if ($process.HasExited) {
            Write-Host "✅ $ServiceName started successfully!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $ServiceName starting..." -ForegroundColor Yellow
        }
        
        # Keep the process running in background
        $process | Out-Null
    }
    catch {
        Write-Host "❌ ERROR starting $ServiceName`: $_" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Start all core services
Write-Host "`n========================================"
Write-Host "  ETHIOPIAN DIGITAL COURT SYSTEM"
Write-Host "  MICROSERVICES DEPLOYMENT"
Write-Host "`n========================================"
Write-Host ""

# Start all 7 core services
Start-Service "User Service" "core-services\digit-user-service" 8080
Start-Sleep -Seconds 2

Start-Service "Notification Service" "core-services\digit-notification-service" 8081
Start-Sleep -Seconds 2

Start-Service "Workflow Service" "core-services\digit-workflow-service" 8082
Start-Sleep -Seconds 2

Start-Service "Filestore Service" "core-services\digit-filestore" 8083
Start-Sleep -Seconds 2

Start-Service "MDMS Service" "core-services\digit-mdms-service" 8084
Start-Sleep -Seconds 2

Start-Service "Indexer Service" "core-services\digit-indexer" 8085
Start-Sleep -Seconds 2

Start-Service "Persister Service" "core-services\digit-persister" 8086
Start-Sleep -Seconds 2

Start-Service "Hearing Service" "core-services\digit-hearing-service" 8087
Start-Sleep -Seconds 2

Start-Service "Case Service" "core-services\digit-case-service" 8088

Write-Host ""
Write-Host "`n========================================"
Write-Host "  ALL MICROSERVICES STARTED!"
Write-Host "`n========================================"
Write-Host ""

Write-Host "Services running on:"
Write-Host "  👤 User Service:     http://localhost:8080" -ForegroundColor Cyan
Write-Host "  📱 Notification:      http://localhost:8081" -ForegroundColor Cyan
Write-Host "  ⚙️ Workflow:         http://localhost:8082" -ForegroundColor Cyan
Write-Host "  📁 Filestore:        http://localhost:8083" -ForegroundColor Cyan
Write-Host "  🗄️ MDMS:            http://localhost:8084" -ForegroundColor Cyan
Write-Host "  🔍 Indexer:         http://localhost:8085" -ForegroundColor Cyan
Write-Host "  💾 Persister:       http://localhost:8086" -ForegroundColor Cyan
Write-Host "  ⚖️ Hearing:         http://localhost:8087" -ForegroundColor Cyan
Write-Host "  💼 Case:            http://localhost:8088" -ForegroundColor Cyan
Write-Host ""

Write-Host "Press Ctrl+C to stop all services..."
Write-Host ""

# Wait for user input to stop
try {
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    if ($null -eq "Ctrl+C") {
        Write-Host "Stopping all microservices..." -ForegroundColor Yellow
        Get-Process | Where-Object { $_.ProcessName -eq "java" } | Stop-Process
        exit 0
    }
} catch {
    Write-Host "Error waiting for input: $_" -ForegroundColor Red
}

Write-Host "Microservices stopped."
