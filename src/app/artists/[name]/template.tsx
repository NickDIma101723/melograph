'use client';
import { motion } from 'framer-motion';
export default function Template({ children }: { children: React.ReactNode }) {
  // Simple Fade-In (No scale/movement to keep it stable)
  // This ensures the content simply "appears" gently over the previous screen if Next.js holds the frame,
  // or fades in from the background color without jumping.
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
