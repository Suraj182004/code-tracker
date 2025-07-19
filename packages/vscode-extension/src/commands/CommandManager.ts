import * as vscode from 'vscode';
import { CodingTracker } from '../core/CodingTracker';
import { StatusBarManager } from '../ui/StatusBarManager';
import { login, logout, checkAuthStatus } from './auth';

export class CommandManager {
    private context: vscode.ExtensionContext;
    private codingTracker: CodingTracker;
    private statusBarManager: StatusBarManager;

    constructor(
        context: vscode.ExtensionContext, 
        codingTracker: CodingTracker, 
        statusBarManager: StatusBarManager
    ) {
        this.context = context;
        this.codingTracker = codingTracker;
        this.statusBarManager = statusBarManager;
    }

    /**
     * Register all extension commands
     */
    registerCommands(): void {
        // Show today's stats
        this.registerCommand('coding-habit-tracker.showStats', () => {
            this.showTodayStats();
        });

        // Toggle tracking
        this.registerCommand('coding-habit-tracker.toggleTracking', () => {
            this.toggleTracking();
        });

        // Open dashboard
        this.registerCommand('coding-habit-tracker.openDashboard', () => {
            this.openDashboard();
        });

        // Sync data
        this.registerCommand('coding-habit-tracker.syncData', () => {
            this.syncData();
        });

        // View leaderboard
        this.registerCommand('coding-habit-tracker.viewLeaderboard', () => {
            this.viewLeaderboard();
        });

        // Login
        this.registerCommand('coding-habit-tracker.login', () => {
            login();
        });

        // Logout
        this.registerCommand('coding-habit-tracker.logout', () => {
            logout();
        });

        // Check auth status
        this.registerCommand('coding-habit-tracker.checkAuth', () => {
            checkAuthStatus();
        });
    }

    /**
     * Register a single command
     */
    private registerCommand(command: string, callback: () => void): void {
        const disposable = vscode.commands.registerCommand(command, callback);
        this.context.subscriptions.push(disposable);
    }

    /**
     * Show today's coding statistics
     */
    async showTodayStats(): Promise<void> {
        try {
            const stats = await this.codingTracker.getTodayStats();
            const currentSession = this.codingTracker.getCurrentSession();
            
            // Format time durations
            const formatTime = (ms: number): string => {
                const minutes = Math.floor(ms / (1000 * 60));
                const hours = Math.floor(minutes / 60);
                const remainingMinutes = minutes % 60;
                
                if (hours > 0) {
                    return `${hours}h ${remainingMinutes}m`;
                } else {
                    return `${minutes}m`;
                }
            };

            // Build statistics message
            const lines = [
                '📊 **Today\'s Coding Statistics**',
                '',
                `⏱️  **Total Time:** ${formatTime(stats.totalTime || 0)}`,
                `📈 **Productivity Score:** ${stats.productivityScore || 0}%`,
                `📁 **Files Worked On:** ${stats.filesCount || 0}`,
                `⌨️  **Total Keystrokes:** ${stats.keystrokes || 0}`,
                ''
            ];

            // Add current session info
            if (currentSession) {
                const sessionDuration = Date.now() - currentSession.startTime.getTime();
                lines.push(
                    '🎯 **Current Session:**',
                    `   💻 Language: ${currentSession.language}`,
                    `   📁 Project: ${currentSession.projectName}`,
                    `   ⏱️  Duration: ${formatTime(sessionDuration)}`,
                    `   📊 Productivity: ${currentSession.productivity}%`,
                    ''
                );
            }

            // Add language breakdown
            if (stats.languageBreakdown && Object.keys(stats.languageBreakdown).length > 0) {
                lines.push('💻 **Languages:**');
                Object.entries(stats.languageBreakdown)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .forEach(([language, time]) => {
                        lines.push(`   ${language}: ${formatTime(time as number)}`);
                    });
                lines.push('');
            }

            // Add action buttons
            const markdown = new vscode.MarkdownString(lines.join('\n'));
            markdown.isTrusted = true;

            const selection = await vscode.window.showInformationMessage(
                'Today\'s Coding Statistics',
                { 
                    modal: false,
                    detail: lines.join('\n').replace(/\*\*/g, '')
                },
                'Open Dashboard',
                'View Details',
                'Sync Data'
            );

            // Handle user selection
            switch (selection) {
                case 'Open Dashboard':
                    this.openDashboard();
                    break;
                case 'View Details':
                    this.showDetailedStats();
                    break;
                case 'Sync Data':
                    this.syncData();
                    break;
            }

        } catch (error) {
            console.error('Error showing today stats:', error);
            vscode.window.showErrorMessage('Failed to load today\'s statistics');
        }
    }

