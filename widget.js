/**
 * Chatbot Widget - Đoàn Viên
 * Text-only, fast responses using knowledge base
 */

(function() {
    'use strict';

    const CONFIG = {
        API_BASE: window.CHATBOT_API_BASE || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : 'https://ai-supporter-vn-backend.onrender.com'),
        API_PATH: '/api/chat'
    };
    
    let isOpen = false, isLoading = false;
    
    const toggleBtn = document.getElementById('chat-widget-toggle');
    const container = document.getElementById('chat-widget-container');
    const closeBtn = document.getElementById('chat-widget-close');
    const messagesArea = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    
    function init() {
        if (!toggleBtn || !container) return;
        toggleBtn.addEventListener('click', toggleWidget);
        closeBtn.addEventListener('click', closeWidget);
        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) closeWidget(); });
    }
    
    function toggleWidget() { isOpen ? closeWidget() : openWidget(); }
    function openWidget() {
        isOpen = true;
        container.classList.add('open');
        toggleBtn.classList.add('open');
        chatInput.focus();
    }
    function closeWidget() { isOpen = false; container.classList.remove('open'); toggleBtn.classList.remove('open'); }
    
    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text || isLoading) return;
        chatInput.value = '';
        sendBtn.disabled = true;
        isLoading = true;
        addMessage(text, 'user');
        const typingId = showTypingIndicator();
        try {
            const response = await sendToAPI({ text });
            removeTypingIndicator(typingId);
            if (response.text) {
                addMessage(response.text, 'ai');
            } else if (response.error) {
                addMessage('Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.', 'ai', true);
            }
        } catch (error) {
            console.error('Error:', error);
            removeTypingIndicator(typingId);
            addMessage('Xin lỗi, có lỗi kết nối. Vui lòng thử lại sau.', 'ai', true);
        } finally {
            isLoading = false;
            sendBtn.disabled = false;
            chatInput.focus();
        }
    }
    
    async function sendToAPI(data) {
        const url = CONFIG.API_BASE.replace(/\/$/, '') + CONFIG.API_PATH;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    }
    
    function addMessage(text, sender, isError = false) {
        if (!text) return;
        const div = document.createElement('div');
        div.className = `message ${sender}${isError ? ' error' : ''}`;
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        if (sender === 'ai') {
            const img = document.createElement('img');
            img.src = 'avatar.png';
            img.alt = 'Avatar';
            avatar.appendChild(img);
        }
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = text;
        div.appendChild(avatar);
        div.appendChild(bubble);
        messagesArea.appendChild(div);
        scrollToBottom();
    }
    
    function showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'message ai';
        div.innerHTML = '<div class="message-avatar"><img src="avatar.png" alt="Avatar"></div><div class="message-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>';
        messagesArea.appendChild(div);
        scrollToBottom();
        return id;
    }
    
    function removeTypingIndicator(id) { const el = document.getElementById(id); if (el) el.remove(); }
    function scrollToBottom() { messagesArea.scrollTop = messagesArea.scrollHeight; }
    
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
