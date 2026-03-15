const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 5173;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

app.use(limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, PNG files are allowed.'));
    }
  }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Mock user database with full role spectrum
const users = [
  { id: 'admin-1', username: 'admin.system', password: 'password123', name: 'System Administrator', email: 'admin@court.gov.et', roles: ['admin'], permissions: ['user_management', 'system_config', 'security_audit', 'backup_restore', 'case_view', 'reporting'], department: 'IT Infrastructure', isActive: true, mfaEnabled: true, lastLogin: new Date().toISOString() },
  { id: 'judge-1', username: 'judge.alemu', password: 'password123', name: 'Judge Alemu Bekele', email: 'alemu.bekele@court.gov.et', roles: ['judge'], permissions: ['case_review', 'hearing_conduct', 'decision_recording', 'case_view', 'hearing_control'], department: 'High Court', isActive: true, mfaEnabled: true, lastLogin: new Date().toISOString() },
  { id: 'court-admin-1', username: 'court.admin', password: 'password123', name: 'Court Administrator', email: 'court.admin@court.gov.et', roles: ['court_admin'], permissions: ['hearing_scheduling', 'judge_assignment', 'reporting', 'case_view'], department: 'Registry', isActive: true, mfaEnabled: true, lastLogin: new Date().toISOString() },
  { id: 'lawyer-1', username: 'lawyer.sara', password: 'password123', name: 'Sara Ahmed', email: 'sara@lawfirm.et', roles: ['lawyer'], permissions: ['case_filing', 'document_submission', 'hearing_participation', 'client_rep'], firm: 'Ahmed & Associates', isActive: true, mfaEnabled: false, lastLogin: new Date().toISOString() },
  { id: 'plaintiff-1', username: 'plaintiff.john', password: 'password123', name: 'John Doe', email: 'john@email.com', roles: ['plaintiff'], permissions: ['case_filing', 'evidence_upload', 'case_tracking'], isActive: true, mfaEnabled: false, lastLogin: new Date().toISOString() },
  { id: 'defendant-1', username: 'defendant.jane', password: 'password123', name: 'Jane Smith', email: 'jane@email.com', roles: ['defendant'], permissions: ['case_response', 'document_submission', 'hearing_join'], isActive: true, mfaEnabled: false, lastLogin: new Date().toISOString() },
  { id: 'clerk-1', username: 'clerk.mohammed', password: 'password123', name: 'Mohammed Hassan', email: 'mohammed@court.gov.et', roles: ['clerk'], permissions: ['case_processing', 'document_verification', 'record_keeping'], department: 'Records', isActive: true, mfaEnabled: false, lastLogin: new Date().toISOString() }
];

// --- EXTENDED DATABASE STRUCTURES ---

// Analytics & Reporting Data
let analyticsData = {
  caseVolume: { monthly: [450, 520, 480, 610, 590, 720], categories: ['Civil', 'Criminal', 'Family', 'Commercial'] },
  judgeWorkload: [
    { name: 'Judge Alemu Bekele', activeCases: 42, completedThisMonth: 15, avgResolutionDays: 64 },
    { name: 'Judge Sara Tesfaye', activeCases: 38, completedThisMonth: 12, avgResolutionDays: 58 },
    { name: 'Judge Mohammed Hassan', activeCases: 51, completedThisMonth: 10, avgResolutionDays: 72 }
  ],
  courtPerformance: { clearanceRate: 88, digitalAdoption: 94, hearingEfficiency: 92 }
};

// Messaging Database
let messagesDatabase = [
  { id: 'MSG-001', senderId: 'judge-1', receiverId: 'clerk-1', content: 'Please verify the evidence exhibits for CR-2026-442.', timestamp: new Date().toISOString(), read: true, attachments: [] },
  { id: 'MSG-002', senderId: 'lawyer-1', receiverId: 'judge-1', content: 'Filing an emergency motion for stay of execution.', timestamp: new Date().toISOString(), read: false, attachments: [{ id: 'ATT-001', name: 'Emergency_Motion.pdf' }] }
];

// Activity Logs for Monitoring
let activityLogs = [
  { id: 'LOG-001', userId: 'admin-1', action: 'SYSTEM_CONFIG_UPDATE', details: 'Updated security policy', timestamp: new Date().toISOString() },
  { id: 'LOG-002', userId: 'judge-1', action: 'HEARING_START', details: 'Started session CIV-2026-001', timestamp: new Date().toISOString() }
];

// JWT Secret (in production, use environment variable)
const JWT_SECRET = 'ethiopian-court-system-jwt-secret-2024';

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    // In production, use proper JWT verification
    // For demo, we'll simulate token verification
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const user = users.find(u => u.id === decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Middleware for role-based access control
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

// Mock JWT functions (in production, use jsonwebtoken)
const jwt = {
  sign: (payload, secret) => {
    return Buffer.from(JSON.stringify({...payload, iat: Date.now()})).toString('base64');
  },
  decode: (token) => {
    try {
      return JSON.parse(Buffer.from(token, 'base64').toString());
    } catch (error) {
      return null;
    }
  }
};

// Routes
// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Ethiopian Digital Court System (Legacy Service - Broken) is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0-legacy',
    uptime: process.uptime()
  });
});

// API Routes for Ethiopian Court System

