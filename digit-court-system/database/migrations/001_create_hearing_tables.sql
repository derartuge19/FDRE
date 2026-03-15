-- Virtual Hearing Recording System Database Schema
-- Migration 001: Create core hearing tables

-- Hearings table
CREATE TABLE IF NOT EXISTS hearings (
  id VARCHAR(50) PRIMARY KEY,
  case_number VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NULL,
  status ENUM('scheduled', 'active', 'completed', 'archived') DEFAULT 'scheduled',
  presiding_judge VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_case_number (case_number),
  INDEX idx_status (status),
  INDEX idx_start_time (start_time)
);

-- Recordings table
CREATE TABLE IF NOT EXISTS recordings (
  id VARCHAR(50) PRIMARY KEY,
  hearing_id VARCHAR(50) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  duration INT NOT NULL DEFAULT 0,
  format ENUM('webm', 'mp4') DEFAULT 'webm',
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NULL,
  status ENUM('recording', 'processing', 'completed', 'failed') DEFAULT 'recording',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hearing_id) REFERENCES hearings(id) ON DELETE CASCADE,
  INDEX idx_hearing_id (hearing_id),
  INDEX idx_status (status),
  INDEX idx_start_time (start_time)
);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
  id VARCHAR(50) PRIMARY KEY,
  hearing_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('judge', 'lawyer', 'plaintiff', 'defendant', 'clerk', 'observer') NOT NULL,
  join_time TIMESTAMP NOT NULL,
  leave_time TIMESTAMP NULL,
  consent_given BOOLEAN DEFAULT FALSE,
  consent_timestamp TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hearing_id) REFERENCES hearings(id) ON DELETE CASCADE,
  INDEX idx_hearing_id (hearing_id),
  INDEX idx_user_id (user_id),
  INDEX idx_role (role)
);

-- Recording metadata table
CREATE TABLE IF NOT EXISTS recording_metadata (
  id VARCHAR(50) PRIMARY KEY,
  recording_id VARCHAR(50) NOT NULL,
  participant_count INT NOT NULL DEFAULT 0,
  has_screen_share BOOLEAN DEFAULT FALSE,
  audio_quality VARCHAR(20) DEFAULT 'standard',
  video_quality VARCHAR(20) DEFAULT 'standard',
  file_checksum VARCHAR(64) NULL,
  compression_ratio DECIMAL(5,2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recording_id) REFERENCES recordings(id) ON DELETE CASCADE,
  INDEX idx_recording_id (recording_id)
);

-- Recording access log table for audit trail
CREATE TABLE IF NOT EXISTS recording_access_log (
  id VARCHAR(50) PRIMARY KEY,
  recording_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  access_type ENUM('view', 'download', 'stream') NOT NULL,
  access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  FOREIGN KEY (recording_id) REFERENCES recordings(id) ON DELETE CASCADE,
  INDEX idx_recording_id (recording_id),
  INDEX idx_user_id (user_id),
  INDEX idx_access_time (access_time)
);

-- Storage usage tracking table
CREATE TABLE IF NOT EXISTS storage_usage (
  id VARCHAR(50) PRIMARY KEY,
  date DATE NOT NULL,
  total_recordings INT NOT NULL DEFAULT 0,
  total_size_bytes BIGINT NOT NULL DEFAULT 0,
  active_recordings INT NOT NULL DEFAULT 0,
  archived_recordings INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_date (date),
  INDEX idx_date (date)
);