// ControlPanel.js (Final Version)
import React, { useState, useContext } from "react";
import Joystick from "./Joystick.js";
import "./ControlPanel.css";
import { WebSocketContext } from "../App";

function ControlPanel() {
  const { connected, botStatus, sendCommand } = useContext(WebSocketContext);
  const [weaponActive, setWeaponActive] = useState(false);

  const handleJoystickUpdate = (position) => {
    if (connected && botStatus.power && !botStatus.safety) {
      sendCommand({
        type: "movement",
        x: position.x,
        y: position.y
      });
    }
  };

  const handleWeaponPress = () => {
    if (connected && botStatus.power && !botStatus.safety) {
      sendCommand({ type: "weapon", speed: 100 });
      setWeaponActive(true);
    }
  };

  const handleWeaponRelease = () => {
    sendCommand({ type: "weapon", speed: 0 });
    setWeaponActive(false);
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
        <Joystick 
          onUpdate={handleJoystickUpdate} 
          disabled={!connected || !botStatus.power || botStatus.safety}
        />

        <div style={{ display: "flex", alignItems: "center", marginLeft: "20px" }}>
          <div className="button2">
            <a 
              onMouseDown={handleWeaponPress}
              onMouseUp={handleWeaponRelease}
              onTouchStart={handleWeaponPress}
              onTouchEnd={handleWeaponRelease}
              className={(!connected || !botStatus.power || botStatus.safety) ? 'disabled' : ''}
            >
              {weaponActive ? 'FIRING' : 'ATTACK'}
            </a>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginLeft: "20px" }}>
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