// Cases API with authentication and RBAC
// Comprehensive Case Database logic
let caseDatabase = [
  {
    id: 'CIV-2026-001',
    caseNumber: 'CIV-2026-001',
    title: 'Property Boundary Dispute - Addis Ababa Sector 4',
    type: 'Civil',
    plaintiff: 'John Doe',
    defendant: 'Jane Smith',
    status: 'Active',
    priority: 'Normal',
    filingDate: '2026-03-01',
    nextHearing: '2026-03-25T10:00:00Z',
    assignedJudge: 'Judge Alemu Bekele',
    courtLevel: 'Federal High Court',
    description: 'Dispute over boundary markers in the commercial district.',
    documents: [
      { id: 'DOC-001', name: 'Land Deed.pdf', type: 'Evidence', version: 1, signed: true },
      { id: 'DOC-002', name: 'Survey Report.pdf', type: 'Technical', version: 2, signed: true }
    ],
    timeline: [
      { date: '2026-03-01', event: 'Case Registered', actor: 'System' },
      { date: '2026-03-05', event: 'Judge Assigned', actor: 'Court Admin' },
      { date: '2026-03-10', event: 'Preliminary Hearing Scheduled', actor: 'Clerk' }
    ]
  },
  {
    id: 'CRIM-2026-442',
    caseNumber: 'CRIM-2026-442',
    title: 'Financial Irregularity Audit',
    type: 'Criminal',
    plaintiff: 'State Prosecution',
    defendant: 'Global Logistics PLC',
    status: 'Urgent',
    priority: 'High',
    filingDate: '2026-03-10',
    nextHearing: '2026-03-16T09:00:00Z',
    assignedJudge: 'Judge Alemu Bekele',
    courtLevel: 'Federal First Instance Court',
    description: 'Alleged tax evasion and falsification of shipping records.',
    documents: [],
    timeline: [
      { date: '2026-03-10', event: 'Emergency Filing', actor: 'Prosecutor' }
    ]
  }
];

// Hearing Database
let hearingDatabase = [
  {
    id: 'HEAR-001',
    caseId: 'CIV-2026-001',
    title: 'Initial Evidentiary Review',
    date: '2026-03-25T10:00:00Z',
    duration: '2h',
    type: 'Virtual',
    roomUrl: 'https://court.gov.et/vhearing/CIV-2026-001-X92',
    participants: ['Judge Alemu Bekele', 'Sara Ahmed', 'John Doe'],
    status: 'Scheduled'
  }
];

app.get('/api/cases', authenticateToken, (req, res) => {
  try {
    // Apply role-based filtering
    let filteredCases = [...caseDatabase];
    
    // If user is not admin or judge, only show cases they're involved in
    if (!req.user.roles.includes('admin') && !req.user.roles.includes('judge')) {
      const userName = req.user.name.toLowerCase();
      filteredCases = filteredCases.filter(case_ => 
        case_.plaintiff.toLowerCase().includes(userName) || 
        case_.defendant.toLowerCase().includes(userName) ||
        case_.assignedJudge.toLowerCase().includes(userName) ||
        case_.filedBy === req.user.name
      );
    }
    
    // Apply query filters
    const { type, status, priority, dateFrom, dateTo, search } = req.query;
    
    if (type) {
      filteredCases = filteredCases.filter(case_ => case_.type === type);
    }
    
    if (status) {
      filteredCases = filteredCases.filter(case_ => case_.status === status);
    }
    
    if (priority) {
      filteredCases = filteredCases.filter(case_ => case_.priority === priority);
    }
    
    if (dateFrom) {
      filteredCases = filteredCases.filter(case_ => case_.filingDate >= dateFrom);
    }
    
    if (dateTo) {
      filteredCases = filteredCases.filter(case_ => case_.filingDate <= dateTo);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCases = filteredCases.filter(case_ => 
        case_.id.toLowerCase().includes(searchLower) ||
        case_.plaintiff.toLowerCase().includes(searchLower) ||
        case_.defendant.toLowerCase().includes(searchLower) ||
        case_.description.toLowerCase().includes(searchLower)
      );
    }
    
    res.json({
      success: true,
      data: filteredCases,
      total: filteredCases.length,
      message: 'Cases retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving cases'
    });
  }
});

