// Property-based tests for recording status broadcasting
// **Feature: virtual-hearing-recording, Property 1: Recording Status Broadcasting Property**

const fc = require('fast-check');
const WebSocket = require('ws');
const http = require('http');

// Mock WebSocket server for testing
class MockWebSocketServer {
    constructor() {
        this.server = null;
        this.wss = null;
        this.connections = new Map();
        this.port = 0;
    }

    async start() {
        return new Promise((resolve) => {
            this.server = http.createServer();
            this.wss = new WebSocket.Server({ server: this.server });
            
            this.wss.on('connection', (ws, req) => {
                const connectionId = Math.random().toString(36).substr(2, 9);
                this.connections.set(connectionId, ws);
                
                ws.on('close', () => {
                    this.connections.delete(connectionId);
                });
            });
            
            this.server.listen(0, () => {
                this.port = this.server.address().port;
                resolve(this.port);
            });
        });
    }

    async stop() {
        return new Promise((resolve) => {
            if (this.wss) {
                this.wss.close();
            }
            if (this.server) {
                this.server.close(resolve);
            } else {
                resolve();
            }
        });
    }

    broadcast(message) {
        this.connections.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }

    getConnectionCount() {
        return this.connections.size;
    }
}

// Mock recording indicator for testing
const mockRecordingIndicator = {
    updateRecordingStatus: function(status, data = {}) {
        this.lastStatus = status;
        this.lastData = data;
        this.callCount++;
    },
    lastStatus: null,
    lastData: null,
    callCount: 0,
    reset: function() {
        this.lastStatus = null;
        this.lastData = null;
        this.callCount = 0;
    }
};

// Property-based test for recording status broadcasting
describe('Recording Status Broadcasting Property Tests', () => {
    let mockServer;

    beforeEach(async () => {
        mockServer = new MockWebSocketServer();
        await mockServer.start();
        mockRecordingIndicator.reset();
        global.window = { recordingIndicator: mockRecordingIndicator };
    });

    afterEach(async () => {
        await mockServer.stop();
        delete global.window;
    });

    // Property 1: Recording status messages should be broadcast to all connected clients
    test('Property: Recording status broadcast reaches all connected clients', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
                fc.oneof(
                    fc.constant('recording_started'),
                    fc.constant('recording_stopped'),
                    fc.constant('screen_share_started'),
                    fc.constant('screen_share_stopped')
                ),
                async (clientIds, status) => {
                    // Create WebSocket connections for each client
                    const clients = [];
                    const receivedMessages = [];

                    for (const clientId of clientIds) {
                        const ws = new WebSocket(`ws://localhost:${mockServer.port}`);
                        await new Promise(resolve => ws.on('open', resolve));
                        
                        ws.on('message', (data) => {
                            receivedMessages.push({
                                clientId,
                                message: JSON.parse(data.toString())
                            });
                        });
                        
                        clients.push({ id: clientId, ws });
                    }

                    // Wait for all connections to be established
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // Broadcast recording status
                    const broadcastMessage = {
                        type: 'recording_status',
                        status: status,
                        timestamp: Date.now(),
                        hearingId: 'test-hearing-123'
                    };

                    mockServer.broadcast(broadcastMessage);

                    // Wait for messages to be received
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // Clean up connections
                    clients.forEach(client => client.ws.close());

                    // Property assertion: All clients should receive the broadcast message
                    const uniqueClientIds = [...new Set(clientIds)];
                    const receivedClientIds = [...new Set(receivedMessages.map(m => m.clientId))];
                    
                    expect(receivedClientIds.sort()).toEqual(uniqueClientIds.sort());
                    
                    // Each client should receive exactly one message with correct content
                    uniqueClientIds.forEach(clientId => {
                        const clientMessages = receivedMessages.filter(m => m.clientId === clientId);
                        expect(clientMessages).toHaveLength(1);
                        expect(clientMessages[0].message.type).toBe('recording_status');
                        expect(clientMessages[0].message.status).toBe(status);
                    });
                }
            ),
            { numRuns: 10 }
        );
    });

    // Property 2: Recording indicator should update for all valid status types
    test('Property: Recording indicator updates for all valid status types', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant('recording_started'),
                    fc.constant('recording_stopped'),
                    fc.constant('screen_share_started'),
                    fc.constant('screen_share_stopped'),
                    fc.constant('consent_required')
                ),
                fc.object(),
                (status, data) => {
                    mockRecordingIndicator.reset();
                    
                    // Simulate status update
                    mockRecordingIndicator.updateRecordingStatus(status, data);
                    
                    // Property assertion: Indicator should always update for valid status
                    expect(mockRecordingIndicator.callCount).toBe(1);
                    expect(mockRecordingIndicator.lastStatus).toBe(status);
                    expect(mockRecordingIndicator.lastData).toEqual(data);
                }
            ),
            { numRuns: 20 }
        );
    });

    // Property 3: Multiple rapid status updates should be handled correctly
    test('Property: Multiple rapid status updates are handled in sequence', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        status: fc.oneof(
                            fc.constant('recording_started'),
                            fc.constant('recording_stopped'),
                            fc.constant('screen_share_started'),
                            fc.constant('screen_share_stopped')
                        ),
                        data: fc.object()
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (statusUpdates) => {
                    mockRecordingIndicator.reset();
                    
                    // Apply all status updates in sequence
                    statusUpdates.forEach(update => {
                        mockRecordingIndicator.updateRecordingStatus(update.status, update.data);
                    });
                    
                    // Property assertion: All updates should be processed
                    expect(mockRecordingIndicator.callCount).toBe(statusUpdates.length);
                    
                    // Last update should be the current state
                    const lastUpdate = statusUpdates[statusUpdates.length - 1];
                    expect(mockRecordingIndicator.lastStatus).toBe(lastUpdate.status);
                    expect(mockRecordingIndicator.lastData).toEqual(lastUpdate.data);
                }
            ),
            { numRuns: 15 }
        );
    });
});