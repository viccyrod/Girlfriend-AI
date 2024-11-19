'use client';

import { useEffect, useRef } from 'react';

export function TechnicalArchitecture() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Helper functions
    const drawBox = (x: number, y: number, w: number, h: number, text: string, isMain: boolean = false) => {
      // Gradient background
      const gradient = ctx.createLinearGradient(x, y, x, y + h);
      gradient.addColorStop(0, isMain ? '#ff4d8d22' : '#5a189a22');
      gradient.addColorStop(1, isMain ? '#5a189a22' : '#ff4d8d22');
      
      // Draw box
      ctx.fillStyle = gradient;
      ctx.strokeStyle = isMain ? '#ff4d8d' : '#9d4edd';
      ctx.lineWidth = isMain ? 2 : 1;
      
      // Rounded rectangle
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 10);
      ctx.fill();
      ctx.stroke();

      // Text
      ctx.fillStyle = 'white';
      ctx.font = isMain ? 'bold 16px sans-serif' : '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Handle multiline text
      const words = text.split(' ');
      let line = '';
      const lines = [];
      words.forEach(word => {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > w - 20) {
          lines.push(line);
          line = word + ' ';
        } else {
          line = testLine;
        }
      });
      lines.push(line);

      lines.forEach((line, i) => {
        const lineHeight = 20;
        const totalHeight = lines.length * lineHeight;
        const startY = y + (h - totalHeight) / 2;
        ctx.fillText(line.trim(), x + w/2, startY + i * lineHeight);
      });
    };

    const drawArrow = (fromX: number, fromY: number, toX: number, toY: number) => {
      ctx.beginPath();
      ctx.strokeStyle = '#9d4edd';
      ctx.lineWidth = 1;
      
      // Draw line
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      // Draw arrowhead
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const size = 10;
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - size * Math.cos(angle - Math.PI / 6),
        toY - size * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        toX - size * Math.cos(angle + Math.PI / 6),
        toY - size * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = '#9d4edd';
      ctx.fill();
    };

    // Draw main platform box
    const mainX = width/2 - 100;
    const mainY = height/2 - 40;
    drawBox(mainX, mainY, 200, 80, 'GOON Token Platform', true);

    // Draw surrounding components
    // Top layer
    drawBox(100, 50, 160, 60, 'User Interface Layer');
    drawBox(340, 50, 160, 60, 'API Gateway');
    drawBox(580, 50, 160, 60, 'Authentication');

    // Middle layer
    drawBox(50, height/2 - 30, 160, 60, 'Payment Processing');
    drawBox(630, height/2 - 30, 160, 60, 'Smart Contracts');

    // Bottom layer
    drawBox(100, height - 110, 160, 60, 'Privacy Layer');
    drawBox(340, height - 110, 160, 60, 'Data Storage');
    drawBox(580, height - 110, 160, 60, 'Cross-chain Bridge');

    // Draw connections
    // Top connections
    drawArrow(180, 110, mainX + 100, mainY);
    drawArrow(420, 110, mainX + 100, mainY);
    drawArrow(660, 110, mainX + 100, mainY);

    // Middle connections
    drawArrow(210, height/2, mainX, height/2);
    drawArrow(mainX + 200, height/2, 630, height/2);

    // Bottom connections
    drawArrow(180, height - 110, mainX + 100, mainY + 80);
    drawArrow(420, height - 110, mainX + 100, mainY + 80);
    drawArrow(660, height - 110, mainX + 100, mainY + 80);

  }, []);

  return (
    <div className="w-full flex justify-center">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={400} 
        className="w-full max-w-[800px] h-auto"
      />
    </div>
  );
} 