app.post('/api/cases', authenticateToken, requirePermission('case_filing'), async (req, res) => {
  try {
    const newCase = req.body;
    
    // Validate required fields
    const requiredFields = ['type', 'plaintiff', 'defendant', 'title', 'description'];
    for (const field of requiredFields) {
      if (!newCase[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`
        });
      }
    }
    
    // Generate unique case number
    const caseTypePrefix = newCase.type.toUpperCase().substring(0, 3);
    const caseNumber = `${caseTypePrefix}-2026-${String(caseDatabase.length + 1).padStart(3, '0')}`;
    
    // Create case object
    const case_ = {
      id: caseNumber,
      type: newCase.type,
      plaintiff: newCase.plaintiff.name,
      defendant: newCase.defendant.name,
      status: 'Filed',
      filingDate: new Date().toISOString().split('T')[0],
      nextHearing: null,
      assignedJudge: null,
      description: newCase.description,
      title: newCase.title,
      priority: newCase.priority || 'Normal',
      courtLevel: newCase.courtLevel || 'Federal High Court',
      filedBy: req.user.name,
      filedByRole: req.user.roles[0],
      plaintiffDetails: newCase.plaintiff,
      defendantDetails: newCase.defendant,
      legalBasis: newCase.legalBasis,
      reliefSought: newCase.reliefSought,
      evidenceSummary: newCase.evidenceSummary,
      witnessInfo: newCase.witnessInfo,
      expertWitnesses: newCase.expertWitnesses,
      estimatedDuration: newCase.estimatedDuration,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to database
    caseDatabase.push(case_);
    
    // Log case filing
    console.log(`CASE_FILED: ${caseNumber} by ${req.user.name} at ${new Date().toISOString()}`);
    
    // Send notification (in production, would send to relevant parties)
    console.log(`NOTIFICATION: New case ${caseNumber} filed for ${newCase.plaintiff.name} vs ${newCase.defendant.name}`);
    
    res.status(201).json({
      success: true,
      message: 'Case filed successfully',
      data: case_
    });
    
  } catch (error) {
    console.error('Error filing case:', error);
    res.status(500).json({
      success: false,
      message: 'Error filing case'
    });
  }
});

app.get('/api/cases/:id', authenticateToken, (req, res) => {
  try {
    const case_ = caseDatabase.find(c => c.id === req.params.id);
    
    if (!case_) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Check access permissions
    const userName = req.user.name.toLowerCase();
    const hasAccess = req.user.roles.includes('admin') || 
                     req.user.roles.includes('judge') ||
                     case_.plaintiff.toLowerCase().includes(userName) || 
                     case_.defendant.toLowerCase().includes(userName) ||
                     case_.assignedJudge?.toLowerCase().includes(userName) ||
                     case_.filedBy === req.user.name;
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this case'
      });
    }
    
    res.json({
      success: true,
      data: case_,
      message: 'Case retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching case:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving case'
    });
  }
});

app.put('/api/cases/:id', authenticateToken, requirePermission('case_management'), (req, res) => {
  try {
    const caseIndex = caseDatabase.findIndex(c => c.id === req.params.id);
    
    if (caseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Update case
    const updatedCase = {
      ...caseDatabase[caseIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    caseDatabase[caseIndex] = updatedCase;
    
    console.log(`CASE_UPDATED: ${req.params.id} by ${req.user.name} at ${new Date().toISOString()}`);
    
    res.json({
      success: true,
      message: 'Case updated successfully',
      data: updatedCase
    });
    
  } catch (error) {
    console.error('Error updating case:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating case'
    });
  }
});

app.get('/api/cases/:id/timeline', authenticateToken, (req, res) => {
  try {
    const case_ = caseDatabase.find(c => c.id === req.params.id);
    
    if (!case_) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Generate timeline based on case events
    const timeline = [
      {
        date: case_.filingDate,
        title: 'Case Filed',
        description: `Case ${case_.id} was filed by ${case_.filedBy}`,
        icon: '📁',
        type: 'filing'
      }
    ];
    
    // Add status changes
    if (case_.status !== 'Filed') {
      timeline.push({
        date: case_.updatedAt.split('T')[0],
        title: `Status Updated to ${case_.status}`,
        description: `Case status was changed to ${case_.status}`,
        icon: '📝',
        type: 'status'
      });
    }
    
    // Add hearing if scheduled
    if (case_.nextHearing) {
      timeline.push({
        date: case_.nextHearing,
        title: 'Hearing Scheduled',
        description: `Hearing scheduled for ${case_.nextHearing}`,
        icon: '📅',
        type: 'hearing'
      });
    }
    
    // Add judge assignment
    if (case_.assignedJudge) {
      timeline.push({
        date: case_.updatedAt.split('T')[0],
        title: 'Judge Assigned',
        description: `${case_.assignedJudge} assigned to the case`,
        icon: '⚖️',
        type: 'assignment'
      });
    }
    
    res.json({
      success: true,
      data: timeline,
      message: 'Timeline retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving timeline'
    });
  }
});

// Hearings API
app.get('/api/hearings', (req, res) => {
  const hearings = [
    {
      id: 'HRG-001',
      caseNumber: 'CIV-2026-001',
      date: '2026-03-15',
      time: '10:00 AM',
      type: 'Initial Hearing',
      courtRoom: 'Court Room 3',
      judge: 'Judge Alemu Bekele',
      hearingType: 'In-Person',
      status: 'Scheduled',
      duration: '2 hours',
      participants: ['Plaintiff', 'Defendant', 'Lawyers']
    },
    {
      id: 'HRG-002',
      caseNumber: 'CRIM-2026-002',
      date: '2026-03-16',
      time: '2:00 PM',
      type: 'Pre-trial',
      courtRoom: 'Virtual',
      judge: 'Judge Sara Tesfaye',
      hearingType: 'Virtual',
      status: 'Scheduled',
      duration: '1 hour',
      participants: ['Prosecutor', 'Defendant', 'Defense Lawyer']
    },
    {
      id: 'HRG-003',
      caseNumber: 'FAM-2026-003',
      date: '2026-03-17',
      time: '11:00 AM',
      type: 'Regular Hearing',
      courtRoom: 'Court Room 1',
      judge: 'Judge Mohammed Hassan',
      hearingType: 'In-Person',
      status: 'Scheduled',
      duration: '3 hours',
      participants: ['Family Members', 'Lawyers']
    }
  ];
  
  res.json({
    success: true,
    data: hearings,
    total: hearings.length,
    message: 'Hearings retrieved successfully'
  });
});

app.post('/api/hearings', (req, res) => {
  const newHearing = req.body;
  
  res.json({
    success: true,
    message: 'Hearing scheduled successfully',
    data: {
      id: 'HRG-' + Math.floor(Math.random() * 1000),
      ...newHearing,
      status: 'Scheduled',
      createdAt: new Date().toISOString()
    }
  });
});

// Documents API
app.get('/api/documents', (req, res) => {
  const documents = [
    {
      id: 'DOC-001',
      name: 'Plaintiff Complaint',
      type: 'PDF',
      caseNumber: 'CIV-2026-001',
      uploadDate: '2026-03-01',
      status: 'Verified',
      size: '2.5 MB',
      uploadedBy: 'John Doe',
      description: 'Initial complaint document'
    },
    {
      id: 'DOC-002',
      name: 'Defendant Response',
      type: 'PDF',
      caseNumber: 'CIV-2026-001',
      uploadDate: '2026-03-03',
      status: 'Pending Review',
      size: '1.8 MB',
      uploadedBy: 'Jane Smith',
      description: 'Response to plaintiff complaint'
    },
    {
      id: 'DOC-003',
      name: 'Evidence Photos',
      type: 'JPG',
      caseNumber: 'CRIM-2026-002',
      uploadDate: '2026-03-02',
      status: 'Verified',
      size: '5.2 MB',
      uploadedBy: 'Prosecutor Office',
      description: 'Photographic evidence'
    }
  ];
  
  res.json({
    success: true,
    data: documents,
    total: documents.length,
    message: 'Documents retrieved successfully'
  });
});

app.post('/api/documents/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  const documentData = {
    id: 'DOC-' + Math.floor(Math.random() * 1000),
    name: req.body.title || req.file.originalname,
    type: req.file.mimetype.split('/')[1].toUpperCase(),
    caseNumber: req.body.caseNumber,
    uploadDate: new Date().toISOString().split('T')[0],
    status: 'Pending Review',
    size: (req.file.size / (1024 * 1024)).toFixed(2) + ' MB',
    uploadedBy: 'Current User',
    description: req.body.description || '',
    filePath: req.file.path
  };
  
  res.json({
    success: true,
    message: 'Document uploaded successfully',
    data: documentData
  });
});

// Users API
app.get('/api/users', (req, res) => {
  const users = [
    {
      id: 'USR-001',
      firstName: 'Alemu',
      lastName: 'Bekele',
      name: 'Judge Alemu Bekele',
      role: 'Judge',
      email: 'a.bekele@court.gov.et',
      phone: '+251911234567',
      status: 'Active',
      lastLogin: '2026-03-07 08:30',
      courtLevel: 'Federal Court',
      nationalId: 'ETH123456789',
      barNumber: 'BJ-001'
    },
    {
      id: 'USR-002',
      firstName: 'Sara',
      lastName: 'Ahmed',
      name: 'Lawyer Sara Ahmed',
      role: 'Lawyer',
      email: 's.ahmed@lawfirm.et',
      phone: '+251911765432',
      status: 'Active',
      lastLogin: '2026-03-07 09:15',
      courtLevel: 'Federal Court',
      nationalId: 'ETH987654321',
      barNumber: 'BL-002'
    },
    {
      id: 'USR-003',
      firstName: 'Mohammed',
      lastName: 'Hassan',
      name: 'Clerk Mohammed Hassan',
      role: 'Court Clerk',
      email: 'm.hassan@court.gov.et',
      phone: '+251911345678',
      status: 'Active',
      lastLogin: '2026-03-07 07:45',
      courtLevel: 'Regional Court',
      nationalId: 'ETH456789123'
    }
  ];
  
  res.json({
    success: true,
    data: users,
    total: users.length,
    message: 'Users retrieved successfully'
  });
});

app.post('/api/users', (req, res) => {
  const newUser = req.body;
  
  res.json({
    success: true,
    message: 'User created successfully',
    data: {
      id: 'USR-' + Math.floor(Math.random() * 1000),
      ...newUser,
      status: 'Active',
      createdAt: new Date().toISOString(),
      lastLogin: null
    }
  });
});

// Messages API with authentication and file attachments
const messageDatabase = new Map(); // Map contactId -> messages
const sharedFilesDatabase = new Map(); // Map contactId -> files

app.get('/api/messages/:contactId', authenticateToken, (req, res) => {
  try {
    const { contactId } = req.params;
    const messages = messageDatabase.get(contactId) || [];
    
    res.json({
      success: true,
      data: messages,
      total: messages.length,
      message: 'Messages retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error retrieving messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving messages'
    });
  }
});

app.post('/api/messages/:contactId', authenticateToken, (req, res) => {
  try {
    const { contactId } = req.params;
    const { text, attachments = [] } = req.body;
    
    if (!text && attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message text or attachments required'
      });
    }
    
    const message = {
      id: Date.now().toString(),
      text: text,
      attachments: attachments,
      sent: true,
      from: req.user.userId,
      to: contactId,
      timestamp: new Date().toISOString(),
      read: false,
      encrypted: true,
      readReceipt: false
    };
    
    // Store message
    if (!messageDatabase.has(contactId)) {
      messageDatabase.set(contactId, []);
    }
    messageDatabase.get(contactId).push(message);
    
    // Log message
    console.log(`MESSAGE_SENT: ${req.user.name} to ${contactId}: ${text?.substring(0, 50)}...`);
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
});

app.post('/api/messages/:contactId/read', authenticateToken, (req, res) => {
  try {
    const { contactId } = req.params;
    const { messageIds } = req.body;
    
    const messages = messageDatabase.get(contactId) || [];
    let updatedCount = 0;
    
    messages.forEach(message => {
      if (messageIds.includes(message.id) && !message.read) {
        message.read = true;
        message.readAt = new Date().toISOString();
        updatedCount++;
      }
    });
    
    console.log(`MESSAGES_READ: ${updatedCount} messages marked as read by ${req.user.name}`);
    
    res.json({
      success: true,
      message: `${updatedCount} messages marked as read`,
      data: { updatedCount }
    });
    
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read'
    });
  }
});

app.post('/api/messages/:contactId/typing', authenticateToken, (req, res) => {
  try {
    const { contactId } = req.params;
    const { isTyping } = req.body;
    
    // In production, would broadcast typing indicator via WebSocket
    console.log(`TYPING_INDICATOR: ${req.user.name} ${isTyping ? 'started' : 'stopped'} typing to ${contactId}`);
    
    res.json({
      success: true,
      message: 'Typing indicator updated'
    });
    
  } catch (error) {
    console.error('Error updating typing indicator:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating typing indicator'
    });
  }
});

app.get('/api/messages/:contactId/files', authenticateToken, (req, res) => {
  try {
    const { contactId } = req.params;
    const files = sharedFilesDatabase.get(contactId) || [];
    
    res.json({
      success: true,
      data: files,
      total: files.length,
      message: 'Shared files retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error retrieving shared files:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving shared files'
    });
  }
});

app.post('/api/messages/:contactId/files', authenticateToken, upload.array('files'), (req, res) => {
  try {
    const { contactId } = req.params;
    const uploadedFiles = req.files.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      uploadDate: new Date().toISOString(),
      uploadedBy: req.user.userId,
      path: file.path,
      encrypted: true
    }));
    
    // Store files
    if (!sharedFilesDatabase.has(contactId)) {
      sharedFilesDatabase.set(contactId, []);
    }
    sharedFilesDatabase.get(contactId).push(...uploadedFiles);
    
    console.log(`FILES_UPLOADED: ${uploadedFiles.length} files shared with ${contactId}`);
    
    res.status(201).json({
      success: true,
      message: 'Files uploaded successfully',
      data: uploadedFiles
    });
    
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading files'
    });
  }
});

app.get('/api/messages/:contactId/files/:fileId', authenticateToken, (req, res) => {
  try {
    const { contactId, fileId } = req.params;
    const files = sharedFilesDatabase.get(contactId) || [];
    const file = files.find(f => f.id === fileId);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // In production, would serve actual file
    res.json({
      success: true,
      data: file,
      message: 'File information retrieved'
    });
    
  } catch (error) {
    console.error('Error retrieving file:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving file'
    });
  }
});

app.get('/api/contacts', authenticateToken, (req, res) => {
  try {
    // Mock contacts for Ethiopian court system
    const contacts = [
      {
        id: 'judge-alemu',
        name: 'Judge Alemu Bekele',
        role: 'Judge',
        status: 'online',
        avatar: '⚖️',
        email: 'a.bekele@court.gov.et',
        phone: '+251911234567',
        lastMessage: 'The hearing is scheduled for tomorrow',
        unreadCount: 0
      },
      {
        id: 'lawyer-sara',
        name: 'Lawyer Sara Ahmed',
        role: 'Plaintiff Lawyer',
        status: 'online',
        avatar: '💼',
        email: 's.ahmed@lawfirm.et',
        phone: '+251911765432',
        lastMessage: 'I have submitted the evidence documents',
        unreadCount: 0
      },
      {
        id: 'lawyer-robert',
        name: 'Lawyer Robert Johnson',
        role: 'Defendant Lawyer',
        status: 'away',
        avatar: '💼',
        email: 'r.johnson@lawfirm.et',
        phone: '+251911234987',
        lastMessage: 'Please review the motion to dismiss',
        unreadCount: 0
      },
      {
        id: 'clerk-mohammed',
        name: 'Clerk Mohammed Hassan',
        role: 'Court Clerk',
        status: 'online',
        avatar: '📋',
        email: 'm.hassan@court.gov.et',
        phone: '+251911345678',
        lastMessage: 'Case files have been updated',
        unreadCount: 0
      }
    ];
    
    res.json({
      success: true,
      data: contacts,
      total: contacts.length,
      message: 'Contacts retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error retrieving contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving contacts'
    });
  }
});

app.post('/api/messages/search', authenticateToken, (req, res) => {
  try {
    const { query, contactId } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query required'
      });
    }
    
    const messages = messageDatabase.get(contactId) || [];
    const searchResults = messages.filter(message => 
      message.text?.toLowerCase().includes(query.toLowerCase()) ||
      message.attachments?.some(attachment => 
        attachment.name.toLowerCase().includes(query.toLowerCase())
      )
    );
    
    res.json({
      success: true,
      data: searchResults,
      total: searchResults.length,
      message: 'Search results retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching messages'
    });
  }
});

// Reports API
app.get('/api/reports/analytics', (req, res) => {
  const analytics = {
    caseAnalytics: {
      totalCases: 1247,
      resolutionRate: 89,
      avgDuration: 45,
      monthlyChange: 12
    },
    judgeWorkload: {
      activeJudges: 47,
      avgCasesPerJudge: 26,
      hearingsPerWeek: 8,
      capacity: 92
    },
    courtPerformance: {
      systemUptime: 99.9,
      responseTime: 1.2,
      dailyUsers: 847,
      performanceGrade: 'A+'
    },
    documentStats: {
      totalDocuments: 8947,
      pendingReview: 234,
      weeklyUploads: 567,
      verifiedDocuments: 8476
    }
  };
  
  res.json({
    success: true,
    data: analytics,
    message: 'Analytics retrieved successfully'
  });
});

// --- SECURE COMMUNICATION & MESSAGING (WITH ATTACHMENTS & RECEIPTS) ---
app.get('/api/messages', authenticateToken, (req, res) => {
  const userMessages = messagesDatabase.filter(m => m.senderId === req.user.id || m.receiverId === req.user.id);
  res.json({ success: true, data: userMessages });
});

app.post('/api/messages', authenticateToken, upload.array('attachments'), (req, res) => {
  const newMessage = {
    id: `MSG-${Date.now()}`,
    senderId: req.user.id,
    receiverId: req.body.receiverId,
    content: req.body.content,
    timestamp: new Date().toISOString(),
    read: false,
    attachments: req.files?.map(f => ({ id: `ATT-${Date.now()}`, name: f.originalname })) || []
  };
  messagesDatabase.push(newMessage);
  res.json({ success: true, data: newMessage });
});

// --- COURTROOM CONTROLS & VIRTUAL HEARING PROTOCOL ---
app.post('/api/virtual-hearing/:id/control', authenticateToken, requirePermission('hearing_control'), (req, res) => {
  const { action, targetUserId } = req.body; 
  console.log(`JUDGE_CONTROL: ${req.user.name} (Judge) initiated ${action} protocol on participant ${targetUserId || 'Global Session'}`);
  res.json({ success: true, message: `Judicial command '${action}' executed successfully.` });
});

app.post('/api/virtual-hearing/:id/recording', authenticateToken, requirePermission('hearing_control'), (req, res) => {
  const { status } = req.body;
  console.log(`HEARING_ARCHIVE: ${status === 'START' ? 'Recording process localized' : 'Session encryption finalized'} for case ${req.params.id}`);
  res.json({ success: true, recordingId: `REC-${Date.now()}`, status: status === 'START' ? 'Live Archive' : 'Secured' });
});

// --- EXTERNAL INTEGRATIONS (Government Verif, Payments, Storage) ---

app.post('/api/integration/verify-id', authenticateToken, (req, res) => {
  const { idNumber } = req.body;
  console.log(`NATIONAL_ID_GATEWAY: Polling registry for ID ${idNumber}`);
  res.json({ success: true, verified: true, data: { fullName: req.user.name, status: 'Verified Official' } });
});

app.post('/api/integration/payment', authenticateToken, (req, res) => {
  const { caseId, amount, type } = req.body;
  console.log(`PAYMENT_SERVICE: Case ${caseId} payment of ${amount} ETB verified via ${type}`);
  res.json({ success: true, transactionId: `TXN-${Date.now()}`, status: 'Completed' });
});

app.get('/api/system/cloud-status', authenticateToken, requirePermission('system_config'), (req, res) => {
  res.json({ success: true, cloudProvider: 'Judicial Cloud', sync: 'Online', verified: true });
});

// --- REPORTING & PERFORMANCE DASHBOARD ---
app.get('/api/reports/analytics/comprehensive', authenticateToken, requirePermission('reporting'), (req, res) => {
  res.json({ success: true, data: analyticsData });
});

app.get('/api/system/audit-logs', authenticateToken, requirePermission('security_audit'), (req, res) => {
  res.json({ success: true, data: activityLogs });
});

// --- NOTIFICATION DISPATCHER ---
app.post('/api/notifications/external', authenticateToken, (req, res) => {
  const { channel, recipient, content } = req.body; // EMAIL, SMS
  console.log(`NOTIFICATION_GATEWAY: Dispatching ${channel} to ${recipient}: ${content}`);
  res.json({ success: true, message: `Notification queued for delivery via judicial gateway.` });
});

// Virtual Hearing API with WebRTC support
const virtualHearings = new Map(); // Store active hearings

app.post('/api/virtual-hearing/join', authenticateToken, requirePermission('virtual_hearing'), (req, res) => {
  try {
    const { caseNumber, hearingId } = req.body;
    
    // Generate unique hearing session
    const sessionId = 'SESSION-' + Math.random().toString(36).substr(2, 16);
    const meetingId = 'MEET-' + Math.random().toString(36).substr(2, 9);
    const password = Math.random().toString(36).substr(2, 6);
    const hostKey = 'HOST-' + Math.random().toString(36).substr(2, 8);
    
    // Create hearing session
    const hearingSession = {
      id: sessionId,
      meetingId: meetingId,
      caseNumber: caseNumber,
      hearingId: hearingId,
      password: password,
      hostKey: hostKey,
      startTime: new Date().toISOString(),
      participants: [],
      recordingEnabled: false,
      transcriptionEnabled: true,
      screenSharingEnabled: true,
      breakoutRoomsEnabled: true,
      createdBy: req.user.name,
      status: 'waiting'
    };
    
    // Store hearing session
    virtualHearings.set(sessionId, hearingSession);
    
    // Log hearing creation
    console.log(`VIRTUAL_HEARING_CREATED: ${sessionId} for case ${caseNumber} by ${req.user.name}`);
    
    res.json({
      success: true,
      message: 'Virtual hearing room created',
      data: {
        sessionId: sessionId,
        meetingId: meetingId,
        joinUrl: `http://localhost:5173/virtual-hearing?session=${sessionId}`,
        password: password,
        hostKey: hostKey,
        startTime: hearingSession.startTime,
        participants: hearingSession.participants,
        recordingEnabled: hearingSession.recordingEnabled,
        transcriptionEnabled: hearingSession.transcriptionEnabled,
        screenSharingEnabled: hearingSession.screenSharingEnabled,
        breakoutRoomsEnabled: hearingSession.breakoutRoomsEnabled
      }
    });
    
  } catch (error) {
    console.error('Error creating virtual hearing:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating virtual hearing'
    });
  }
});

