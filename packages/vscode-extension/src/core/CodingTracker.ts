import * as vscode from 'vscode';
import * as path from 'path';
import { SessionManager } from './SessionManager';
import { LanguageDetector } from './LanguageDetector';
import { ProjectContext } from './ProjectContext';
import { ApiClient } from '../utils/ApiClient';
import { StorageManager } from '../utils/StorageManager';

export interface CodingSession {
    id: string;
    startTime: Date;
    endTime?: Date;
    duration: number;
    language: string;
    files: string[];
    linesAdded: number;
    linesDeleted: number;
    linesModified: number;
    projectName: string;
    projectPath: string;
    gitBranch?: string;
    gitCommits: number;
    keystrokes: number;
    productivity: number;
}

export class CodingTracker {
    private context: vscode.ExtensionContext;
    private sessionManager: SessionManager;
    private languageDetector: LanguageDetector;
    private projectContext: ProjectContext;
    private apiClient: ApiClient;
    private storageManager: StorageManager;
    
    private isTracking = false;
    private currentSession: CodingSession | null = null;
    private activityTimer: NodeJS.Timeout | null = null;
    private lastActivityTime = Date.now();
    private keystrokeCount = 0;
    private activeFile: string | null = null;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.sessionManager = new SessionManager();
        this.languageDetector = new LanguageDetector();
        this.projectContext = new ProjectContext();
        this.apiClient = new ApiClient();
        this.storageManager = new StorageManager(context);
    }

    /**
     * Start tracking coding activity
     */
    async startTracking(): Promise<void> {
        if (this.isTracking) return;

        console.log('🎯 Starting coding activity tracking...');
        
        // Check authentication status
        const isAuth = await this.isAuthenticated();
        if (isAuth) {
            console.log('✅ User is authenticated - sessions will be synced to server');
        } else {
            console.log('⚠️ User not authenticated - sessions will be saved locally only');
        }
        
        this.isTracking = true;
        
        // Start new session if we have an active editor
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            await this.startNewSession(activeEditor.document);
        }

        // Start activity monitoring
        this.startActivityMonitoring();
        
        console.log('✅ Coding tracking started successfully');
    }

    /**
     * Stop tracking and save current session
     */
    async stopTracking(): Promise<void> {
        if (!this.isTracking) return;

        console.log('🛑 Stopping coding activity tracking...');
        this.isTracking = false;

        // End current session
        if (this.currentSession) {
            await this.endCurrentSession();
        }

        // Clear timers
        if (this.activityTimer) {
            clearInterval(this.activityTimer);
            this.activityTimer = null;
        }

        console.log('✅ Coding tracking stopped');
    }

    /**
     * Handle file save events
     */
    async onFileSaved(document: vscode.TextDocument): Promise<void> {
        if (!this.isTracking || !this.shouldTrackFile(document.uri.fsPath)) {
            return;
        }

        console.log(`📝 File saved: ${path.basename(document.uri.fsPath)}`);
        
        // Update activity
        this.updateActivity();
        
        // Ensure we have an active session
        if (!this.currentSession) {
            await this.startNewSession(document);
            return;
        }

        // Update session with file save
        const filePath = document.uri.fsPath;
        if (!this.currentSession.files.includes(filePath)) {
            this.currentSession.files.push(filePath);
        }

        // Calculate lines changed (simplified for now)
        this.currentSession.linesModified += document.lineCount;
        
        // Update productivity score
        this.updateProductivityScore();
        
        console.log(`💾 Session updated - Files: ${this.currentSession.files.length}, Lines: ${this.currentSession.linesModified}`);
    }

    /**
     * Handle text change events
     */
    onTextChanged(event: vscode.TextDocumentChangeEvent): void {
        if (!this.isTracking || !this.shouldTrackFile(event.document.uri.fsPath)) {
            return;
        }

        // Update activity and keystroke count
        this.updateActivity();
        this.keystrokeCount += event.contentChanges.reduce((sum, change) => sum + change.text.length, 0);

        // Update current session if exists
        if (this.currentSession) {
            this.currentSession.keystrokes = this.keystrokeCount;
            
            // Calculate line changes
            event.contentChanges.forEach(change => {
                const newLines = change.text.split('\n').length - 1;
                const deletedLines = change.rangeLength > 0 ? change.range.end.line - change.range.start.line : 0;
                
                if (change.text.length > 0) {
                    this.currentSession!.linesAdded += newLines;
                }
                if (deletedLines > 0) {
                    this.currentSession!.linesDeleted += deletedLines;
                }
            });
        }
    }

    /**
     * Handle active editor changes
     */
    async onActiveEditorChanged(editor: vscode.TextEditor | undefined): Promise<void> {
        if (!this.isTracking) return;

        if (editor && this.shouldTrackFile(editor.document.uri.fsPath)) {
            console.log(`📂 Active editor changed: ${path.basename(editor.document.uri.fsPath)}`);
            
            this.activeFile = editor.document.uri.fsPath;
            this.updateActivity();

            // Start new session if language or project changed significantly
            const newLanguage = this.languageDetector.detectLanguage(editor.document);
            const newProject = this.projectContext.getProjectInfo(editor.document.uri);

            if (!this.currentSession || 
                this.currentSession.language !== newLanguage ||
                this.currentSession.projectPath !== newProject.path) {
                
                // End current session
                if (this.currentSession) {
                    await this.endCurrentSession();
                }
                
                // Start new session
                await this.startNewSession(editor.document);
            }
        }
    }

    /**
     * Start a new coding session
     */
    private async startNewSession(document: vscode.TextDocument): Promise<void> {
        const language = this.languageDetector.detectLanguage(document);
        const projectInfo = this.projectContext.getProjectInfo(document.uri);
        const gitInfo = await this.projectContext.getGitInfo(projectInfo.path);

        this.currentSession = {
            id: this.generateSessionId(),
            startTime: new Date(),
            duration: 0,
            language,
            files: [document.uri.fsPath],
            linesAdded: 0,
            linesDeleted: 0,
            linesModified: 0,
            projectName: projectInfo.name,
            projectPath: projectInfo.path,
            gitBranch: gitInfo?.branch,
            gitCommits: 0,
            keystrokes: 0,
            productivity: 100
        };

        this.keystrokeCount = 0;
        this.lastActivityTime = Date.now();

        console.log(`🚀 New coding session started: ${language} in ${projectInfo.name}`);
    }

    /**
     * End current coding session and save it
     */
    private async endCurrentSession(): Promise<void> {
        if (!this.currentSession) return;

        // Calculate final duration
        this.currentSession.endTime = new Date();
        this.currentSession.duration = this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime();

        // Final productivity calculation
        this.updateProductivityScore();

        console.log(`⏹️ Session ended: ${Math.round(this.currentSession.duration / 1000)}s, ` +
                   `${this.currentSession.files.length} files, ` +
                   `${this.currentSession.keystrokes} keystrokes`);

        // Save session locally
        await this.storageManager.saveSession(this.currentSession);

        // Check if user is authenticated before trying to sync
        const isAuth = await this.isAuthenticated();
        if (!isAuth) {
            console.log('🔒 User not authenticated, skipping session upload. Please login using the "Login" command.');
            vscode.window.showWarningMessage('Please login to sync your coding sessions.', 'Login').then(selection => {
                if (selection === 'Login') {
                    vscode.commands.executeCommand('coding-habit-tracker.login');
                }
            });
            this.currentSession = null;
            return;
        }

        // Try to sync with server
        try {
            console.log('📡 Attempting to upload session to server...');
            const success = await this.apiClient.uploadCodingSession(this.currentSession);
            if (success) {
                console.log('✅ Session uploaded successfully!');
            } else {
                console.log('❌ Session upload failed, saved locally for retry.');
            }
        } catch (error) {
            console.log('📡 Failed to sync session, will retry later:', error);
            vscode.window.showErrorMessage('Failed to sync coding session. Please check your connection and authentication.');
        }

        this.currentSession = null;
    }

    /**
     * Update activity timestamp
     */
    private updateActivity(): void {
        this.lastActivityTime = Date.now();
    }

    /**
     * Start activity monitoring timer
     */
    private startActivityMonitoring(): void {
        // Check for inactivity every 30 seconds
        this.activityTimer = setInterval(() => {
            const inactiveTime = Date.now() - this.lastActivityTime;
            const maxInactiveTime = 5 * 60 * 1000; // 5 minutes

            if (inactiveTime > maxInactiveTime && this.currentSession) {
                console.log('😴 Detected inactivity, ending session');
                this.endCurrentSession();
            }
        }, 30000);
    }

    /**
     * Update productivity score based on activity patterns
     */
    private updateProductivityScore(): void {
        if (!this.currentSession) return;

        const duration = Date.now() - this.currentSession.startTime.getTime();
        const durationMinutes = duration / (1000 * 60);
        
        // Base score from language productivity
        const languageProductivity = this.getLanguageProductivity(this.currentSession.language);
        
        // Activity factor (keystrokes per minute)
        const activityFactor = Math.min(this.currentSession.keystrokes / Math.max(durationMinutes, 1) / 100, 1);
        
        // File diversity factor
        const diversityFactor = Math.min(this.currentSession.files.length / 5, 1);
        
        // Calculate final score
        this.currentSession.productivity = Math.round(
            languageProductivity * 0.5 + 
            activityFactor * 30 + 
            diversityFactor * 20
        );
    }

    /**
     * Get productivity rating for programming language
     */
    private getLanguageProductivity(language: string): number {
        const ratings: Record<string, number> = {
            'typescript': 90,
            'javascript': 85,
            'python': 88,
            'java': 82,
            'csharp': 85,
            'cpp': 80,
            'rust': 92,
            'go': 88,
            'react': 87,
            'vue': 85,
            'html': 70,
            'css': 68,
            'scss': 72,
            'json': 60,
            'yaml': 65,
            'markdown': 75,
            'other': 70
        };
        
        return ratings[language.toLowerCase()] || 70;
    }

    /**
     * Check if file should be tracked
     */
    private shouldTrackFile(filePath: string): boolean {
        const config = vscode.workspace.getConfiguration('codingHabitTracker');
        const excludePatterns = config.get<string[]>('excludePatterns', []);
        
        // Check exclude patterns
        for (const pattern of excludePatterns) {
            if (filePath.includes(pattern.replace(/\*\*/g, '').replace(/\*/g, ''))) {
                return false;
            }
        }

        // Only track files with known extensions
        const ext = path.extname(filePath).toLowerCase();
        const trackableExtensions = [
            '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cs', '.cpp', '.c', '.h',
            '.rs', '.go', '.php', '.rb', '.swift', '.kt', '.scala', '.html', '.css',
            '.scss', '.less', '.vue', '.svelte', '.md', '.json', '.yaml', '.yml',
            '.xml', '.sql', '.sh', '.ps1', '.bat'
        ];

        return trackableExtensions.includes(ext);
    }

    /**
     * Generate unique session ID
     */
    private generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get current session info
     */
    getCurrentSession(): CodingSession | null {
        return this.currentSession;
    }

    /**
     * Get today's statistics
     */
    async getTodayStats(): Promise<any> {
        return await this.storageManager.getTodayStats();
    }

    /**
     * Check if tracking is enabled
     */
    isTrackingEnabled(): boolean {
        return this.isTracking;
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated(): Promise<boolean> {
        const config = vscode.workspace.getConfiguration('codingHabitTracker');
        const token = await config.get('authToken');
        return !!token;
    }

    /**
     * Get extension context
     */
    getContext(): vscode.ExtensionContext {
        return this.context;
    }
} 