// Joystick.js (Final Version)
import React, { useEffect, useRef, useState } from 'react';
import '../lib/joy.js';
import "./Joystick.css";

const Joystick = ({ onUpdate, disabled, flipped }) => {
  const joyDivRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [joystickId] = useState(`joystick-${Math.random().toString(36).substr(2, 9)}`);
  const joyRef = useRef(null);

  // Convert raw joystick values to -100 to 100 range
  const normalizePosition = (rawX, rawY) => {
    const x = Math.round((rawX / 50) * 100);
    const y = Math.round((rawY / 50) * 100);
    return {
      x: Math.max(-100, Math.min(100, x)),
      y: Math.max(-100, Math.min(100, y))
    };
  };

  useEffect(() => {
    const loadJoystick = () => {
      if (typeof window.JoyStick !== 'undefined') {
        joyRef.current = new window.JoyStick(joystickId, {
          title: 'joystick',
          width: 300,
          height: 300,
          internalFillColor: '#FFFFFF',
          internalLineWidth: 2,
          internalStrokeColor: '#000000',
          externalLineWidth: 2,
          externalStrokeColor: '#000000',
          autoReturnToCenter: true
        }, (stickData) => {
          const normalized = normalizePosition(stickData.x, stickData.y);
          const x = flipped ? -normalized.x : normalized.x;
          const y = flipped ? -normalized.y : normalized.y;
          
          setPosition({ x, y });
          
          if (!disabled) {
            onUpdate({ x, y });
          }
        });

        return () => {
          if (joyRef.current) {
            joyRef.current._$container.remove();
          }
        };
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
          opacity: disabled ? '0.5' : '1',
          pointerEvents: disabled ? 'none' : 'auto'
        }}
      ></div>
      <div className="position-display">
        <span>X: {position.x}</span>
        <span>Y: {position.y}</span>
      </div>
    </div>
  );
};

export default Joystick;