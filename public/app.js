// DOM Elements
const chatContainer = document.getElementById('chatContainer');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');

// State
let isProcessing = false;
let planMode = false;
let conversationHistory = [];
let compareMode = false;

// Check server health on load
async function checkHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (data.status === 'healthy' && data.apiKeyConfigured) {
            statusIndicator.classList.add('online');
            statusText.textContent = `Connected - ${data.provider}`;
        } else {
            statusIndicator.classList.add('offline');
            statusText.textContent = 'API key not configured';
        }
    } catch (error) {
        statusIndicator.classList.add('offline');
        statusText.textContent = 'Server offline';
        console.error('Health check failed:', error);
    }
}

// Initialize
checkHealth();

// Compare Mode Toggle
const compareModeToggle = document.getElementById('compareModeToggle');
const tokenTestBtn = document.getElementById('tokenTestBtn');
const modeIndicator = document.getElementById('modeIndicator');
const modelSelect = document.getElementById('modelSelect');

compareModeToggle.addEventListener('click', () => {
    compareMode = !compareMode;
    updateCompareModeUI();
});

// Token Test Button
tokenTestBtn.addEventListener('click', async () => {
    if (isProcessing) return;
    
    // Remove welcome message if exists
    const welcomeMessage = chatContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    // Add loading indicator
    const selectedModel = modelSelect.value;
    const loadingDiv = addLoadingIndicator(`Running token limit tests with ${selectedModel}...`);
    isProcessing = true;
    updateButtonState();
    
    try {
        const response = await fetch('/api/test-tokens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ model: selectedModel })
        });
        
        const data = await response.json();
        
        // Remove loading indicator
        loadingDiv.remove();
        
        if (data.success) {
            showTokenTestResults(data);
        } else {
            addErrorMessage(data.error || 'Failed to run token tests');
        }
    } catch (error) {
        loadingDiv.remove();
        addErrorMessage('Failed to connect to server. Please try again.');
        console.error('Error:', error);
    } finally {
        isProcessing = false;
        updateButtonState();
    }
});

function updateCompareModeUI() {
    if (compareMode) {
        compareModeToggle.classList.add('active');
        modeIndicator.textContent = '🌡️ Compare Mode';
        modeIndicator.classList.add('active');
        userInput.placeholder = 'Enter prompt to compare at different temperatures...';
    } else {
        compareModeToggle.classList.remove('active');
        modeIndicator.textContent = 'Normal Mode';
        modeIndicator.classList.remove('active');
        userInput.placeholder = 'Type your question here...';
    }
}

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// Handle form submission
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const message = userInput.value.trim();
    if (!message || isProcessing) return;
    
    // Check if user is activating plan mode
    if (message.toLowerCase() === 'plan mode' && !planMode) {
        planMode = true;
        conversationHistory = [];
        userInput.value = '';
        userInput.style.height = 'auto';
        
        // Remove welcome message if exists
        const welcomeMessage = chatContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        showPlanModeActivation();
        updatePlanModeUI();
        return;
    }
    
    // Clear input
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Remove welcome message if exists
    const welcomeMessage = chatContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    // Add user message
    addMessage(message, 'user');
    
    // Handle Compare Mode
    if (compareMode) {
        // Add loading indicator
        const loadingDiv = addLoadingIndicator('Comparing temperatures (0, 0.7, 1.2)...');
        
        // Disable input while processing
        isProcessing = true;
        updateButtonState();
        
        try {
            const selectedModel = modelSelect.value;
            const response = await fetch('/api/compare-temperatures', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    message,
                    model: selectedModel
                })
            });
            
            const data = await response.json();
            
            // Remove loading indicator
            loadingDiv.remove();
            
            if (data.success) {
                showTemperatureComparison(data);
            } else {
                addErrorMessage(data.error || 'An error occurred');
            }
        } catch (error) {
            loadingDiv.remove();
            addErrorMessage('Failed to connect to server. Please try again.');
            console.error('Error:', error);
        } finally {
            isProcessing = false;
            updateButtonState();
            userInput.focus();
        }
        return;
    }
    
    // Add to conversation history if in plan mode
    if (planMode) {
        conversationHistory.push({
            role: 'user',
            content: message
        });
    }
    
    // Add loading indicator
    const loadingDiv = addLoadingIndicator();
    
    // Disable input while processing
    isProcessing = true;
    updateButtonState();
    
    try {
        // Make API call
        const selectedModel = modelSelect.value;
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                message,
                conversationHistory,
                planMode,
                model: selectedModel
            })
        });
        
        const data = await response.json();
        
        // Remove loading indicator
        loadingDiv.remove();
        
        if (data.success) {
            addMessage(data.response, 'ai', data.provider, data.tokenUsage);
            
            // Add to conversation history if in plan mode
            if (planMode) {
                conversationHistory.push({
                    role: 'assistant',
                    content: data.response
                });
                
                // Check if this is the final document
                if (data.response.includes('📋 FINAL DOCUMENT:')) {
                    showPlanModeComplete();
                }
            }
        } else {
            addErrorMessage(data.error || 'An error occurred');
        }
    } catch (error) {
        loadingDiv.remove();
        addErrorMessage('Failed to connect to server. Please try again.');
        console.error('Error:', error);
    } finally {
        isProcessing = false;
        updateButtonState();
        userInput.focus();
    }
});

