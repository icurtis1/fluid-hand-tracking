import React, { useEffect, useState } from 'react';
import { Hand } from 'lucide-react';

export function InstructionOverlay() {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // Fade in after 1 second
    const showTimeout = setTimeout(() => setVisible(true), 1000);
    
    // Fade out after 4 seconds total (1s delay + 3s visible)
    const hideTimeout = setTimeout(() => setVisible(false), 4000);
    
    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
    };
  }, []);
  
  return (
    <div className={`fixed inset-0 pointer-events-none flex items-center justify-center -mt-32 transition-opacity duration-1000 ${
      visible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className="text-center text-white">
        <div className="flex justify-center space-x-8 mb-4">
          <Hand className="w-12 h-12 scale-x-[-1]" strokeWidth={1.5} />
          <Hand className="w-12 h-12" strokeWidth={1.5} />
        </div>
        <p className="text-xl font-light tracking-wide">
          Use your hands to interact with the scene
        </p>
      </div>
    </div>
  );
}