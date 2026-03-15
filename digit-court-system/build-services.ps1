Write-Host "Building Ethiopian Digital Court System Services..." -ForegroundColor Yellow

$services = @(
    @{Name="User Service"; Path="core-services\digit-user-service"},
    @{Name="Notification Service"; Path="core-services\digit-notification-service"},
    @{Name="Workflow Service"; Path="core-services\digit-workflow-service"},
    @{Name="Filestore Service"; Path="core-services\digit-filestore"},
    @{Name="MDMS Service"; Path="core-services\digit-mdms-service"},
    @{Name="Indexer Service"; Path="core-services\digit-indexer"},
    @{Name="Persister Service"; Path="core-services\digit-persister"},
    @{Name="Hearing Service"; Path="core-services\digit-hearing-service"},
    @{Name="Case Service"; Path="core-services\digit-case-service"}
)

$success = $true

foreach ($service in $services) {
    Write-Host "Building $($service.Name)..." -ForegroundColor Cyan
    
    Set-Location $service.Path
    if (-not (Test-Path "pom.xml")) {
        Write-Host "ERROR: pom.xml not found in $($service.Path)" -ForegroundColor Red
        $success = $false
    } else {
        try {
            # Build the service
            $result = & mvn clean package -DskipTests
            if ($LASTEXITCODE -ne 0) {
                Write-Host "ERROR: Failed to build $($service.Name)" -ForegroundColor Red
                $success = $false
            } else {
                Write-Host "✅ $($service.Name) built successfully!" -ForegroundColor Green
            }
        } catch {
            Write-Host "ERROR: Exception building $($service.Name): $($_.Exception.Message)" -ForegroundColor Red
            $success = $false
        }
    }
    
    Pop-Location
}

if ($success) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "🎉 ALL SERVICES BUILT SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Services are ready to start!" -ForegroundColor Cyan
    Write-Host "Run: .\start-services-simple.ps1" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ BUILD FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
}
