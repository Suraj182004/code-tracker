import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface ProjectInfo {
    name: string;
    path: string;
    type: 'workspace' | 'folder' | 'file';
    framework?: string;
    packageManager?: string;
}

export interface GitInfo {
    branch: string;
    hasUncommittedChanges: boolean;
    remoteUrl?: string;
    lastCommit?: string;
}

export class ProjectContext {
    
    /**
     * Get project information from a file URI
     */
    getProjectInfo(uri: vscode.Uri): ProjectInfo {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        
        if (workspaceFolder) {
            return {
                name: workspaceFolder.name,
                path: workspaceFolder.uri.fsPath,
                type: 'workspace',
                framework: this.detectFramework(workspaceFolder.uri.fsPath),
                packageManager: this.detectPackageManager(workspaceFolder.uri.fsPath)
            };
        }

        // Fallback to parent directory
        const filePath = uri.fsPath;
        const directory = path.dirname(filePath);
        
        return {
            name: path.basename(directory),
            path: directory,
            type: 'folder',
            framework: this.detectFramework(directory),
            packageManager: this.detectPackageManager(directory)
        };
    }

    /**
     * Detect project framework/technology
     */
    private detectFramework(projectPath: string): string | undefined {
        try {
            // Check for package.json
            const packageJsonPath = path.join(projectPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                
                // Check dependencies for framework detection
                const dependencies = { 
                    ...packageJson.dependencies, 
                    ...packageJson.devDependencies 
                };
                
                if (dependencies.react) return 'react';
                if (dependencies.vue) return 'vue';
                if (dependencies.angular || dependencies['@angular/core']) return 'angular';
                if (dependencies.svelte) return 'svelte';
                if (dependencies.next) return 'nextjs';
                if (dependencies.nuxt) return 'nuxtjs';
                if (dependencies.gatsby) return 'gatsby';
                if (dependencies.express) return 'express';
                if (dependencies.fastify) return 'fastify';
                if (dependencies.nestjs || dependencies['@nestjs/core']) return 'nestjs';
                
                // Check for Node.js project
                if (packageJson.engines?.node || dependencies.node) return 'nodejs';
                
                return 'javascript';
            }

            // Check for Python
            if (fs.existsSync(path.join(projectPath, 'requirements.txt')) ||
                fs.existsSync(path.join(projectPath, 'setup.py')) ||
                fs.existsSync(path.join(projectPath, 'pyproject.toml'))) {
                return 'python';
            }

            // Check for Java
            if (fs.existsSync(path.join(projectPath, 'pom.xml'))) return 'maven';
            if (fs.existsSync(path.join(projectPath, 'build.gradle'))) return 'gradle';

            // Check for .NET
            if (fs.existsSync(path.join(projectPath, '*.csproj')) ||
                fs.existsSync(path.join(projectPath, '*.sln'))) {
                return 'dotnet';
            }

            // Check for Rust
            if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) return 'rust';

            // Check for Go
            if (fs.existsSync(path.join(projectPath, 'go.mod'))) return 'go';

            // Check for PHP
            if (fs.existsSync(path.join(projectPath, 'composer.json'))) return 'php';

            // Check for Ruby
            if (fs.existsSync(path.join(projectPath, 'Gemfile'))) return 'ruby';

            return undefined;
        } catch (error) {
            console.log('Error detecting framework:', error);
            return undefined;
        }
    }

    /**
     * Detect package manager
     */
    private detectPackageManager(projectPath: string): string | undefined {
        if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) return 'yarn';
        if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm';
        if (fs.existsSync(path.join(projectPath, 'package-lock.json'))) return 'npm';
        if (fs.existsSync(path.join(projectPath, 'Pipfile'))) return 'pipenv';
        if (fs.existsSync(path.join(projectPath, 'poetry.lock'))) return 'poetry';
        if (fs.existsSync(path.join(projectPath, 'composer.lock'))) return 'composer';
        if (fs.existsSync(path.join(projectPath, 'Gemfile.lock'))) return 'bundler';
        
        return undefined;
    }

    /**
     * Get Git information for a project
     */
    async getGitInfo(projectPath: string): Promise<GitInfo | null> {
        try {
            // Check if Git is available and this is a Git repository
            const gitDir = path.join(projectPath, '.git');
            if (!fs.existsSync(gitDir)) {
                return null;
            }

            // Use VS Code's Git extension API if available
            const gitExtension = vscode.extensions.getExtension('vscode.git');
            if (gitExtension && gitExtension.exports) {
                const git = gitExtension.exports.getAPI(1);
                const repo = git.repositories.find((r: any) => 
                    r.rootUri.fsPath === projectPath
                );

                if (repo) {
                    return {
                        branch: repo.state.HEAD?.name || 'unknown',
                        hasUncommittedChanges: repo.state.workingTreeChanges.length > 0 ||
                                                repo.state.indexChanges.length > 0,
                        remoteUrl: this.getRemoteUrl(repo),
                        lastCommit: repo.state.HEAD?.commit || undefined
                    };
                }
            }

            // Fallback to file-based Git info reading
            return await this.readGitInfoFromFiles(projectPath);
            
        } catch (error) {
            console.log('Error getting Git info:', error);
            return null;
        }
    }

    /**
     * Get remote URL from Git repository
     */
    private getRemoteUrl(repo: any): string | undefined {
        try {
            const remotes = repo.state.remotes;
            if (remotes && remotes.length > 0) {
                return remotes[0].fetchUrl || remotes[0].pushUrl;
            }
            return undefined;
        } catch (error) {
            return undefined;
        }
    }

    /**
     * Read Git info from .git files (fallback method)
     */
    private async readGitInfoFromFiles(projectPath: string): Promise<GitInfo | null> {
        try {
            const gitDir = path.join(projectPath, '.git');
            
            // Read HEAD file to get current branch
            let branch = 'unknown';
            const headPath = path.join(gitDir, 'HEAD');
            if (fs.existsSync(headPath)) {
                const head = fs.readFileSync(headPath, 'utf8').trim();
                if (head.startsWith('ref: refs/heads/')) {
                    branch = head.substring('ref: refs/heads/'.length);
                }
            }

            // Check for uncommitted changes (simplified)
            const indexPath = path.join(gitDir, 'index');
            const hasIndex = fs.existsSync(indexPath);
            
            // Check if there are untracked files or modifications
            // This is a simplified check - in a real implementation,
            // you'd want to run git status or use a proper Git library
            const hasUncommittedChanges = hasIndex; // Simplified assumption

            return {
                branch,
                hasUncommittedChanges,
                remoteUrl: undefined, // Would need to parse .git/config
                lastCommit: undefined  // Would need to read from refs/heads/<branch>
            };
            
        } catch (error) {
            console.log('Error reading Git files:', error);
            return null;
        }
    }

    /**
     * Get project statistics
     */
    getProjectStats(projectPath: string): {
        totalFiles: number;
        codeFiles: number;
        languages: string[];
        size: number;
    } {
        try {
            const stats = this.walkDirectory(projectPath);
            return stats;
        } catch (error) {
            console.log('Error getting project stats:', error);
            return {
                totalFiles: 0,
                codeFiles: 0,
                languages: [],
                size: 0
            };
        }
    }

    /**
     * Walk directory and collect statistics
     */
    private walkDirectory(dirPath: string): {
        totalFiles: number;
        codeFiles: number;
        languages: string[];
        size: number;
    } {
        const stats = {
            totalFiles: 0,
            codeFiles: 0,
            languages: new Set<string>(),
            size: 0
        };

        const codeExtensions = [
            '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cs', '.cpp', '.c', '.h',
            '.rs', '.go', '.php', '.rb', '.swift', '.kt', '.scala', '.html', '.css',
            '.scss', '.less', '.vue', '.svelte'
        ];

        try {
            const files = fs.readdirSync(dirPath, { withFileTypes: true });
            
            for (const file of files) {
                if (file.name.startsWith('.') || 
                    file.name === 'node_modules' || 
                    file.name === 'dist' || 
                    file.name === 'build') {
                    continue;
                }

                const filePath = path.join(dirPath, file.name);
                
                if (file.isDirectory()) {
                    const subStats = this.walkDirectory(filePath);
                    stats.totalFiles += subStats.totalFiles;
                    stats.codeFiles += subStats.codeFiles;
                    subStats.languages.forEach(lang => stats.languages.add(lang));
                    stats.size += subStats.size;
                } else {
                    stats.totalFiles++;
                    
                    try {
                        const fileStats = fs.statSync(filePath);
                        stats.size += fileStats.size;
                        
                        const ext = path.extname(file.name).toLowerCase();
                        if (codeExtensions.includes(ext)) {
                            stats.codeFiles++;
                            stats.languages.add(ext.substring(1)); // Remove the dot
                        }
                    } catch (error) {
                        // Skip files that can't be accessed
                    }
                }
            }
        } catch (error) {
            // Skip directories that can't be read
        }

        return {
            ...stats,
            languages: Array.from(stats.languages)
        };
    }
} 