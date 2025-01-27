import React, { useContext } from 'react';
import { WebSocketContext } from '../App';
import './BotStatus.css';

function BotStatus() {
  const { connected, botStatus } = useContext(WebSocketContext);

  return (
    <div className="status-container">
      <h2 className="status-header">Status</h2>
      <div className="status-row">
        <div className="status-item">
          Connection: {connected ? 'Connected' : 'Disconnected'}
        </div>
        <div className="status-item">
          Power: {botStatus.power ? 'On' : 'Off'}
        </div>
        <div className="status-item">
          Safety: {botStatus.safety ? 'Enabled' : 'Disabled'}
        </div>
        {botStatus.weaponSpeed !== 0 && (
          <div className="status-item">
            Weapon Speed: {botStatus.weaponSpeed}%
          </div>
        )}
      </div>
    </div>
  );
}

export default BotStatus;