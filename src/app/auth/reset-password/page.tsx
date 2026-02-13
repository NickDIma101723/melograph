'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { safeJson } from '@/lib/client-cache';
import styles from '../auth.module.scss';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const t = searchParams.get('token');
    const e = searchParams.get('email');
    if (t) setToken(t);
    if (e) setEmail(decodeURIComponent(e));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, newPassword })
      });

      const data = await safeJson(res, { error: 'Server returned an invalid response' });

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to reset password');
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth');
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className={styles.page}>
        <div className={styles.noiseOverlay} />
        <div className={styles.gridLines} />
        <motion.div 
          className={styles.authContainer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.authHeader}>
            <h1 className={styles.logo}>Melograph</h1>
            <div className={styles.subtitle}>// INVALID_RESET_LINK</div>
          </div>
          <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
            This reset link is invalid or has expired.
          </p>
          <Link href="/auth" className={styles.submitBtn} style={{ textAlign: 'center', display: 'block' }}>
            BACK_TO_LOGIN
          </Link>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.noiseOverlay} />
        <div className={styles.gridLines} />
        <motion.div 
          className={styles.authContainer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.authHeader}>
            <h1 className={styles.logo}>Melograph</h1>
            <div className={styles.subtitle}>// PASSWORD_RESET_SUCCESS</div>
          </div>
          <p style={{ color: '#44ff44', marginBottom: '1rem' }}>
            ✓ Password has been reset successfully!
          </p>
          <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
            Redirecting to login...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
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
          <div className={styles.subtitle}>// SET_NEW_PASSWORD</div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ color: '#ff4444', fontSize: '0.8rem', marginBottom: '1rem', fontFamily: 'var(--font-geist-mono)' }}>
              ERROR: {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <input 
              type="email" 
              placeholder="EMAIL" 
              className={styles.input}
              value={email}
              disabled
              style={{ opacity: 0.5 }}
            />
          </div>

          <div className={styles.formGroup}>
            <input 
              type="password" 
              placeholder="NEW_PASSWORD" 
              className={styles.input}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className={styles.formGroup}>
            <input 
              type="password" 
              placeholder="CONFIRM_PASSWORD" 
              className={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <motion.button 
            type="submit" 
            className={styles.submitBtn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
          >
            {loading ? 'PROCESSING...' : 'RESET_PASSWORD'}
          </motion.button>
        </form>

        <div className={styles.toggleContainer}>
          <Link href="/auth" className={styles.toggleBtn}>
            BACK_TO_LOGIN
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className={styles.page}>
        <div className={styles.noiseOverlay} />
        <div className={styles.gridLines} />
        <div style={{ color: '#fff', textAlign: 'center', marginTop: '40vh' }}>
          Loading...
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
