// DOM Elements
const chatContainer = document.getElementById('chatContainer');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');

// State
let isProcessing = false;

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
    
    // Add loading indicator
    const loadingDiv = addLoadingIndicator();
    
    // Disable input while processing
    isProcessing = true;
    updateButtonState();
    
    try {
        // Make API call
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        // Remove loading indicator
        loadingDiv.remove();
        
        if (data.success) {
            addMessage(data.response, 'ai', data.provider);
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
function addMessage(text, type, provider = null) {
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
function addLoadingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    messageDiv.id = 'loadingMessage';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
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

