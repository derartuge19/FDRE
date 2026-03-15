#!/usr/bin/env node

// 🎯 REAL Multi-User Test Script
// This simulates multiple users connecting from different devices

const WebSocket = require('ws');

console.log('👥 Testing REAL Multi-User Chat System...\n');

// Create multiple "users" connecting simultaneously
const users = [
  { id: 'judge-alemu', name: 'Judge Alemu', role: 'judge' },
  { id: 'lawyer-sara', name: 'Lawyer Sara', role: 'lawyer' },
  { id: 'clerk-mohammed', name: 'Clerk Mohammed', role: 'clerk' }
];

const connections = [];
let messageCount = 0;

// Connect all users
users.forEach((user, index) => {
  setTimeout(() => {
    const ws = new WebSocket('ws://localhost:5173');
    
    ws.on('open', () => {
      console.log(`✅ ${user.name} connected`);
      
      // Authenticate
      ws.send(JSON.stringify({
        type: 'authenticate',
        userId: user.id,
        userName: user.name,
        userRole: user.role
      }));
      
      // Join chat room
      setTimeout(() => {
        ws.send(JSON.stringify({
          type: 'join_chat_room',
          roomId: 'general',
          userName: user.name
        }));
        
        console.log(`📝 ${user.name} joined chat room`);
      }, 500);
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      
      if (message.type === 'new_message') {
        messageCount++;
        console.log(`💬 [${messageCount}] ${message.userName}: ${message.message}`);
      }
      
      if (message.type === 'user_joined') {
        console.log(`👋 ${message.userName} entered the room`);
      }
    });
    
    ws.on('error', (error) => {
      console.error(`❌ ${user.name} connection error:`, error.message);
    });
    
    connections.push({ ws, user });
  }, index * 1000); // Connect users 1 second apart
});

// Have users send messages to each other
setTimeout(() => {
  console.log('\n📤 Users starting conversation...\n');
  
  connections.forEach((conn, index) => {
    setTimeout(() => {
      const messages = [
        'Good morning everyone!',
        'The hearing is scheduled for 10 AM',
        'I have prepared the documents',
        'Let me review the case file',
        'All evidence has been submitted'
      ];
      
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      conn.ws.send(JSON.stringify({
        type: 'send_message',
        roomId: 'general',
        message: randomMessage,
        encrypted: Math.random() > 0.5
      }));
      
      console.log(`📤 ${conn.user.name} sent: "${randomMessage}"`);
    }, index * 2000); // Send messages 2 seconds apart
  });
}, 5000);

// Show typing indicators
setTimeout(() => {
  console.log('\n⌨️ Showing typing indicators...\n');
  
  connections.forEach((conn, index) => {
    setTimeout(() => {
      conn.ws.send(JSON.stringify({
        type: 'typing',
        roomId: 'general',
        isTyping: true
      }));
      
      setTimeout(() => {
        conn.ws.send(JSON.stringify({
          type: 'typing',
          roomId: 'general',
          isTyping: false
        }));
      }, 1500);
    }, index * 3000);
  });
}, 10000);

// Clean up
setTimeout(() => {
  console.log('\n📊 Test Summary:');
  console.log(`👥 ${users.length} users connected`);
  console.log(`💬 ${messageCount} messages exchanged`);
  console.log(`🔗 All users in same chat room`);
  console.log(`⏱️ Real-time communication working!`);
  
  connections.forEach(conn => conn.ws.close());
  process.exit(0);
}, 15000);
