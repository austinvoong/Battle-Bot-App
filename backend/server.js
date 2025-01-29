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
// Modified WebSocket message handler
ws.on('message', (message) => {
    try {
        const data = JSON.parse(message);
        
        if (clientType === '/esp32') {
            // Convert ESP32 status to frontend format
            const status = {
                connected: true,
                botStatus: {
                    power: data.power,
                    safety: data.safety,
                    weaponSpeed: Math.round((data.weaponSpeed / 1023) * 100)
                }
            };
            broadcastToWebClients(status);
        } else {
            // Process web client commands
            const processedCmd = processCommand(data);
            if(processedCmd && esp32Client) {
                esp32Client.send(JSON.stringify(processedCmd));
            }
        }
    } catch (error) { /* ... */ }
});

function processCommand(frontendCmd) {
    // Convert joystick to tank controls
    if(frontendCmd.type === 'movement') {
        const left = frontendCmd.y + frontendCmd.x;
        const right = frontendCmd.y - frontendCmd.x;
        return {
            type: 'motor',
            left: Math.round((left / 100) * 1023),
            right: Math.round((right / 100) * 1023)
        };
    }
    
    // Handle weapon toggle
    if(frontendCmd.type === 'weapon') {
        return {
            type: 'weapon',
            speed: frontendCmd.speed === 100 ? 1023 : 0
        };
    }
    
    // Forward state toggles directly
    return frontendCmd;
}

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