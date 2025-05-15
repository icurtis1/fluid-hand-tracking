import React, { useEffect, useRef } from 'react';
import { LiquidSimulation } from '../lib/liquidSimulation';
import { HandTracking } from './HandTracking';

export function LiquidCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<LiquidSimulation | null>(null);
  
  const handleHandUpdate = (handIndex: number, x: number, y: number) => {
    simulationRef.current?.updateHandPosition(handIndex, x, y);
  };
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Create simulation
    const simulation = new LiquidSimulation(container);
    simulationRef.current = simulation;
    
    // Cleanup
    return () => {
      simulation.destroy();
    };
  }, []);
  
  return (
    <>
      <div 
        ref={containerRef}
        className="fixed inset-0 bg-gradient-to-b from-blue-50 to-blue-100"
      />
      <HandTracking onHandUpdate={handleHandUpdate} />
    </>
  );
}