// Check if text is JSON
function isJSON(text) {
    try {
        const trimmed = text.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            JSON.parse(trimmed);
            return true;
        }
    } catch (e) {
        return false;
    }
    return false;
}

// Format JSON with syntax highlighting
function formatJSON(jsonString) {
    const obj = JSON.parse(jsonString.trim());
    const formatted = JSON.stringify(obj, null, 2);
    
    // Add syntax highlighting
    return formatted
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
}

// Add message to chat
function addMessage(text, type, provider = null, tokenUsage = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'user' ? '👤' : '🤖';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Check if the message is JSON and format it nicely
    if (type === 'ai' && isJSON(text)) {
        const jsonLabel = document.createElement('div');
        jsonLabel.className = 'json-label';
        jsonLabel.textContent = '📋 JSON Response';
        contentDiv.appendChild(jsonLabel);
        
        const jsonContainer = document.createElement('pre');
        jsonContainer.className = 'json-container';
        jsonContainer.innerHTML = formatJSON(text);
        contentDiv.appendChild(jsonContainer);
        
        // Add copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-json-btn';
        copyBtn.textContent = '📋 Copy';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(text.trim());
            copyBtn.textContent = '✓ Copied!';
            setTimeout(() => {
                copyBtn.textContent = '📋 Copy';
            }, 2000);
        };
        contentDiv.appendChild(copyBtn);
    } else {
        contentDiv.textContent = text;
    }
    
    // Add token usage if available
    if (tokenUsage && type === 'ai') {
        const tokenDiv = document.createElement('div');
        tokenDiv.className = 'token-usage';
        
        const percentClass = tokenUsage.percentUsed < 5 ? 'low' : tokenUsage.percentUsed < 25 ? 'medium' : 'high';
        
        tokenDiv.innerHTML = `
            <div class="token-stats">
                <span class="token-label">📊 Tokens:</span>
                <span class="token-value">↑ ${tokenUsage.input}</span>
                <span class="token-value">↓ ${tokenUsage.output}</span>
                <span class="token-total">Total: ${tokenUsage.total}</span>
            </div>
            <div class="token-bar-container">
                <div class="token-bar ${percentClass}" style="width: ${Math.min(tokenUsage.percentUsed, 100)}%"></div>
            </div>
            <div class="token-percent">${tokenUsage.percentUsed}% of ${tokenUsage.limit.toLocaleString()} token limit</div>
        `;
        contentDiv.appendChild(tokenDiv);
    }
    
    if (provider && type === 'ai') {
        const meta = document.createElement('div');
        meta.className = 'message-meta';
        meta.textContent = `via ${provider}`;
        contentDiv.appendChild(meta);
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    
    chatContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Add loading indicator
function addLoadingIndicator(customText = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    messageDiv.id = 'loadingMessage';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (customText) {
        const textDiv = document.createElement('div');
        textDiv.textContent = customText;
        textDiv.style.marginBottom = '8px';
        textDiv.style.fontSize = '14px';
        textDiv.style.color = 'var(--text-secondary)';
        contentDiv.appendChild(textDiv);
    }
    
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = '<span></span><span></span><span></span>';
    
    contentDiv.appendChild(loading);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    
    chatContainer.appendChild(messageDiv);
    scrollToBottom();
    
    return messageDiv;
}

// Add error message
function addErrorMessage(errorText) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = `⚠️ ${errorText}`;
    
    chatContainer.appendChild(errorDiv);
    scrollToBottom();
}

// Update button state
function updateButtonState() {
    sendButton.disabled = isProcessing;
    sendButton.querySelector('.button-text').textContent = isProcessing ? 'Sending...' : 'Send';
}

