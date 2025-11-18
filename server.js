const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const { encode } = require('gpt-tokenizer');
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

// Token counting function
function countTokens(text) {
  try {
    const tokens = encode(text);
    return tokens.length;
  } catch (error) {
    console.error('Token counting error:', error);
    return 0;
  }
}

// Model context limits
const MODEL_LIMITS = {
  'gpt-4o': 128000,
  'gpt-4-turbo': 128000,
  'gpt-4': 8192,
  'gpt-3.5-turbo': 16385
};

// Function to call OpenAI API
async function callOpenAI(message, conversationHistory = [], planMode = false, model = 'gpt-4o') {
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

    // Count input tokens
    const fullPrompt = messages.map(m => m.content).join(' ');
    const inputTokens = countTokens(fullPrompt);
    const modelLimit = MODEL_LIMITS[model] || MODEL_LIMITS['gpt-4o'];
    
    // Check if we're approaching or exceeding the limit
    if (inputTokens > modelLimit) {
      throw new Error(`Input tokens (${inputTokens}) exceed model context limit (${modelLimit}). Please use a shorter prompt.`);
    }
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: model,
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
    
    const responseText = response.data.choices[0].message.content;
    const outputTokens = countTokens(responseText);
    
    // Get friendly model name
    const modelNames = {
      'gpt-4o': 'GPT-4o',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4': 'GPT-4',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo'
    };
    
    return {
      success: true,
      response: responseText,
      provider: `OpenAI ${modelNames[model] || model}`,
      tokenUsage: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens,
        limit: modelLimit,
        percentUsed: ((inputTokens + outputTokens) / modelLimit * 100).toFixed(2)
      }
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
  const { message, conversationHistory = [], planMode = false, model = 'gpt-4o' } = req.body;
  
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
      result = await callOpenAI(message, conversationHistory, planMode, model);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Token testing endpoint
app.post('/api/test-tokens', async (req, res) => {
  const { model = 'gpt-4o' } = req.body;
  
  if (AI_PROVIDER !== 'openai') {
    return res.status(400).json({
      success: false,
      error: 'Token testing is only available with OpenAI provider'
    });
  }
  
  if (!OPENAI_API_KEY) {
    return res.status(500).json({
      success: false,
      error: 'OpenAI API key not configured'
    });
  }
  
  const modelLimit = MODEL_LIMITS[model] || MODEL_LIMITS['gpt-4o'];
  const modelNames = {
    'gpt-4o': 'GPT-4o',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-4': 'GPT-4',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo'
  };
  
  try {
    // Generate a prompt that exceeds the selected model's limit
    const limitExceedingTokens = Math.floor(modelLimit * 1.1); // 110% of limit
    
    const testCases = [
      {
        name: 'Short Prompt',
        description: 'A brief question that uses minimal tokens',
        prompt: 'What is 2+2?',
        expectedBehavior: 'Fast response, minimal token usage, efficient'
      },
      {
        name: 'Long Prompt',
        description: 'A detailed prompt that uses significant tokens',
        prompt: `Please provide a comprehensive analysis of artificial intelligence, covering the following topics in detail:
1. The history and evolution of AI from the 1950s to present day
2. Different types of AI including narrow AI, general AI, and superintelligence
3. Current applications of AI in various industries such as healthcare, finance, transportation, and entertainment
4. The underlying technologies including machine learning, deep learning, neural networks, and natural language processing
5. Ethical considerations and challenges including bias, privacy, job displacement, and safety concerns
6. Future prospects and potential developments in the field
7. The role of AI in solving global challenges like climate change and disease
Please be thorough and provide examples for each section.`,
        expectedBehavior: 'Slower response, higher token usage, more detailed'
      },
      {
        name: 'Context Limit Test',
        description: `A prompt designed to exceed ${modelNames[model] || model}'s context limit (${modelLimit.toLocaleString()} tokens)`,
        prompt: 'Repeat the word "limit" many times: ' + 'limit '.repeat(limitExceedingTokens),
        expectedBehavior: `Should trigger context limit error for ${modelNames[model] || model} and be rejected before API call`
      }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      try {
        const inputTokens = countTokens(testCase.prompt);
        
        // Check if prompt exceeds limit
        if (inputTokens > modelLimit) {
          results.push({
            name: testCase.name,
            description: testCase.description,
            prompt: testCase.prompt.substring(0, 200) + '...',
            status: 'error',
            error: `Input exceeds context limit (${inputTokens.toLocaleString()} > ${modelLimit.toLocaleString()} tokens)`,
            tokenUsage: {
              input: inputTokens,
              output: 0,
              total: inputTokens,
              limit: modelLimit,
              percentUsed: ((inputTokens / modelLimit) * 100).toFixed(2)
            },
            expectedBehavior: testCase.expectedBehavior
          });
          continue;
        }
        
        // Make the API call
        const startTime = Date.now();
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: model,
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant.'
              },
              {
                role: 'user',
                content: testCase.prompt
              }
            ],
            max_tokens: 500,
            temperature: 0.7
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
          }
        );
        const responseTime = Date.now() - startTime;
        
        const responseText = response.data.choices[0].message.content;
        const outputTokens = countTokens(responseText);
        
        results.push({
          name: testCase.name,
          description: testCase.description,
          prompt: testCase.prompt.substring(0, 200) + (testCase.prompt.length > 200 ? '...' : ''),
          status: 'success',
          response: responseText.substring(0, 300) + (responseText.length > 300 ? '...' : ''),
          responseTime: responseTime,
          tokenUsage: {
            input: inputTokens,
            output: outputTokens,
            total: inputTokens + outputTokens,
            limit: modelLimit,
            percentUsed: ((inputTokens + outputTokens) / modelLimit * 100).toFixed(2)
          },
          expectedBehavior: testCase.expectedBehavior
        });
      } catch (error) {
        results.push({
          name: testCase.name,
          description: testCase.description,
          prompt: testCase.prompt.substring(0, 200) + '...',
          status: 'error',
          error: error.message,
          expectedBehavior: testCase.expectedBehavior
        });
      }
    }
    
    res.json({
      success: true,
      results: results,
      modelLimit: modelLimit,
      provider: `OpenAI ${modelNames[model] || model}`
    });
  } catch (error) {
    console.error('Token Testing Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to perform token testing'
    });
  }
});

// Temperature comparison endpoint
app.post('/api/compare-temperatures', async (req, res) => {
  const { message, model = 'gpt-4o' } = req.body;
  
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
    
    const modelNames = {
      'gpt-4o': 'GPT-4o',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4': 'GPT-4',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo'
    };
    
    const promises = temperatures.map(temp => 
      axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: model,
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
      provider: `OpenAI ${modelNames[model] || model}`
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

