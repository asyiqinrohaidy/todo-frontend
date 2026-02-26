# Athena - Frontend

React-based frontend for an intelligent task management system with AI assistant, voice control, and document analysis.

![React](https://img.shields.io/badge/React-18-blue)
![AI](https://img.shields.io/badge/AI-OpenAI-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

### Core Task Management
- Create, read, update, and delete tasks
- Due date tracking with overdue indicators
- Priority levels (High/Medium/Low) with color coding
- Time estimation tracking
- Task completion status

### AI-Powered Features
- **Conversational AI Assistant** - Natural language task management
- **Voice Interface** - Hands-free control with speech recognition
- **Text-to-Speech** - AI reads responses aloud
- **Document Analysis** - Extract tasks from PDFs, images, and Word docs
- **Multi-Agent System** - 4 AI agents collaborate to break down complex goals
- **Smart Priority Detection** - Auto-assigns priority based on urgency
- **Time Estimation** - AI predicts task completion time

### User Experience
- Floating chat interface (modern UX)
- Responsive, mobile-friendly design
- Secure authentication with OAuth2
- Real-time updates

## Tech Stack

- **Framework:** React 18 (Hooks, Functional Components)
- **HTTP Client:** Axios
- **Voice AI:** Web Speech API
- **File Upload:** React Dropzone
- **Authentication:** JWT Tokens
- **Styling:** Custom CSS with modern design

## Prerequisites

- Node.js 16+ and npm
- Backend API running (see [todo-api](https://github.com/asyiqinrohaidy/todo-api))

## Installation

1. **Clone the repository:**
```bash
git clone https://github.com/asyiqinrohaidy/todo-frontend.git
cd todo-frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure API endpoint:**

The frontend connects to `http://127.0.0.1:8000/api` by default (configured in `src/services/api.js`).

To change the API URL, update:
```javascript
// src/services/api.js
const API_URL = 'http://127.0.0.1:8000/api'; // Change this if needed
```

4. **Start the development server:**
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Usage

### Basic Task Management
1. **Register/Login** to create an account
2. **Add tasks** using the form or voice command
3. **Set priorities** and due dates
4. **Complete tasks** by clicking the checkbox

### AI Assistant
1. Click the 💬 **chat button** (bottom right)
2. Type or speak commands like:
   - "Add a task to buy groceries tomorrow"
   - "List all my high priority tasks"
   - "Delete all completed tasks"
   - "What should I do first to launch a mobile app?"

### Voice Control
1. Click the 🎤 **microphone icon**
2. Speak your command
3. AI responds with text and voice

### Document Analysis
1. Click **"Upload Document"**
2. Drag & drop a PDF, image, or Word file
3. AI extracts tasks automatically

### Multi-Agent Planning
1. Ask: "Help me plan [big goal]"
2. 4 AI agents collaborate:
   - **Planner** - Breaks down the goal
   - **Executor** - Analyses feasibility
   - **Reviewer** - Quality checks
   - **Coordinator** - Creates final plan
3. Tasks are created automatically

## Project Structure
```
todo-frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── AIChat.js          # Conversational AI assistant
│   │   ├── MultiAgent.js      # Multi-agent system UI
│   │   └── DocumentUpload.js  # OCR document parser
│   ├── pages/
│   │   ├── Login.js           # Authentication
│   │   ├── Register.js        # User registration
│   │   └── Dashboard.js       # Main task interface
│   ├── services/
│   │   └── api.js             # Axios API client
│   ├── App.js
│   └── index.js
└── package.json
```

## API Integration

The frontend communicates with the Laravel backend via REST API:

- **Authentication:** `POST /api/login`, `POST /api/register`
- **Tasks:** `GET /api/tasks`, `POST /api/tasks`, `PUT /api/tasks/{id}`
- **AI Chat:** `POST /api/ai/chat`
- **Document Analysis:** `POST /api/documents/analyse`
- **Multi-Agent:** `POST /api/multi-agent/process`

See [API Documentation](https://github.com/asyiqinrohaidy/todo-api) for details.

## Screenshots

### Dashboard
![Dashboard](screenshots/dashboard.png)

### AI Chat Assistant
![AI Chat](screenshots/ai-chat.png)

### Multi-Agent Planning
![Multi-Agent](screenshots/multi-agent.png)

## Roadmap

- [ ] Dark mode toggle
- [ ] Task categories and tags
- [ ] Calendar view
- [ ] Recurring tasks
- [ ] Task sharing and collaboration
- [ ] Mobile app (React Native)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. :)

## License

This project is licensed under the MIT License.

## Author

**Asyiqin Rohaidy** - AI Engineer at Fulkrum Interactive

- GitHub: [@asyiqinrohaidy](https://github.com/asyiqinrohaidy)
- LinkedIn: [@asyiqinrohaidy](https://linkedin.com/in/asyiqinrohaidy)

## Acknowledgments

- OpenAI for GPT-4o-mini API
- React community for amazing libraries
- Web Speech API for voice capabilities
