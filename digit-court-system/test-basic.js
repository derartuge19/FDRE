#!/usr/bin/env node

// 🧪 SIMPLE TEST - Just check if WebSocket works
const WebSocket = require('ws');

console.log('🔍 Testing basic WebSocket connection...');

const ws = new WebSocket('ws://localhost:5173');

ws.on('open', () => {
    console.log('✅ WebSocket connected successfully');
    
    // Test authentication
    ws.send(JSON.stringify({
        type: 'authenticate',
        userId: 'test-user',
        userName: 'Test User',
        userRole: 'test'
    }));
    
    console.log('📤 Sent authentication message');
});

ws.on('message', (data) => {
    const message = JSON.parse(data);
    console.log('📥 Received:', message.type);
    
    if (message.type === 'connection_established') {
        console.log('✅ Server responded correctly');
        ws.close();
    }
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
});

ws.on('close', () => {
    console.log('🔌 Connection closed');
    process.exit(0);
});

// Timeout after 5 seconds
setTimeout(() => {
    console.log('⏰ Test timeout - checking if server is running');
    ws.close();
    process.exit(1);
}, 5000);
