'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { safeJson } from '@/lib/client-cache';
import styles from './auth.module.scss';
export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isArtist, setIsArtist] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
        if (isForgotPassword) {
             const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email }),
                headers: { 'Content-Type': 'application/json' }
             });
             const data: any = await safeJson(res, { error: 'Server returned an invalid response' });
             if (!res.ok) throw new Error(data?.error || 'Failed to send reset email');
             
             if (data?.devUrl) {
                 // Dev mode: show the link directly
                 setSuccessMsg(`Reset link generated! Open this URL: ${data.devUrl}`);
             } else {
                 setSuccessMsg('If an account exists with that email, a reset link has been sent.');
             }
             
             setLoading(false);
             return;
        }

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
        const payload = isLogin 
            ? { email, password }
            : { email, password, username: name, isArtist };

        const res = await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await safeJson(res, { error: 'Server returned an invalid response' });

        if (!res.ok) throw new Error(data.error || 'Authentication failed');

        // Redirect or Success
        router.push('/profile');

    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
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
            {isForgotPassword ? '// PASSWORD_RECOVERY' : (isLogin ? '// ACCESS_TERMINAL' : '// NEW_USER_REGISTRATION')}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
              <div style={{ color: '#ff4444', fontSize: '0.8rem', marginBottom: '1rem', fontFamily: 'var(--font-geist-mono)' }}>
                  ERROR: {error}
              </div>
          )}
          {successMsg && (
              <div style={{ color: '#44ff44', fontSize: '0.8rem', marginBottom: '1rem', fontFamily: 'var(--font-geist-mono)' }}>
                  SUCCESS: {successMsg}
              </div>
          )}
          
          <AnimatePresence>
            {!isLogin && !isForgotPassword && (
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

          {!isForgotPassword && (
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
          )}

          {!isLogin && !isForgotPassword && (
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', opacity: 0.8 }}>
                <input 
                    type="checkbox" 
                    id="artistCheck" 
                    style={{ accentColor: '#fff', cursor: 'pointer' }}
                    checked={isArtist}
                    onChange={(e) => setIsArtist(e.target.checked)} 
                />
                <label htmlFor="artistCheck" style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.8rem', cursor: 'pointer' }}>
                    REGISTER AS ARTIST
                </label>
             </div>
          )}

          {!isLogin && !isForgotPassword && (
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', opacity: 0.8 }}>
                <input type="checkbox" id="artistCheck" style={{ accentColor: '#fff', cursor: 'pointer' }} />
                <label htmlFor="artistCheck" style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.8rem', cursor: 'pointer' }}>
                    REGISTER AS ARTIST
                </label>
             </div>
          )}

          {isLogin && !isForgotPassword && (
              <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                  <button 
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMsg(''); }}
                    style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.5, cursor: 'pointer', fontFamily: 'var(--font-geist-mono)', fontSize: '0.7rem' }}
                  >
                      FORGOT_PASSWORD?
                  </button>
              </div>
          )}

          <motion.button 
            type="submit" 
            className={styles.submitBtn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
          >
            {loading ? 'PROCESSING...' : (isForgotPassword ? 'SEND_RESET_LINK' : (isLogin ? 'AUTHENTICATE' : 'INITIALIZE_USER'))}
          </motion.button>
        </form>


        <div className={styles.toggleContainer}>
          {isForgotPassword ? (
              <button 
                className={styles.toggleBtn}
                onClick={() => { setIsForgotPassword(false); setIsLogin(true); setError(''); setSuccessMsg(''); }}
              >
                BACK_TO_LOGIN
              </button>
          ) : (
            <>
              <span>{isLogin ? "DON'T HAVE AN ACCESS KEY?" : "ALREADY REGISTERED?"}</span>
              <button 
                className={styles.toggleBtn}
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'CREATE_ACCOUNT' : 'LOG_IN'}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
