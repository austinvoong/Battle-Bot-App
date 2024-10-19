import React, { useState } from "react";
import Joystick from "./Joystick.js";
import "./ControlPanel.css"; // Import the CSS file for styling

function ControlPanel() {
  const [safetyOn, setSafetyOn] = useState(true); // Defaulting to safety on
  const [flipControls, setFlipControls] = useState(false);
  const [killPower, setPower] = useState(false);

  const sendCommand = (command) => {
    console.log(`Sending command: ${command}`);
  };

  const handleJoystickUpdate = (position) => {
    console.log(`Joystick position:`, position);
    sendCommand(
      `Move to X: ${position.x}, Y: ${position.y}, Direction: ${position.direction}`
    );
  };

  const handleWeaponAction = () => {
    sendCommand("Weapon Action Triggered");
    console.log("Weapon fired!");
  };

  const toggleSafety = () => {
    setSafetyOn(!safetyOn);
    sendCommand(safetyOn ? "Safety Off" : "Safety On");
  };

  const toggleFlipControls = () => {
    setFlipControls(!flipControls);
    sendCommand(flipControls ? "Flip Controls Off" : "Flip Controls On");
  };

  const togglePower = () => {
    setPower(!killPower);
    sendCommand(killPower ? "Kill Power Off" : "Kill Power On");
  };

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
