import axios, { AxiosInstance } from 'axios';
import * as vscode from 'vscode';
import { CodingSession } from '../core/CodingTracker';

export class ApiClient {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor() {
        const config = vscode.workspace.getConfiguration('codingHabitTracker');
        this.baseUrl = config.get('apiEndpoint', 'http://localhost:3001');
        
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'VSCode-CodingHabitTracker/1.0.0'
            }
        });

        // Add request interceptor for authentication
        this.client.interceptors.request.use(
            async (config) => {
                const token = await this.getAuthToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                console.error('API Error:', error.response?.data || error.message);
                
                if (error.response?.status === 401) {
                    // Handle unauthorized - clear token
                    this.clearAuthToken();
                    vscode.window.showWarningMessage(
                        'Authentication expired. Please sign in again.',
                        'Sign In'
                    ).then(selection => {
                        if (selection === 'Sign In') {
                            vscode.env.openExternal(vscode.Uri.parse(`${this.baseUrl}/login`));
                        }
                    });
                }
                
                return Promise.reject(error);
            }
        );
    }

    async login(email: string, password: string): Promise<any> {
        try {
            const response = await this.client.post('/api/auth/login', { email, password });
            return response.data;
        } catch (error) {
            console.error('Failed to login:', error);
            return null;
        }
    }

    /**
     * Upload coding session to server
     */
    async uploadCodingSession(session: CodingSession): Promise<boolean> {
        try {
            const response = await this.client.post('/api/tracking/sync', session);
            return response.status === 200 || response.status === 201;
            
        } catch (error) {
            console.error('Failed to upload coding session:', error);
            return false;
        }
    }

    /**
     * Upload multiple sessions in batch
     */
    async uploadBatchSessions(sessions: CodingSession[]): Promise<boolean> {
        try {
            const sessionsData = sessions.map(session => ({
                id: session.id,
                startTime: session.startTime.toISOString(),
                endTime: session.endTime?.toISOString(),
                duration: session.duration,
                language: session.language,
                files: session.files,
                linesAdded: session.linesAdded,
                linesDeleted: session.linesDeleted,
                linesModified: session.linesModified,
                projectName: session.projectName,
                projectPath: session.projectPath,
                gitBranch: session.gitBranch,
                gitCommits: session.gitCommits,
                keystrokes: session.keystrokes,
                productivity: session.productivity,
                source: 'vscode-extension'
            }));

            const response = await this.client.post('/api/sessions/coding/batch', {
                sessions: sessionsData
            });
            
            return response.status === 200 || response.status === 201;
            
        } catch (error) {
            console.error('Failed to upload batch sessions:', error);
            return false;
        }
    }

    /**
     * Get user analytics data
     */
    async getAnalytics(startDate: Date, endDate: Date): Promise<any> {
        try {
            const response = await this.client.get('/api/analytics', {
                params: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    source: 'vscode-extension'
                }
            });

            return response.data;
            
        } catch (error) {
            console.error('Failed to get analytics:', error);
            return null;
        }
    }

    /**
     * Get leaderboard data
     */
    async getLeaderboard(timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<any> {
        try {
            const response = await this.client.get('/api/leaderboard', {
                params: { timeframe }
            });

            return response.data;
            
        } catch (error) {
            console.error('Failed to get leaderboard:', error);
            return null;
        }
    }

    /**
     * Get user profile
     */
    async getUserProfile(): Promise<any> {
        try {
            const response = await this.client.get('/api/user/profile');
            return response.data;
            
        } catch (error) {
            console.error('Failed to get user profile:', error);
            return null;
        }
    }

    /**
     * Check server health
     */
    async checkHealth(): Promise<boolean> {
        try {
            const response = await this.client.get('/health');
            return response.status === 200;
            
        } catch (error) {
            return false;
        }
    }

    /**
     * Test API connection
     */
    async testConnection(): Promise<boolean> {
        try {
            const response = await this.client.get('/api/ping');
            return response.status === 200;
            
        } catch (error) {
            console.error('API connection test failed:', error);
            return false;
        }
    }

    /**
     * Get auth token from VS Code secrets or configuration
     */
    private async getAuthToken(): Promise<string | undefined> {
        const config = vscode.workspace.getConfiguration('codingHabitTracker');
        return await config.get('authToken');
    }

    /**
     * Clear auth token
     */
    private async clearAuthToken(): Promise<void> {
        await vscode.workspace.getConfiguration('codingHabitTracker').update('authToken', undefined, vscode.ConfigurationTarget.Global);
        console.log('Auth token cleared');
    }

    /**
     * Update API endpoint configuration
     */
    updateBaseUrl(newBaseUrl: string): void {
        this.baseUrl = newBaseUrl;
        this.client.defaults.baseURL = newBaseUrl;
    }

    /**
     * Get current API endpoint
     */
    getBaseUrl(): string {
        return this.baseUrl;
    }
} 