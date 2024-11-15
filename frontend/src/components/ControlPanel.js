import React, { useState, useEffect } from "react";
import Joystick from "./Joystick.js";
import "./ControlPanel.css";

function ControlPanel() {
  const [safetyOn, setSafetyOn] = useState(true);
  const [flipControls, setFlipControls] = useState(false);
  const [killPower, setPower] = useState(false);
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);

  // Connect to ESP32 when component mounts
  useEffect(() => {
    // Replace with your ESP32's IP address
    const websocket = new WebSocket('ws://YOUR_ESP32_IP:81');

    websocket.onopen = () => {
      console.log('Connected to bot');
      setConnected(true);
    };

    websocket.onclose = () => {
      console.log('Disconnected from bot');
      setConnected(false);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    setWs(websocket);

    // Cleanup on unmount
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, []);

  const sendCommand = (command) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(command));
        console.log(`Sending command:`, command);
      } catch (e) {
        console.error('Error sending command:', e);
      }
    } else {
      console.log('WebSocket not connected');
    }
  };

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
      active: true
    });
    console.log("Weapon fired!");
  };

  const toggleSafety = () => {
    setSafetyOn(!safetyOn);
    sendCommand({
      type: "safety",
      enabled: !safetyOn
    });
  };

  const toggleFlipControls = () => {
    setFlipControls(!flipControls);
    // This can be handled locally since it's just UI
  };

  const togglePower = () => {
    setPower(!killPower);
    sendCommand({
      type: "power",
      enabled: !killPower
    });
  };

  // Keep your original JSX structure
  return (
    <div className="control-panel">
      <h2 className="control-panel-header">Control Panel</h2>
      <div className="panel-content">
        {/* Joystick */}
        <Joystick onUpdate={handleJoystickUpdate} />

        {/* Button Group */}
        <div
          style={{ display: "flex", alignItems: "center", marginLeft: "20px" }}
        >
          {/* Attack Button */}
          <div className="button2">
            <a onClick={handleWeaponAction}>Attack</a>
          </div>

          {/* Stacked buttons (Safety and Flip Controls) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: "20px",
            }}
          >
            <div className="button" style={{ marginTop: "10px" }}>
              <a onClick={togglePower}>
                {killPower ? "Power: Off" : "Power: On"}
              </a>
            </div>
            <div className="button">
              <a onClick={toggleSafety}>
                {safetyOn ? "Disable Safety" : "Enable Safety"}
              </a>
            </div>
            <div className="button" style={{ marginTop: "10px" }}>
              <a onClick={toggleFlipControls}>
                {flipControls ? "Flip Controls: Off" : "Flip Controls: On"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;