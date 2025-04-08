// mqtt-aws-test.js
// Node.js script to test direct MQTT connection to AWS IoT Core
const awsIot = require('aws-iot-device-sdk');
const fs = require('fs');
const path = require('path');

// AWS IoT Core Configuration
const config = {
  // Your AWS IoT Core endpoint (from AWS IoT Core console)
  host: 'your-iot-endpoint.iot.region.amazonaws.com',
  
  // Path to your AWS IoT Core credentials
  // These files should be downloaded from AWS IoT Core when you create a thing
  keyPath: path.join(__dirname, 'certs/private.pem.key'),
  certPath: path.join(__dirname, 'certs/certificate.pem.crt'),
  caPath: path.join(__dirname, 'certs/amazon-root-ca-1.pem'),
  
  clientId: 'field-of-vision-client',
  region: 'eu-west-1', // Change to your AWS region
  
  // The topic to publish to (same as what your devices are subscribed to)
  topic: 'aviva_IRL/sub',
  
  // How often to send test messages (in milliseconds)
  interval: 3000
};

// Create a device with the configuration
console.log('Creating AWS IoT device...');

try {
  // Check if certificate files exist before trying to connect
  if (!fs.existsSync(config.keyPath)) {
    console.error(`Private key not found at ${config.keyPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(config.certPath)) {
    console.error(`Certificate not found at ${config.certPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(config.caPath)) {
    console.error(`CA certificate not found at ${config.caPath}`);
    process.exit(1);
  }
  
  const device = awsIot.device({
    keyPath: config.keyPath,
    certPath: config.certPath,
    caPath: config.caPath,
    clientId: config.clientId,
    host: config.host,
    region: config.region
  });

  // Handle connection events
  device.on('connect', () => {
    console.log('Connected to AWS IoT Core!');
    console.log(`Publishing messages to topic: ${config.topic}`);
    
    // Start sending test messages at regular intervals
    startSendingTestData(device);
  });

  device.on('error', (error) => {
    console.error('Connection error:', error);
  });

  device.on('reconnect', () => {
    console.log('Attempting to reconnect to AWS IoT Core...');
  });

  device.on('offline', () => {
    console.log('Device is offline');
  });

  device.on('close', () => {
    console.log('Connection to AWS IoT Core closed');
  });

  device.on('message', (topic, payload) => {
    console.log(`Received message on topic ${topic}: ${payload.toString()}`);
  });

} catch (err) {
  console.error('Error creating AWS IoT device:', err);
  process.exit(1);
}

// Function to generate test data similar to your Field of Vision format
function generateTestData() {
  return {
    T: parseFloat((Date.now() / 1000).toFixed(2)),
    X: parseFloat((Math.random() * 102).toFixed(2)),
    Y: parseFloat((Math.random() * 64).toFixed(2)),
    P: Math.random() > 0.5 ? 1 : 0,
    Pa: Math.random() > 0.8 ? 1 : 0,
    G: Math.random() > 0.95 ? 1 : 0,
    C: Math.random() > 0.95 ? 1 : 0,
    R: Math.random() > 0.9 ? 1 : 0,
    S: Math.random() > 0.9 ? 1 : 0
  };
}

// Function to start sending test data at regular intervals
function startSendingTestData(device) {
  // Subscribe to our own topic to see the messages we send
  device.subscribe(config.topic, { qos: 1 }, (err, granted) => {
    if (!err) {
      console.log(`Subscribed to ${config.topic}`);
    } else {
      console.error('Subscribe error:', err);
    }
  });
  
  // Send an initial test message
  sendTestMessage(device);
  
  // Set up interval to send test messages regularly
  setInterval(() => sendTestMessage(device), config.interval);
}

// Function to send a single test message
function sendTestMessage(device) {
  const testData = generateTestData();
  const message = JSON.stringify(testData);
  
  device.publish(config.topic, message, { qos: 1 }, (err) => {
    if (!err) {
      console.log(`Published: ${message}`);
    } else {
      console.error('Publish error:', err);
    }
  });
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('Disconnecting from AWS IoT Core...');
  process.exit();
});