import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface WelcomeBackProps {
  firstName: string;
  onComplete: () => void;
  duration?: number; // Duration in milliseconds, default 3000
}

export function WelcomeBack({ firstName, onComplete, duration = 3000 }: WelcomeBackProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in immediately
    setIsVisible(true);

    // Start fade out process after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Call onComplete after fade out animation completes
      setTimeout(onComplete, 500); // 500ms for fade out animation
    }, duration - 500); // Start fade out 500ms before duration ends

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 bg-[#F8F8F0] z-50 flex items-center justify-center"
      data-testid="welcome-back-screen"
    >
      <div className="text-center">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          className="text-4xl md:text-5xl font-light text-gray-800 mb-4"
          style={{ fontFamily: 'Caveat, cursive' }}
          data-testid="text-welcome-message"
        >
          Welcome back, {firstName}!
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
          className="text-xl md:text-2xl font-light text-gray-600"
          style={{ fontFamily: 'Caveat, cursive' }}
          data-testid="text-pickup-message"
        >
          Let's pick up where we left off
        </motion.p>
        
        {/* Subtle loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="mt-8 flex justify-center"
        >
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-2 h-2 bg-gray-400 rounded-full"
                data-testid={`loading-dot-${i}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}