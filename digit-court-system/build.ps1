# 🚀 Clean Build Script for DIGIT Smart Court System (Windows PowerShell)

Write-Host "🔧 Building DIGIT Smart Court System..."

# Build DIGIT Services
Write-Host "📦 Building DIGIT services..."
Set-Location core-services

$services = @("digit-user-service", "digit-mdms-service", "digit-workflow-service", "digit-filestore", "digit-notification-service", "digit-indexer", "digit-persister")

foreach ($service in $services) {
    if (Test-Path $service) {
        Write-Host "🔧 Building $service..."
        Set-Location $service
        
        # Create Dockerfile if not exists
        if (-not (Test-Path "Dockerfile")) {
            Write-Host "📝 Creating Dockerfile for $service..."
            'FROM openjdk:11-jre-slim' | Out-File -FilePath "Dockerfile" -Encoding utf8
            'WORKDIR /app' | Out-File -FilePath "Dockerfile" -Encoding utf8 -Append
            'COPY target/*.jar app.jar' | Out-File -FilePath "Dockerfile" -Encoding utf8 -Append
            'EXPOSE 8080' | Out-File -FilePath "Dockerfile" -Encoding utf8 -Append
            'ENTRYPOINT ["java", "-jar", "app.jar"]' | Out-File -FilePath "Dockerfile" -Encoding utf8 -Append
        }
        
        # Build the service
        docker build -t "${service}:latest" .
        
        Set-Location ..
    } else {
        Write-Host "⚠️  Service $service not found, skipping..."
    }
}

Set-Location ..

# Build Court Services
Write-Host "🏛️ Building Court services..."
Set-Location ..\services

$court_services = @("case-service", "hearing-service", "document-service")

foreach ($service in $court_services) {
    if (Test-Path $service) {
        Write-Host "🔧 Building $service..."
        Set-Location $service
        
        # Create Dockerfile if not exists
        if (-not (Test-Path "Dockerfile")) {
            Write-Host "📝 Creating Dockerfile for $service..."
            'FROM openjdk:11-jre-slim' | Out-File -FilePath "Dockerfile" -Encoding utf8
            'WORKDIR /app' | Out-File -FilePath "Dockerfile" -Encoding utf8 -Append
            'COPY target/*.jar app.jar' | Out-File -FilePath "Dockerfile" -Encoding utf8 -Append
            'EXPOSE 8080' | Out-File -FilePath "Dockerfile" -Encoding utf8 -Append
            'ENTRYPOINT ["java", "-jar", "app.jar"]' | Out-File -FilePath "Dockerfile" -Encoding utf8 -Append
        }
        
        # Build the service
        docker build -t "${service}:latest" .
        
        Set-Location ..
    } else {
        Write-Host "⚠️  Service $service not found, skipping..."
    }
}

Set-Location ..\digit-court-system

# Build Frontend
Write-Host "🎨 Building Frontend..."
Set-Location frontend
if (Test-Path "digit-ui") {
    Set-Location digit-ui
    
    # Create Dockerfile if not exists
    if (-not (Test-Path "Dockerfile")) {
        Write-Host "📝 Creating Frontend Dockerfile..."
        'FROM node:16-alpine as builder' | Out-File -FilePath "Dockerfile" -Encoding utf8
        'WORKDIR /app' | Out-File -FilePath "Dockerfile" -Encoding utf8 -Append
        'COPY package*.json ./' | Out-File -FilePath "Dockerfile" -Encoding utf8 -Append
        'RUN npm install' | Out-File -FilePath "Dockerfile" -Encoding utf8 -Append
        'COPY . .' | Out-File -FilePath "Dockerfile" -Encoding utf8 -Append
        'RUN npm run build' | Out-File -FilePath "Dockerfile" -Encoding utf8 -Append
        '' | Out-File -FilePath "Dockerfile" -Encoding utf8 -Append
        'FROM nginx:alpine' | Out-File -FilePath "Dockerfile" -Encoding utf8 -Append
        'COPY --from=builder /app/dist /usr/share/nginx/html' | Out-File -FilePath "Dockerfile" -Encoding utf8 -Append
        'COPY nginx.conf /etc/nginx/nginx.conf' | Out-File -FilePath "Dockerfile" -Encoding utf8 -Append
        'EXPOSE 80' | Out-File -FilePath "Dockerfile" -Encoding utf8 -Append
        'CMD ["nginx", "-g", "daemon off;"]' | Out-File -FilePath "Dockerfile" -Encoding utf8 -Append
    }
    
    # Create nginx.conf if not exists
    if (-not (Test-Path "nginx.conf")) {
        'events {' | Out-File -FilePath "nginx.conf" -Encoding utf8
        '    worker_connections 1024;' | Out-File -FilePath "nginx.conf" -Encoding utf8 -Append
        '}' | Out-File -FilePath "nginx.conf" -Encoding utf8 -Append
        'http {' | Out-File -FilePath "nginx.conf" -Encoding utf8 -Append
        '    include       /etc/nginx/mime.types;' | Out-File -FilePath "nginx.conf" -Encoding utf8 -Append
        '    default_type  application/octet-stream;' | Out-File -FilePath "nginx.conf" -Encoding utf8 -Append
        '    server {' | Out-File -FilePath "nginx.conf" -Encoding utf8 -Append
        '        listen 80;' | Out-File -FilePath "nginx.conf" -Encoding utf8 -Append
        '        server_name localhost;' | Out-File -FilePath "nginx.conf" -Encoding utf8 -Append
        '        root /usr/share/nginx/html;' | Out-File -FilePath "nginx.conf" -Encoding utf8 -Append
        '        index index.html;' | Out-File -FilePath "nginx.conf" -Encoding utf8 -Append
        '        location / {' | Out-File -FilePath "nginx.conf" -Encoding utf8 -Append
        '            try_files $uri $uri/ /index.html;' | Out-File -FilePath "nginx.conf" -Encoding utf8 -Append
        '        }' | Out-File -FilePath "nginx.conf" -Encoding utf8 -Append
        '    }' | Out-File -FilePath "nginx.conf" -Encoding utf8 -Append
        '}' | Out-File -FilePath "nginx.conf" -Encoding utf8 -Append
    }
    
    docker build -t court-frontend:latest .
    Set-Location ..
}

Set-Location ..

Write-Host "✅ Build completed successfully!"
Write-Host ""
Write-Host "🖼️  Built Images:"
docker images | grep -E "(digit-|court-|frontend)"

Write-Host ""
Write-Host "🎯 Next step: Run .\deploy.ps1 to start the system"