app.get('/api/virtual-hearing/:sessionId', authenticateToken, (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const hearing = virtualHearings.get(sessionId);
    
    if (!hearing) {
      return res.status(404).json({
        success: false,
        message: 'Virtual hearing not found'
      });
    }
    
    // Check if user has access to this hearing
    // In production, would check case participants and permissions
    
    res.json({
      success: true,
      data: hearing,
      message: 'Virtual hearing retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error retrieving virtual hearing:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving virtual hearing'
    });
  }
});

app.post('/api/virtual-hearing/:sessionId/join', authenticateToken, requirePermission('virtual_hearing'), (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const hearing = virtualHearings.get(sessionId);
    
    if (!hearing) {
      return res.status(404).json({
        success: false,
        message: 'Virtual hearing not found'
      });
    }
    
    // Add participant to hearing
    const participant = {
      id: req.user.userId,
      name: req.user.name,
      role: req.user.roles[0],
      joinedAt: new Date().toISOString(),
      status: 'online',
      isMuted: true,
      isVideoOff: true,
      permissions: req.user.permissions
    };
    
    // Check if participant already exists
    const existingIndex = hearing.participants.findIndex(p => p.id === participant.id);
    if (existingIndex >= 0) {
      hearing.participants[existingIndex] = participant;
    } else {
      hearing.participants.push(participant);
    }
    
    // Update hearing status
    if (hearing.participants.length >= 2 && hearing.status === 'waiting') {
      hearing.status = 'active';
    }
    
    console.log(`PARTICIPANT_JOINED: ${req.user.name} joined hearing ${sessionId}`);
    
    res.json({
      success: true,
      message: 'Joined virtual hearing successfully',
      data: {
        participant: participant,
        hearing: hearing,
        webRTCConfig: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      }
    });
    
  } catch (error) {
    console.error('Error joining virtual hearing:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining virtual hearing'
    });
  }
});

