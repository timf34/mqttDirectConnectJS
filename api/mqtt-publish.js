// api/mqtt-publish.js
const awsIot = require('aws-iot-device-sdk');

// Environment variables configured in Vercel dashboard
// Note: we have them stored in base64 for Vercel 
const AWS_IOT_KEY = Buffer.from(process.env.AWS_IOT_KEY_BASE64, 'base64').toString();
const AWS_IOT_CERT = Buffer.from(process.env.AWS_IOT_CERT_BASE64, 'base64').toString();
const AWS_IOT_CA = Buffer.from(process.env.AWS_IOT_CA_BASE64, 'base64').toString();

module.exports = async (req, res) => {
  // CORS headers for browser requests
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const { topic, message } = req.body;
    if (!topic || !message) {
      return res.status(400).json({ error: 'Topic and message are required' });
    }

    // Create device with environment variables
    const device = awsIot.device({
      keyPath: AWS_IOT_KEY,
      certPath: AWS_IOT_CERT,
      caPath: AWS_IOT_CA,
      clientId: `server-${Date.now()}`,
      host: AWS_IOT_ENDPOINT,
      region: 'eu-west-1' // Change to your region
    });

    // Wait for device to connect
    await new Promise((resolve, reject) => {
      device.on('connect', resolve);
      device.on('error', reject);
      
      // Add timeout to avoid hanging
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    // Publish message
    await new Promise((resolve, reject) => {
      device.publish(topic, JSON.stringify(message), { qos: 1 }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Disconnect after sending
    device.end();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('MQTT error:', error);
    return res.status(500).json({ error: error.message });
  }
};