    /**
     * Toggle coding tracking on/off
     */
    async toggleTracking(): Promise<void> {
        try {
            const isCurrentlyTracking = this.codingTracker.isTrackingEnabled();
            
            if (isCurrentlyTracking) {
                await this.codingTracker.stopTracking();
                vscode.window.showInformationMessage(
                    '⏸️ Coding tracking paused',
                    'Resume Tracking'
                ).then(selection => {
                    if (selection === 'Resume Tracking') {
                        this.codingTracker.startTracking();
                    }
                });
            } else {
                await this.codingTracker.startTracking();
                vscode.window.showInformationMessage(
                    '▶️ Coding tracking resumed',
                    'View Stats'
                ).then(selection => {
                    if (selection === 'View Stats') {
                        this.showTodayStats();
                    }
                });
            }

        } catch (error) {
            console.error('Error toggling tracking:', error);
            vscode.window.showErrorMessage('Failed to toggle tracking');
        }
    }

    /**
     * Open web dashboard
     */
    openDashboard(): void {
        const config = vscode.workspace.getConfiguration('codingHabitTracker');
        const webUrl = 'http://localhost:5173/dashboard'; // Web platform URL
        
        vscode.env.openExternal(vscode.Uri.parse(webUrl));
        
        vscode.window.showInformationMessage(
            '🌐 Opening dashboard in browser...',
            'Close'
        );
    }

    /**
     * Sync data with server
     */
    async syncData(): Promise<void> {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Syncing coding data...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Connecting to server...' });
                
                // Simulate sync process (replace with actual API call)
                await new Promise(resolve => setTimeout(resolve, 1000));
                progress.report({ increment: 50, message: 'Uploading sessions...' });
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                progress.report({ increment: 100, message: 'Sync complete!' });
            });

            vscode.window.showInformationMessage(
                '✅ Data synced successfully!',
                'View Dashboard'
            ).then(selection => {
                if (selection === 'View Dashboard') {
                    this.openDashboard();
                }
            });

        } catch (error) {
            console.error('Error syncing data:', error);
            vscode.window.showErrorMessage(
                '❌ Failed to sync data. Check your connection and try again.',
                'Retry'
            ).then(selection => {
                if (selection === 'Retry') {
                    this.syncData();
                }
            });
        }
    }

    /**
     * View leaderboard
     */
    viewLeaderboard(): void {
        const leaderboardUrl = 'http://localhost:5173/leaderboard';
        
        vscode.env.openExternal(vscode.Uri.parse(leaderboardUrl));
        
        vscode.window.showInformationMessage(
            '🏆 Opening leaderboard in browser...',
            'Close'
        );
    }

    /**
     * Show detailed statistics in a webview
     */
    private showDetailedStats(): void {
        const panel = vscode.window.createWebviewPanel(
            'codingStats',
            'Coding Statistics',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.getStatsWebviewContent();
    }

    /**
     * Generate webview content for detailed stats
     */
    private getStatsWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coding Statistics</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        .stat-card {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
        }
        .stat-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 12px;
            color: var(--vscode-textLink-foreground);
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: var(--vscode-textPreformat-foreground);
        }
        .language-bar {
            background: var(--vscode-progressBar-background);
            height: 8px;
            border-radius: 4px;
            margin: 8px 0;
            overflow: hidden;
        }
        .language-fill {
            background: var(--vscode-progressBar-background);
            height: 100%;
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <h1>📊 Detailed Coding Statistics</h1>
    
    <div class="stat-card">
        <div class="stat-title">Today's Activity</div>
        <div class="stat-value" id="todayTime">Loading...</div>
    </div>
    
    <div class="stat-card">
        <div class="stat-title">Productivity Score</div>
        <div class="stat-value" id="productivityScore">Loading...</div>
    </div>
    
    <div class="stat-card">
        <div class="stat-title">Current Session</div>
        <div id="currentSession">No active session</div>
    </div>
    
    <div class="stat-card">
        <div class="stat-title">Language Breakdown</div>
        <div id="languageBreakdown">Loading...</div>
    </div>

    <script>
        // This would be populated with real data from the extension
        document.getElementById('todayTime').textContent = '2h 45m';
        document.getElementById('productivityScore').textContent = '87%';
        document.getElementById('currentSession').innerHTML = 
            'TypeScript - 45m 23s<br>Project: coding-habit-tracker';
    </script>
</body>
</html>`;
    }

    /**
     * Get extension context
     */
    getContext(): vscode.ExtensionContext {
        return this.context;
    }

    /**
     * Dispose of the command manager
     */
    dispose(): void {
        // Commands are automatically disposed when the extension context is disposed
        console.log('🧹 CommandManager disposed');
    }
} 