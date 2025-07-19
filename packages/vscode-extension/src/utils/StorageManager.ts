import * as vscode from 'vscode';
import { CodingSession } from '../core/CodingTracker';

export class StorageManager {
    private context: vscode.ExtensionContext;
    private static readonly STORAGE_KEYS = {
        SESSIONS: 'coding_sessions',
        PENDING_SYNC: 'pending_sync_sessions',
        USER_STATS: 'user_statistics',
        SETTINGS: 'extension_settings',
        DAILY_CACHE: 'daily_cache'
    };

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * Save a coding session to local storage
     */
    async saveSession(session: CodingSession): Promise<void> {
        try {
            // Get existing sessions
            const existingSessions = await this.getAllSessions();
            
            // Add new session
            existingSessions.push(session);
            
            // Save back to storage
            await this.context.globalState.update(
                StorageManager.STORAGE_KEYS.SESSIONS, 
                existingSessions
            );

            // Also add to pending sync queue
            await this.addToPendingSync(session);
            
            console.log(`💾 Session saved: ${session.id}`);
            
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    /**
     * Get all saved sessions
     */
    async getAllSessions(): Promise<CodingSession[]> {
        try {
            const sessions = this.context.globalState.get<CodingSession[]>(
                StorageManager.STORAGE_KEYS.SESSIONS, 
                []
            );
            
            // Convert date strings back to Date objects
            return sessions.map(session => ({
                ...session,
                startTime: new Date(session.startTime),
                endTime: session.endTime ? new Date(session.endTime) : undefined
            }));
            
        } catch (error) {
            console.error('Error getting sessions:', error);
            return [];
        }
    }

    /**
     * Get sessions for today
     */
    async getTodaySessions(): Promise<CodingSession[]> {
        const allSessions = await this.getAllSessions();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return allSessions.filter(session => 
            session.startTime >= today
        );
    }

    /**
     * Get sessions for a specific date range
     */
    async getSessionsInRange(startDate: Date, endDate: Date): Promise<CodingSession[]> {
        const allSessions = await this.getAllSessions();
        
        return allSessions.filter(session => 
            session.startTime >= startDate && session.startTime <= endDate
        );
    }

    /**
     * Get today's statistics
     */
    async getTodayStats(): Promise<{
        totalTime: number;
        languageBreakdown: Record<string, number>;
        projectBreakdown: Record<string, number>;
        productivityScore: number;
        filesCount: number;
        keystrokes: number;
        sessionsCount: number;
    }> {
        try {
            const todaySessions = await this.getTodaySessions();
            
            if (todaySessions.length === 0) {
                return {
                    totalTime: 0,
                    languageBreakdown: {},
                    projectBreakdown: {},
                    productivityScore: 0,
                    filesCount: 0,
                    keystrokes: 0,
                    sessionsCount: 0
                };
            }

            // Calculate totals
            const totalTime = todaySessions.reduce((sum, session) => sum + session.duration, 0);
            const totalKeystrokes = todaySessions.reduce((sum, session) => sum + session.keystrokes, 0);
            
            // Language breakdown
            const languageBreakdown: Record<string, number> = {};
            todaySessions.forEach(session => {
                languageBreakdown[session.language] = 
                    (languageBreakdown[session.language] || 0) + session.duration;
            });

            // Project breakdown
            const projectBreakdown: Record<string, number> = {};
            todaySessions.forEach(session => {
                projectBreakdown[session.projectName] = 
                    (projectBreakdown[session.projectName] || 0) + session.duration;
            });

            // Calculate unique files count
            const allFiles = new Set<string>();
            todaySessions.forEach(session => {
                session.files.forEach(file => allFiles.add(file));
            });

            // Calculate average productivity score
            const avgProductivityScore = todaySessions.length > 0 
                ? todaySessions.reduce((sum, session) => sum + session.productivity, 0) / todaySessions.length
                : 0;

            return {
                totalTime,
                languageBreakdown,
                projectBreakdown,
                productivityScore: Math.round(avgProductivityScore),
                filesCount: allFiles.size,
                keystrokes: totalKeystrokes,
                sessionsCount: todaySessions.length
            };
            
        } catch (error) {
            console.error('Error getting today stats:', error);
            return {
                totalTime: 0,
                languageBreakdown: {},
                projectBreakdown: {},
                productivityScore: 0,
                filesCount: 0,
                keystrokes: 0,
                sessionsCount: 0
            };
        }
    }

    /**
     * Add session to pending sync queue
     */
    async addToPendingSync(session: CodingSession): Promise<void> {
        try {
            const pendingSessions = await this.getPendingSyncSessions();
            pendingSessions.push(session);
            
            await this.context.globalState.update(
                StorageManager.STORAGE_KEYS.PENDING_SYNC,
                pendingSessions
            );
            
        } catch (error) {
            console.error('Error adding to pending sync:', error);
        }
    }

    /**
     * Get sessions pending sync
     */
    async getPendingSyncSessions(): Promise<CodingSession[]> {
        try {
            const sessions = this.context.globalState.get<CodingSession[]>(
                StorageManager.STORAGE_KEYS.PENDING_SYNC,
                []
            );
            
            return sessions.map(session => ({
                ...session,
                startTime: new Date(session.startTime),
                endTime: session.endTime ? new Date(session.endTime) : undefined
            }));
            
        } catch (error) {
            console.error('Error getting pending sync sessions:', error);
            return [];
        }
    }

    /**
     * Clear pending sync sessions (after successful sync)
     */
    async clearPendingSyncSessions(): Promise<void> {
        try {
            await this.context.globalState.update(
                StorageManager.STORAGE_KEYS.PENDING_SYNC,
                []
            );
            
        } catch (error) {
            console.error('Error clearing pending sync sessions:', error);
        }
    }

    /**
     * Save extension settings
     */
    async saveSettings(settings: any): Promise<void> {
        try {
            await this.context.globalState.update(
                StorageManager.STORAGE_KEYS.SETTINGS,
                settings
            );
            
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    /**
     * Get extension settings
     */
    async getSettings(): Promise<any> {
        try {
            return this.context.globalState.get(
                StorageManager.STORAGE_KEYS.SETTINGS,
                {}
            );
            
        } catch (error) {
            console.error('Error getting settings:', error);
            return {};
        }
    }

    /**
     * Cache daily statistics for performance
     */
    async cacheDailyStats(stats: any): Promise<void> {
        try {
            const cacheData = {
                date: new Date().toDateString(),
                stats,
                timestamp: Date.now()
            };
            
            await this.context.globalState.update(
                StorageManager.STORAGE_KEYS.DAILY_CACHE,
                cacheData
            );
            
        } catch (error) {
            console.error('Error caching daily stats:', error);
        }
    }

    /**
     * Get cached daily statistics
     */
    async getCachedDailyStats(): Promise<any | null> {
        try {
            const cacheData = this.context.globalState.get<any>(
                StorageManager.STORAGE_KEYS.DAILY_CACHE
            );
            
            if (!cacheData) return null;
            
            // Check if cache is from today and less than 5 minutes old
            const isToday = cacheData.date === new Date().toDateString();
            const isFresh = Date.now() - cacheData.timestamp < 5 * 60 * 1000; // 5 minutes
            
            if (isToday && isFresh) {
                return cacheData.stats;
            }
            
            return null;
            
        } catch (error) {
            console.error('Error getting cached daily stats:', error);
            return null;
        }
    }

    /**
     * Clean up old sessions (keep last 30 days)
     */
    async cleanupOldSessions(): Promise<void> {
        try {
            const allSessions = await this.getAllSessions();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const recentSessions = allSessions.filter(session => 
                session.startTime >= thirtyDaysAgo
            );
            
            await this.context.globalState.update(
                StorageManager.STORAGE_KEYS.SESSIONS,
                recentSessions
            );
            
            console.log(`🧹 Cleaned up ${allSessions.length - recentSessions.length} old sessions`);
            
        } catch (error) {
            console.error('Error cleaning up old sessions:', error);
        }
    }

    /**
     * Get storage usage statistics
     */
    async getStorageStats(): Promise<{
        totalSessions: number;
        storageSize: number;
        oldestSession?: Date;
        newestSession?: Date;
    }> {
        try {
            const allSessions = await this.getAllSessions();
            
            const storageSize = JSON.stringify(allSessions).length;
            
            let oldestSession: Date | undefined;
            let newestSession: Date | undefined;
            
            if (allSessions.length > 0) {
                const sortedSessions = allSessions.sort((a, b) => 
                    a.startTime.getTime() - b.startTime.getTime()
                );
                
                oldestSession = sortedSessions[0].startTime;
                newestSession = sortedSessions[sortedSessions.length - 1].startTime;
            }
            
            return {
                totalSessions: allSessions.length,
                storageSize,
                oldestSession,
                newestSession
            };
            
        } catch (error) {
            console.error('Error getting storage stats:', error);
            return {
                totalSessions: 0,
                storageSize: 0
            };
        }
    }

    /**
     * Export all data for backup
     */
    async exportData(): Promise<any> {
        try {
            const allSessions = await this.getAllSessions();
            const settings = await this.getSettings();
            const pendingSessions = await this.getPendingSyncSessions();
            
            return {
                sessions: allSessions,
                settings,
                pendingSessions,
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            };
            
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }

    /**
     * Import data from backup
     */
    async importData(data: any): Promise<boolean> {
        try {
            if (data.sessions) {
                await this.context.globalState.update(
                    StorageManager.STORAGE_KEYS.SESSIONS,
                    data.sessions
                );
            }
            
            if (data.settings) {
                await this.saveSettings(data.settings);
            }
            
            if (data.pendingSessions) {
                await this.context.globalState.update(
                    StorageManager.STORAGE_KEYS.PENDING_SYNC,
                    data.pendingSessions
                );
            }
            
            console.log('✅ Data imported successfully');
            return true;
            
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Reset all data (for testing or fresh start)
     */
    async resetAllData(): Promise<void> {
        try {
            await this.context.globalState.update(StorageManager.STORAGE_KEYS.SESSIONS, []);
            await this.context.globalState.update(StorageManager.STORAGE_KEYS.PENDING_SYNC, []);
            await this.context.globalState.update(StorageManager.STORAGE_KEYS.USER_STATS, {});
            await this.context.globalState.update(StorageManager.STORAGE_KEYS.SETTINGS, {});
            await this.context.globalState.update(StorageManager.STORAGE_KEYS.DAILY_CACHE, null);
            
            console.log('🔄 All data reset');
            
        } catch (error) {
            console.error('Error resetting data:', error);
        }
    }
} 