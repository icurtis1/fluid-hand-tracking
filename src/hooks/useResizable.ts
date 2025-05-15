import { useCallback, useEffect, useRef, useState } from 'react';

interface ResizableOptions {
  minWidth?: number;
  maxWidth?: number;
  aspectRatio?: number;
}

export function useResizable({ 
  minWidth = 120, 
  maxWidth = 800,
  aspectRatio = 4/3 
}: ResizableOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const startWidth = useRef(0);
  const startX = useRef(0);

  const [width, setWidth] = useState(window.innerWidth < 768 ? 160 : 380);
  const [height, setHeight] = useState(width / aspectRatio);

  const startResize = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    isResizing.current = true;
    startWidth.current = ref.current.offsetWidth;
    startX.current = e.clientX;
    document.body.style.cursor = 'se-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;

    const delta = e.clientX - startX.current;
    const newWidth = Math.min(
      Math.max(startWidth.current + delta, minWidth),
      maxWidth
    );
    
    setWidth(newWidth);
    setHeight(newWidth / aspectRatio);
  }, [minWidth, maxWidth, aspectRatio]);

  const stopResize = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    const resizeHandle = ref.current?.querySelector('.cursor-se-resize');
    if (!resizeHandle) return;

    resizeHandle.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);

    return () => {
      resizeHandle.removeEventListener('mousedown', startResize);
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
    };
  }, [startResize, resize, stopResize]);

  return { ref, width, height };
}