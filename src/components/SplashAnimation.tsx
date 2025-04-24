import React, { useEffect, useState } from 'react';
import { Book, FileText, Upload, Download, Star } from 'lucide-react';

interface SplashAnimationProps {
  isActive: boolean;
}

export const SplashAnimation: React.FC<SplashAnimationProps> = ({ isActive }) => {
  const [bounce, setBounce] = useState(false);
  const [icons, setIcons] = useState([
    { id: 1, icon: Book, position: { x: -100, y: -100 }, visible: false, scale: 1, opacity: 1 },
    { id: 2, icon: FileText, position: { x: -100, y: -100 }, visible: false, scale: 1, opacity: 1 },
    { id: 3, icon: Upload, position: { x: -100, y: -100 }, visible: false, scale: 1, opacity: 1 },
    { id: 4, icon: Download, position: { x: -100, y: -100 }, visible: false, scale: 1, opacity: 1 },
    { id: 5, icon: Star, position: { x: -100, y: -100 }, visible: false, scale: 1, opacity: 1 },
  ]);

  const getRandomPosition = () => {
    const minRadius = 150;
    const maxRadius = 300;
    const angle = Math.random() * Math.PI * 2;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  };

  useEffect(() => {
    if (isActive) {
      // Start bounce animation
      setBounce(true);

      // Animate icons one by one
      icons.forEach((icon, index) => {
        setTimeout(() => {
          setIcons(prev => prev.map(i => 
            i.id === icon.id 
              ? { ...i, visible: true, position: getRandomPosition() }
              : i
          ));
        }, index * 300);
      });

      // After all icons are visible, make them move to the center and shrink
      setTimeout(() => {
        setIcons(prev => prev.map(icon => ({ 
          ...icon, 
          position: { x: 0, y: 0 },
          scale: 0.5,
          opacity: 0
        })));
      }, icons.length * 300 + 500);
    }
  }, [isActive]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
      <div className="relative">
        {/* Floating icons - positioned behind the text */}
        {icons.map(({ id, icon: Icon, position, visible, scale, opacity }) => (
          <div
            key={id}
            className="absolute transition-all duration-500"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              left: '50%',
              top: '50%',
              zIndex: 1,
              opacity: visible ? opacity : 0,
            }}
          >
            <Icon className="w-4 h-4 text-primary" />
          </div>
        ))}

        {/* Main logo container - positioned in front */}
        <div className={`relative z-10 ${bounce ? 'animate-bounce' : ''}`}>
          <span className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600">
            stash
          </span>
        </div>
      </div>
    </div>
  );
};

export default SplashAnimation; 