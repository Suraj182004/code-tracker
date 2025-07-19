# VS Code Extension - Coding Habit Tracker

A powerful VS Code extension for tracking coding habits, monitoring productivity, and building better development practices with real-time analytics.

## 🚀 Features

### 📊 **Real-time Coding Activity Tracking**
- **Automatic session detection** when you start coding
- **Language-specific tracking** with support for 25+ programming languages
- **Project context awareness** with Git integration
- **Keystroke and line change monitoring** for detailed activity metrics
- **Idle detection** with configurable thresholds

### 🎯 **Smart Productivity Analytics**
- **Productivity scoring** based on language, activity patterns, and focus time
- **Language breakdown** showing time spent in each programming language
- **Project insights** with framework detection (React, Vue, Node.js, etc.)
- **File operation tracking** (saves, edits, creates, deletes)
- **Git integration** with branch tracking and commit context

### 💻 **Seamless VS Code Integration**
- **Status bar integration** showing real-time session data
- **Command palette integration** with quick access to all features
- **Settings integration** with full configuration options
- **Webview panels** for detailed statistics
- **Activity bar integration** with dedicated stats view

### ⚡ **Advanced Features**
- **Offline support** with local data storage
- **Cloud synchronization** with backend API integration
- **Data export/import** for backup and migration
- **Leaderboard integration** for competitive coding
- **Custom notifications** for productivity milestones

## 🛠️ Installation

### From VS Code Marketplace
*Coming soon*

### For Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/coding-habit-tracker.git
   cd coding-habit-tracker/packages/vscode-extension
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Compile the extension:**
   ```bash
   npm run compile
   ```

4. **Open in VS Code:**
   ```bash
   code .
   ```

5. **Run the extension:**
   - Press `F5` to open a new Extension Development Host window
   - The extension will be automatically loaded and activated

## 🎯 Usage

### **Getting Started**

1. **Automatic Activation**: The extension activates automatically when VS Code starts
2. **Start Coding**: Open any supported file and start coding - tracking begins automatically
3. **View Stats**: Click the status bar item or use `Ctrl+Shift+P` → "Coding Habit Tracker: Show Stats"

### **Status Bar Integration**

The status bar shows real-time information:
- **Language icon** and current programming language
- **Session duration** (e.g., "15m 32s")
- **Click** to view detailed statistics
- **Right-click** for quick actions

### **Command Palette Commands**

Access all features via `Ctrl+Shift+P`:

- `Coding Habit Tracker: Show Today's Stats` - View detailed daily statistics
- `Coding Habit Tracker: Toggle Tracking` - Enable/disable tracking
- `Coding Habit Tracker: Open Dashboard` - Open web dashboard
- `Coding Habit Tracker: Sync Data` - Sync with cloud server
- `Coding Habit Tracker: View Leaderboard` - Open competitive leaderboard

### **Configuration Options**

Configure the extension via VS Code settings:

```json
{
  "codingHabitTracker.enabled": true,
  "codingHabitTracker.syncInterval": 5,
  "codingHabitTracker.showStatusBar": true,
  "codingHabitTracker.trackFileOperations": true,
  "codingHabitTracker.trackGitOperations": true,
  "codingHabitTracker.excludePatterns": [
    "**/node_modules/**",
    "**/dist/**",
    "**/.git/**"
  ],
  "codingHabitTracker.apiEndpoint": "http://localhost:3001",
  "codingHabitTracker.enableNotifications": true,
  "codingHabitTracker.dailyGoal": 480
}
```

## 📊 Tracked Metrics

### **Session Data**
- Start/end times with duration
- Programming language and file types
- Project name and path
- Git branch and repository context
- Keystrokes and character count
- Lines added, modified, and deleted
- Productivity score (0-100)

### **Productivity Scoring**
Based on multiple factors:
- **Language productivity** (TypeScript: 90%, Python: 88%, etc.)
- **Activity level** (keystrokes per minute)
- **Focus time** (continuous coding without distractions)
- **File diversity** (working across multiple files)

### **Supported Languages**
- **Web**: TypeScript, JavaScript, React, Vue, HTML, CSS, SCSS
- **Backend**: Python, Java, C#, Node.js, PHP, Ruby
- **Systems**: C, C++, Rust, Go
- **Mobile**: Swift, Kotlin
- **Data**: SQL, JSON, YAML
- **Others**: Markdown, Shell scripts, Docker

## 🔧 Development

### **Tech Stack**
- **TypeScript** for type-safe development
- **VS Code API** for editor integration
- **Webpack** for bundling and optimization
- **Axios** for HTTP requests
- **Moment.js** for date handling

### **Architecture**

