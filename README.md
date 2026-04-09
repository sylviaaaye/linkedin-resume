# US Resume Personal Assistant

A Chrome extension designed specifically for F1 OPT international students targeting AI Product Manager roles in the US job market. Provides personalized resume analysis, job targeting, and application optimization.

## 🎯 Features

### **P0: Resume Analysis MVP**
- **AI-Powered Analysis**: Uses Claude API to analyze resumes with focus on AI Product Manager roles
- **International Student Focus**: Specialized analysis for F1 OPT students needing H1B sponsorship
- **ATS Compatibility Check**: Evaluates resume formatting for applicant tracking systems
- **Personalized Recommendations**: Actionable suggestions for improvement

### **P1: LinkedIn Integration** (Coming Soon)
- **AI PM Job Monitoring**: Tracks LinkedIn for AI Product Manager positions
- **Sponsor-Friendly Filtering**: Identifies companies with H1B sponsorship history
- **24/7 Monitoring**: Real-time job alerts for new postings

### **P2: Application Automation** (Coming Soon)
- **Smart Form Filling**: Auto-fills job application forms
- **Cover Letter Generation**: AI-generated personalized cover letters
- **Application Tracking**: Monitors application status and follow-ups

## 🚀 Quick Start

### **1. Installation**
```bash
# Clone or download the extension
cd /path/to/extension

# Load in Chrome:
# 1. Open Chrome and go to chrome://extensions/
# 2. Enable "Developer mode" (top right)
# 3. Click "Load unpacked"
# 4. Select the extension folder
```

### **2. Configuration**
1. **Get Claude API Key**:
   - Visit https://console.anthropic.com/
   - Create account and generate API key
   - Copy the key (starts with `sk-ant-`)

2. **Configure Extension**:
   - Click the extension icon
   - Go to Settings tab
   - Paste your Claude API key
   - Save preferences

### **3. First Analysis**
1. Go to Resume Analysis tab
2. Paste your resume text (Chinese or English)
3. Click "Analyze Resume"
4. Review detailed analysis and recommendations

## 📁 Project Structure

```
us-resume-personal-assistant/
├── manifest.json              # Extension configuration
├── popup/                    # User interface
│   ├── index.html           # Main popup HTML
│   └── app.js               # Frontend logic
├── background/              # Background services
│   └── service-worker.js    # Background processing
├── resume-analyzer/         # Core analysis engine
│   ├── analyzer.js          # Resume analysis logic
│   └── claude-client.js     # Claude API integration
├── linkedin-monitor/        # LinkedIn integration (P1)
│   └── job-scraper.js       # Job monitoring
├── sponsor-database/        # Sponsor data (P1)
│   └── company-analyzer.js  # Company analysis
└── README.md               # This file
```

## 🔧 Development

### **Prerequisites**
- Chrome browser (for testing)
- Claude API account (for AI analysis)
- Basic JavaScript knowledge

### **Local Development**
```bash
# 1. Clone the repository
git clone <repository-url>

# 2. Make changes to files
# 3. Reload extension in Chrome:
#    - Go to chrome://extensions/
#    - Find the extension
#    - Click the refresh icon

# 4. Test changes
#    - Click extension icon
#    - Test resume analysis
```

### **File Descriptions**

#### **manifest.json**
- Extension metadata and permissions
- Defines popup, content scripts, and background service
- Sets required host permissions (LinkedIn, Claude API)

#### **popup/index.html**
- Main user interface
- Three tabs: Resume Analysis, Settings, Results
- Responsive design with gradient background

#### **popup/app.js**
- Frontend application logic
- Handles user interactions
- Manages API calls and data display
- Implements tab switching and state management

#### **background/service-worker.js**
- Background processing
- API key validation
- Data storage management
- Periodic cleanup tasks

#### **resume-analyzer/analyzer.js**
- Core resume analysis engine
- Claude API integration
- ATS compatibility checking
- International student optimization logic

## 🎨 UI Components

### **Resume Analysis Tab**
- Text area for resume input
- "Load Example" button (pre-populates with sample resume)
- "Analyze Resume" button (triggers Claude API analysis)
- Loading indicator and status messages

### **Settings Tab**
- Claude API key configuration
- Analysis preferences:
  - F1 OPT focus
  - AI Product Manager optimization
  - Sponsor-friendly company analysis

### **Results Tab**
- Overall score and ATS compatibility
- Key strengths and critical improvements
- AI PM optimization assessment
- International student strategy
- Personalized recommendations
- Export functionality

