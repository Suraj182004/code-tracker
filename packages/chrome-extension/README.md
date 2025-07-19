# Chrome Extension - Coding Habit Tracker

A powerful Chrome extension for tracking website usage and boosting productivity with real-time analytics and insights.

## 🚀 Features

### 📊 **Real-time Website Tracking**
- **Automatic domain detection** with smart categorization
- **Active tab monitoring** with idle time detection
- **Session management** with productivity scoring
- **Background processing** with Manifest V3 service worker

### 🎯 **Smart Categorization**
- **100+ pre-configured sites** (GitHub, Stack Overflow, Netflix, etc.)
- **AI-powered pattern matching** for new domains
- **Custom category assignment** with learning capability
- **Productivity scoring** based on website categories

### 💻 **Beautiful Developer-Focused UI**
- **Developer's Sanctuary theme** with dark aesthetics
- **Real-time popup interface** with live session data
- **Category breakdown** with visual progress bars
- **Top domains tracking** with time analytics

### ⚡ **Advanced Features**
- **Idle detection** (customizable threshold)
- **Focus mode** for distraction-free work
- **Data synchronization** with backend API
- **Offline support** with local storage
- **Productivity notifications** and alerts

## 🛠️ Installation

### For Development

1. **Install Dependencies:**
   ```bash
   cd packages/chrome-extension
   npm install
   ```

2. **Build Extension:**
   ```bash
   npm run build
   ```

3. **Load in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked" and select the `dist` folder

### For Production
*Coming soon on Chrome Web Store*

## 🎯 Usage

### **Getting Started**
1. Install the extension following the steps above
2. Click the extension icon in the Chrome toolbar
3. Grant necessary permissions when prompted
4. Start browsing - tracking begins automatically!

### **Popup Interface**
- **Current Session**: View active domain and productivity score
- **Today's Stats**: Total time, productive time, and category breakdown
- **Top Domains**: Most visited sites with time spent
- **Quick Actions**: Focus mode, analytics, and sync controls

### **Settings & Configuration**
- Click the settings icon in popup or right-click extension icon → Options
- Configure tracking preferences, idle thresholds, and notifications
- Set daily productivity goals and sync intervals

## 📋 Permissions Required

```json
{
  "permissions": [
    "storage",      // Local data storage
    "activeTab",    // Current tab information
    "tabs",         // Tab change detection
    "background",   // Background processing
    "idle",         // Idle state detection
    "alarms"        // Periodic sync scheduling
  ],
  "host_permissions": [
    "https://*/*"  // Website access for tracking
  ]
}
```

## 🏗️ Architecture

### **Core Components**

#### **Background Service Worker** (`background.js`)
- **Tab monitoring** and session management
- **Data storage** and sync coordination
- **Idle detection** and productivity scoring
- **API communication** with backend server

#### **Content Scripts** (`content.js`)
- **User activity detection** on web pages
- **Coding environment recognition** (VS Code Online, CodePen, etc.)
- **SPA navigation tracking** for React/Vue apps
- **Productivity tool integration** (Notion, Google Docs, etc.)

#### **Popup Interface** (`popup.html/js`)
- **Real-time session display** with live updates
- **Interactive productivity dashboard**
- **Quick action buttons** and settings access
- **Authentication status** and sync controls

#### **Options Page** (`options.html/js`)
- **Extension settings** configuration
- **Custom category management**
- **Sync preferences** and notification settings
- **Privacy and data controls**

### **Data Flow**
1. **Content scripts** detect user activity on web pages
2. **Background worker** processes activity and categorizes domains
3. **Local storage** saves session data with sync queue
4. **Popup interface** displays real-time stats and controls
5. **API client** syncs data with backend server periodically

## 🔧 Development

### **Tech Stack**
- **TypeScript** for type-safe development
- **Webpack** for bundling and optimization  
- **Tailwind CSS** with custom Developer's Sanctuary theme
- **Chrome APIs** for extension functionality
- **Manifest V3** for modern Chrome extension standards

### **Build Commands**
```bash
npm run dev          # Development build with watch mode
npm run build        # Production build
npm run clean        # Clean dist folder
npm run type-check   # TypeScript type checking
npm run lint         # ESLint code linting
npm run lint:fix     # Auto-fix ESLint issues
```

### **Project Structure**
```
src/
├── background/
│   ├── background.ts       # Main service worker
│   ├── websiteTracker.ts   # Domain extraction logic
│   └── timeTracker.ts      # Session timing
├── content/
│   └── content.ts          # Page activity detection
├── popup/
│   ├── popup.html          # Popup interface
│   ├── popup.ts           # Popup logic
│   └── popup.css          # Popup styles
├── options/
│   ├── options.html        # Settings page
│   ├── options.ts         # Settings logic
│   └── options.css        # Settings styles
└── utils/
    ├── storage.ts          # Storage management
    ├── categories.ts       # Website categorization
    └── api.ts             # Backend API client
```

### **Adding New Categories**
```typescript
// In src/utils/categories.ts
const customDomains = {
  'your-domain.com': 'your-category'
};

// Or use pattern matching
const patterns = {
  'your-category': [/your-pattern/]
};
```

## 🔗 Integration

### **Backend API Integration**
The extension syncs with a Node.js backend API:

```typescript
// Configure API endpoint
const API_BASE_URL = 'http://localhost:3001';

// Authentication with JWT tokens
await apiClient.authenticateUser(email, password);

// Upload session data
await apiClient.uploadSessions(sessions, authToken);
```

### **Web Platform Integration**
Seamlessly connects with the React web platform:
- **Shared authentication** via JWT tokens
- **Real-time data sync** for dashboard analytics
- **Cross-device tracking** with cloud storage
- **Consistent UI theme** with Developer's Sanctuary design

## 📊 Privacy & Data

### **Data Collection**
- **Domain names** of visited websites (no URLs or page content)
- **Time spent** on each domain with activity detection
- **Category classifications** and productivity scores
- **User preferences** and extension settings

### **Data Storage**
- **Local storage** in Chrome extension storage API
- **Cloud sync** only with explicit user authentication
- **No sensitive data** collection (passwords, personal info, etc.)
- **User control** over data retention and deletion

### **Privacy Controls**
- **Tracking toggle** to pause/resume monitoring
- **Domain exclusions** for private browsing
- **Data export** and deletion capabilities
- **Offline mode** for complete privacy

## 🐛 Troubleshooting

### **Common Issues**

#### **Extension Not Loading**
```bash
# Check for build errors
npm run build
# Verify dist folder has manifest.json
ls dist/
```

#### **Permissions Issues**
- Reload extension in `chrome://extensions/`
- Check that all required permissions are granted
- Verify host permissions for `https://*/*`

#### **Data Not Syncing**
- Check internet connection and API endpoint
- Verify authentication token in extension storage
- Check browser console for API errors

#### **Performance Issues**
- Reduce sync interval in settings
- Clear old session data periodically
- Check for excessive idle detection sensitivity

### **Debug Mode**
Enable debug logging:
```bash
# Development build with debug logs
NODE_ENV=development npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Chrome Extension APIs** for powerful browser integration
- **Tailwind CSS** for rapid UI development
- **TypeScript** for type-safe JavaScript development
- **Developer community** for feedback and contributions

---

**Built with ❤️ for developers who want to optimize their productivity and build better coding habits.** 