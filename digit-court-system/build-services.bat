@echo off
echo ========================================
echo    BUILDING JAVA SERVICES
echo ========================================
echo.

echo Building all services...
echo.

cd core-services\digit-user-service
echo Building User Service...
call mvn clean package -DskipTests
if errorlevel 1 goto build-error

cd ..\digit-notification-service
echo Building Notification Service...
call mvn clean package -DskipTests
if errorlevel 1 goto build-error

cd ..\digit-workflow-service
echo Building Workflow Service...
call mvn clean package -DskipTests
if errorlevel 1 goto build-error

cd ..\digit-filestore
echo Building Filestore Service...
call mvn clean package -DskipTests
if errorlevel 1 goto build-error

cd ..\digit-mdms-service
echo Building MDMS Service...
call mvn clean package -DskipTests
if errorlevel 1 goto build-error

cd ..\digit-indexer
echo Building Indexer Service...
call mvn clean package -DskipTests
if errorlevel 1 goto build-error

cd ..\digit-persister
echo Building Persister Service...
call mvn clean package -DskipTests
if errorlevel 1 goto build-error

echo.
echo ========================================
echo    ALL SERVICES BUILT SUCCESSFULLY!
echo ========================================
echo.
echo Now you can start services with: start-services-simple.bat
echo.
pause
goto end

:build-error
echo.
echo ========================================
echo           BUILD ERROR!
echo ========================================
echo.
pause
exit /b 1

:end
