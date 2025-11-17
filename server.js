const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// AI Provider configuration
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Function to call OpenAI API
async function callOpenAI(message, conversationHistory = [], planMode = false) {
  try {
    const systemPrompt = planMode 
      ? `You are an expert requirements analyst and technical writer. Your goal is to gather information through conversation and produce a comprehensive final document.

PROCESS:
1. Ask clarifying questions to understand the user's needs
2. Gather requirements, specifications, and details through natural conversation
3. When you have sufficient information (typically after 3-5 exchanges), produce a final structured document
4. Start your final document with "📋 FINAL DOCUMENT:" to indicate completion

DOCUMENT FORMAT:
Your final document should be well-structured with:
- Clear sections and headers
- Bullet points or numbered lists
- Comprehensive coverage of all discussed points
- Professional formatting

CONSTRAINT: After producing the final document, you have completed your task. Keep conversations focused and efficient.`
      : 'You are a helpful assistant that provides clear and concise answers.';

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: messages,
        max_tokens: planMode ? 2000 : 500,
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      }
    );
    
    return {
      success: true,
      response: response.data.choices[0].message.content,
      provider: 'OpenAI GPT-4o'
    };
  } catch (error) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to get response from OpenAI');
  }
}

// Function to call Anthropic Claude API
async function callAnthropic(message) {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    return {
      success: true,
      response: response.data.content[0].text,
      provider: 'Anthropic Claude'
    };
  } catch (error) {
    console.error('Anthropic API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to get response from Anthropic');
  }
}

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, conversationHistory = [], planMode = false } = req.body;
  
  if (!message || message.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }
  
  try {
    let result;
    
    if (AI_PROVIDER === 'anthropic') {
      if (!ANTHROPIC_API_KEY) {
        return res.status(500).json({
          success: false,
          error: 'Anthropic API key not configured'
        });
      }
      result = await callAnthropic(message);
    } else {
      if (!OPENAI_API_KEY) {
        return res.status(500).json({
          success: false,
          error: 'OpenAI API key not configured'
        });
      }
      result = await callOpenAI(message, conversationHistory, planMode);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Temperature comparison endpoint
app.post('/api/compare-temperatures', async (req, res) => {
  const { message } = req.body;
  
  if (!message || message.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }
  
  if (AI_PROVIDER !== 'openai') {
    return res.status(400).json({
      success: false,
      error: 'Temperature comparison is only available with OpenAI provider'
    });
  }
  
  if (!OPENAI_API_KEY) {
    return res.status(500).json({
      success: false,
      error: 'OpenAI API key not configured'
    });
  }
  
  try {
    // Run the same prompt with three different temperatures in parallel
    const temperatures = [0, 0.7, 1.2];
    
    const promises = temperatures.map(temp => 
      axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that provides clear and concise answers.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 500,
          temperature: temp
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          }
        }
      ).then(response => ({
        temperature: temp,
        response: response.data.choices[0].message.content,
        characteristics: temp === 0 
          ? 'Deterministic & Focused - Best for factual, consistent answers'
          : temp === 0.7 
          ? 'Balanced - Good mix of accuracy and creativity'
          : 'Creative & Diverse - Best for brainstorming and varied ideas'
      }))
    );
    
    const results = await Promise.all(promises);
    
    res.json({
      success: true,
      prompt: message,
      results: results,
      provider: 'OpenAI GPT-4o'
    });
  } catch (error) {
    console.error('Temperature Comparison Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || 'Failed to compare temperatures'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    provider: AI_PROVIDER,
    apiKeyConfigured: AI_PROVIDER === 'openai' ? !!OPENAI_API_KEY : !!ANTHROPIC_API_KEY
  });
});

app.listen(PORT, () => {
  console.log(`🤖 AI Agent server running on http://localhost:${PORT}`);
  console.log(`📡 Using AI Provider: ${AI_PROVIDER}`);
  console.log(`🔑 API Key configured: ${AI_PROVIDER === 'openai' ? !!OPENAI_API_KEY : !!ANTHROPIC_API_KEY}`);
});

