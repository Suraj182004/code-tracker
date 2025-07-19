import * as vscode from 'vscode';
import { CodingTracker } from '../core/CodingTracker';

export class StatusBarManager {
    private context: vscode.ExtensionContext;
    private codingTracker: CodingTracker;
    private statusBarItem: vscode.StatusBarItem;
    private updateTimer: NodeJS.Timeout | null = null;

    constructor(context: vscode.ExtensionContext, codingTracker: CodingTracker) {
        this.context = context;
        this.codingTracker = codingTracker;
        
        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, 
            100
        );
        
        this.statusBarItem.command = 'codingHabitTracker.showStats';
        this.statusBarItem.tooltip = 'Click to view coding stats';
    }

    /**
     * Register status bar and start updates
     */
    register(): void {
        this.context.subscriptions.push(this.statusBarItem);
        this.updateStatusBar();
        this.startPeriodicUpdates();
        this.statusBarItem.show();
    }

    /**
     * Update status bar content
     */
    private updateStatusBar(): void {
        const config = vscode.workspace.getConfiguration('codingHabitTracker');
        const showStatusBar = config.get('showStatusBar', true);
        
        if (!showStatusBar) {
            this.statusBarItem.hide();
            return;
        }

        const currentSession = this.codingTracker.getCurrentSession();
        
        if (!this.codingTracker.isTrackingEnabled()) {
            // Tracking disabled
            this.statusBarItem.text = '$(circle-slash) CHT: Disabled';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            this.statusBarItem.tooltip = 'Coding Habit Tracker is disabled. Click to enable.';
            this.statusBarItem.command = 'codingHabitTracker.toggleTracking';
        } else if (currentSession) {
            // Active session
            const duration = Date.now() - currentSession.startTime.getTime();
            const minutes = Math.floor(duration / (1000 * 60));
            const seconds = Math.floor((duration % (1000 * 60)) / 1000);
            
            const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
            const icon = this.getLanguageIcon(currentSession.language);
            
            this.statusBarItem.text = `${icon} ${timeStr} | ${currentSession.language}`;
            this.statusBarItem.backgroundColor = undefined;
            this.statusBarItem.tooltip = this.buildSessionTooltip(currentSession, timeStr);
            this.statusBarItem.command = 'codingHabitTracker.showStats';
        } else {
            // No active session but tracking enabled
            this.statusBarItem.text = '$(clock) CHT: Ready';
            this.statusBarItem.backgroundColor = undefined;
            this.statusBarItem.tooltip = 'Coding Habit Tracker is ready. Start coding to begin tracking.';
            this.statusBarItem.command = 'codingHabitTracker.showStats';
        }

        this.statusBarItem.show();
    }

    /**
     * Build tooltip for active session
     */
    private buildSessionTooltip(session: any, timeStr: string): string {
        const lines = [
            `🎯 Coding Session Active`,
            `⏱️  Duration: ${timeStr}`,
            `💻 Language: ${session.language}`,
            `📁 Project: ${session.projectName}`,
            `📊 Productivity: ${session.productivity}%`,
            `⌨️  Keystrokes: ${session.keystrokes}`,
            `📄 Files: ${session.files.length}`,
            ``,
            `Click for detailed stats`
        ];
        
        if (session.gitBranch) {
            lines.splice(5, 0, `🌿 Branch: ${session.gitBranch}`);
        }
        
        return lines.join('\n');
    }

    /**
     * Get icon for programming language
     */
    private getLanguageIcon(language: string): string {
        const icons: Record<string, string> = {
            'typescript': '$(code)',
            'javascript': '$(code)',
            'react': '$(react)',
            'python': '$(symbol-snake)',
            'java': '$(coffee)',
            'csharp': '$(code)',
            'cpp': '$(gear)',
            'c': '$(gear)',
            'rust': '$(settings-gear)',
            'go': '$(go-to-file)',
            'php': '$(code)',
            'ruby': '$(ruby)',
            'swift': '$(code)',
            'html': '$(browser)',
            'css': '$(paintcan)',
            'scss': '$(paintcan)',
            'vue': '$(code)',
            'svelte': '$(code)',
            'json': '$(json)',
            'yaml': '$(settings-gear)',
            'markdown': '$(markdown)',
            'sql': '$(database)',
            'shell': '$(terminal)',
            'other': '$(file-code)'
        };
        
        return icons[language.toLowerCase()] || '$(file-code)';
    }

    /**
     * Start periodic status bar updates
     */
    private startPeriodicUpdates(): void {
        // Update every 5 seconds
        this.updateTimer = setInterval(() => {
            this.updateStatusBar();
        }, 5000);
        
        this.context.subscriptions.push({
            dispose: () => {
                if (this.updateTimer) {
                    clearInterval(this.updateTimer);
                }
            }
        });
    }

    /**
     * Handle configuration changes
     */
    onConfigurationChanged(): void {
        this.updateStatusBar();
    }

    /**
     * Show daily summary in status bar temporarily
     */
    async showDailySummary(): Promise<void> {
        try {
            const stats = await this.codingTracker.getTodayStats();
            const totalMinutes = Math.floor(stats.totalTime / (1000 * 60));
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            
            let timeStr = '';
            if (hours > 0) {
                timeStr = `${hours}h ${minutes}m`;
            } else {
                timeStr = `${minutes}m`;
            }
            
            const originalText = this.statusBarItem.text;
            this.statusBarItem.text = `$(graph) Today: ${timeStr}`;
            
            // Revert after 3 seconds
            setTimeout(() => {
                this.updateStatusBar();
            }, 3000);
            
        } catch (error) {
            console.error('Error showing daily summary:', error);
        }
    }

    /**
     * Show productivity score temporarily
     */
    async showProductivityScore(): Promise<void> {
        try {
            const currentSession = this.codingTracker.getCurrentSession();
            if (!currentSession) return;
            
            const originalText = this.statusBarItem.text;
            this.statusBarItem.text = `$(pulse) Score: ${currentSession.productivity}%`;
            
            // Revert after 2 seconds
            setTimeout(() => {
                this.updateStatusBar();
            }, 2000);
            
        } catch (error) {
            console.error('Error showing productivity score:', error);
        }
    }

    /**
     * Dispose status bar item
     */
    dispose(): void {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        this.statusBarItem.dispose();
    }
} 