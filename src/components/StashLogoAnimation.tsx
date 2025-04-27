import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package } from 'lucide-react';

type StashLogoAnimationProps = {
  isActive: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const StashLogoAnimation: React.FC<StashLogoAnimationProps> = ({
  isActive,
  size = 'md',
  className = '',
}) => {
  const [showCrate, setShowCrate] = useState(false);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShowCrate(true);
      setTimeout(() => {
        setShowText(true);
      }, 500);
    } else {
      setShowText(false);
      setTimeout(() => {
        setShowCrate(false);
      }, 500);
    }
  }, [isActive]);

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  const iconSize = {
    sm: 24,
    md: 32,
    lg: 40,
  };

  const containerSize = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  };

  return (
    <div className={`relative ${containerSize[size]} ${className}`}>
      {/* Motion Blur Effect */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: showCrate ? 0.3 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 blur-xl" />
      </motion.div>

      {/* Crate */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scale: 0, rotate: -180, filter: 'blur(8px)' }}
        animate={{ 
          scale: showCrate ? 1 : 0,
          rotate: showCrate ? [0, 5, -5, 0] : -180,
          filter: showCrate ? 'blur(0px)' : 'blur(8px)'
        }}
        transition={{ 
          duration: 0.8,
          type: "spring",
          stiffness: 260,
          damping: 20,
          rotate: {
            duration: 0.5,
            repeat: 2,
            repeatType: "reverse"
          },
          filter: {
            duration: 0.3,
            ease: "easeOut"
          }
        }}
      >
        <Package
          size={iconSize[size]}
          className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600"
        />
      </motion.div>

      {/* Text */}
      <motion.div
        className={`absolute inset-0 flex items-center justify-center font-bold ${sizeClasses[size]}`}
        initial={{ y: 50, opacity: 0, filter: 'blur(8px)' }}
        animate={{
          y: showText ? 0 : 50,
          opacity: showText ? 1 : 0,
          filter: showText ? 'blur(0px)' : 'blur(8px)'
        }}
        transition={{ 
          duration: 0.5,
          type: "spring",
          stiffness: 200,
          damping: 15,
          filter: {
            duration: 0.3,
            ease: "easeOut"
          }
        }}
      >
        <motion.span
          className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600"
          animate={{
            scale: showText ? [1, 1.05, 1] : 1,
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          stash
        </motion.span>
      </motion.div>

      {/* Particle Effects */}
      <AnimatePresence>
        {showCrate && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600"
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 0,
                  scale: 0
                }}
                animate={{ 
                  x: [0, Math.random() * 40 - 20],
                  y: [0, Math.random() * 40 - 20],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StashLogoAnimation; 