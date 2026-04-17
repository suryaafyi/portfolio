document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('chatbot-toggle');
  const closeBtn = document.getElementById('chatbot-close');
  const panel = document.getElementById('chatbot-panel');
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const suggestedPrompts = document.getElementById('suggested-prompts');

  // --- UI Interactions ---

  // Open chat
  toggleBtn.addEventListener('click', () => {
    panel.classList.remove('hidden');
    toggleBtn.parentElement.classList.add('hidden');
    chatInput.focus();
  });

  // Close chat
  closeBtn.addEventListener('click', () => {
    panel.classList.add('hidden');
    toggleBtn.parentElement.classList.remove('hidden');
  });

  // Handle suggestion clicks
  if (suggestedPrompts) {
    suggestedPrompts.addEventListener('click', (e) => {
      if (e.target.classList.contains('prompt-pill')) {
        const text = e.target.innerText;
        handleSend(text);
        // Remove suggestions after first use to clear clutter
        suggestedPrompts.remove();
      }
    });
  }

  // Send via button
  sendBtn.addEventListener('click', () => {
    const text = chatInput.value.trim();
    if (text) handleSend(text);
  });

  // Send via Enter key
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const text = chatInput.value.trim();
      if (text) handleSend(text);
    }
  });

  // --- Chat Logic ---

  async function handleSend(promptText) {
    // Clear input
    chatInput.value = '';

    // Append user message
    appendMessage('user', promptText);

    // Hide suggested prompts if they still exist
    if (document.getElementById('suggested-prompts')) {
      document.getElementById('suggested-prompts').style.display = 'none';
    }

    // Show loading
    const loadingId = showLoading();

    try {
      const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000/chat' 
        : '/api/chat';

      // Send to backend API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: promptText })
      });

      const data = await response.json();

      // Remove loading
      removeLoading(loadingId);

      if (response.ok && data.reply) {
        appendMessage('bot', data.reply, data.followUp);
      } else {
        appendMessage('bot', "Oops, something went wrong on my end. Try asking again.");
      }
    } catch (error) {
      removeLoading(loadingId);
      appendMessage('bot', "Network error. Make sure you are connected to the internet.");
    }
  }

  // --- Helpers ---

  function appendMessage(sender, text, followUpText = null) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('msg-content');

    // Basic markdown parsing for bold text (**text**) and line breaks
    let parsedText = text
      .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
      .replace(/\\n/g, '<br>');

    if (sender === 'bot') {
      // Highlight Keywords
      const keywords = ["timeline", "family graph", "smart nudges", "vault", "privacy", "research", "testing"];
      keywords.forEach(kw => {
        const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
        parsedText = parsedText.replace(regex, '<span class="highlight">$1</span>');
      });

      msgDiv.appendChild(contentDiv);
      chatMessages.appendChild(msgDiv);
      
      // Stream the text like a real chatbot
      typeMessage(parsedText, contentDiv, 15, () => {
        if (followUpText && followUpText.trim() !== "") {
          addFollowUpChip(followUpText, msgDiv);
        }
      });
    } else {
      contentDiv.innerHTML = parsedText;
      msgDiv.appendChild(contentDiv);
      chatMessages.appendChild(msgDiv);
      scrollToBottom();
    }
  }

  function typeMessage(html, element, speed = 15, onComplete) {
    let i = 0;
    function typing() {
      if (i < html.length) {
        if (html.charAt(i) === '<') {
          const tagEnd = html.indexOf('>', i);
          if (tagEnd !== -1) {
            element.innerHTML += html.substring(i, tagEnd + 1);
            i = tagEnd + 1;
          } else {
            element.innerHTML += html.charAt(i);
            i++;
          }
        } else {
          element.innerHTML += html.charAt(i);
          i++;
        }
        scrollToBottom();
        setTimeout(typing, speed);
      } else if (onComplete) {
        onComplete();
      }
    }
    typing();
  }

  function addFollowUpChip(text, parentDiv) {
    const chip = document.createElement('button');
    chip.classList.add('followup-chip');
    chip.innerText = text;
    chip.addEventListener('click', () => {
      handleSend(text);
      chip.remove();
    });
    
    // Add chip with fade-in effect
    chip.style.opacity = 0;
    chip.style.transform = 'translateY(5px)';
    parentDiv.appendChild(chip);
    
    setTimeout(() => {
      chip.style.transition = 'all 0.3s ease';
      chip.style.opacity = 1;
      chip.style.transform = 'translateY(0)';
      scrollToBottom();
    }, 50);
  }

  function showLoading() {
    const id = 'loading-' + Date.now();
    const loadDiv = document.createElement('div');
    loadDiv.id = id;
    loadDiv.classList.add('typing-indicator');
    loadDiv.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(loadDiv);
    scrollToBottom();
    return id;
  }

  function removeLoading(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});
