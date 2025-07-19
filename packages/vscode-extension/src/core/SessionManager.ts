import { CodingSession } from './CodingTracker';

export class SessionManager {
    private sessions: CodingSession[] = [];
    private currentSession: CodingSession | null = null;

    /**
     * Start a new coding session
     */
    startSession(session: CodingSession): void {
        this.currentSession = session;
        console.log(`📅 Session started: ${session.language} in ${session.projectName}`);
    }

    /**
     * End current session
     */
    endSession(): CodingSession | null {
        if (!this.currentSession) return null;

        const session = { ...this.currentSession };
        this.sessions.push(session);
        this.currentSession = null;
        
        console.log(`⏹️ Session ended: ${session.id} (${session.duration}ms)`);
        return session;
    }

    /**
     * Get current active session
     */
    getCurrentSession(): CodingSession | null {
        return this.currentSession;
    }

    /**
     * Get all sessions
     */
    getAllSessions(): CodingSession[] {
        return [...this.sessions];
    }

    /**
     * Get sessions for today
     */
    getTodaySessions(): CodingSession[] {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return this.sessions.filter(session => 
            session.startTime >= today
        );
    }

    /**
     * Get total coding time for today
     */
    getTodayTime(): number {
        return this.getTodaySessions()
            .reduce((total, session) => total + session.duration, 0);
    }

    /**
     * Get language breakdown for today
     */
    getTodayLanguageBreakdown(): Record<string, number> {
        const breakdown: Record<string, number> = {};
        
        this.getTodaySessions().forEach(session => {
            breakdown[session.language] = (breakdown[session.language] || 0) + session.duration;
        });
        
        return breakdown;
    }

    /**
     * Get productivity score for today
     */
    getTodayProductivityScore(): number {
        const todaySessions = this.getTodaySessions();
        if (todaySessions.length === 0) return 0;
        
        const totalScore = todaySessions.reduce((sum, session) => sum + session.productivity, 0);
        return Math.round(totalScore / todaySessions.length);
    }

    /**
     * Clear all sessions (for reset)
     */
    clearSessions(): void {
        this.sessions = [];
        this.currentSession = null;
    }
} 