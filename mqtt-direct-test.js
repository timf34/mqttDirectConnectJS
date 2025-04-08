// mqtt-direct-test.js
// A simple Node.js script to test direct MQTT connection
const mqtt = require('mqtt');
const { v4: uuidv4 } = require('uuid');

// Configuration
const config = {
  // For AWS IoT Core:
  // brokerUrl: 'wss://your-iot-endpoint.iot.region.amazonaws.com/mqtt',
  
  // For testing, you can use a public MQTT broker like HiveMQ's public broker:
  brokerUrl: 'mqtt://broker.hivemq.com:1883',
  
  // For production, use your own broker with authentication:
  // brokerUrl: 'mqtt://your-broker-address:1883',
  // username: 'your-username',
  // password: 'your-password',
  
  clientId: `field-of-vision-client-${uuidv4()}`,
  topic: 'field-of-vision/test/data',
  qos: 1,
  
  // How often to send test messages (in milliseconds)
  interval: 3000
};

// Create MQTT client with connection options
const options = {
  clientId: config.clientId,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000
};

// Add authentication if configured
if (config.username && config.password) {
  options.username = config.username;
  options.password = config.password;
}

// Connect to the broker
console.log(`Connecting to MQTT broker at ${config.brokerUrl}...`);
const client = mqtt.connect(config.brokerUrl, options);

// Handle connection events
client.on('connect', () => {
  console.log('Connected to MQTT broker!');
  console.log(`Publishing messages to topic: ${config.topic}`);
  
  // Start sending test messages at regular intervals
  startSendingTestData();
});

client.on('error', (error) => {
  console.error('Connection error:', error);
});

client.on('reconnect', () => {
  console.log('Attempting to reconnect to MQTT broker...');
});

client.on('close', () => {
  console.log('Connection to MQTT broker closed');
});

client.on('message', (topic, message) => {
  console.log(`Received message on topic ${topic}: ${message.toString()}`);
});

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
function startSendingTestData() {
  // Subscribe to our own topic to see the messages we send
  client.subscribe(config.topic, { qos: config.qos }, (err) => {
    if (!err) {
      console.log(`Subscribed to ${config.topic}`);
    } else {
      console.error('Subscribe error:', err);
    }
  });
  
  // Send an initial test message
  sendTestMessage();
  
  // Set up interval to send test messages regularly
  setInterval(sendTestMessage, config.interval);
}

// Function to send a single test message
function sendTestMessage() {
  const testData = generateTestData();
  const message = JSON.stringify(testData);
  
  client.publish(config.topic, message, { qos: config.qos }, (err) => {
    if (!err) {
      console.log(`Published: ${message}`);
    } else {
      console.error('Publish error:', err);
    }
  });
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('Disconnecting from MQTT broker...');
  client.end();
  process.exit();
});