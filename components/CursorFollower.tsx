import React, { useEffect, useState } from 'react';

export const CursorFollower: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Use requestAnimationFrame for smoother performance
      requestAnimationFrame(() => {
        setPosition({ x: e.clientX, y: e.clientY });
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <div 
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-25 transition-transform duration-300 ease-out"
        style={{
          // Chambray center, fading to Cello/Transparent
          background: 'radial-gradient(circle, rgba(59,91,140,0.8) 0%, rgba(31,64,96,0.5) 50%, rgba(31,64,96,0) 70%)',
          transform: `translate(${position.x - 300}px, ${position.y - 300}px)`,
        }}
      />
      {/* Secondary static blob for depth using Waikawa/Casper */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-waikawa/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-chambray/10 rounded-full blur-[80px]" />
    </div>
  );
};