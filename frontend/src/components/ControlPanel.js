import React, { useContext } from "react";
import Joystick from "./Joystick.js";
import "./ControlPanel.css";
import { WebSocketContext } from "../App";

function ControlPanel() {
  const { connected, botStatus, sendCommand } = useContext(WebSocketContext);
  
  const handleJoystickUpdate = (position) => {
    sendCommand({
      type: "movement",
      x: position.x,
      y: position.y
    });
  };

  const handleWeaponAction = () => {
    sendCommand({
      type: "weapon",
      speed: 100  // Full speed when activated
    });
  };

  const toggleSafety = () => {
    sendCommand({
      type: "safety",
      enabled: !botStatus.safety
    });
  };

  const togglePower = () => {
    sendCommand({
      type: "power",
      enabled: !botStatus.power
    });
  };

  return (
    <div className="control-panel">
      <h2 className="control-panel-header">Control Panel</h2>
      <div className="panel-content">
        {/* Joystick */}
        <Joystick 
          onUpdate={handleJoystickUpdate} 
          disabled={!connected || !botStatus.power || botStatus.safety}
        />

        {/* Button Group */}
        <div style={{ display: "flex", alignItems: "center", marginLeft: "20px" }}>
          {/* Attack Button */}
          <div className="button2">
            <a 
              onClick={handleWeaponAction}
              className={(!connected || !botStatus.power || botStatus.safety) ? 'disabled' : ''}
            >
              Attack
            </a>
          </div>

          {/* Stacked buttons */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            marginLeft: "20px",
          }}>
            <div className="button" style={{ marginTop: "10px" }}>
              <a onClick={togglePower}>
                Power: {botStatus.power ? 'On' : 'Off'}
              </a>
            </div>
            <div className="button">
              <a onClick={toggleSafety}>
                {botStatus.safety ? 'Disable Safety' : 'Enable Safety'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;