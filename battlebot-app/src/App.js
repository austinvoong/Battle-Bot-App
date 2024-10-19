import React from 'react';
import './styles.css';
import ControlPanel from './components/ControlPanel';
import BotStatus from './components/BotStatus';
import './styles.css';

function App() {
  return (
    <div className="App">
      <BotStatus />
      <ControlPanel />
    </div>
  );
}

export default App;
