# 🏛️ DIGIT Smart Court System

A comprehensive digital justice platform built on the DIGIT framework, customized for Ethiopian courts.

## 📋 Overview

This system provides a complete digital court management solution with:
- **Case management** - Digital case filing and tracking
- **Hearing management** - Virtual and physical hearing scheduling
- **Document management** - Digital documents with signatures
- **User management** - Court roles and permissions
- **Payment processing** - Court fees and fines
- **Notifications** - SMS and email alerts

## 🏗️ Architecture

The system is built on the DIGIT platform with court-specific customizations:

```
court/
└── digit-court-system/          # Main implementation
    ├── 📁 core-services/       # DIGIT services (customized)
    ├── 📁 frontend/            # DIGIT frontend (customized)
    ├── � court-customizations/ # Court-specific features
    ├── 🐳 docker-compose.yml   # Deployment configuration
    ├── 🔧 build.sh            # Build script
    ├── 🚀 deploy.sh           # Deploy script
    └── 📚 README.md           # Detailed documentation
```

## 🚀 Quick Start

### 1. Navigate to the System
```bash
cd digit-court-system
```

### 2. Build the Services
```bash
./build.sh
```

### 3. Deploy the System
```bash
./deploy.sh
```

### 4. Access the System
- **Frontend**: http://localhost:5173
- **User Service**: http://localhost:3001
- **Case Service**: http://localhost:3002
- **Hearing Service**: http://localhost:3005
- **Document Service**: http://localhost:3003

## 👥 Court Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Judge** | Can hear cases and pass judgments | Hear cases, pass judgments, manage hearings |
| **Lawyer** | Can represent clients in court | File cases, represent clients, manage documents |
| **Plaintiff** | Can file and manage cases | File cases, view own cases, pay fees |
| **Defendant** | Can respond to cases | View own cases, respond to cases, pay fees |
| **Clerk** | Can manage court operations | Manage cases, schedule hearings, generate documents |
| **Registrar** | Can manage court registrations | Manage registrations, approve cases, manage records |
| **Admin** | Full system access | All permissions |

## 🔧 Services

### DIGIT Core Services
- **User Service (3001)** - Court user management
- **MDMS Service (3007)** - Master data for courts
- **Workflow Service (3006)** - Court workflows
- **Filestore (3011)** - Document storage
- **Notification Service (3009)** - SMS/Email notifications
- **Indexer (3012)** - Search functionality
- **Persister (3013)** - Data persistence

### Court Services
- **Case Service (3002)** - Court case management
- **Hearing Service (3005)** - Hearing management
- **Document Service (3003)** - Document processing

## 🎯 Key Features

### Case Management
- ✅ Online case filing
- ✅ Case tracking and status updates
- ✅ Case assignment to judges
- ✅ Document management
- ✅ Payment processing

### Hearing Management
- ✅ Hearing scheduling
- ✅ Virtual hearings (video conferencing)
- ✅ Hearing reminders
- ✅ Recording support
- ✅ Calendar integration

### Document Management
- ✅ Document upload and storage
- ✅ Digital signatures
- ✅ Document search
- ✅ Access control
- ✅ Version control

## 🇪🇹 Ethiopian Customization

### Localization
- **Amharic language** support
- **Ethiopian calendar** integration
- **Local legal system** compliance
- **Ethiopian court procedures**

### Payment Integration
- **Telebirr** integration
- **CBE Birr** integration
- **Ethiopian banking** systems
- **Mobile money** support

## 🔌 API Examples

### Create Court User
```bash
curl -X POST http://localhost:3001/user/court/_create \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "judge1",
    "password": "judge123",
    "name": "Judge Alemu",
    "mobileNumber": "251911234567",
    "emailId": "judge1@court.gov.et",
    "courtRole": "JUDGE",
    "courtJurisdiction": "FEDERAL",
    "tenantId": "default"
  }'
```

### Create Case
```bash
curl -X POST http://localhost:3002/cases/court/_create \
  -H "Content-Type: application/json" \
  -d '{
    "caseType": "CIVIL",
    "title": "Property Dispute",
    "description": "Dispute over property ownership",
    "plaintiffId": "plaintiff-uuid",
    "defendantId": "defendant-uuid",
    "courtJurisdiction": "FEDERAL"
  }'
```

## 🛠️ Development

### Environment Setup
```bash
# Navigate to the system
cd digit-court-system

# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Stop services
docker-compose down
```

### Building Services
```bash
# Build all services
./build.sh

# Build specific service
cd core-services/digit-user-service
docker build -t digit-user-service:latest .
```

## 🔒 Security

### Authentication
- **JWT-based** authentication
- **Role-based** access control
- **Session** management
- **Password** encryption

### Data Protection
- **Data encryption** at rest
- **Secure document** storage
- **Access control** lists
- **Audit logging**

## 📈 Monitoring

### Health Checks
All services include health checks:
```bash
curl http://localhost:3001/user/_health
curl http://localhost:3007/egov-mdms-service/v1/_health
curl http://localhost:3006/workflow/v1/_health
```

## 🚀 Deployment

### Production Deployment
```bash
# Navigate to the system
cd digit-court-system

# Deploy to production
./deploy.sh

# Check status
docker-compose ps

# Scale services
docker-compose up -d --scale digit-user-service=3
```

## 📄 License

This project is based on the DIGIT platform and follows the same licensing terms.

## 🎉 Conclusion

The DIGIT Smart Court System provides a comprehensive, scalable, and customizable solution for digital justice in Ethiopia. Built on the proven DIGIT platform, it offers enterprise-grade features with court-specific customizations.

**Ready for production deployment and scaling to national level!** 🏛️✨🚀

---

## 🎯 Next Steps

1. **Navigate to the system**: `cd digit-court-system`
2. **Build and deploy**: `./build.sh && ./deploy.sh`
3. **Create court users** and test functionality
4. **Customize for Ethiopian** requirements
5. **Deploy to production** environment

**🚀 Your Smart Court System is ready!**
