import * as vscode from 'vscode';
import { CodingTracker } from './core/CodingTracker';
import { CommandManager } from './commands/CommandManager';
import { StatusBarManager } from './ui/StatusBarManager';

let codingTracker: CodingTracker;
let statusBarManager: StatusBarManager;
let commandManager: CommandManager;

export async function activate(context: vscode.ExtensionContext) {
    console.log('🚀 Coding Habit Tracker extension is activating...');

    try {
        // Initialize core components
        codingTracker = new CodingTracker(context);
        statusBarManager = new StatusBarManager(context, codingTracker);
        commandManager = new CommandManager(context, codingTracker, statusBarManager);
        
        // Register components
        await registerComponents(context);
        
        // Start tracking if enabled and workspace is available
        const config = vscode.workspace.getConfiguration('codingHabitTracker');
        if (config.get('enabled', true)) {
            // Only start tracking if we have an active editor or workspace
            const activeEditor = vscode.window.activeTextEditor;
            const hasWorkspace = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0;
            
            if (activeEditor || hasWorkspace) {
                await codingTracker.startTracking();
            } else {
                console.log('⏳ Waiting for workspace or file to be opened...');
            }
        }
        
        console.log('✅ Coding Habit Tracker activated successfully!');
        
    } catch (error) {
        console.error('❌ Error activating extension:', error);
    }
}

export async function deactivate() {
    console.log('🛑 Deactivating Coding Habit Tracker...');
    
    try {
        if (codingTracker) {
            await codingTracker.stopTracking();
        }
        
        if (statusBarManager) {
            statusBarManager.dispose();
        }
        
        if (commandManager) {
            commandManager.dispose();
        }
    } catch (error) {
        console.error('❌ Error during deactivation:', error);
    }
}

async function registerComponents(context: vscode.ExtensionContext) {
    // Register status bar
    statusBarManager.register();
    
    // Register commands
    commandManager.registerCommands();
    
    // Register file system listeners
    registerFileListeners(context);
}

function registerFileListeners(context: vscode.ExtensionContext) {
    // Text document events
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(document => {
            codingTracker.onFileSaved(document);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            codingTracker.onTextChanged(event);
        })
    );

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            codingTracker.onActiveEditorChanged(editor);
        })
    );
} 