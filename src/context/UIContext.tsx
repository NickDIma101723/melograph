'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface UIContextType {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  setIsMenuOpen: (isOpen: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
  };

  return (
    <UIContext.Provider value={{ isMenuOpen, toggleMenu, setIsMenuOpen, showToast }}>
      {children}
      
      {/* GLOBAL TOAST CONTAINER */}
      <div style={{
          position: 'fixed',
          bottom: '3rem',
          right: '2rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '1rem',
          pointerEvents: 'none'
      }}>
          <AnimatePresence>
              {toasts.map(toast => (
                  <motion.div
                    key={toast.id}
                    initial={{ opacity: 0, y: 30, scale: 0.95, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    style={{
                        background: 'rgba(18, 18, 18, 0.85)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#fff',
                        padding: '12px 24px',
                        borderRadius: '999px',
                        fontFamily: 'var(--font-geist-sans)',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        letterSpacing: '-0.01em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.2)',
                        pointerEvents: 'auto'
                    }}
                  >
                      {/* Icon based on type */}
                      {toast.type === 'success' && (
                          <div style={{ display: 'flex', alignItems: 'center', color: '#ef4444' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                          </div>
                      )}
                      
                      {toast.type === 'error' && (
                           <div style={{ display: 'flex', alignItems: 'center', color: '#ff4444' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                           </div>
                      )}
                      
                      {toast.type === 'info' && (
                           <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.5)' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                           </div>
                      )}

                      {toast.message}
                  </motion.div>
              ))}
          </AnimatePresence>
      </div>
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
