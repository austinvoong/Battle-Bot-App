//App.js
import React from 'react';
import './styles.css';
import ControlPanel from './components/ControlPanel';
import BotStatus from './components/BotStatus';
import './styles.css';
import { createContext, useState, useEffect } from 'react';

export const WebSocketContext = createContext();

function App() {
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [botStatus, setBotStatus] = useState({
    power: false,
    safety: true,
    weaponSpeed: 0
  });

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3000');
    websocket.onopen = () => setConnected(true);
    websocket.onclose = () => setConnected(false);
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if(data.botStatus) setBotStatus(data.botStatus);
    };
    setWs(websocket);
    return () => websocket.close();
  }, []);

  const sendCommand = (command) => {
    if(ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(command));
    }
  };

  return (
    <WebSocketContext.Provider value={{ connected, botStatus, sendCommand }}>
      <div className="App">
        <BotStatus />
        <ControlPanel />
      </div>
    </WebSocketContext.Provider>
  );
}
