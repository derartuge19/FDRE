// File Storage Service for Virtual Hearing Recordings
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FileStorageService {
    constructor(baseDir = 'recordings') {
        this.baseDir = path.join(__dirname, '..', baseDir);
        this.maxFileSize = 5 * 1024 * 1024 * 1024; // 5GB max file size
        this.allowedFormats = ['webm', 'mp4', 'wav', 'mp3'];
    }

    /**
     * Initialize storage directory structure
     */
    async initialize() {
        try {
            await fs.mkdir(this.baseDir, { recursive: true });
            console.log(`📁 File storage initialized at: ${this.baseDir}`);
        } catch (error) {
            console.error('❌ Failed to initialize file storage:', error);
            throw error;
        }
    }

    /**
     * Generate file path based on hearing ID and timestamp
     * Format: /recordings/YYYY/MM/DD/hearing-{caseNumber}-{timestamp}.{format}
     */
    generateFilePath(hearingId, caseNumber, format = 'webm') {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        
        const filename = `hearing-${caseNumber}-${timestamp}.${format}`;
        const relativePath = path.join(year.toString(), month, day, filename);
        const fullPath = path.join(this.baseDir, relativePath);
        
        return {
            filename,
            relativePath: `/${relativePath.replace(/\\/g, '/')}`, // Normalize path separators
            fullPath,
            directory: path.dirname(fullPath)
        };
    }

    /**
     * Create directory structure for a file path
     */
    async ensureDirectory(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            console.error(`❌ Failed to create directory ${dirPath}:`, error);
            throw error;
        }
    }

    /**
     * Save recording blob to file system
     */
    async saveRecording(hearingId, caseNumber, recordingBlob, format = 'webm') {
        if (!this.allowedFormats.includes(format)) {
            throw new Error(`Unsupported format: ${format}`);
        }

        const pathInfo = this.generateFilePath(hearingId, caseNumber, format);
        
        try {
            // Ensure directory exists
            await this.ensureDirectory(pathInfo.directory);
            
            // Convert blob to buffer if needed
            let buffer;
            if (recordingBlob instanceof Buffer) {
                buffer = recordingBlob;
            } else if (recordingBlob instanceof ArrayBuffer) {
                buffer = Buffer.from(recordingBlob);
            } else {
                // Assume it's a blob-like object with arrayBuffer method
                buffer = Buffer.from(await recordingBlob.arrayBuffer());
            }

            // Check file size
            if (buffer.length > this.maxFileSize) {
                throw new Error(`File size exceeds maximum allowed size: ${this.maxFileSize} bytes`);
            }

            // Write file
            await fs.writeFile(pathInfo.fullPath, buffer);
            
            // Calculate checksum
            const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
            
            console.log(`💾 Recording saved: ${pathInfo.filename} (${buffer.length} bytes)`);
            
            return {
                filename: pathInfo.filename,
                filePath: pathInfo.relativePath,
                fileSize: buffer.length,
                checksum,
                format
            };
            
        } catch (error) {
            console.error(`❌ Failed to save recording:`, error);
            throw error;
        }
    }

    /**
     * Read recording file
     */
    async getRecording(filePath) {
        const fullPath = path.join(this.baseDir, filePath.replace(/^\//, ''));
        
        try {
            const buffer = await fs.readFile(fullPath);
            return buffer;
        } catch (error) {
            console.error(`❌ Failed to read recording ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Check if recording file exists
     */
    async recordingExists(filePath) {
        const fullPath = path.join(this.baseDir, filePath.replace(/^\//, ''));
        
        try {
            await fs.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get file statistics
     */
    async getFileStats(filePath) {
        const fullPath = path.join(this.baseDir, filePath.replace(/^\//, ''));
        
        try {
            const stats = await fs.stat(fullPath);
            return {
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                accessed: stats.atime
            };
        } catch (error) {
            console.error(`❌ Failed to get file stats for ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Delete recording file
     */
    async deleteRecording(filePath) {
        const fullPath = path.join(this.baseDir, filePath.replace(/^\//, ''));
        
        try {
            await fs.unlink(fullPath);
            console.log(`🗑️ Recording deleted: ${filePath}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to delete recording ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Get storage usage statistics
     */
    async getStorageUsage() {
        try {
            const stats = await this.calculateDirectorySize(this.baseDir);
            return {
                totalFiles: stats.fileCount,
                totalSize: stats.totalSize,
                formattedSize: this.formatBytes(stats.totalSize),
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Failed to calculate storage usage:', error);
            return {
                totalFiles: 0,
                totalSize: 0,
                formattedSize: '0 B',
                lastUpdated: new Date().toISOString()
            };
        }
    }

    /**
     * Recursively calculate directory size
     */
    async calculateDirectorySize(dirPath) {
        let totalSize = 0;
        let fileCount = 0;

        try {
            const items = await fs.readdir(dirPath);
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stats = await fs.stat(itemPath);
                
                if (stats.isDirectory()) {
                    const subStats = await this.calculateDirectorySize(itemPath);
                    totalSize += subStats.totalSize;
                    fileCount += subStats.fileCount;
                } else {
                    totalSize += stats.size;
                    fileCount++;
                }
            }
        } catch (error) {
            // Directory might not exist or be accessible
            console.warn(`⚠️ Could not access directory: ${dirPath}`);
        }

        return { totalSize, fileCount };
    }

    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Cleanup old recordings based on retention policy
     */
    async cleanupOldRecordings(retentionDays = 365) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        
        let deletedCount = 0;
        let deletedSize = 0;

        try {
            await this.cleanupDirectory(this.baseDir, cutoffDate, (size) => {
                deletedCount++;
                deletedSize += size;
            });

            console.log(`🧹 Cleanup completed: ${deletedCount} files deleted, ${this.formatBytes(deletedSize)} freed`);
            
            return {
                deletedFiles: deletedCount,
                freedSpace: deletedSize,
                formattedFreedSpace: this.formatBytes(deletedSize)
            };
        } catch (error) {
            console.error('❌ Cleanup failed:', error);
            throw error;
        }
    }

    /**
     * Recursively cleanup directory
     */
    async cleanupDirectory(dirPath, cutoffDate, onDelete) {
        try {
            const items = await fs.readdir(dirPath);
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stats = await fs.stat(itemPath);
                
                if (stats.isDirectory()) {
                    await this.cleanupDirectory(itemPath, cutoffDate, onDelete);
                    
                    // Remove empty directories
                    const remainingItems = await fs.readdir(itemPath);
                    if (remainingItems.length === 0) {
                        await fs.rmdir(itemPath);
                    }
                } else if (stats.mtime < cutoffDate) {
                    await fs.unlink(itemPath);
                    onDelete(stats.size);
                }
            }
        } catch (error) {
            console.warn(`⚠️ Could not cleanup directory: ${dirPath}`, error.message);
        }
    }
}

// Export singleton instance
const fileStorageService = new FileStorageService();

module.exports = fileStorageService;