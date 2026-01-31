'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import styles from './profile.module.scss';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [likes, setLikes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'favorites' | 'uploads'>('favorites');
    
    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [newAvatar, setNewAvatar] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                // Fetch User Session
                const meRes = await fetch('/api/auth/me');
                
                // Handle non-200 responses
                if (!meRes.ok) {
                    router.push('/auth');
                    return;
                }

                const userData = await meRes.json();
                
                // Handle authenticated but empty session (user: null)
                if (!userData.user) {
                     router.push('/auth');
                     return;
                }

                setUser(userData.user);
                setNewAvatar(userData.user.avatar_url || '');
                setNewUsername(userData.user.username || '');
                setNewEmail(userData.user.email || '');

                // Fetch Likes
                const likesRes = await fetch('/api/likes');
                if (likesRes.ok) {
                    setLikes(await likesRes.json());
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/auth');
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/user/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    avatar_url: newAvatar,
                    username: newUsername,
                    email: newEmail 
                })
            });
            
            if (res.ok) {
                // Optimistic Update
                setUser((prev: any) => ({ 
                    ...prev, 
                    avatar_url: newAvatar,
                    username: newUsername,
                    email: newEmail
                }));
                setIsEditing(false);
            } else {
                alert('Failed to update profile');
            }
        } catch (err) {
            alert('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading) {
        return (
            <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#fff', fontFamily: 'var(--font-geist-mono)' }}>INITIALIZING...</div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className={styles.page}>
            <div className={styles.noiseOverlay} />
            <div className={styles.gridLines} />

            <div className={styles.profileWrapper}>
                
                {/* SWISS STYLE HERO HEADER */}
                <header className={styles.profileHeader}>
                    {/* LEFT: AVATAR / IMAGE */}
                    <div className={styles.avatarWrapper}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} 
                            alt="User Avatar" 
                            style={{ objectFit: 'cover' }}
                        />
                        <div className={styles.statusIndicator}>
                            <span>{user.is_artist ? 'Verified Artist' : 'Active User'}</span>
                        </div>
                    </div>

                    {/* RIGHT: INFO BLOCK */}
                    <div className={styles.infoBlock}>
                        <div className={styles.topBar}>
                            <div className={styles.metaLabel}>
                                {user.is_artist ? 'Melograph Artist' : 'Melograph Listener'}
                            </div>
                            <div className={styles.actionRow}>
                                <button onClick={() => router.push('/dashboard')} style={{ opacity: 0.8 }}>Dashboard</button>
                                <button onClick={handleLogout} style={{ opacity: 0.6 }}>Log Out</button>
                                {isEditing ? (
                                    <>
                                        <button onClick={() => setIsEditing(false)}>Cancel</button>
                                        <button onClick={handleSaveProfile} disabled={isSaving}>
                                            {isSaving ? 'Saving...' : 'Save'}
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setIsEditing(true)}>Edit Profile</button>
                                )}
                            </div>
                        </div>

                        <h1 className={styles.bigName}>
                            {user.username}
                        </h1>

                        {isEditing && (
                            <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                        <label style={{ fontSize: '0.7rem', opacity: 0.7, fontFamily: 'var(--font-geist-mono)' }}>USERNAME</label>
                                        <input 
                                            type="text" 
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            style={{ 
                                                background: 'rgba(0,0,0,0.3)', 
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                padding: '0.5rem',
                                                color: '#fff',
                                                outline: 'none',
                                                fontFamily: 'var(--font-geist-sans)'
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                        <label style={{ fontSize: '0.7rem', opacity: 0.7, fontFamily: 'var(--font-geist-mono)' }}>EMAIL</label>
                                        <input 
                                            type="email" 
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            style={{ 
                                                background: 'rgba(0,0,0,0.3)', 
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                padding: '0.5rem',
                                                color: '#fff',
                                                outline: 'none',
                                                fontFamily: 'var(--font-geist-sans)'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <label style={{ fontSize: '0.7rem', opacity: 0.7, fontFamily: 'var(--font-geist-mono)' }}>AVATAR IMAGE</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.8rem' }}
                                    />
                                    <div style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '2px' }}>
                                        OR ENTER URL BELOW
                                    </div>
                                    <input 
                                        type="text" 
                                        value={newAvatar}
                                        onChange={(e) => setNewAvatar(e.target.value)}
                                        placeholder="https://..."
                                        style={{ 
                                            background: 'rgba(0,0,0,0.3)', 
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            padding: '0.5rem',
                                            color: '#fff',
                                            outline: 'none',
                                            fontFamily: 'var(--font-geist-mono)',
                                            fontSize: '0.8rem'
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className={styles.statsGrid}>
                            <div className={styles.statUnit}>
                                <span className={styles.statLabel}>Favorites</span>
                                <span className={styles.statValue}>{likes.length}</span>
                            </div>
                            <div className={styles.statUnit}>
                                <span className={styles.statLabel}>Email</span>
                                <span className={styles.statValue}>{user.email}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* TEXT NAVIGATION */}
                <div className={styles.navContainer}>
                    <nav className={styles.glassNav}>
                        <button 
                            className={`${styles.navLink} ${activeTab === 'favorites' ? styles.active : ''}`}
                            onClick={() => setActiveTab('favorites')}
                        >
                            LIKED SONGS
                        </button>
                        {user.is_artist && (
                            <button 
                                className={`${styles.navLink} ${activeTab === 'uploads' ? styles.active : ''}`}
                                onClick={() => setActiveTab('uploads')}
                            >
                                DISCOGRAPHY
                            </button>
                        )}
                    </nav>
                </div>

                {/* CONTENT AREA */}
                <main className={styles.mainContent}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'favorites' ? (
                            <motion.div 
                                key="favorites"
                                className={styles.mediaGrid}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {likes.length === 0 && (
                                    <div style={{ opacity: 0.5, padding: '2rem' }}>No liked songs yet. Go explore!</div>
                                )}

                                {likes.map((song, i) => (
                                    <div key={song.id} className={styles.listRow} style={{ transitionDelay: `${i * 50}ms` }}>
                                        {/* Rank */}
                                        <div className={styles.rankNum}>
                                            {String(i + 1).padStart(2, '0')}
                                        </div>
                                        
                                        {/* Image */}
                                        <div className={styles.rowImage}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={song.cover_url || '/placeholder.png'} alt={song.song_title} />
                                        </div>

                                        {/* Info */}
                                        <div className={styles.rowInfo}>
                                            <h3>{song.song_title}</h3>
                                            <p>{song.artist_name}</p>
                                        </div>

                                        {/* Action */}
                                        <button className={styles.btnPlay}>♥</button>
                                    </div>
                                ))}
                                
                                <Link href="/artists" className={styles.exploreRow} style={{ display: 'block', textDecoration: 'none' }}>
                                    + Explore More Music
                                </Link>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="uploads"
                                className={styles.dashboardPanel}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.4 }}
                            >
                                <div className={styles.panelHeader}>
                                    <h2>Your Releases</h2>
                                    <button className={styles.actionBtn}>NEW UPLOAD +</button>
                                </div>
                                
                                <div className={styles.trackList}>
                                   <div style={{opacity: 0.5, padding: '1rem' }}>No uploads yet.</div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

            </div>
        </div>
    );
}
