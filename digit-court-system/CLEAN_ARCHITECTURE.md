# 🏛️ DIGIT Smart Court System - Clean Architecture

## 📋 Clean Architecture Overview

Since we're taking the full DIGIT source code, this is a **clean, streamlined architecture** focused on court system integration.

```
digit-court-system/
├── 📁 core-services/              # DIGIT Services (Customized for Courts)
│   ├── digit-user-service/        # User management with court roles
│   ├── digit-mdms-service/        # Master data for courts
│   ├── digit-workflow-service/    # Court workflows
│   ├── digit-filestore/           # Document storage
│   ├── digit-notification-service/ # SMS/Email notifications
│   ├── digit-indexer/             # Search functionality
│   └── digit-persister/            # Data persistence
├── 📁 frontend/                   # DIGIT Frontend (Customized)
│   └── digit-ui/                  # React UI for courts
├── 📁 court-customizations/       # Court-Specific Customizations
│   ├── 📁 database/               # Database schema
│   ├── 📁 configs/                # Service configurations
│   ├── 📁 data/                   # Master data
│   ├── 📁 themes/                 # UI themes
│   └── 📁 scripts/                # Utility scripts
├── 🐳 docker-compose.yml          # Clean deployment
├── 🔧 build.sh                   # Build script
├── 🚀 deploy.sh                  # Deploy script
└── 📚 README.md                  # Documentation
```

---

## 🎯 Clean Architecture Principles

### **✅ What We Keep:**
- **Core DIGIT services** - Only what's needed for courts
- **Court customizations** - Ethiopian court specific features
- **Clean deployment** - Simple, focused configuration
- **Essential scripts** - Build and deploy automation

### **❌ What We Remove:**
- **Urban services** - Not needed for courts
- **Documentation** - Redundant, we have our own
- **Infrastructure** - Simplified in docker-compose
- **Main platform** - We have the services directly
- **Complex scripts** - Streamlined to essentials

---

## 🚀 Clean Deployment

### **Services Running:**
1. **User Service (3001)** - Court user management
2. **MDMS Service (3007)** - Court master data
3. **Workflow Service (3006)** - Court workflows
4. **Filestore (3011)** - Document storage
5. **Notification Service (3009)** - SMS/Email
6. **Indexer (3012)** - Search functionality
7. **Persister (3013)** - Data persistence

### **Your Services:**
1. **Case Service (3002)** - Court case management
2. **Hearing Service (3005)** - Hearing management
3. **Document Service (3003)** - Document processing

### **Database:**
- **PostgreSQL (5432)** - Single database for all services
- **Redis (6379)** - Caching and session storage

---

## 🎨 Clean Frontend

### **Direct Service Integration:**
- **No API gateway** - Direct calls to services
- **Court-specific UI** - Customized for Ethiopian courts
- **Role-based access** - Different interfaces for different roles
- **Mobile responsive** - Works on all devices

---

## 🏛️ Court-Specific Features

### **User Roles:**
- **Judge** - Hear cases, pass judgments
- **Lawyer** - Represent clients, file cases
- **Plaintiff** - File cases, manage own cases
- **Defendant** - Respond to cases, manage own cases
- **Clerk** - Manage court operations
- **Registrar** - Manage registrations
- **Admin** - Full system access

### **Case Management:**
- **Case filing** - Online case registration
- **Case tracking** - Real-time status updates
- **Document management** - Digital documents with signatures
- **Payment processing** - Court fees and fines

### **Hearing Management:**
- **Virtual hearings** - Video conferencing support
- **Hearing scheduling** - Calendar integration
- **Hearing reminders** - Automated notifications
- **Recording** - Audio/video recording support

---

## 🔧 Clean Configuration

### **Environment Variables:**
```bash
# Database
DATABASE_URL=jdbc:postgresql://postgres:5432/court_system
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Services
USER_SERVICE_URL=http://digit-user-service:3001
MDMS_SERVICE_URL=http://digit-mdms-service:3007
WORKFLOW_SERVICE_URL=http://digit-workflow-service:3006
FILESTORE_URL=http://digit-filestore:3011
NOTIFICATION_SERVICE_URL=http://digit-notification-service:3009
```

### **Docker Compose:**
- **Single file** - All services in one place
- **Clean networking** - Simple service communication
- **Health checks** - Service monitoring
- **Volume management** - Data persistence

---

## 🎯 Clean Development Workflow

### **1. Development:**
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Make changes to services
# Services auto-reload with volume mounts
```

### **2. Building:**
```bash
# Build all services
./build.sh

# Images created:
# - digit-user-service:latest
# - digit-mdms-service:latest
# - digit-workflow-service:latest
# - digit-filestore:latest
# - digit-notification-service:latest
# - digit-indexer:latest
# - digit-persister:latest
```

### **3. Deployment:**
```bash
# Deploy to production
./deploy.sh

# All services start with health checks
# Database initialized with court schema
# Frontend accessible at http://localhost:5173
```

---

## 🏆 Clean Benefits

### **✅ Simplicity:**
- **Fewer files** - Only what's needed
- **Clear structure** - Easy to understand
- **Focused purpose** - Court system only

### **✅ Performance:**
- **Direct service calls** - No API gateway overhead
- **Optimized database** - Single database design
- **Efficient caching** - Redis for performance

### **✅ Maintainability:**
- **Clean code** - DIGIT best practices
- **Standard patterns** - Follows DIGIT conventions
- **Easy updates** - Service isolation

### **✅ Scalability:**
- **Microservices** - Scale individual services
- **Containerized** - Easy deployment
- **Load balanced** - Multiple instances

---

## 🎉 Clean Result

### **🏛️ What You Have:**
1. **Complete DIGIT integration** - Full source code customization
2. **Court-specific features** - Ethiopian court system
3. **Clean architecture** - Streamlined and focused
4. **Production ready** - Deploy and run immediately
5. **Maintainable** - Easy to update and extend

### **🚀 Ready For:**
- **Case management** - Digital case processing
- **Virtual hearings** - Remote court proceedings
- **Document processing** - Digital signatures and storage
- **User management** - Court roles and permissions
- **Payment processing** - Court fees and fines
- **Notifications** - SMS and email alerts

---

## 🎯 Next Steps

### **1. Deploy the System:**
```bash
cd digit-court-system
./deploy.sh
```

### **2. Create Court Users:**
- Admin user for system management
- Judges for hearing cases
- Lawyers for representing clients
- Plaintiffs/Defendants for case parties

### **3. Customize for Ethiopia:**
- Add Amharic language support
- Integrate Telebirr/CBE Birr payments
- Customize UI themes
- Add Ethiopian legal templates

### **4. Test and Deploy:**
- Test all court workflows
- Verify document processing
- Test virtual hearings
- Deploy to production

---

## 🎊 Clean Architecture Complete!

**Your Smart Court System now has a clean, focused architecture powered by DIGIT source code!** 🏛️✨🚀