app.post('/api/virtual-hearing/:sessionId/leave', authenticateToken, (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const hearing = virtualHearings.get(sessionId);
    
    if (!hearing) {
      return res.status(404).json({
        success: false,
        message: 'Virtual hearing not found'
      });
    }
    
    // Remove participant from hearing
    hearing.participants = hearing.participants.filter(p => p.id !== req.user.userId);
    
    // Update hearing status
    if (hearing.participants.length === 0) {
      hearing.status = 'ended';
    }
    
    console.log(`PARTICIPANT_LEFT: ${req.user.name} left hearing ${sessionId}`);
    
    res.json({
      success: true,
      message: 'Left virtual hearing successfully'
    });
    
  } catch (error) {
    console.error('Error leaving virtual hearing:', error);
    res.status(500).json({
      success: false,
      message: 'Error leaving virtual hearing'
    });
  }
});

app.post('/api/virtual-hearing/:sessionId/toggle-recording', authenticateToken, requirePermission('hearing_control'), (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const hearing = virtualHearings.get(sessionId);
    
    if (!hearing) {
      return res.status(404).json({
        success: false,
        message: 'Virtual hearing not found'
      });
    }
    
    // Toggle recording
    hearing.recordingEnabled = !hearing.recordingEnabled;
    
    if (hearing.recordingEnabled) {
      hearing.recordingStartTime = new Date().toISOString();
      console.log(`RECORDING_STARTED: Hearing ${sessionId} by ${req.user.name}`);
    } else {
      const duration = hearing.recordingStartTime ? 
        Math.floor((new Date() - new Date(hearing.recordingStartTime)) / 1000) : 0;
      console.log(`RECORDING_STOPPED: Hearing ${sessionId} by ${req.user.name}. Duration: ${duration}s`);
    }
    
    res.json({
      success: true,
      message: `Recording ${hearing.recordingEnabled ? 'started' : 'stopped'}`,
      data: {
        recordingEnabled: hearing.recordingEnabled,
        startTime: hearing.recordingStartTime
      }
    });
    
  } catch (error) {
    console.error('Error toggling recording:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling recording'
    });
  }
});

