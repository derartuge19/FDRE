@echo off
echo 🚀 Building DIGIT Smart Court System...

echo 📦 Building DIGIT services...
cd core-services

for %%s in (digit-user-service digit-mdms-service digit-workflow-service digit-filestore digit-notification-service digit-indexer digit-persister) do (
    if exist "%%s" (
        echo 🔧 Building %%s...
        cd %%s
        
        if not exist "Dockerfile" (
            echo 📝 Creating Dockerfile for %%s...
            echo FROM openjdk:17-jre-slim > Dockerfile
            echo WORKDIR /app >> Dockerfile
            echo COPY target/*.jar app.jar >> Dockerfile
            echo EXPOSE 8080 >> Dockerfile
            echo ENTRYPOINT ["java", "-jar", "app.jar"] >> Dockerfile
        )
        
        docker build -t %%s:latest .
        
        cd ..
    ) else (
        echo ⚠️ Service %%s not found, skipping...
    )
)

cd ..

echo 🏛️ Building Court services...
cd ..\services

for %%s in (case-service hearing-service document-service) do (
    if exist "%%s" (
        echo 🔧 Building %%s...
        cd %%s
        
        if not exist "Dockerfile" (
            echo 📝 Creating Dockerfile for %%s...
            echo FROM openjdk:17-jre-slim > Dockerfile
            echo WORKDIR /app >> Dockerfile
            echo COPY target/*.jar app.jar >> Dockerfile
            echo EXPOSE 8080 >> Dockerfile
            echo ENTRYPOINT ["java", "-jar", "app.jar"] >> Dockerfile
        )
        
        docker build -t %%s:latest .
        
        cd ..
    ) else (
        echo ⚠️ Service %%s not found, skipping...
    )
)

cd ..\digit-court-system

echo 🎨 Building Frontend...
cd frontend
if exist "digit-ui" (
    cd digit-ui\micro-ui
    
    if not exist "Dockerfile" (
        echo 📝 Creating Frontend Dockerfile...
        echo FROM node:16-alpine as builder > Dockerfile
        echo WORKDIR /app >> Dockerfile
        echo COPY package*.json ./ >> Dockerfile
        echo COPY yarn.lock ./ >> Dockerfile
        echo RUN npm install >> Dockerfile
        echo COPY . . >> Dockerfile
        echo RUN npm run build >> Dockerfile
        echo. >> Dockerfile
        echo FROM nginx:alpine >> Dockerfile
        echo COPY --from=builder /app/web/micro-ui/dist /usr/share/nginx/html >> Dockerfile
        echo COPY nginx.conf /etc/nginx/nginx.conf >> Dockerfile
        echo EXPOSE 80 >> Dockerfile
        echo CMD ["nginx", "-g", "daemon off;"] >> Dockerfile
    )
    
    if not exist "nginx.conf" (
        echo 📝 Creating nginx.conf...
        echo events { > nginx.conf
        echo     worker_connections 1024; >> nginx.conf
        echo } >> nginx.conf
        echo http { >> nginx.conf
        echo     include       /etc/nginx/mime.types; >> nginx.conf
        echo     default_type  application/octet-stream; >> nginx.conf
        echo     server { >> nginx.conf
        echo         listen 80; >> nginx.conf
        echo         server_name localhost; >> nginx.conf
        echo         root /usr/share/nginx/html; >> nginx.conf
        echo         index index.html; >> nginx.conf
        echo         location / { >> nginx.conf
        echo             try_files $uri $uri/ /index.html; >> nginx.conf
        echo         } >> nginx.conf
        echo     } >> nginx.conf
        echo } >> nginx.conf
    )
    
    docker build -t court-frontend:latest .
    cd ..\..
)

cd ..

echo ✅ Build completed successfully!
echo.
echo 🖼️ Built Images:
docker images | findstr /i "digit- court- frontend"

echo.
echo 🎯 Next step: Run deploy.bat to start the system
