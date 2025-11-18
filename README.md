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
- 🌡️ **Temperature Comparison Mode** - Compare AI responses at different temperature settings (0, 0.7, 1.2) side-by-side to understand how creativity vs. determinism affects outputs
- 📊 **Token Counting & Monitoring** - Real-time token usage tracking for both requests and responses with visual indicators and percentage bars
- 🧪 **Token Limit Testing** - Automated testing suite that demonstrates model behavior with short prompts, long prompts, and context-limit-exceeding prompts
- 🔄 **Model Selection** - Choose from multiple ChatGPT models (GPT-4o, GPT-4 Turbo, GPT-4, GPT-3.5 Turbo) with automatic token limit adjustment

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

## Model Selection

Choose the ChatGPT model that best fits your needs using the dropdown selector at the bottom of the interface.

### Available Models

| Model | Context Limit | Best For | Speed | Cost |
|-------|--------------|----------|-------|------|
| **GPT-4o** | 128K tokens | Most capable, best overall performance | Fast | $$ |
| **GPT-4 Turbo** | 128K tokens | Fast GPT-4 with large context | Fastest | $$ |
| **GPT-4** | 8K tokens | High quality responses, smaller context | Medium | $$$ |
| **GPT-3.5 Turbo** | 16K tokens | Fast, cost-effective, good for simple tasks | Fastest | $ |

### Model Comparison

**GPT-4o** (Default)
- Latest and most capable model
- Best reasoning and comprehension
- Large 128K context window
- Recommended for most use cases

**GPT-4 Turbo**
- Fast variant of GPT-4
- Same 128K context as GPT-4o
- Good balance of speed and quality

**GPT-4**
- Original GPT-4 model
- Excellent quality but smaller 8K context
- Higher cost per token
- Best for tasks requiring highest quality in short contexts

**GPT-3.5 Turbo**
- Most cost-effective option
- Fast responses
- 16K context window
- Great for simple questions, summaries, translations

### Token Limits Auto-Adjust

When you switch models, the token limit tracking automatically adjusts:
- The progress bar reflects the selected model's context limit
- Token percentage calculations update accordingly
- Context limit errors are specific to the selected model

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

## Temperature Comparison Mode

Explore how temperature settings affect AI responses by comparing outputs side-by-side.

### How to Use

1. **Toggle Compare Mode** - Click the "🌡️ Compare Temperatures" button at the bottom
2. **Enter Your Prompt** - Type any question or prompt
3. **View Results** - See three responses generated with different temperatures:
   - **Temperature 0** (❄️ Cold) - Deterministic and focused
   - **Temperature 0.7** (⚖️ Balanced) - Mix of accuracy and creativity
   - **Temperature 1.2** (🔥 Hot) - Creative and diverse

### Understanding Temperature

**Temperature** controls the randomness of the AI's responses:

- **0 (Deterministic)**: Always picks the most likely next word
  - Best for: Math problems, code generation, factual answers, technical docs
  - Output: Consistent, precise, focused
  
- **0.7 (Balanced)**: Good mix of predictability and variety
  - Best for: General conversation, explanations, Q&A, structured creative writing
  - Output: Natural, reliable with some variation
  
- **1.2 (Creative)**: More random, explores diverse possibilities
  - Best for: Brainstorming, storytelling, poetry, multiple perspectives
  - Output: Varied, imaginative, unexpected

### Example Prompts to Try

- "Write a short story about a robot" (See creativity differences)
- "What is 2+2?" (See consistency at different temperatures)
- "Explain quantum physics" (Compare accuracy vs. creativity)
- "Generate 5 business name ideas" (Observe diversity)

## Token Counting & Monitoring

Every AI response includes real-time token usage tracking to help you understand and optimize API costs.

### Token Usage Display

