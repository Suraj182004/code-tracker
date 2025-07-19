import * as vscode from 'vscode';
import * as path from 'path';

export class LanguageDetector {
    
    /**
     * Detect programming language from VS Code document
     */
    detectLanguage(document: vscode.TextDocument): string {
        // Use VS Code's language ID first
        const vscodeLanguage = document.languageId;
        if (vscodeLanguage && vscodeLanguage !== 'plaintext') {
            return this.normalizeLanguage(vscodeLanguage);
        }

        // Fallback to file extension
        const ext = path.extname(document.uri.fsPath).toLowerCase();
        return this.getLanguageFromExtension(ext);
    }

    /**
     * Normalize language ID to consistent format
     */
    private normalizeLanguage(languageId: string): string {
        const languageMap: Record<string, string> = {
            'typescript': 'typescript',
            'typescriptreact': 'react',
            'javascript': 'javascript',
            'javascriptreact': 'react',
            'python': 'python',
            'java': 'java',
            'csharp': 'csharp',
            'cpp': 'cpp',
            'c': 'c',
            'rust': 'rust',
            'go': 'go',
            'php': 'php',
            'ruby': 'ruby',
            'swift': 'swift',
            'kotlin': 'kotlin',
            'scala': 'scala',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'less': 'less',
            'sass': 'sass',
            'vue': 'vue',
            'svelte': 'svelte',
            'json': 'json',
            'yaml': 'yaml',
            'yml': 'yaml',
            'xml': 'xml',
            'markdown': 'markdown',
            'sql': 'sql',
            'shellscript': 'shell',
            'powershell': 'powershell',
            'bat': 'batch',
            'dockerfile': 'docker',
            'makefile': 'makefile',
            'gitignore': 'git',
            'gitcommit': 'git'
        };

        return languageMap[languageId.toLowerCase()] || languageId;
    }

    /**
     * Get language from file extension
     */
    private getLanguageFromExtension(extension: string): string {
        const extensionMap: Record<string, string> = {
            '.ts': 'typescript',
            '.tsx': 'react',
            '.js': 'javascript',
            '.jsx': 'react',
            '.py': 'python',
            '.java': 'java',
            '.cs': 'csharp',
            '.cpp': 'cpp',
            '.cxx': 'cpp',
            '.cc': 'cpp',
            '.c': 'c',
            '.h': 'c',
            '.hpp': 'cpp',
            '.rs': 'rust',
            '.go': 'go',
            '.php': 'php',
            '.rb': 'ruby',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.scala': 'scala',
            '.html': 'html',
            '.htm': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.sass': 'sass',
            '.less': 'less',
            '.vue': 'vue',
            '.svelte': 'svelte',
            '.json': 'json',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.xml': 'xml',
            '.md': 'markdown',
            '.markdown': 'markdown',
            '.sql': 'sql',
            '.sh': 'shell',
            '.bash': 'shell',
            '.zsh': 'shell',
            '.ps1': 'powershell',
            '.bat': 'batch',
            '.cmd': 'batch'
        };

        return extensionMap[extension] || 'other';
    }

    /**
     * Get language display name
     */
    getLanguageDisplayName(language: string): string {
        const displayNames: Record<string, string> = {
            'typescript': 'TypeScript',
            'javascript': 'JavaScript',
            'react': 'React',
            'python': 'Python',
            'java': 'Java',
            'csharp': 'C#',
            'cpp': 'C++',
            'c': 'C',
            'rust': 'Rust',
            'go': 'Go',
            'php': 'PHP',
            'ruby': 'Ruby',
            'swift': 'Swift',
            'kotlin': 'Kotlin',
            'scala': 'Scala',
            'html': 'HTML',
            'css': 'CSS',
            'scss': 'SCSS',
            'sass': 'Sass',
            'less': 'Less',
            'vue': 'Vue.js',
            'svelte': 'Svelte',
            'json': 'JSON',
            'yaml': 'YAML',
            'xml': 'XML',
            'markdown': 'Markdown',
            'sql': 'SQL',
            'shell': 'Shell Script',
            'powershell': 'PowerShell',
            'batch': 'Batch',
            'docker': 'Docker',
            'makefile': 'Makefile',
            'git': 'Git',
            'other': 'Other'
        };

        return displayNames[language] || language;
    }

    /**
     * Get language icon for UI display
     */
    getLanguageIcon(language: string): string {
        const icons: Record<string, string> = {
            'typescript': '$(code)',
            'javascript': '$(code)',
            'react': '$(react)',
            'python': '$(python)',
            'java': '$(java)',
            'csharp': '$(code)',
            'cpp': '$(code)',
            'c': '$(code)',
            'rust': '$(gear)',
            'go': '$(go)',
            'php': '$(code)',
            'ruby': '$(ruby)',
            'swift': '$(code)',
            'kotlin': '$(code)',
            'scala': '$(code)',
            'html': '$(browser)',
            'css': '$(paintcan)',
            'scss': '$(paintcan)',
            'sass': '$(paintcan)',
            'less': '$(paintcan)',
            'vue': '$(code)',
            'svelte': '$(code)',
            'json': '$(json)',
            'yaml': '$(settings-gear)',
            'xml': '$(code)',
            'markdown': '$(markdown)',
            'sql': '$(database)',
            'shell': '$(terminal)',
            'powershell': '$(terminal)',
            'batch': '$(terminal)',
            'docker': '$(package)',
            'makefile': '$(tools)',
            'git': '$(git-branch)',
            'other': '$(file-code)'
        };

        return icons[language] || '$(file-code)';
    }
} 