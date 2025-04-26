import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Upload, Loader2 } from 'lucide-react';

type StashAnimationProps = {
  type: 'upload' | 'download' | 'loading';
  isActive: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const StashAnimation: React.FC<StashAnimationProps> = ({
  type,
  isActive,
  size = 'md',
  className = '',
}) => {
  const [showIcon, setShowIcon] = useState(false);
  const [showStash, setShowStash] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShowIcon(true);
      setTimeout(() => {
        setShowStash(true);
      }, 500);
    } else {
      setShowStash(false);
      setTimeout(() => {
        setShowIcon(false);
      }, 500);
    }
  }, [isActive]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const iconSize = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const Icon = type === 'upload' ? Upload : type === 'download' ? Download : Loader2;

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Stash Box */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        initial={{ scale: 0 }}
        animate={{ scale: showStash ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'linear-gradient(135deg, #60a5fa, #a855f7, #4f46e5)',
        }}
      >
        <motion.div
          className="absolute inset-0 bg-white/10 rounded-lg border-2 border-white/20 backdrop-blur-sm"
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </motion.div>

      {/* Icon */}
      <AnimatePresence>
        {showIcon && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ y: -50, opacity: 0 }}
            animate={{
              y: showStash ? 0 : -50,
              opacity: showStash ? 1 : 0,
            }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Icon
              size={iconSize[size]}
              className={type === 'loading' ? 'animate-spin' : ''}
              style={{ color: 'white' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StashAnimation; 