import React from 'react';
import { LiquidCanvas } from './components/LiquidCanvas';
import { InstructionOverlay } from './components/InstructionOverlay';

function App() {
  return (
    <div className="min-h-screen relative">
      <LiquidCanvas /> 
      <InstructionOverlay />
    </div>
  );
}

export default App;
