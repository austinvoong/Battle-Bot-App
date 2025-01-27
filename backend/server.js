//server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Store connected clients
const clients = new Set();
let esp32Client = null;

// WebSocket connection handler
wss.on('connection', (ws, req) => {
    const clientType = req.url;
    console.log(`New client connected: ${clientType}`);

    if (clientType === '/esp32') {
        // Handle ESP32 connection
        if (esp32Client) {
            esp32Client.close();
        }
        esp32Client = ws;
        console.log('ESP32 connected');

        // Send initial status to all web clients
        broadcastStatus({ connected: true });
    } else {
        // Handle web client connection
        clients.add(ws);
        console.log('Web client connected');
        
        // Send current ESP32 connection status
        ws.send(JSON.stringify({
            type: 'status',
            connected: esp32Client !== null && esp32Client.readyState === WebSocket.OPEN
        }));
    }

    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (clientType === '/esp32') {
                // Forward ESP32 status updates to all web clients
                broadcastToWebClients(data);
            } else {
                // Forward web client commands to ESP32
                if (esp32Client && esp32Client.readyState === WebSocket.OPEN) {
                    esp32Client.send(JSON.stringify(data));
                }
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    // Handle client disconnection
    ws.on('close', () => {
        if (clientType === '/esp32') {
            esp32Client = null;
            console.log('ESP32 disconnected');
            broadcastStatus({ connected: false });
        } else {
            clients.delete(ws);
            console.log('Web client disconnected');
        }
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        if (clientType === '/esp32') {
            esp32Client = null;
            broadcastStatus({ connected: false });
        } else {
            clients.delete(ws);
        }
    });
});

// Broadcast status to all web clients
function broadcastStatus(status) {
    const message = JSON.stringify({
        type: 'status',
        ...status
    });
    broadcastToWebClients(message);
}

// Broadcast message to all web clients
function broadcastToWebClients(message) {
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(typeof message === 'string' ? message : JSON.stringify(message));
        }
    });
}

// API Routes
const botRoutes = require('./routes/bot');
app.use('/api/bot', botRoutes);

// Catch-all handler for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
});