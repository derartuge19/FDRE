-- DIGIT-Based Smart Court System Database Initialization
-- This script initializes the database with court-specific tables and data

-- Create court-specific extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create court user profiles table
CREATE TABLE IF NOT EXISTS court_user_profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(36) NOT NULL REFERENCES egov_user(id),
    bar_number VARCHAR(50),           -- For lawyers
    court_jurisdiction VARCHAR(100),  -- For judges
    specialization VARCHAR(100),      -- For lawyers
    license_number VARCHAR(50),       -- For lawyers
    court_rank VARCHAR(50),          -- For judges
    law_firm VARCHAR(200),           -- For lawyers
    experience_years INTEGER,        -- For lawyers
    education_background TEXT,        -- For lawyers
    bio TEXT,                        -- Bio information
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create court roles table
CREATE TABLE IF NOT EXISTS court_roles (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create court cases table
CREATE TABLE IF NOT EXISTS court_cases (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    case_type VARCHAR(50) NOT NULL,
    sub_type VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'INITIATED',
    priority VARCHAR(20) DEFAULT 'NORMAL',
    court_id VARCHAR(36),
    judge_id VARCHAR(36) REFERENCES egov_user(id),
    filing_date DATE DEFAULT CURRENT_DATE,
    hearing_date DATE,
    description TEXT,
    estimated_value DECIMAL(15,2),
    actual_value DECIMAL(15,2),
    plaintiff_id VARCHAR(36) REFERENCES egov_user(id),
    defendant_id VARCHAR(36) REFERENCES egov_user(id),
    plaintiff_lawyer_id VARCHAR(36) REFERENCES egov_user(id),
    defendant_lawyer_id VARCHAR(36) REFERENCES egov_user(id),
    created_by VARCHAR(36) REFERENCES egov_user(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create court hearings table
CREATE TABLE IF NOT EXISTS court_hearings (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id VARCHAR(36) NOT NULL REFERENCES court_cases(id),
    hearing_number INTEGER NOT NULL,
    hearing_date TIMESTAMP NOT NULL,
    hearing_time TIME NOT NULL,
    courtroom VARCHAR(50),
    judge_id VARCHAR(36) REFERENCES egov_user(id),
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    hearing_type VARCHAR(50),
    purpose TEXT,
    outcome TEXT,
    next_hearing_date DATE,
    notes TEXT,
    recording_enabled BOOLEAN DEFAULT FALSE,
    virtual_hearing_enabled BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(36) REFERENCES egov_user(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create court documents table
CREATE TABLE IF NOT EXISTS court_documents (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id VARCHAR(36) REFERENCES court_cases(id),
    hearing_id VARCHAR(36) REFERENCES court_hearings(id),
    document_type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    file_name VARCHAR(500),
    file_path VARCHAR(1000),
    file_size BIGINT,
    file_type VARCHAR(50),
    uploaded_by VARCHAR(36) REFERENCES egov_user(id),
    is_digital_signature_required BOOLEAN DEFAULT FALSE,
    is_digital_signed BOOLEAN DEFAULT FALSE,
    signature_details JSON,
    access_level VARCHAR(50) DEFAULT 'PUBLIC',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create court payments table
CREATE TABLE IF NOT EXISTS court_payments (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id VARCHAR(36) REFERENCES court_cases(id),
    payment_type VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ETB',
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    receipt_number VARCHAR(100),
    paid_by VARCHAR(36) REFERENCES egov_user(id),
    paid_at TIMESTAMP,
    due_date DATE,
    late_fee DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2),
    payment_gateway_response JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create court notifications table
CREATE TABLE IF NOT EXISTS court_notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id VARCHAR(36) REFERENCES court_cases(id),
    hearing_id VARCHAR(36) REFERENCES court_hearings(id),
    recipient_id VARCHAR(36) REFERENCES egov_user(id),
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(50) NOT NULL, -- SMS, EMAIL, PUSH
    status VARCHAR(50) DEFAULT 'PENDING',
    sent_at TIMESTAMP,
    delivery_status VARCHAR(50),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create court workflow instances table
CREATE TABLE IF NOT EXISTS court_workflow_instances (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id VARCHAR(36) NOT NULL, -- case_id or hearing_id
    business_service VARCHAR(50) NOT NULL,
    state_id VARCHAR(50) NOT NULL,
    action VARCHAR(50),
    assignee VARCHAR(36) REFERENCES egov_user(id),
    comment TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_by VARCHAR(36) REFERENCES egov_user(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert court roles
INSERT INTO court_roles (name, code, description, permissions) VALUES
('Judge', 'JUDGE', 'Can hear cases and pass judgments', '["HEAR_CASES", "PASS_JUDGMENTS", "MANAGE_HEARINGS", "VIEW_ALL_CASES"]'),
('Lawyer', 'LAWYER', 'Can represent clients in court', '["REPRESENT_CLIENTS", "FILE_CASES", "VIEW_CLIENT_CASES", "MANAGE_DOCUMENTS"]'),
('Plaintiff', 'PLAINTIFF', 'Can file and manage cases', '["FILE_CASES", "VIEW_OWN_CASES", "PAY_FEES", "UPLOAD_DOCUMENTS"]'),
('Defendant', 'DEFENDANT', 'Can respond to cases', '["VIEW_OWN_CASES", "RESPOND_TO_CASES", "PAY_FEES", "UPLOAD_DOCUMENTS"]'),
('Clerk', 'CLERK', 'Can manage court operations', '["MANAGE_CASES", "SCHEDULE_HEARINGS", "GENERATE_DOCUMENTS", "VIEW_ALL_CASES"]'),
('Registrar', 'REGISTRAR', 'Can manage court registrations', '["MANAGE_REGISTRATIONS", "APPROVE_CASES", "MANAGE_RECORDS", "VIEW_ALL_CASES"]'),
('Administrator', 'ADMIN', 'Full system access', '["FULL_ACCESS"]')
ON CONFLICT (code) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_court_cases_case_number ON court_cases(case_number);
CREATE INDEX IF NOT EXISTS idx_court_cases_status ON court_cases(status);
CREATE INDEX IF NOT EXISTS idx_court_cases_judge_id ON court_cases(judge_id);
CREATE INDEX IF NOT EXISTS idx_court_hearings_case_id ON court_hearings(case_id);
CREATE INDEX IF NOT EXISTS idx_court_hearings_date ON court_hearings(hearing_date);
CREATE INDEX IF NOT EXISTS idx_court_documents_case_id ON court_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_court_payments_case_id ON court_payments(case_id);
CREATE INDEX IF NOT EXISTS idx_court_notifications_recipient_id ON court_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_court_workflow_instances_business_id ON court_workflow_instances(business_id);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_court_user_profiles_updated_at BEFORE UPDATE ON court_user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_court_roles_updated_at BEFORE UPDATE ON court_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_court_cases_updated_at BEFORE UPDATE ON court_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_court_hearings_updated_at BEFORE UPDATE ON court_hearings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_court_documents_updated_at BEFORE UPDATE ON court_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_court_payments_updated_at BEFORE UPDATE ON court_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_court_notifications_updated_at BEFORE UPDATE ON court_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_court_workflow_instances_updated_at BEFORE UPDATE ON court_workflow_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create sample court master data for MDMS
INSERT INTO egov_mdms_master_data (tenantid, modulecode, mastername, masterdata) VALUES
('default', 'COURT', 'CASE_TYPES', '[
    {"code": "CIVIL", "name": "Civil Case", "description": "Civil dispute cases", "active": true},
    {"code": "CRIMINAL", "name": "Criminal Case", "description": "Criminal cases", "active": true},
    {"code": "FAMILY", "name": "Family Case", "description": "Family law cases", "active": true},
    {"code": "CORPORATE", "name": "Corporate Case", "description": "Corporate law cases", "active": true}
]'),
('default', 'COURT', 'COURT_ROOMS', '[
    {"code": "ROOM_001", "name": "Court Room 1", "capacity": 50, "facilities": ["VIDEO_CONF", "AUDIO_SYSTEM", "PROJECTOR"], "active": true},
    {"code": "ROOM_002", "name": "Court Room 2", "capacity": 30, "facilities": ["AUDIO_SYSTEM", "PROJECTOR"], "active": true},
    {"code": "ROOM_003", "name": "Virtual Court Room", "capacity": 100, "facilities": ["VIDEO_CONF", "AUDIO_SYSTEM", "SCREEN_SHARING"], "active": true}
]'),
('default', 'COURT', 'HEARING_TYPES', '[
    {"code": "INITIAL", "name": "Initial Hearing", "description": "First hearing of the case", "active": true},
    {"code": "REGULAR", "name": "Regular Hearing", "description": "Regular case hearing", "active": true},
    {"code": "FINAL", "name": "Final Hearing", "description": "Final judgment hearing", "active": true},
    {"code": "EMERGENCY", "name": "Emergency Hearing", "description": "Emergency hearing", "active": true}
]'),
('default', 'COURT', 'DOCUMENT_TYPES', '[
    {"code": "PLEADING", "name": "Pleading Document", "description": "Legal pleading documents", "active": true},
    {"code": "EVIDENCE", "name": "Evidence Document", "description": "Evidence documents", "active": true},
    {"code": "JUDGMENT", "name": "Judgment Document", "description": "Court judgment", "active": true},
    {"code": "CERTIFICATE", "name": "Certificate Document", "description": "Official certificates", "active": true}
]'),
('default', 'COURT', 'FEE_STRUCTURES', '[
    {"code": "CIVIL_FILING", "name": "Civil Case Filing Fee", "amount": 1000, "currency": "ETB", "applicableTo": ["CIVIL"], "active": true},
    {"code": "CRIMINAL_FILING", "name": "Criminal Case Filing Fee", "amount": 500, "currency": "ETB", "applicableTo": ["CRIMINAL"], "active": true},
    {"code": "HEARING_FEE", "name": "Hearing Fee", "amount": 200, "currency": "ETB", "applicableTo": ["CIVIL", "CRIMINAL"], "active": true}
]')
ON CONFLICT DO NOTHING;

COMMIT;
