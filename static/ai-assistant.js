// AI Assistant JavaScript
class AIAssistant {
    constructor() {
        this.isDialogOpen = false;
        this.isLoading = false;
        this.factInterval = null;
        this.init();
    }

    init() {
        this.createAssistantHTML();
        this.bindEvents();
        this.startRandomFacts();
    }

    createAssistantHTML() {
        const assistantHTML = `
            <div class="ai-assistant" id="aiAssistant">
                <div class="ai-chat-bubble" id="aiChatBubble"></div>
                <div class="ai-assistant-pikachu" id="aiPikachu">
                    <img src="/images/pikachu.png" alt="Poké-Pal">
                </div>
            </div>
            
            <div class="ai-chat-dialog" id="aiChatDialog">
                <div class="ai-chat-header">
                    <span>💬 Chat with Poké-Pal</span>
                    <button class="ai-chat-close" id="aiChatClose">&times;</button>
                </div>
                <div class="ai-chat-messages" id="aiChatMessages">
                    <div class="ai-message assistant">
                        <div class="ai-message-avatar">🤖</div>
                        <div class="ai-message-content">
                            Hi there, trainer! I'm Poké-Pal, your AI companion! Ask me anything about Pokémon - from battle strategies to Pokédex entries. How can I help you today?
                        </div>
                    </div>
                </div>
                <div class="ai-chat-input-container">
                    <input type="text" class="ai-chat-input" id="aiChatInput" placeholder="Ask me about Pokémon..." maxlength="500">
                    <button class="ai-chat-send" id="aiChatSend">Send</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', assistantHTML);
    }

    bindEvents() {
        const pikachu = document.getElementById('aiPikachu');
        const chatDialog = document.getElementById('aiChatDialog');
        const chatClose = document.getElementById('aiChatClose');
        const chatInput = document.getElementById('aiChatInput');
        const chatSend = document.getElementById('aiChatSend');
        const chatBubble = document.getElementById('aiChatBubble');

        // Toggle chat dialog
        pikachu.addEventListener('click', () => {
            this.toggleDialog();
        });

        // Close dialog
        chatClose.addEventListener('click', () => {
            this.closeDialog();
        });

        // Send message on button click
        chatSend.addEventListener('click', () => {
            this.sendMessage();
        });

        // Send message on Enter key
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isLoading) {
                this.sendMessage();
            }
        });

        // Hide bubble when clicking on it
        chatBubble.addEventListener('click', () => {
            this.hideBubble();
        });

        // Close dialog when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isDialogOpen && 
                !chatDialog.contains(e.target) && 
                !pikachu.contains(e.target)) {
                this.closeDialog();
            }
        });
    }

    toggleDialog() {
        const chatDialog = document.getElementById('aiChatDialog');
        
        if (this.isDialogOpen) {
            this.closeDialog();
        } else {
            this.openDialog();
        }
    }

    openDialog() {
        const chatDialog = document.getElementById('aiChatDialog');
        const chatInput = document.getElementById('aiChatInput');
        
        chatDialog.classList.add('show');
        this.isDialogOpen = true;
        this.hideBubble();
        
        // Focus on input
        setTimeout(() => {
            chatInput.focus();
        }, 100);
    }

    closeDialog() {
        const chatDialog = document.getElementById('aiChatDialog');
        
        chatDialog.classList.remove('show');
        this.isDialogOpen = false;
    }

    async sendMessage() {
        const chatInput = document.getElementById('aiChatInput');
        const message = chatInput.value.trim();
        
        if (!message || this.isLoading) return;
        
        // Add user message
        this.addMessage(message, 'user');
        chatInput.value = '';
        
        // Show loading
        this.setLoading(true);
        
        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.addMessage(data.response, 'assistant');
            } else {
                this.addMessage('Sorry, I encountered an error. Please try again later.', 'assistant');
            }
        } catch (error) {
            console.error('AI Chat Error:', error);
            this.addMessage('Sorry, I\'m having trouble connecting right now. Please try again later.', 'assistant');
        } finally {
            this.setLoading(false);
        }
    }

    addMessage(content, sender) {
        const messagesContainer = document.getElementById('aiChatMessages');
        const avatar = sender === 'user' ? '👤' : '🤖';
        
        const messageHTML = `
            <div class="ai-message ${sender}">
                <div class="ai-message-avatar">${avatar}</div>
                <div class="ai-message-content">${this.escapeHtml(content)}</div>
            </div>
        `;
        
        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    setLoading(loading) {
        const chatSend = document.getElementById('aiChatSend');
        const chatInput = document.getElementById('aiChatInput');
        
        this.isLoading = loading;
        chatSend.disabled = loading;
        chatInput.disabled = loading;
        
        if (loading) {
            const messagesContainer = document.getElementById('aiChatMessages');
            const loadingHTML = `
                <div class="ai-message assistant" id="loadingMessage">
                    <div class="ai-message-avatar">🤖</div>
                    <div class="ai-message-content">
                        <div class="ai-loading">Thinking...</div>
                    </div>
                </div>
            `;
            messagesContainer.insertAdjacentHTML('beforeend', loadingHTML);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else {
            const loadingMessage = document.getElementById('loadingMessage');
            if (loadingMessage) {
                loadingMessage.remove();
            }
        }
    }

    async showRandomFact() {
        if (this.isDialogOpen) return;
        
        try {
            const response = await fetch('/api/ai/random-fact');
            const data = await response.json();
            
            if (data.success) {
                this.showBubble(data.fact);
            }
        } catch (error) {
            console.error('Random Fact Error:', error);
        }
    }

    showBubble(text) {
        const chatBubble = document.getElementById('aiChatBubble');
        
        chatBubble.textContent = text;
        chatBubble.classList.add('show');
        
        // Auto hide after 15 seconds
        setTimeout(() => {
            this.hideBubble();
        }, 20000);
    }

    hideBubble() {
        const chatBubble = document.getElementById('aiChatBubble');
        chatBubble.classList.remove('show');
    }

    startRandomFacts() {
        // Show first fact after 5 seconds
        setTimeout(() => {
            this.showRandomFact();
        }, 5000);
        
        // Then show facts every 30-60 seconds
        this.factInterval = setInterval(() => {
            const randomDelay = Math.random() * 30000 + 30000; // 30-60 seconds
            setTimeout(() => {
                this.showRandomFact();
            }, randomDelay);
        }, 60000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    destroy() {
        if (this.factInterval) {
            clearInterval(this.factInterval);
        }
        
        const assistant = document.getElementById('aiAssistant');
        const dialog = document.getElementById('aiChatDialog');
        
        if (assistant) assistant.remove();
        if (dialog) dialog.remove();
    }
}

// Initialize AI Assistant when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in (session exists)
    if (document.body.dataset.userLoggedIn !== 'false') {
        window.aiAssistant = new AIAssistant();
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (window.aiAssistant) {
        window.aiAssistant.destroy();
    }
});