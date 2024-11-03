import React from 'react';
import './BotStatus.css'; // Ensure to import the CSS file

function BotStatus() {
  return (
    <div className="status-container">
      <h2 className="status-header">Status</h2>
      <div className="status-row">
        <div className="status-item">Connected: Yes</div>
        <div className="status-item">Battery Level: 100%</div>
        <div className="status-item">Wifi: Connected</div>
      </div>
    </div>
  );
}

export default BotStatus;