// Scroll to bottom of chat
function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Handle Enter key (without Shift for submit)
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
    }
});

// Plan Mode UI Functions
function showPlanModeActivation() {
    const activationDiv = document.createElement('div');
    activationDiv.className = 'plan-mode-activation';
    activationDiv.innerHTML = `
        <div class="plan-mode-icon">📋</div>
        <h3>Plan Mode Activated</h3>
        <p>I'll gather requirements through our conversation and produce a comprehensive final document when ready.</p>
        <div class="plan-mode-steps">
            <div class="step">1️⃣ Tell me about your needs</div>
            <div class="step">2️⃣ I'll ask clarifying questions</div>
            <div class="step">3️⃣ I'll produce a final document</div>
        </div>
    `;
    chatContainer.appendChild(activationDiv);
    scrollToBottom();
}

function showPlanModeComplete() {
    setTimeout(() => {
        const completeDiv = document.createElement('div');
        completeDiv.className = 'plan-mode-complete';
        completeDiv.innerHTML = `
            <div class="complete-icon">✅</div>
            <p><strong>Final document delivered!</strong></p>
            <button class="exit-plan-mode-btn" onclick="exitPlanMode()">Exit Plan Mode</button>
        `;
        chatContainer.appendChild(completeDiv);
        scrollToBottom();
    }, 500);
}

function exitPlanMode() {
    planMode = false;
    conversationHistory = [];
    updatePlanModeUI();
    
    const exitMsg = document.createElement('div');
    exitMsg.className = 'plan-mode-exit';
    exitMsg.innerHTML = `<p>👋 Exited Plan Mode. Send "Plan mode" to start again.</p>`;
    chatContainer.appendChild(exitMsg);
    scrollToBottom();
}

function updatePlanModeUI() {
    const header = document.querySelector('header');
    if (planMode) {
        header.classList.add('plan-mode-active');
        if (!document.getElementById('planModeBadge')) {
            const badge = document.createElement('div');
            badge.id = 'planModeBadge';
            badge.className = 'plan-mode-badge';
            badge.innerHTML = '📋 Plan Mode Active';
            header.appendChild(badge);
        }
    } else {
        header.classList.remove('plan-mode-active');
        const badge = document.getElementById('planModeBadge');
        if (badge) badge.remove();
    }
}

// Token Test Results Display
function showTokenTestResults(data) {
    const testDiv = document.createElement('div');
    testDiv.className = 'token-test-results';
    
    // Header
    const header = document.createElement('div');
    header.className = 'test-header';
    header.innerHTML = `
        <div class="test-title">
            <span class="test-icon">📊</span>
            <h3>Token Limit Testing Results</h3>
        </div>
        <div class="test-subtitle">Model: ${data.provider} | Context Limit: ${data.modelLimit.toLocaleString()} tokens</div>
    `;
    testDiv.appendChild(header);
    
    // Test Cases
    const casesDiv = document.createElement('div');
    casesDiv.className = 'test-cases';
    
    data.results.forEach((result, index) => {
        const caseDiv = document.createElement('div');
        caseDiv.className = `test-case ${result.status}`;
        
        const statusIcon = result.status === 'success' ? '✅' : '❌';
        const statusClass = result.status === 'success' ? 'status-success' : 'status-error';
        
        let tokenBar = '';
        if (result.tokenUsage) {
            const percentClass = result.tokenUsage.percentUsed < 5 ? 'low' : result.tokenUsage.percentUsed < 25 ? 'medium' : 'high';
            tokenBar = `
                <div class="test-token-usage">
                    <div class="test-token-stats">
                        <span>Input: ${result.tokenUsage.input.toLocaleString()}</span>
                        <span>Output: ${result.tokenUsage.output.toLocaleString()}</span>
                        <span><strong>Total: ${result.tokenUsage.total.toLocaleString()}</strong></span>
                    </div>
                    <div class="token-bar-container">
                        <div class="token-bar ${percentClass}" style="width: ${Math.min(result.tokenUsage.percentUsed, 100)}%"></div>
                    </div>
                    <div class="token-percent">${result.tokenUsage.percentUsed}% of context limit</div>
                </div>
            `;
        }
        
        caseDiv.innerHTML = `
            <div class="test-case-header">
                <span class="test-number">Test ${index + 1}</span>
                <span class="test-status ${statusClass}">${statusIcon} ${result.status.toUpperCase()}</span>
            </div>
            <h4>${result.name}</h4>
            <p class="test-description">${result.description}</p>
            <div class="test-prompt">
                <strong>Prompt:</strong>
                <code>${result.prompt}</code>
            </div>
            ${result.status === 'success' ? `
                <div class="test-response">
                    <strong>Response:</strong>
                    <p>${result.response}</p>
                    <div class="test-timing">⏱️ Response Time: ${result.responseTime}ms</div>
                </div>
            ` : `
                <div class="test-error">
                    <strong>Error:</strong>
                    <p>${result.error}</p>
                </div>
            `}
            ${tokenBar}
            <div class="test-behavior">
                <strong>Expected Behavior:</strong> ${result.expectedBehavior}
            </div>
        `;
        
        casesDiv.appendChild(caseDiv);
    });
    
    testDiv.appendChild(casesDiv);
    
    // Analysis
    const analysisDiv = document.createElement('div');
    analysisDiv.className = 'test-analysis';
    analysisDiv.innerHTML = `
        <h4>📚 Key Learnings</h4>
        <div class="learning-grid">
            <div class="learning-item">
                <strong>Short Prompts</strong>
                <p>Use minimal tokens, respond quickly, and are cost-effective. Best for simple queries where context isn't needed.</p>
            </div>
            <div class="learning-item">
                <strong>Long Prompts</strong>
                <p>Consume more tokens and take longer to process, but provide richer context leading to more detailed responses.</p>
            </div>
            <div class="learning-item">
                <strong>Context Limits</strong>
                <p>Exceeding the model's context window (${data.modelLimit.toLocaleString()} tokens for GPT-4o) results in errors. Always monitor token usage.</p>
            </div>
        </div>
    `;
    testDiv.appendChild(analysisDiv);
    
    chatContainer.appendChild(testDiv);
    scrollToBottom();
}

