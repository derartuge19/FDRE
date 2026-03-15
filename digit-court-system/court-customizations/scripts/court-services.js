// CORE SERVICES Integration - Ethiopian Digital Court System
import axios from 'axios';

// CORE SERVICES URLs (Your Microservices)
const CORE_SERVICES = {
  // User Authentication Service (Port 8080)
  USER_SERVICE: 'http://localhost:8080',
  
  // Notification Service (Port 8081)
  NOTIFICATION_SERVICE: 'http://localhost:8081',
  
  // Workflow Service (Port 8082)
  WORKFLOW_SERVICE: 'http://localhost:8082',
  
  // File Storage Service (Port 8083)
  FILESTORE_SERVICE: 'http://localhost:8083',
  
  // Master Data Service (Port 8084)
  MDMS_SERVICE: 'http://localhost:8084',
  
  // Search/Indexing Service (Port 8085)
  INDEXER_SERVICE: 'http://localhost:8085',
  
  // Data Persistence Service (Port 8086)
  PERSISTER_SERVICE: 'http://localhost:8086'
};

// Ethiopian Court System Service URLs
const COURT_SERVICES = {
  CASE_SERVICE: 'http://localhost:8082',
  HEARING_SERVICE: 'http://localhost:8082',
  DOCUMENT_SERVICE: 'http://localhost:8083'
};

// Court User Service - CORE SERVICES Integration
export const courtUserService = {
  // Court user authentication
  login: (credentials) => 
    axios.post(`${CORE_SERVICES.USER_SERVICE}/user/oauth/token`, credentials),
  
  // Court user registration
  register: (userData) => 
    axios.post(`${CORE_SERVICES.USER_SERVICE}/citizen/_create`, userData),
  
  // Get court user profile
  getProfile: (userId) => 
    axios.post(`${CORE_SERVICES.USER_SERVICE}/_details`, { accessToken: localStorage.getItem('courtToken') }),
  
  // Search court users by role
  searchByRole: (courtRole) => 
    axios.post(`${CORE_SERVICES.USER_SERVICE}/_search`, { 
      RequestInfo: { 
        apiId: "court-system", 
        ver: "v1", 
        ts: new Date().toISOString(), 
        action: "_search", 
        did: "1", 
        key: "", 
        msgId: "20170310130900|default"
      },
      tenantId: "default",
      type: courtRole
    }),
  
  // Update profile
  updateProfile: (userId, profileData) => 
    axios.post(`${CORE_SERVICES.USER_SERVICE}/profile/_update`, profileData)
};

// Court Case Service - Workflow Integration
export const courtCaseService = {
  // Create case (triggers workflow)
  create: (caseData) => 
    axios.post(`${CORE_SERVICES.WORKFLOW_SERVICE}/process/_transition`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "_create",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      ProcessInstance: {
        tenantId: "default",
        businessService: "COURT_CASES",
        action: "APPLY",
        assignes: [caseData.createdBy],
        comment: caseData.description,
        initiator: {
          id: caseData.createdBy,
          name: caseData.createdByName,
          userName: caseData.createdBy
        }
      }
    }),
  
  // Get case by ID
  get: (caseId) => 
    axios.post(`${CORE_SERVICES.WORKFLOW_SERVICE}/process/_search`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "_search",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      ProcessInstanceSearchCriteria: {
        businessIds: [caseId]
      }
    }),
  
  // Search cases
  search: (filters) => 
    axios.post(`${CORE_SERVICES.WORKFLOW_SERVICE}/process/_search`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "_search",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      ProcessInstanceSearchCriteria: {
        assignee: [filters.userId],
        status: filters.status || ["PENDING", "INPROGRESS"]
      }
    }),
  
  // Update case
  update: (caseId, caseData) => 
    axios.post(`${CORE_SERVICES.WORKFLOW_SERVICE}/process/_transition`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "UPDATE",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      ProcessInstance: {
        businessId: caseId,
        action: "UPDATE",
        comment: caseData.updateMessage,
        assignes: [caseData.updatedBy],
        initiator: {
          id: caseData.updatedBy,
          name: caseData.updatedByName,
          userName: caseData.updatedBy
        }
      }
    }),
  
  // Get my cases
  getMyCases: (userId) => 
    axios.post(`${CORE_SERVICES.WORKFLOW_SERVICE}/process/_search`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "_search",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      ProcessInstanceSearchCriteria: {
        assignee: [userId]
      }
    }),
  
  // Assign case to judge
  assignJudge: (caseId, judgeId) => 
    axios.post(`${CORE_SERVICES.WORKFLOW_SERVICE}/process/_transition`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "ASSIGN",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      ProcessInstance: {
        businessId: caseId,
        action: "ASSIGN",
        comment: `Case assigned to Judge ${judgeId}`,
        assignes: [judgeId],
        initiator: {
          id: userId,
          name: "System",
          userName: "system"
        }
      }
    })
};