Each AI response shows:
- **Input Tokens** (↑) - Tokens in your prompt
- **Output Tokens** (↓) - Tokens in AI's response
- **Total Tokens** - Sum of input + output
- **Visual Progress Bar** - Color-coded by usage percentage:
  - 🟢 Green (< 5%) - Low usage, very efficient
  - 🟡 Orange (5-25%) - Medium usage
  - 🔴 Red (> 25%) - High usage
- **Percentage** - % of model's context limit used

### Token Limit Testing

Click the **"📊 Test Token Limits"** button to run three automated tests using the **currently selected model**.

#### Test 1: Short Prompt
- **Prompt**: "What is 2+2?"
- **Tokens**: ~5-10 tokens
- **Behavior**: Fast response, minimal usage, cost-effective
- **Best for**: Simple queries, quick answers, factual questions

#### Test 2: Long Prompt  
- **Prompt**: Comprehensive AI analysis request (~300 tokens)
- **Tokens**: ~300-400 tokens
- **Behavior**: Slower response, detailed output, higher cost
- **Best for**: Complex questions, detailed analysis, comprehensive answers

#### Test 3: Context Limit Exceeded
- **Prompt**: Artificially large prompt (110% of selected model's limit)
- **Tokens**: Dynamically generated to exceed selected model's limit:
  - GPT-4o/4-turbo: ~140,800 tokens (exceeds 128K)
  - GPT-3.5 Turbo: ~18,024 tokens (exceeds 16K)
  - GPT-4: ~9,011 tokens (exceeds 8K)
- **Behavior**: ❌ Error - "Input exceeds context limit"
- **Demonstrates**: How the system validates and rejects oversized inputs before making API calls

**Note**: Tests automatically adapt to your selected model's context limit, so you can see how different models handle varying prompt sizes.

### Understanding Token Costs

**GPT-4o Pricing** (example):
- Input: $2.50 per 1M tokens
- Output: $10 per 1M tokens

**Example Costs:**
- Short prompt (10 + 20 tokens): $0.00025
- Long prompt (300 + 400 tokens): $0.0075
- Average conversation (50 + 100 tokens): $0.0015

### Context Limits by Model

- **GPT-4o**: 128,000 tokens (~96,000 words)
- **GPT-4-turbo**: 128,000 tokens
- **GPT-4**: 8,192 tokens (~6,000 words)
- **GPT-3.5-turbo**: 16,385 tokens (~12,000 words)

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
  "provider": "OpenAI GPT-4o",
  "tokenUsage": {
    "input": 12,
    "output": 8,
    "total": 20,
    "limit": 128000,
    "percentUsed": "0.02"
  }
}
```

### POST `/api/compare-temperatures`

Compare the same prompt at three different temperature settings.

**Request:**
```json
{
  "message": "Write a haiku about coding"
}
```

**Response:**
```json
{
  "success": true,
  "prompt": "Write a haiku about coding",
  "results": [
    {
      "temperature": 0,
      "response": "Code flows line by line...",
      "characteristics": "Deterministic & Focused - Best for factual, consistent answers"
    },
    {
      "temperature": 0.7,
      "response": "Keys tap through the night...",
      "characteristics": "Balanced - Good mix of accuracy and creativity"
    },
    {
      "temperature": 1.2,
      "response": "Logic dances wild...",
      "characteristics": "Creative & Diverse - Best for brainstorming and varied ideas"
    }
  ],
  "provider": "OpenAI GPT-4o"
}
```

### POST `/api/test-tokens`

Run automated token limit tests with three different prompt lengths.

**Request:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "name": "Short Prompt",
      "description": "A brief question that uses minimal tokens",
      "prompt": "What is 2+2?",
      "status": "success",
      "response": "2+2 equals 4.",
      "responseTime": 856,
      "tokenUsage": {
        "input": 8,
        "output": 6,
        "total": 14,
        "limit": 128000,
        "percentUsed": "0.01"
      },
      "expectedBehavior": "Fast response, minimal token usage, efficient"
    }
  ],
  "modelLimit": 128000,
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

