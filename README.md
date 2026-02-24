# StudyBuddy - AI-Powered Study Organization Tool

A hierarchical AI-powered study organization tool that helps students manage their courses and notes with AI-generated summaries.

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │  Express API    │    │   SQLite DB     │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Database)    │
│                 │    │                 │    │                 │
│ - Dashboard     │    │ - REST Routes   │    │ - users         │
│ - Course Mgmt   │    │ - Controllers   │    │ - courses       │
│ - Note Editor   │    │ - AI Integration│    │ - notes        │
│ - AI Summaries  │    │ - Error Handling│    │ - Foreign Keys  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🗄️ Database Schema

### SQLite Schema Diagram

```
users
├── id (INTEGER PRIMARY KEY)
├── email (TEXT UNIQUE)
└── created_at (DATETIME)

courses
├── id (INTEGER PRIMARY KEY)
├── user_id (INTEGER → users.id)
├── name (TEXT NOT NULL)
├── description (TEXT)
├── created_at (DATETIME)
└── updated_at (DATETIME)

notes
├── id (INTEGER PRIMARY KEY)
├── course_id (INTEGER → courses.id)
├── title (TEXT NOT NULL)
├── body (TEXT)
├── summary (TEXT)
├── pdf_path (TEXT) - Stores uploaded PDF filename
├── created_at (DATETIME)
└── updated_at (DATETIME)
```

### Foreign Key Relationships

- `courses.user_id` → `users.id` (ON DELETE CASCADE)
- `notes.course_id` → `courses.id` (ON DELETE CASCADE)

### Cascade Delete Implementation

```sql
PRAGMA foreign_keys = ON;

-- When a user is deleted, all their courses are automatically deleted
-- When a course is deleted, all its notes are automatically deleted
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd studybuddy
   ```

2. **Set up the backend**
   ```bash
   cd server
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start the backend server**
   ```bash
   node app.js
   ```

5. **Set up the frontend**
   ```bash
   cd ../client
   npm install
   ```

6. **Start the frontend development server**
   ```bash
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 📡 API Endpoints

### Courses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/courses` | Get all courses |
| POST | `/courses` | Create a new course |
| GET | `/courses/:id` | Get a specific course |
| PUT | `/courses/:id` | Update a course |
| DELETE | `/courses/:id` | Delete a course (and all its notes) |

### Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/courses/:courseId/notes` | Get all notes for a course |
| POST | `/courses/:courseId/notes` | Create a new note (with optional PDF) |
| GET | `/notes/:id` | Get a specific note |
| PUT | `/notes/:id` | Update a note |
| DELETE | `/notes/:id` | Delete a note (and associated PDF) |
| POST | `/notes/:id/summarize` | Generate AI summary for a note |

### Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pdf/:filename` | Serve uploaded PDF files |

### Response Format

All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": {},
  "error": null
}
```

**Error Response:**
```json
{
  "success": false,
  "data": null,
  "error": "Error message"
}
```

**AI Summary Response:**
```json
{
  "success": true,
  "data": {
    "note": {
      "id": 1,
      "title": "Note Title",
      "body": "Note content...",
      "summary": "• Key point 1\n• Key point 2\n• Key point 3"
    }
  },
  "latency_ms": 842,
  "error": null
}
```

## 🤖 AI Integration

### Prompt Design

The AI summarization uses a carefully crafted prompt:

```
Summarize the following study note into 3–5 concise bullet points focusing only on key concepts:

[Note content here]
```

### AI Configuration

- **Model**: GPT-3.5-turbo (or compatible)
- **Temperature**: 0.3 (for consistent, focused summaries)
- **Max Tokens**: 150 (for concise summaries)
- **Response Format**: Bullet points focusing on key concepts

### Error Handling

- Empty note bodies are rejected
- API failures are caught and user-friendly messages shown
- Latency is measured and included in responses
- Fallback behavior when AI service is unavailable

## 🧪 Edge Case Handling

### Database Operations
- **SQL Injection Prevention**: All queries use parameterized statements
- **Invalid IDs**: 404 responses for non-existent resources
- **Empty Data**: Validation for required fields
- **Cascade Deletes**: Automatic cleanup of related data

### API Error Handling
- **Centralized Error Middleware**: Consistent error responses
- **Input Validation**: Required field checking
- **Rate Limiting**: Basic protection for AI endpoints
- **Timeout Handling**: Configurable timeouts for external API calls

### Frontend Validation
- **Form Validation**: Client-side validation before API calls
- **Loading States**: Visual feedback during async operations
- **Error Messages**: User-friendly error display
- **Responsive Design**: Mobile-friendly interface

## 📁 Project Structure

```
studybuddy/
├── server/
│   ├── controllers/
│   │   ├── courseController.js
│   │   └── noteController.js
│   ├── models/
│   │   └── database.js
│   ├── routes/
│   │   ├── courses.js
│   │   └── notes.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── app.js
│   ├── package.json
│   └── .env
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── CourseDetail.js
│   │   │   └── NoteDetail.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── App.css
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   └── package.json
└── README.md
```

## 🛠️ Technologies Used

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **SQLite3**: Database engine
- **Axios**: HTTP client for AI API calls
- **Multer**: File upload handling for PDFs
- **CORS**: Cross-origin resource sharing
- **dotenv**: Environment variable management

### Frontend
- **React.js**: UI library with functional components and hooks
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **CSS3**: Responsive styling

## 🔧 Development Commands

### Backend
```bash
cd server
npm install          # Install dependencies
node app.js          # Start development server
npm run dev          # Start with nodemon (if installed)
```

### Frontend
```bash
cd client
npm install          # Install dependencies
npm start            # Start development server
npm run build        # Build for production
```

## 📱 Features

### Core Functionality
- ✅ Create, read, update, delete courses
- ✅ Create, read, update, delete notes within courses
- ✅ Hierarchical organization (courses → notes)
- ✅ AI-powered note summarization
- ✅ PDF file upload and preview
- ✅ Responsive web design
- ✅ Real-time updates

### PDF Features
- 📄 Upload PDF files with notes (10MB limit)
- 📖 In-app PDF preview with iframe
- 🔗 Direct PDF download links
- 🗂️ Automatic file cleanup on note deletion
- 📊 File size display during upload

### User Experience
- 📱 Mobile-responsive interface
- 🎨 Clean, modern UI design
- ⚡ Fast loading and interactions
- 🔍 Intuitive navigation with breadcrumbs
- 💾 Auto-save functionality
- 📊 Visual feedback for all operations

## 🚀 Deployment

### Environment Variables
```env
PORT=3001
LLM_API_KEY=your_openai_api_key_here
LLM_API_URL=https://api.openai.com/v1/chat/completions
```

### Production Considerations
- Use HTTPS in production
- Implement proper authentication
- Add rate limiting for AI endpoints
- Set up database backups
- Configure proper CORS for your domain
- Use environment-specific configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure SQLite3 is properly installed
   - Check file permissions for the database file

2. **AI API Not Working**
   - Verify your API key is correct
   - Check if you have sufficient API credits
   - Ensure the API URL is correct

3. **CORS Issues**
   - Make sure the backend CORS is configured correctly
   - Check that the frontend is running on the correct port

4. **Frontend Build Errors**
   - Clear node_modules and reinstall
   - Check for conflicting dependency versions

### Getting Help

- Check the console for detailed error messages
- Verify all environment variables are set
- Ensure both frontend and backend are running
- Check network connectivity for AI API calls