// Court Hearing Service - Workflow Integration
export const courtHearingService = {
  // Schedule hearing (creates workflow instance)
  schedule: (hearingData) => 
    axios.post(`${CORE_SERVICES.WORKFLOW_SERVICE}/process/_transition`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "_create",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      ProcessInstance: {
        tenantId: "default",
        businessService: "COURT_HEARINGS",
        action: "SCHEDULE",
        assignes: [hearingData.judgeId],
        comment: `Hearing scheduled for case ${hearingData.caseId}`,
        initiator: {
          id: hearingData.createdBy,
          name: hearingData.createdByName,
          userName: hearingData.createdBy
        }
      }
    }),
  
  // Get hearing by ID
  get: (hearingId) => 
    axios.post(`${CORE_SERVICES.WORKFLOW_SERVICE}/process/_search`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "_search",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      ProcessInstanceSearchCriteria: {
        businessIds: [hearingId]
      }
    }),
  
  // Search hearings
  search: (filters) => 
    axios.post(`${CORE_SERVICES.WORKFLOW_SERVICE}/process/_search`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "_search",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      ProcessInstanceSearchCriteria: {
        assignee: [filters.userId],
        status: filters.status || ["SCHEDULED", "INPROGRESS"]
      }
    }),
  
  // Update hearing
  update: (hearingId, hearingData) => 
    axios.post(`${CORE_SERVICES.WORKFLOW_SERVICE}/process/_transition`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "UPDATE",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      ProcessInstance: {
        businessId: hearingId,
        action: "UPDATE",
        comment: hearingData.updateMessage,
        assignes: [hearingData.judgeId],
        initiator: {
          id: hearingData.updatedBy,
          name: hearingData.updatedByName,
          userName: hearingData.updatedBy
        }
      }
    }),
  
  // Get my hearings
  getMyHearings: (userId) => 
    axios.post(`${CORE_SERVICES.WORKFLOW_SERVICE}/process/_search`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "_search",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      ProcessInstanceSearchCriteria: {
        assignee: [userId]
      }
    }),
  
  // Start virtual hearing
  startVirtual: (hearingId) => 
    axios.post(`${CORE_SERVICES.WORKFLOW_SERVICE}/process/_transition`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "START_HEARING",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      ProcessInstance: {
        businessId: hearingId,
        action: "START_HEARING",
        comment: "Virtual hearing started",
        assignes: [],
        initiator: {
          id: "system",
          name: "System",
          userName: "system"
        }
      }
    }),
  
  // Join virtual hearing
  joinVirtual: (hearingId, participantData) => 
    axios.post(`${CORE_SERVICES.WORKFLOW_SERVICE}/process/_transition`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "JOIN_HEARING",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      ProcessInstance: {
        businessId: hearingId,
        action: "JOIN_HEARING",
        comment: `Participant ${participantData.participantName} joined hearing`,
        assignes: [participantData.participantId],
        initiator: {
          id: participantData.participantId,
          name: participantData.participantName,
          userName: participantData.participantId
        }
      }
    })
};

