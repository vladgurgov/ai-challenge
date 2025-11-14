# Simple AI Agent

A simple, modern AI agent with a beautiful web interface that answers questions using HTTP requests to AI APIs.

## Features

- 🤖 Clean, modern chat interface
- 🌐 HTTP-based communication with AI models
- 🔄 Support for multiple AI providers (OpenAI, Anthropic)
- ⚡ Real-time responses
- 📱 Responsive design
- 🎨 Beautiful gradient UI with smooth animations
- 📋 **Automatic JSON detection and formatting** - JSON responses are automatically detected, syntax-highlighted, and displayed with a copy button
- 🎯 **Plan Mode** - Activate by typing "Plan mode" to have the AI gather requirements through conversation and automatically produce a comprehensive final document

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **HTTP Client**: Axios
- **AI Providers**: OpenAI GPT-3.5-turbo or Anthropic Claude

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- An API key from either:
  - OpenAI: https://platform.openai.com/api-keys
  - Anthropic: https://console.anthropic.com/

## Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd /Users/vlad/projects/challenge/day1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the project root:
   ```bash
   touch .env
   ```
   
   Add your configuration (choose one provider):
   
   **For OpenAI:**
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   AI_PROVIDER=openai
   PORT=3000
   ```
   
   **For Anthropic Claude:**
   ```env
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   AI_PROVIDER=anthropic
   PORT=3000
   ```

## Usage

1. **Start the server**
   ```bash
   npm start
   ```

2. **Open your browser**
   
   Navigate to: `http://localhost:3000`

3. **Start chatting!**
   
   Type your question in the input field and press Enter or click Send.

## Plan Mode

Plan Mode is a special feature that helps you create structured documents through conversation.

### How to Use

1. **Activate Plan Mode** - Type "Plan mode" and send it
2. **Describe Your Needs** - Tell the AI what kind of document you need (e.g., "I need a technical specification for a mobile app")
3. **Answer Questions** - The AI will ask clarifying questions to gather all necessary information
4. **Receive Final Document** - After 3-5 exchanges, the AI will automatically produce a comprehensive, well-structured final document

### Example Use Cases

- **Technical Specifications**: Describe your project, and get a complete technical spec
- **Project Plans**: Discuss your project goals, and receive a detailed project plan
- **Requirements Documents**: Explain your needs, and get a formatted requirements doc
- **Architecture Designs**: Describe your system, and get an architecture document

### How It Works

When in Plan Mode:
- The AI maintains conversation context
- It asks targeted questions to gather complete information
- It knows when it has enough information to produce the final document
- The final document is automatically marked with "📋 FINAL DOCUMENT:"
- You can exit Plan Mode after receiving your document

## API Endpoints

### POST `/api/chat`

Send a message to the AI agent.

**Request:**
```json
{
  "message": "What is the capital of France?",
  "conversationHistory": [],
  "planMode": false
}
```

**Request Parameters:**
- `message` (required): The user's message
- `conversationHistory` (optional): Array of previous messages for context (used in Plan Mode)
- `planMode` (optional): Boolean to activate Plan Mode behavior

**Response:**
```json
{
  "success": true,
  "response": "The capital of France is Paris.",
  "provider": "OpenAI GPT-4o"
}
```

### GET `/api/health`

Check the server and API connection status.

**Response:**
```json
{
  "status": "healthy",
  "provider": "openai",
  "apiKeyConfigured": true
}
```

## Project Structure

```
day1/
├── server.js           # Express server with API endpoints
├── package.json        # Node.js dependencies
├── .env               # Environment variables (create this)
├── .gitignore         # Git ignore file
├── README.md          # This file
└── public/            # Frontend files
    ├── index.html     # Main HTML structure
    ├── styles.css     # Styling and animations
    └── app.js         # Client-side JavaScript
```

## How It Works

1. **User Input**: User types a question in the web interface
2. **HTTP Request**: Frontend sends POST request to `/api/chat` endpoint
3. **AI Processing**: Backend makes HTTP request to selected AI provider (OpenAI or Anthropic)
4. **Response**: AI response is sent back through the HTTP chain
5. **Display**: Frontend displays the response in the chat interface

## Customization

### Change AI Model

Edit `server.js` to change the model:

**OpenAI:**
```javascript
model: 'gpt-4'  // or 'gpt-3.5-turbo'
```

**Anthropic:**
```javascript
model: 'claude-3-opus-20240229'  // or 'claude-3-haiku-20240307'
```

### Adjust Response Length

Modify `max_tokens` in `server.js`:
```javascript
max_tokens: 1000  // Default is 500
```

### Change Port

Update the `PORT` in your `.env` file:
```env
PORT=8080
```

## Troubleshooting

### "API key not configured" error
- Make sure you've created a `.env` file
- Verify your API key is correct
- Check that `AI_PROVIDER` matches your configured key

### Server won't start
- Ensure port 3000 (or your chosen port) is not in use
- Verify Node.js is installed: `node --version`
- Try deleting `node_modules` and running `npm install` again

### No response from AI
- Check your internet connection
- Verify your API key is valid and has credits
- Check the browser console and server logs for errors

## License

MIT

## Notes

- This is a demonstration project showing HTTP-based AI agent communication
- API keys should never be committed to version control
- Consider adding rate limiting for production use
- Add authentication for public deployments