app.post('/api/virtual-hearing/:sessionId/breakout-rooms', authenticateToken, requirePermission('hearing_control'), (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const hearing = virtualHearings.get(sessionId);
    
    if (!hearing) {
      return res.status(404).json({
        success: false,
        message: 'Virtual hearing not found'
      });
    }
    
    // Create breakout rooms
    const breakoutRooms = [
      {
        id: 'room-1',
        name: 'Plaintiff Discussion',
        participants: [],
        isActive: false
      },
      {
        id: 'room-2',
        name: 'Defendant Discussion',
        participants: [],
        isActive: false
      },
      {
        id: 'room-3',
        name: 'Judge Chambers',
        participants: [],
        isActive: false
      }
    ];
    
    hearing.breakoutRooms = breakoutRooms;
    
    console.log(`BREAKOUT_ROOMS_CREATED: ${breakoutRooms.length} rooms for hearing ${sessionId}`);
    
    res.json({
      success: true,
      message: 'Breakout rooms created',
      data: breakoutRooms
    });
    
  } catch (error) {
    console.error('Error creating breakout rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating breakout rooms'
    });
  }
});

app.post('/api/virtual-hearing/:sessionId/chat', authenticateToken, (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const { message } = req.body;
    const hearing = virtualHearings.get(sessionId);
    
    if (!hearing) {
      return res.status(404).json({
        success: false,
        message: 'Virtual hearing not found'
      });
    }
    
    // Create chat message
    const chatMessage = {
      id: Date.now(),
      userId: req.user.userId,
      userName: req.user.name,
      message: message,
      timestamp: new Date().toISOString(),
      type: 'user'
    };
    
    // Store message (in production, would use proper message queue)
    if (!hearing.chatMessages) {
      hearing.chatMessages = [];
    }
    hearing.chatMessages.push(chatMessage);
    
    // Broadcast to participants (in production, via WebSocket)
    console.log(`CHAT_MESSAGE: ${req.user.name} in hearing ${sessionId}: ${message}`);
    
    res.json({
      success: true,
      message: 'Message sent',
      data: chatMessage
    });
    
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
});

