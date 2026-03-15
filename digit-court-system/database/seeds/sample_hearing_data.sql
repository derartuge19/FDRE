-- Sample data for testing the virtual hearing recording system

-- Insert sample hearings
INSERT INTO hearings (id, case_number, title, start_time, end_time, status, presiding_judge) VALUES
('hearing-001', 'CIV-2026-001', 'Contract Dispute - ABC Corp vs John Doe', '2026-03-13 10:00:00', '2026-03-13 12:00:00', 'completed', 'Judge Alemu Bekele'),
('hearing-002', 'CIV-2026-002', 'Property Dispute - Land Ownership Case', '2026-03-13 14:00:00', NULL, 'active', 'Judge Alemu Bekele'),
('hearing-003', 'CRIM-2026-001', 'Criminal Case - Fraud Investigation', '2026-03-14 09:00:00', NULL, 'scheduled', 'Judge Sara Ahmed');

-- Insert sample participants
INSERT INTO participants (id, hearing_id, user_id, name, role, join_time, leave_time, consent_given, consent_timestamp) VALUES
-- Hearing 001 participants
('part-001', 'hearing-001', 'judge-alemu', 'Judge Alemu Bekele', 'judge', '2026-03-13 09:55:00', '2026-03-13 12:05:00', TRUE, '2026-03-13 09:55:00'),
('part-002', 'hearing-001', 'lawyer-sara', 'Lawyer Sara Ahmed', 'lawyer', '2026-03-13 09:58:00', '2026-03-13 12:02:00', TRUE, '2026-03-13 09:58:00'),
('part-003', 'hearing-001', 'plaintiff-john', 'John Doe', 'plaintiff', '2026-03-13 10:02:00', '2026-03-13 12:00:00', TRUE, '2026-03-13 10:02:00'),
('part-004', 'hearing-001', 'lawyer-robert', 'Lawyer Robert Johnson', 'lawyer', '2026-03-13 10:01:00', '2026-03-13 12:01:00', TRUE, '2026-03-13 10:01:00'),
('part-005', 'hearing-001', 'clerk-mohammed', 'Clerk Mohammed Hassan', 'clerk', '2026-03-13 09:50:00', '2026-03-13 12:10:00', TRUE, '2026-03-13 09:50:00'),

-- Hearing 002 participants (currently active)
('part-006', 'hearing-002', 'judge-alemu', 'Judge Alemu Bekele', 'judge', '2026-03-13 13:55:00', NULL, TRUE, '2026-03-13 13:55:00'),
('part-007', 'hearing-002', 'lawyer-sara', 'Lawyer Sara Ahmed', 'lawyer', '2026-03-13 14:02:00', NULL, TRUE, '2026-03-13 14:02:00'),
('part-008', 'hearing-002', 'plaintiff-john', 'John Doe', 'plaintiff', '2026-03-13 14:05:00', NULL, FALSE, NULL);

-- Insert sample recordings
INSERT INTO recordings (id, hearing_id, filename, file_path, file_size, duration, format, start_time, end_time, status) VALUES
('rec-001', 'hearing-001', 'hearing-CIV-2026-001-20260313-100000.webm', '/recordings/2026/03/13/hearing-CIV-2026-001-20260313-100000.webm', 524288000, 7200, 'webm', '2026-03-13 10:00:00', '2026-03-13 12:00:00', 'completed'),
('rec-002', 'hearing-002', 'hearing-CIV-2026-002-20260313-140000.webm', '/recordings/2026/03/13/hearing-CIV-2026-002-20260313-140000.webm', 157286400, 3600, 'webm', '2026-03-13 14:00:00', NULL, 'recording');

-- Insert recording metadata
INSERT INTO recording_metadata (id, recording_id, participant_count, has_screen_share, audio_quality, video_quality, file_checksum, compression_ratio) VALUES
('meta-001', 'rec-001', 5, TRUE, 'high', 'hd', 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', 0.75),
('meta-002', 'rec-002', 3, FALSE, 'standard', 'standard', NULL, NULL);

-- Insert sample access log entries
INSERT INTO recording_access_log (id, recording_id, user_id, user_name, access_type, access_time, ip_address, user_agent) VALUES
('log-001', 'rec-001', 'judge-alemu', 'Judge Alemu Bekele', 'view', '2026-03-13 15:30:00', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
('log-002', 'rec-001', 'clerk-mohammed', 'Clerk Mohammed Hassan', 'download', '2026-03-13 16:45:00', '192.168.1.105', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
('log-003', 'rec-001', 'lawyer-sara', 'Lawyer Sara Ahmed', 'stream', '2026-03-13 17:20:00', '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

-- Insert storage usage data
INSERT INTO storage_usage (id, date, total_recordings, total_size_bytes, active_recordings, archived_recordings) VALUES
('usage-001', '2026-03-13', 2, 681574400, 1, 1),
('usage-002', '2026-03-12', 1, 524288000, 0, 1),
('usage-003', '2026-03-11', 1, 524288000, 0, 1);