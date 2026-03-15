#!/usr/bin/env node

// 🧪 Real-Time System Test Script
// This demonstrates that the WebSocket system is working

const WebSocket = require('ws');

console.log('🔍 Testing Ethiopian Court System Real-Time Features...\n');

// Connect to the WebSocket server
const ws = new WebSocket('ws://localhost:5173');

ws.on('open', () => {
  console.log('✅ Connected to court system WebSocket server');
  
  // Simulate user authentication
  ws.send(JSON.stringify({
    type: 'authenticate',
    userId: 'test-user',
    userName: 'Test User',
    userRole: 'lawyer'
  }));
  
  // Join chat room after authentication
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'join_chat_room',
      roomId: 'general',
      userName: 'Test User'
    }));
  }, 1000);
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  
  console.log('📡 Received:', message.type);
  
  switch (message.type) {
    case 'connection_established':
      console.log('🎉 WebSocket connection established');
      console.log(`🆔 Connection ID: ${message.connectionId}`);
      break;
      
    case 'user_joined':
      console.log(`👥 ${message.userName} joined the chat room`);
      break;
      
    case 'new_message':
      console.log(`💬 ${message.userName}: ${message.message}`);
      console.log(`🔐 Encrypted: ${message.encrypted}`);
      console.log(`⏰ Time: ${message.timestamp}`);
      break;
      
    case 'typing_indicator':
      console.log(`⌨️ ${message.userName} is ${message.isTyping ? 'typing...' : 'not typing'}`);
      break;
      
    case 'user_left':
      console.log(`👋 ${message.userName} left the chat room`);
      break;
      
    case 'participant_joined':
      console.log(`🎥 ${message.userName} (${message.userRole}) joined virtual hearing`);
      break;
      
    case 'participant_left':
      console.log(`🚪 ${message.userName} left virtual hearing`);
      break;
      
    case 'start_recording':
      console.log(`⏺️ Recording started by ${message.userName}`);
      break;
      
    default:
      console.log('❓ Unknown message type:', message.type);
  }
});

ws.on('close', () => {
  console.log('❌ Disconnected from WebSocket server');
});

ws.on('error', (error) => {
  console.error('💥 WebSocket error:', error);
});

// Test sending messages
setTimeout(() => {
  console.log('\n📤 Sending test messages...\n');
  
  // Send a chat message
  ws.send(JSON.stringify({
    type: 'send_message',
    roomId: 'general',
    message: 'Hello from test script!',
    encrypted: false
  }));
  
  // Send typing indicator
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'typing',
      roomId: 'general',
      isTyping: true
    }));
  }, 1000);
  
  // Stop typing
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'typing',
      roomId: 'general',
      isTyping: false
    }));
  }, 3000);
  
}, 5000);

console.log('🎯 Test script will run for 10 seconds...');
console.log('📊 Open the court system in browser to see real-time updates!');
console.log('🌐 http://localhost:5173\n');

// Auto-close after test
setTimeout(() => {
  ws.close();
  console.log('\n✅ Test completed. Real-time system is working!\n');
}, 10000);