## 🔌 API Integration

### **Claude API**
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Model**: `claude-3-5-sonnet-20241022`
- **Authentication**: API key in request header
- **Rate Limits**: Depends on your Claude plan

### **Data Flow**
```
User Input → Frontend → Background Service → Claude API → Analysis → Display
```

### **Storage**
- **Chrome Storage API**: Local storage for API keys and preferences
- **Data Privacy**: All data stored locally, never sent to external servers
- **Encryption**: API keys stored securely

## 📊 Analysis Framework

### **1. Structural Analysis**
- Format and readability scoring
- ATS compatibility assessment
- Section organization evaluation

### **2. Content Analysis (AI PM Focus)**
- RAG/LLM experience highlighting
- Technical depth assessment
- Product management skills evaluation
- Quantifiable achievements identification

### **3. International Student Strategy**
- F1 OPT timeline optimization
- Sponsor-friendly company targeting
- Visa status handling strategies
- Cultural adaptation advice

### **4. Personalized Recommendations**
- Top 3 immediate improvements
- Skill gap analysis
- Company targeting strategy
- Interview preparation focus

## 🚧 Roadmap

### **P0 (Current) - Resume Analysis MVP**
- ✅ Basic UI with three tabs
- ✅ Claude API integration
- ✅ Resume analysis with AI PM focus
- ✅ International student optimization
- ✅ Results display and export

### **P1 (Next) - LinkedIn Integration**
- LinkedIn job monitoring
- Sponsor database integration
- Real-time job alerts
- Company research tools

### **P2 (Future) - Application Automation**
- Smart form filling
- Cover letter generation
- Application tracking
- Interview preparation

### **P3 (Future) - Advanced Features**
- Multi-resume management
- A/B testing for resume versions
- Networking tools
- Salary negotiation guidance

## ⚠️ Limitations & Known Issues

### **Current Limitations**
1. **PDF Upload**: Currently supports text input only (PDF support planned)
2. **LinkedIn Integration**: Basic monitoring only (full integration in P1)
3. **Sponsor Database**: Manual entry required (automated in P1)
4. **Cover Letters**: Basic generation (advanced in P2)

### **Known Issues**
1. **API Key Security**: Keys stored locally but visible in dev tools
2. **Rate Limiting**: Claude API has usage limits
3. **ATS Accuracy**: Compatibility check is heuristic-based
4. **Browser Support**: Chrome only (Firefox/Safari planned)

## 🔒 Privacy & Security

### **Data Storage**
- **Local Only**: All data stored in Chrome's local storage
- **No External Servers**: No data sent to our servers
- **User Control**: Users can clear data anytime

### **API Keys**
- **Local Storage**: API keys stored in Chrome storage
- **No Logging**: Keys never logged or transmitted elsewhere
- **User Responsibility**: Users manage their own API keys

### **Resume Data**
- **Temporary Processing**: Resume text processed only during analysis
- **No Storage**: Raw resume text not stored after analysis
- **Analysis Results**: Stored locally for user reference

## 🤝 Contributing

### **Development Guidelines**
1. **Code Style**: Use consistent formatting (Prettier recommended)
2. **Comments**: Document complex logic
3. **Testing**: Test changes in Chrome before committing
4. **Documentation**: Update README for new features

### **Feature Requests**
1. **Check Roadmap**: See if feature is already planned
2. **Create Issue**: Describe feature and use case
3. **Discuss**: Wait for feedback before implementing

### **Bug Reports**
1. **Reproduce**: Document steps to reproduce
2. **Environment**: Include Chrome version and OS
3. **Screenshots**: Add screenshots if helpful
4. **Console Logs**: Include any error messages

## 📞 Support

### **Troubleshooting**
1. **API Key Issues**:
   - Verify key starts with `sk-ant-`
   - Check Claude account balance
   - Test key in Anthropic console

2. **Extension Not Loading**:
   - Enable Developer mode in Chrome
   - Check for error messages in console
   - Try reloading the extension

3. **Analysis Failing**:
   - Check internet connection
   - Verify API key is saved
   - Try smaller resume text

### **Getting Help**
- **GitHub Issues**: Report bugs or request features
- **Documentation**: Check this README first
- **Community**: Join discussion forums (if available)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Claude API** by Anthropic for AI analysis
- **Chrome Extensions API** for browser integration
- **Open Source Community** for tools and libraries

---

**Version**: 1.0.0  
**Last Updated**: 2026-03-23  
**Status**: MVP Development (P0 Complete)