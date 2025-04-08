// public/index.js
document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.getElementById('sendButton');
    
    sendButton.addEventListener('click', async () => {
      try {
        // Field of Vision message format from your original code
        const message = {
          T: Date.now() / 1000,
          X: Math.random() * 102,
          Y: Math.random() * 64,
          P: Math.random() > 0.5 ? 1 : 0,
          Pa: Math.random() > 0.8 ? 1 : 0,
          G: Math.random() > 0.95 ? 1 : 0,
          C: Math.random() > 0.95 ? 1 : 0,
          R: Math.random() > 0.9 ? 1 : 0,
          S: Math.random() > 0.9 ? 1 : 0
        };
        
        // Send to your serverless function
        const response = await fetch('/api/mqtt-publish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            topic: 'aviva_IRL/sub',
            message: message
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          console.log('Message sent successfully!');
        } else {
          console.error('Failed to send message:', data.error);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });
  });