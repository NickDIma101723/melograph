'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import styles from './auth.module.scss';
export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for authentication logic
    console.log(isLogin ? 'Logging in...' : 'Signing up...', { email, password, name });
    alert(isLogin ? "Simulated Login Success" : "Simulated Signup Success");
  };

  return (
    <div className={styles.page}>
      {/* Background Ambience */}
      <div className={styles.noiseOverlay} />
      <div className={styles.gridLines} />
      <div className={styles.scanline} />

      <motion.div 
        className={styles.authContainer}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={styles.authHeader}>
          <h1 className={styles.logo}>Melograph</h1>
          <div className={styles.subtitle}>
            {isLogin ? '// ACCESS_TERMINAL' : '// NEW_USER_REGISTRATION'}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: '1.5rem' }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
                className={styles.formGroup}
              >
                <input 
                  type="text" 
                  placeholder="USERNAME" 
                  className={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className={styles.formGroup}>
            <input 
              type="email" 
              placeholder="EMAIL_ADDRESS" 
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <input 
              type="password" 
              placeholder="PASSWORD" 
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', opacity: 0.8 }}>
                <input type="checkbox" id="artistCheck" style={{ accentColor: '#fff', cursor: 'pointer' }} />
                <label htmlFor="artistCheck" style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.8rem', cursor: 'pointer' }}>
                    REGISTER AS ARTIST
                </label>
             </div>
          )}

          <motion.button 
            type="submit" 
            className={styles.submitBtn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLogin ? 'LOG IN' : 'SIGN UP'}
          </motion.button>
        </form>

        <div className={styles.toggleContainer}>
          <span>{isLogin ? "DON'T HAVE AN ACCESS KEY?" : "ALREADY REGISTERED?"}</span>
          <button 
            className={styles.toggleBtn}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'CREATE_ACCOUNT' : 'LOG_IN'}
          </button>
        </div>

        {/* Temporary Dev Link */}
        <div style={{ textAlign: 'center', marginTop: '1rem', opacity: 0.3 }}>
             <Link href="/profile" style={{ fontSize: '0.7rem', fontFamily: 'var(--font-geist-mono)' }}>
                 [DEV] VIEW_PROFILE_TEMPLATE
             </Link>
        </div>
      </motion.div>
    </div>
  );
}
