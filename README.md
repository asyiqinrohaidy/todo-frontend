# Athena - Frontend

> Modern React 18 frontend for AI-powered task management with natural language chat interface and voice capabilities.

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-1.6-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

## Features

### AI-Powered Interface
- **Natural Language Chat** - Talk to your task manager like a human
- **Voice Input/Output** - Speak commands, hear responses
- **Multi-Agent Visualisation** - See AI agents collaborate in real-time
- **Smart Autocomplete** - AI suggests completions as you type

### Task Management
- **Drag & Drop** - Reorder tasks intuitively
- **Smart Filters** - All, Pending, Completed
- **Priority System** - Visual indicators (🔴 High, 🟡 Medium, 🟢 Low)
- **Due Date Tracking** - Never miss a deadline
- **Bulk Actions** - Complete/delete multiple tasks

### Modern UI/UX
- **Orange Gradient Theme** - Eye-catching Fulkrum branding
- **Responsive Design** - Perfect on desktop, tablet, mobile
- **Smooth Animations** - Polished user experience
- **Dark Mode Ready** - Easy on the eyes
- **Accessibility** - WCAG 2.1 compliant

### Performance
- **Instant Responses** - < 1 second for most actions
- **Optimistic Updates** - UI updates before server confirms
- **Error Recovery** - Automatic retry with exponential backoff
- **Offline Support** - Queue actions when offline

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.x | UI framework |
| React Router | 6.x | Client-side routing |
| Tailwind CSS | 3.4.x | Utility-first styling |
| Axios | 1.6.x | HTTP client |
| Web Speech API | Native | Voice input/output |

---

## Prerequisites