```
src/
├── extension.ts              # Main entry point
├── core/
│   ├── CodingTracker.ts     # Main tracking logic
│   ├── LanguageDetector.ts  # Language detection
│   ├── ProjectContext.ts    # Project and Git info
│   └── SessionManager.ts    # Session lifecycle
├── ui/
│   └── StatusBarManager.ts  # Status bar integration
├── commands/
│   └── CommandManager.ts    # Command handling
└── utils/
    ├── ApiClient.ts         # Backend API client
    └── StorageManager.ts    # Local data storage
```

### **Key Components**

#### **CodingTracker**
The main orchestrator that:
- Listens to VS Code file events
- Manages session lifecycle
- Calculates productivity metrics
- Handles data persistence

#### **LanguageDetector**
Detects programming languages from:
- VS Code language IDs
- File extensions
- Content analysis

#### **ProjectContext**
Extracts project information:
- Workspace detection
- Framework identification (React, Vue, etc.)
- Package manager detection
- Git repository information

#### **StatusBarManager**
Manages real-time status display:
- Live session updates
- Language-specific icons
- Click handlers for quick actions

### **Build Commands**

```bash
npm run compile        # Compile TypeScript
npm run compile-dev    # Development build
npm run watch          # Watch mode for development
npm run package        # Package extension (.vsix)
npm run lint           # ESLint checking
npm run type-check     # TypeScript type checking
```

### **Testing the Extension**

1. **Development Mode:**
   ```bash
   npm run watch
   # In VS Code: Press F5 to launch Extension Development Host
   ```

2. **Package and Install:**
   ```bash
   npm run package
   # Generates .vsix file for installation
   ```

## 🔗 Integration

### **Backend API Integration**
Syncs with Node.js backend for:
- Cross-device data synchronization
- Cloud storage and backup
- Analytics and insights
- Leaderboard functionality

```typescript
// API endpoints used:
POST /api/sessions/coding        // Upload single session
POST /api/sessions/coding/batch  // Upload multiple sessions
GET  /api/analytics             // Get analytics data
GET  /api/leaderboard           // Get leaderboard
GET  /api/user/profile          // Get user profile
```

### **Web Platform Integration**
Seamless connection with React web platform:
- **Shared authentication** via JWT tokens
- **Consistent data format** for cross-platform analytics
- **Real-time dashboard** opening from extension
- **Unified user experience** across all platforms

## 📊 Privacy & Data

### **Data Collection**
- **File paths** (project-relative, anonymized)
- **Programming languages** and file types
- **Time spent** coding with idle detection
- **Keystroke patterns** (count only, no content)
- **Project metadata** (name, framework, Git branch)

### **Data Storage**
- **Local storage** in VS Code's global state
- **Cloud sync** only with explicit user consent
- **No source code** or file content collection
- **Configurable exclusions** for sensitive projects

### **Privacy Controls**
- **Toggle tracking** on/off instantly
- **Exclude patterns** for sensitive directories
- **Local-only mode** for complete privacy
- **Data export/delete** capabilities

## 🐛 Troubleshooting

### **Common Issues**

#### **Extension Not Loading**
```bash
# Check VS Code output panel
View → Output → "Extension Host"
# Reload window
Ctrl+Shift+P → "Developer: Reload Window"
```

#### **Tracking Not Working**
- Check if tracking is enabled in settings
- Verify file type is supported
- Check exclude patterns don't match your files
- Look for errors in VS Code Developer Tools

#### **Status Bar Not Updating**
- Ensure `codingHabitTracker.showStatusBar` is `true`
- Check if you're actively editing supported files
- Restart VS Code if status bar is frozen

#### **Data Not Syncing**
- Verify API endpoint configuration
- Check network connectivity
- Look for authentication errors in output panel
- Ensure backend server is running

### **Debug Mode**
Enable debug logging:
```json
{
  "codingHabitTracker.debug": true
}
```

Check output in: `View → Output → "Coding Habit Tracker"`

### **Reset Extension Data**
```typescript
// Command Palette
"Coding Habit Tracker: Reset All Data"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### **Development Guidelines**
- Follow TypeScript best practices
- Use VS Code API conventions
- Add proper error handling
- Include JSDoc comments
- Test with multiple programming languages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **VS Code Extension API** for powerful editor integration
- **TypeScript** for type-safe development
- **VS Code team** for excellent documentation and examples
- **Developer community** for feedback and contributions

---

**Built with ❤️ for developers who want to understand their coding patterns and build better habits.**

## 📱 Connect With Other Platforms

- **🌐 Web Dashboard**: Full analytics and insights
- **🔌 Chrome Extension**: Website usage tracking
- **📊 Mobile App**: On-the-go statistics (coming soon)

---

*Happy coding! 🚀* 