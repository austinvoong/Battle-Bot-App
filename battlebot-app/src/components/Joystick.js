import React, { useEffect, useRef, useState } from 'react';
import '../lib/joy.js'; // Adjust the path based on your folder structure
import "./Joystick.css";

const Joystick = () => {
  const joyDivRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [joystickId] = useState(`joystick-${Math.random().toString(36).substr(2, 9)}`); // Generate unique id

  useEffect(() => {
    const loadJoystick = () => {
      if (typeof window.JoyStick !== 'undefined') {
        const joy = new window.JoyStick(joystickId, {}, (stickData) => {
          setPosition({ x: stickData.x, y: stickData.y });
        });

        return () => {
          // Cleanup if necessary
        };
      } else {
        console.error('Joystick is not defined');
      }
    };

    loadJoystick();
  }, [joystickId]);

  return (
    <div>
      {/* Assign the dynamically generated id */}
      <div id={joystickId} ref={joyDivRef} style={{ width: '300px', height: '300px', marginBottom: '20px' }}></div>
      <p className="position-text">X Position: {position.x}</p>
      <p className="position-text">Y Position: {position.y}</p>
    </div>
  );
};

export default Joystick;