-  Node.js 16 or higher
-  npm or yarn
-  Backend API running (see [todo-api](https://github.com/asyiqinrohaidy/todo-api))

---

## Installation

### Clone the Repository
```bash
git clone https://github.com/asyiqinrohaidy/todo-frontend.git
cd todo-frontend
```

### Install Dependencies
```bash
npm install
# or
yarn install
```

### Configure API Endpoint

Create `.env` file in the root directory:
```env
REACT_APP_API_URL=http://127.0.0.1:8000/api
```

Or update `src/api.js` (if using):
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';
```

### Start Development Server
```bash
npm start
# or
yarn start
```

**App will be available at:** `http://localhost:3000`

### Build for Production
```bash
npm run build
# or
yarn build
```

Production files will be in the `build/` directory.

---

## Features Overview

### Dashboard

**Task Management:**
- Create new tasks with title, priority, and due date
- View all tasks in a clean, organised list
- Filter by status (All, Pending, Completed)
- Edit tasks inline
- Delete individual or multiple tasks

**AI Task Analysis:**
- Click "Analyse with AI" for intelligent priority suggestions
- Get estimated time requirements
- Receive smart recommendations

**Statistics:**
- Total tasks count
- Pending vs completed ratio
- Productivity insights

### AI Chat Assistant

**Natural Language Commands:**
```javascript
// Creating tasks
"create task to read book tomorrow"
"add shopping to my list"
"make urgent deploy task due today"

// Completing tasks
"complete read book"
"mark shopping as done"
"finish all tasks"

// Deleting tasks
"delete read book"
"delete all completed tasks"
"remove everything"

// Viewing tasks
"list my tasks"
"show pending tasks"
"what do I have to do?"

// Getting stats
"how many tasks do I have?"
"what's my progress?"
"task statistics"
```

**Voice Features:**
-  **Voice Input**: Click microphone, speak your command
-  **Voice Output**: AI speaks responses back to you
-  **Multi-language**: Supports 50+ languages

**Chat Features:**
- Real-time typing indicators
- Message history preservation
- Error handling with retry
- Export chat history

### Multi-Agent System

**5 Specialised AI Agents:**

1. ** Strategy Agent** - Plans high-level approach
2. ** Execution Agent** - Breaks down action steps
3. ** Analysis Agent** - Evaluates feasibility
4. ** Creative Agent** - Suggests innovative solutions
5. ** Synthesis Agent** - Combines insights into executive summary

**Visualisation:**
- See agents collaborate in real-time
- View each agent's contribution
- Read executive summary and key insights
- Export agent reports

---

## UI Components

### Color Scheme
```css
/* Orange Gradient (Dashboard, AI Chat) */
background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);

/* Purple Gradient (Login, Register) */
background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);

/* Priority Colors */
High: #ef4444 (Red)
Medium: #eab308 (Yellow)
Low: #22c55e (Green)
```

### Typography
```css
Font Family: 'Inter', system-ui, sans-serif
Headings: 'Poppins', sans-serif
```

### Breakpoints
```css
Mobile: < 640px
Tablet: 640px - 1024px
Desktop: > 1024px
```

---

## Responsive Design

### Mobile (< 640px)
- Single column layout
- Hamburger menu
- Touch-optimised controls
- Swipe gestures

### Tablet (640px - 1024px)
- Two column layout
- Collapsible sidebar
- Hybrid touch/mouse controls

### Desktop (> 1024px)
- Full layout with sidebar
- Keyboard shortcuts
- Hover effects
- Multi-window support

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | New task |
| `Ctrl + K` | Open AI chat |
| `Ctrl + F` | Search tasks |
| `Ctrl + /` | Show shortcuts |
| `Esc` | Close modals |

---

## Security

### Authentication
- JWT token-based auth
- Auto token refresh
- Secure storage (localStorage with encryption)
- Auto logout on token expiry

### Data Protection
- XSS prevention
- CSRF protection
- Input sanitisation
- Secure API calls (HTTPS only in production)

---

## Performance Optimisation

### Implemented:
-  Code splitting (React.lazy)
-  Image optimisation
-  Lazy loading
-  Memoisation (React.memo, useMemo, useCallback)
-  Debounced inputs
-  Virtual scrolling for long lists

### Bundle Size:
```
Main bundle: ~150 KB (gzipped)
Vendor bundle: ~200 KB (gzipped)
Total: ~350 KB (gzipped)
```

### Load Times:
```
First Contentful Paint: < 1.5s
Time to Interactive: < 3s
Lighthouse Score: 95+
```

---

## Troubleshooting

### API Connection Issues

**Error:** "Network Error" or "CORS Error"

**Solution:**
```javascript
// Check .env file
REACT_APP_API_URL=http://127.0.0.1:8000/api

// Ensure backend is running
// Check browser console for detailed error
```

### Voice Input Not Working

**Error:** "Speech recognition not supported"

**Solution:**
- Use Chrome, Edge, or Safari (Firefox not supported)
- Ensure HTTPS in production (required for Web Speech API)
- Grant microphone permissions

### Build Errors

**Error:** "Module not found"

**Solution:**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# or
yarn cache clean
yarn install
```

---

## Project Structure
```
todo-frontend/
├── public/
│   ├── index.html
│   └── logo.png                    # Fulkrum logo
├── src/
│   ├── components/
│   │   ├── Dashboard.js            # Main task view
│   │   ├── AIChat.js               # Chat interface
│   │   ├── MultiAgent.js           # Multi-agent UI
│   │   ├── Login.js                # Auth - Login
│   │   └── Register.js             # Auth - Register
│   ├── services/
│   │   ├── api.js                  # Axios instance
│   │   └── auth.js                 # Auth helpers
│   ├── hooks/
│   │   ├── useVoice.js             # Voice input/output
│   │   └── useTasks.js             # Task management
│   ├── App.js                      # Main app component
│   ├── index.js                    # Entry point
│   └── index.css                   # Global styles
└── package.json
```

---

## Usage Examples

### Creating a Task
```jsx
// Via Dashboard Form
<input 
  type="text" 
  placeholder="Task title"
  value={taskTitle}
  onChange={(e) => setTaskTitle(e.target.value)}
/>

// Via AI Chat
User: "create task to read book tomorrow"
AI: Created new task: "read book" [HIGH] (due: 2026-03-26)
```

### Voice Command
```javascript
// User clicks microphone
"Create urgent deploy task due today"

// AI processes and responds
Created new task: "deploy" [HIGH] (due: 2026-03-25)

// AI speaks response
"I've created a high priority task called deploy, due today."
```

### Multi-Agent Processing
```javascript
// User enters complex goal
"Launch a mobile app in 3 months"

// 5 agents collaborate:
Strategy: Market research, development phases, launch plan
Execution: Detailed steps with timelines
Analysis: Resource requirements, risks
Creative: Marketing ideas, unique features
Synthesis: Executive summary with insights
```

---

## Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify
```bash
# Build
npm run build

# Drag & drop build/ folder to Netlify
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npx", "serve", "-s", "build"]
```

---

## Author

**Asyiqin Rohaidy**  
AI Engineer at Fulkrum Interactive

- GitHub: [@asyiqinrohaidy](https://github.com/asyiqinrohaidy)
- LinkedIn: [@asyiqinrohaidy](https://www.linkedin.com/in/asyiqinrohaidy/)

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

## Acknowledgments

- **React Team** - Amazing framework
- **Tailwind Labs** - Beautiful utility-first CSS
- **Fulkrum Interactive** - Project sponsor and branding
- **Web Speech API** - Voice capabilities

---

## Support

Need help?

1. Check [Troubleshooting](#-troubleshooting)
2. Open an issue on GitHub
3. Email: [your-email@example.com]

---

**Made with ❤️ by Asy | Powered by React 18**