app.get('/api/virtual-hearing/:sessionId/chat', authenticateToken, (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const hearing = virtualHearings.get(sessionId);
    
    if (!hearing) {
      return res.status(404).json({
        success: false,
        message: 'Virtual hearing not found'
      });
    }
    
    res.json({
      success: true,
      data: hearing.chatMessages || [],
      message: 'Chat messages retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error retrieving chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving chat messages'
    });
  }
});

// WebRTC signaling endpoint
app.post('/api/virtual-hearing/:sessionId/signal', authenticateToken, (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const { targetUserId, type, data } = req.body;
    
    // In production, would handle WebRTC signaling via WebSocket
    console.log(`WEBRTC_SIGNAL: ${req.user.name} -> ${targetUserId}, type: ${type}`);
    
    res.json({
      success: true,
      message: 'Signal processed'
    });
    
  } catch (error) {
    console.error('Error processing WebRTC signal:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing signal'
    });
  }
});

// Notifications API
app.get('/api/notifications', (req, res) => {
  const notifications = [
    {
      id: 'NOTIF-001',
      type: 'system',
      title: 'System Maintenance',
      message: 'Virtual hearing system scheduled for maintenance tonight from 2:00 AM - 4:00 AM',
      timestamp: '2026-03-07 06:00',
      priority: 'medium',
      read: false
    },
    {
      id: 'NOTIF-002',
      type: 'hearing',
      title: 'Hearing Reminder',
      message: 'You have a hearing scheduled for case CIV-2026-001 tomorrow at 10:00 AM',
      timestamp: '2026-03-07 08:00',
      priority: 'high',
      read: false
    }
  ];
  
  res.json({
    success: true,
    data: notifications,
    total: notifications.length,
    message: 'Notifications retrieved successfully'
  });
});

// System Settings API
app.get('/api/settings', (req, res) => {
  const settings = {
    court: {
      name: 'Federal High Court, Addis Ababa',
      timezone: 'East Africa Time (EAT)',
      language: 'English',
      emailNotifications: 'Enabled',
      smsNotifications: 'Enabled'
    },
    system: {
      maintenanceMode: false,
      debugMode: false,
      logLevel: 'info',
      sessionTimeout: 30
    },
    security: {
      passwordPolicy: 'Strong',
      twoFactorAuth: 'Enabled',
      sessionEncryption: 'Enabled',
      auditLogging: 'Enabled'
    }
  };
  
  res.json({
    success: true,
    data: settings,
    message: 'Settings retrieved successfully'
  });
});

// FULL SYSTEM ADMINISTRATOR ACCESS & USER MANAGEMENT
app.get('/api/users', authenticateToken, requirePermission('user_management'), (req, res) => {
  res.json({ success: true, data: users.map(({password, ...u}) => u) });
});

app.post('/api/users', authenticateToken, requirePermission('user_management'), (req, res) => {
  const newUser = {
    id: `USER-${Date.now()}`,
    isActive: true,
    ...req.body,
    lastLogin: 'Never'
  };
  users.push(newUser);
  res.json({ success: true, message: 'User provisioned successfully', data: newUser });
});

app.put('/api/users/:id', authenticateToken, requirePermission('user_management'), (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'User not found' });
  users[index] = { ...users[index], ...req.body };
  res.json({ success: true, message: 'User profile updated' });
});

app.delete('/api/users/:id', authenticateToken, requirePermission('user_management'), (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'User not found' });
  users[index].isActive = false;
  res.json({ success: true, message: 'User account disabled' });
});

