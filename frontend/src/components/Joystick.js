// frontend/src/components/Joystick.js
import React, { useEffect, useRef, useState } from 'react';
import '../lib/joy.js';
import "./Joystick.css";

const Joystick = ({ onUpdate, disabled, flipped }) => {
  const joyDivRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [joystickId] = useState(`joystick-${Math.random().toString(36).substr(2, 9)}`);
  const joyRef = useRef(null);

  useEffect(() => {
    const loadJoystick = () => {
      if (typeof window.JoyStick !== 'undefined') {
        joyRef.current = new window.JoyStick(joystickId, {}, (stickData) => {
          const x = flipped ? -stickData.x : stickData.x;
          const y = flipped ? -stickData.y : stickData.y;
          setPosition({ x, y });
          if (!disabled) {
            onUpdate({ x, y });
          }
        });

        return () => {
          // Cleanup if necessary
        };
      } else {
        console.error('Joystick is not defined');
      }
    };

    loadJoystick();
  }, [joystickId, onUpdate, disabled, flipped]);

  return (
    <div className={`joystick-container ${disabled ? 'disabled' : ''}`}>
      <div 
        id={joystickId} 
        ref={joyDivRef} 
        style={{ 
          width: '300px', 
          height: '300px', 
          marginBottom: '20px',
          opacity: disabled ? '0.5' : '1'
        }}
      ></div>
      <p className="position-text">X Position: {position.x}</p>
      <p className="position-text">Y Position: {position.y}</p>
    </div>
  );
};

export default Joystick;