// Court Document Service - Filestore Integration
export const courtDocumentService = {
  // Upload document
  upload: (file, module = "COURT", tenantId = "default") => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('module', module);
    formData.append('tenantId', tenantId);
    
    return axios.post(`${CORE_SERVICES.FILESTORE_SERVICE}/filestore/v1/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Get document URL
  getUrl: (fileStoreId, tenantId = "default") => 
    axios.get(`${CORE_SERVICES.FILESTORE_SERVICE}/filestore/v1/files/url`, {
      params: {
        fileStoreIds: fileStoreId,
        tenantId: tenantId
      }
    }),
  
  // Download document
  download: (fileStoreId, tenantId = "default") => 
    axios.get(`${CORE_SERVICES.FILESTORE_SERVICE}/filestore/v1/files/${fileStoreId}/download`, {
      params: { tenantId },
      responseType: 'blob'
    }),
  
  // Get case documents
  getCaseDocuments: (caseId) => 
    axios.post(`${CORE_SERVICES.FILESTORE_SERVICE}/filestore/v1/files/url`, {
      params: {
        tenantId: "default",
        module: "COURT",
        caseId: caseId
      }
    }),
  
  // Sign document (metadata update)
  signDocument: (documentId, signatureData) => 
    axios.post(`${CORE_SERVICES.FILESTORE_SERVICE}/filestore/v1/files/${documentId}/metadata`, {
      ...signatureData,
      tenantId: "default",
      module: "COURT"
    })
};

// Master Data Service - CORE SERVICES MDMS Integration
export const masterDataService = {
  // Get case types
  getCaseTypes: () => 
    axios.post(`${CORE_SERVICES.MDMS_SERVICE}/egov-mdms-service/v1/_search`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "_search",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      MdmsCriteria: {
        tenantId: "default",
        moduleDetails: [{
          moduleName: "COURT",
          masterDetails: [{
            name: "CaseTypes"
          }]
        }]
      }
    }),
  
  // Get court rooms
  getCourtRooms: () => 
    axios.post(`${CORE_SERVICES.MDMS_SERVICE}/egov-mdms-service/v1/_search`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "_search",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      MdmsCriteria: {
        tenantId: "default",
        moduleDetails: [{
          moduleName: "COURT",
          masterDetails: [{
            name: "CourtRooms"
          }]
        }]
      }
    }),
  
  // Get hearing types
  getHearingTypes: () => 
    axios.post(`${CORE_SERVICES.MDMS_SERVICE}/egov-mdms-service/v1/_search`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "_search",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      MdmsCriteria: {
        tenantId: "default",
        moduleDetails: [{
          moduleName: "COURT",
          masterDetails: [{
            name: "HearingTypes"
          }]
        }]
      }
    }),
  
  // Get document types
  getDocumentTypes: () => 
    axios.post(`${CORE_SERVICES.MDMS_SERVICE}/egov-mdms-service/v1/_search`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "_search",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      MdmsCriteria: {
        tenantId: "default",
        moduleDetails: [{
          moduleName: "COURT",
          masterDetails: [{
            name: "DocumentTypes"
          }]
        }]
      }
    }),
  
  // Get fee structures
  getFeeStructures: () => 
    axios.post(`${CORE_SERVICES.MDMS_SERVICE}/egov-mdms-service/v1/_search`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "_search",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      MdmsCriteria: {
        tenantId: "default",
        moduleDetails: [{
          moduleName: "COURT",
          masterDetails: [{
            name: "FeeStructures"
          }]
        }]
      }
    }),
  
  // Get court roles
  getCourtRoles: () => 
    axios.post(`${CORE_SERVICES.MDMS_SERVICE}/egov-mdms-service/v1/_search`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "_search",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      MdmsCriteria: {
        tenantId: "default",
        moduleDetails: [{
          moduleName: "COURT",
          masterDetails: [{
            name: "CourtRoles"
          }]
        }]
      }
    })
};

// Workflow Service - Direct DIGIT Workflow
export const workflowService = {
  // Create workflow
  create: (workflowData) => 
    axios.post(`${DIGIT_SERVICES.WORKFLOW_SERVICE}/workflow/v1/_create`, workflowData),
  
  // Update workflow
  update: (workflowData) => 
    axios.post(`${DIGIT_SERVICES.WORKFLOW_SERVICE}/workflow/v1/_update`, workflowData),
  
  // Search workflows
  search: (criteria) => 
    axios.post(`${DIGIT_SERVICES.WORKFLOW_SERVICE}/workflow/v1/_search`, criteria),
  
  // Get workflow history
  getHistory: (businessId) => 
    axios.post(`${DIGIT_SERVICES.WORKFLOW_SERVICE}/workflow/v1/_search`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "_search",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      ProcessInstanceSearchCriteria: {
        businessIds: [businessId]
      }
    }),
  
  // Get my tasks
  getMyTasks: (userId) => 
    axios.post(`${DIGIT_SERVICES.WORKFLOW_SERVICE}/workflow/v1/_search`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "_search",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      ProcessInstanceSearchCriteria: {
        assignee: [userId],
        status: ["PENDING", "INPROGRESS"]
      }
    })
};

// File Store Service - Direct DIGIT Filestore
export const fileStoreService = {
  // Upload file
  upload: (file, module, tenantId = "default") => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('module', module);
    formData.append('tenantId', tenantId);
    
    return axios.post(`${DIGIT_SERVICES.FILESTORE_SERVICE}/filestore/v1/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Get file URL
  getUrl: (fileStoreId, tenantId = "default") => 
    axios.get(`${DIGIT_SERVICES.FILESTORE_SERVICE}/filestore/v1/files/url`, {
      params: {
        fileStoreIds: fileStoreId,
        tenantId: tenantId
      }
    }),
  
  // Download file
  download: (fileStoreId, tenantId = "default") => 
    axios.get(`${DIGIT_SERVICES.FILESTORE_SERVICE}/filestore/v1/files/${fileStoreId}/download`, {
      params: { tenantId },
      responseType: 'blob'
    })
};

// Notification Service - CORE SERVICES Integration
export const notificationService = {
  // Send SMS
  sendSMS: (mobileNumber, message, template = "DEFAULT") => 
    axios.post(`${CORE_SERVICES.NOTIFICATION_SERVICE}/notification/v1/sms/_send`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "_send",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      Sms: {
        mobileNumber: mobileNumber,
        message: message,
        locale: "en_IN",
        tag: "court-notification",
        template: template
      }
    }),
  
  // Send Email
  sendEmail: (email, subject, body, template = "DEFAULT") => 
    axios.post(`${CORE_SERVICES.NOTIFICATION_SERVICE}/notification/v1/email/_send`, {
      RequestInfo: {
        apiId: "court-system",
        ver: "v1",
        ts: new Date().toISOString(),
        action: "_send",
        did: "1",
        key: "",
        msgId: "20170310130900|default"
      },
      Email: {
        email: email,
        subject: subject,
        body: body,
        template: template,
        locale: "en_IN",
        tag: "court-notification"
      }
    }),
  
  // Send hearing reminder
  sendHearingReminder: (caseData, participants) => {
    const promises = participants.map(participant => {
      const message = `Hearing Reminder: Case #${caseData.caseNumber} scheduled on ${caseData.hearingDate} at ${caseData.hearingTime} in ${caseData.courtroom}. Please be present 15 minutes before scheduled time.`;
      
      return notificationService.sendSMS(participant.mobileNumber, message, "HEARING_REMINDER");
    });
    
    return Promise.all(promises);
  },
  
  // Send case update
  sendCaseUpdate: (caseData, recipients) => {
    const promises = recipients.map(recipient => {
      const message = `Case Update: Case #${caseData.caseNumber} - ${caseData.updateMessage}. Status: ${caseData.status}.`;
      
      return notificationService.sendSMS(recipient.mobileNumber, message, "CASE_UPDATE");
    });
    
    return Promise.all(promises);
  }
};

// Combined court service
export default {
  user: courtUserService,
  cases: courtCaseService,
  hearings: courtHearingService,
  documents: courtDocumentService,
  masterData: masterDataService,
  workflow: workflowService,
  fileStore: fileStoreService,
  notifications: notificationService
};