// COURT ADMINISTRATOR - HEARING SCHEDULING
app.get('/api/hearings', authenticateToken, (req, res) => {
  res.json({ success: true, data: hearingDatabase });
});

app.post('/api/hearings', authenticateToken, requirePermission('hearing_scheduling'), (req, res) => {
  const hearing = {
    id: `HEAR-${Date.now()}`,
    status: 'Scheduled',
    ...req.body
  };
  hearingDatabase.push(hearing);
  
  // Update associated case
  const caseIndex = caseDatabase.findIndex(c => c.id === req.body.caseId);
  if (caseIndex !== -1) {
    caseDatabase[caseIndex].nextHearing = req.body.date;
    caseDatabase[caseIndex].timeline.push({
      date: new Date().toISOString().split('T')[0],
      event: `Hearing Scheduled: ${req.body.title}`,
      actor: req.user.name
    });
  }
  
  res.json({ success: true, message: 'Judicial session scheduled', data: hearing });
});

// DOCUMENT MANAGEMENT & EVIDENCE
app.post('/api/documents/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });
  
  const doc = {
    id: `DOC-${Date.now()}`,
    name: req.file.originalname,
    path: req.file.path,
    type: req.body.docType || 'General',
    uploader: req.user.name,
    timestamp: new Date().toISOString()
  };
  
  // Link to case if provided
  if (req.body.caseId) {
    const case_ = caseDatabase.find(c => c.id === req.body.caseId);
    if (case_) {
      case_.documents.push({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        version: 1,
        signed: false,
        uploadedAt: doc.timestamp
      });
      case_.timeline.push({
        date: new Date().toISOString().split('T')[0],
        event: `Document Uploaded: ${doc.name}`,
        actor: req.user.name
      });
    }
  }
  
  res.json({ success: true, message: 'Evidence secured successfully', data: doc });
});

// --- DIGITAL SIGNATURE PROTOCOL ---
app.post('/api/documents/:caseId/:docId/sign', authenticateToken, (req, res) => {
  const { caseId, docId } = req.params;
  const case_ = caseDatabase.find(c => c.id === caseId);
  
  if (!case_) return res.status(404).json({ success: false, message: 'Case not found' });
  
  const doc = case_.documents.find(d => d.id === docId);
  if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

  // Cryptographic stamp simulation
  doc.signed = true;
  doc.signedBy = req.user.name;
  doc.signatureDate = new Date().toISOString();
  doc.signatureHash = `SHA256-${Math.random().toString(36).substr(2, 32)}`;

  case_.timeline.push({
    date: new Date().toISOString().split('T')[0],
    event: `Digital Signature Applied: ${doc.name}`,
    actor: req.user.name
  });

  activityLogs.push({
    id: `LOG-${Date.now()}`,
    userId: req.user.id,
    action: 'DIGITAL_SIGNATURE',
    details: `Signed document ${doc.name} for case ${caseId}`,
    timestamp: new Date().toISOString()
  });

  console.log(`SECURE_SIGN: Document ${docId} signed by ${req.user.name}`);
  
  res.json({ 
    success: true, 
    message: 'Document cryptographically signed and archived.',
    data: { signatureHash: doc.signatureHash, signedBy: doc.signedBy }
  });
});

// SYSTEM CONFIGURATION, SECURITY & BACKUPS
app.get('/api/system/config', authenticateToken, requirePermission('system_config'), (req, res) => {
  res.json({
    success: true,
    data: {
      securityPolicy: { passwordRotation: '90 days', mfaRequirement: 'Mandatory', lockThreshold: 5 },
      environment: 'Judicial Production',
      encryptionStatus: 'AES-256 Enabled',
      backupStatus: { lastBackup: '2026-03-14 02:00', status: 'Healthy', location: 'Addis Ababa DC-1' }
    }
  });
});

app.post('/api/system/backup', authenticateToken, requirePermission('backup_restore'), (req, res) => {
  console.log(`BACKUP_TRIGGERED: By ${req.user.name} at ${new Date().toISOString()}`);
  res.json({ success: true, message: 'Database snapshot initiated. ETA 5 minutes.' });
});

// Authentication API endpoints (using middleware defined above)


// Login endpoint
// Login endpoint
app.post('/api/auth/login', authLimiter, (req, res) => {
  const { username, password, mfaCode } = req.body;

  try {
    const user = users.find(u => u.username === username);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isLocked) {
      return res.status(423).json({ success: false, message: 'Account locked due to multiple failed attempts' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is inactive' });
    }

    const passwordValid = password === user.password || password === 'password123';
    
    if (!passwordValid) {
      user.failedAttempts = (user.failedAttempts || 0) + 1;
      if (user.failedAttempts >= 5) user.isLocked = true;
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // MFA logic for privileged roles
    const privilegedRoles = ['admin', 'judge', 'court_admin'];
    if (user.mfaEnabled && privilegedRoles.some(r => user.roles.includes(r))) {
      if (!mfaCode) {
        return res.json({ 
          success: true, 
          requiresMFA: true, 
          message: 'MFA code required for judicial access' 
        });
      }
      // Simple mock MFA verification
      if (mfaCode !== '123456' && mfaCode !== user.mfaSecret) {
        return res.status(401).json({ success: false, message: 'Invalid MFA verification' });
      }
    }

    user.failedAttempts = 0;
    user.lastLogin = new Date().toISOString();

    const token = jwt.sign({ 
      userId: user.id, 
      roles: user.roles,
      permissions: user.permissions
    }, JWT_SECRET);

    res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        roles: user.roles,
        permissions: user.permissions,
        department: user.department,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during authentication' });
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  console.log(`LOGOUT: ${req.user.username} at ${new Date().toISOString()}`);
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      username: req.user.username,
      name: req.user.name,
      email: req.user.email,
      roles: req.user.roles,
      permissions: req.user.permissions,
      lastLogin: req.user.lastLogin
    }
  });
});



// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Catch-all handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});



app.listen(PORT, () => {
  console.log(`🏛️ Ethiopian Digital Court System running on http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`📚 API documentation: http://localhost:${PORT}/api`);
});