// Temperature Comparison Display
function showTemperatureComparison(data) {
    const comparisonDiv = document.createElement('div');
    comparisonDiv.className = 'temperature-comparison';
    
    // Header
    const header = document.createElement('div');
    header.className = 'comparison-header';
    header.innerHTML = `
        <div class="comparison-title">
            <span class="comparison-icon">🌡️</span>
            <h3>Temperature Comparison Results</h3>
        </div>
        <div class="comparison-subtitle">Same prompt, different temperatures</div>
    `;
    comparisonDiv.appendChild(header);
    
    // Results Grid
    const resultsGrid = document.createElement('div');
    resultsGrid.className = 'comparison-grid';
    
    data.results.forEach(result => {
        const resultCard = document.createElement('div');
        resultCard.className = 'comparison-card';
        
        const tempValue = result.temperature === 0 ? '0' : result.temperature === 0.7 ? '0.7' : '1.2';
        const colorClass = result.temperature === 0 ? 'temp-low' : result.temperature === 0.7 ? 'temp-medium' : 'temp-high';
        
        resultCard.innerHTML = `
            <div class="temp-header ${colorClass}">
                <div class="temp-value">Temperature: ${tempValue}</div>
                <div class="temp-label">${result.temperature === 0 ? '❄️ Cold' : result.temperature === 0.7 ? '⚖️ Balanced' : '🔥 Hot'}</div>
            </div>
            <div class="temp-characteristics">${result.characteristics}</div>
            <div class="temp-response">${result.response}</div>
        `;
        
        resultsGrid.appendChild(resultCard);
    });
    
    comparisonDiv.appendChild(resultsGrid);
    
    // Analysis Section
    const analysisDiv = document.createElement('div');
    analysisDiv.className = 'comparison-analysis';
    analysisDiv.innerHTML = `
        <h4>📊 Understanding Temperature Settings</h4>
        <div class="analysis-grid">
            <div class="analysis-item">
                <strong>Temperature 0 (❄️)</strong>
                <p>Deterministic and consistent. Best for: factual questions, math problems, code generation, technical documentation.</p>
            </div>
            <div class="analysis-item">
                <strong>Temperature 0.7 (⚖️)</strong>
                <p>Balanced approach. Best for: general conversation, explanations, creative writing with structure, Q&A.</p>
            </div>
            <div class="analysis-item">
                <strong>Temperature 1.2 (🔥)</strong>
                <p>Creative and diverse. Best for: brainstorming, storytelling, poetry, exploring different perspectives.</p>
            </div>
        </div>
    `;
    comparisonDiv.appendChild(analysisDiv);
    
    chatContainer.appendChild(comparisonDiv);
    scrollToBottom();
}

