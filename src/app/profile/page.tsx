'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import styles from './profile.module.scss';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [user, setUser] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [likes, setLikes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'favorites' | 'uploads'>('favorites');
    const [hoveredSong, setHoveredSong] = useState<number | null>(null);
    
    // Edit Mode
    const [isEditing, setIsEditing] = useState(false);
    const [newAvatar, setNewAvatar] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const meRes = await fetch('/api/auth/me');
                if (!meRes.ok) { router.push('/auth'); return; }
                const userData = await meRes.json();
                if (!userData.user) { router.push('/auth'); return; }
                setUser(userData.user);
                setNewAvatar(userData.user.avatar_url || '');
                setNewUsername(userData.user.username || '');
                setNewEmail(userData.user.email || '');
                const likesRes = await fetch('/api/likes');
                if (likesRes.ok) { setLikes(await likesRes.json()); }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
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
                body: JSON.stringify({ avatar_url: newAvatar, username: newUsername, email: newEmail })
            });
            if (res.ok) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setUser((prev: any) => ({ ...prev, avatar_url: newAvatar, username: newUsername, email: newEmail }));
                setIsEditing(false);
            } else { alert('Failed to update profile'); }
        } catch { alert('Failed to update profile'); }
        finally { setIsSaving(false); }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { setNewAvatar(reader.result as string); };
            reader.readAsDataURL(file);
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.loadingText}>
                    <span>LOADING</span>
                    <span className={styles.loadingDot}>_</span>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const memberSince = user.created_at ? new Date(user.created_at).getFullYear() : '2025';

    return (
        <div className={styles.container}>

            {/* ═══ FULL-BLEED HERO ═══ */}
            <section className={styles.hero}>
                <div className={styles.heroImage}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                        src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} 
                        alt="" 
                    />
                    <div className={styles.heroImageOverlay} />
                </div>
                
                <div className={styles.heroContent}>
                    <div className={styles.heroTop}>
                        <div className={styles.heroMeta}>
                            <span className={styles.heroBadge}>
                                {user.is_artist ? 'Artist' : 'Listener'}
                            </span>
                        </div>
                        <div className={styles.heroActions}>
                            <button onClick={() => router.push('/dashboard')}>Dashboard</button>
                            <button onClick={handleLogout}>Log Out</button>
                            {isEditing ? (
                                <>
                                    <button onClick={() => setIsEditing(false)}>Cancel</button>
                                    <button onClick={handleSaveProfile} disabled={isSaving} className={styles.primaryBtn}>
                                        {isSaving ? '...' : 'Save'}
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => setIsEditing(true)}>Edit</button>
                            )}
                        </div>
                    </div>

                    <div className={styles.heroBottom}>
                        <h1 className={styles.heroName}>{user.username}</h1>
                        <p className={styles.heroEmail}>{user.email}</p>
                    </div>
                </div>
            </section>

            {/* ═══ STATS GRID — 4 Column like Artist Detail ═══ */}
            <div className={styles.statsBar}>
                <div className={styles.statCell}>
                    <span className={styles.statLabel}>Liked Songs</span>
                    <span className={styles.statValue}>{likes.length}</span>
                </div>
                <div className={styles.statCell}>
                    <span className={styles.statLabel}>Status</span>
                    <span className={styles.statValue}>
                        <span className={styles.statusDot} />
                        {user.is_artist ? 'Verified' : 'Active'}
                    </span>
                </div>
                <div className={styles.statCell}>
                    <span className={styles.statLabel}>Member Since</span>
                    <span className={styles.statValue}>{memberSince}</span>
                </div>
                <div className={styles.statCell}>
                    <span className={styles.statLabel}>Account</span>
                    <span className={styles.statValue}>{user.is_artist ? 'Artist' : 'Free'}</span>
                </div>
            </div>

            {/* ═══ EDIT FORM (Collapsible) ═══ */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div 
                        className={styles.editSection}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className={styles.editInner}>
                            <div className={styles.editGrid}>
                                <div className={styles.editField}>
                                    <label>Username</label>
                                    <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
                                </div>
                                <div className={styles.editField}>
                                    <label>Email</label>
                                    <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                                </div>
                            </div>
                            <div className={styles.editField}>
                                <label>Avatar</label>
                                <input type="file" accept="image/*" onChange={handleFileChange} />
                                <span className={styles.fieldHint}>Or paste URL</span>
                                <input type="text" value={newAvatar} onChange={(e) => setNewAvatar(e.target.value)} placeholder="https://..." />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ TRACKS SECTION — Matching Artist Detail ═══ */}
            <section className={styles.tracksSection}>
                <div className={styles.tracksHeader}>
                    <div className={styles.tracksHeaderLeft}>
                        <div className={styles.tracksEyebrow}>
                            <span className={styles.eyebrowDot} />
                            Your Collection
                        </div>
                        <h2 className={styles.tracksTitle}>
                            {activeTab === 'favorites' ? 'Liked Songs' : 'Your Releases'}
                        </h2>
                    </div>
                    <div className={styles.tabButtons}>
                        <button 
                            className={`${styles.tabBtn} ${activeTab === 'favorites' ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab('favorites')}
                        >
                            Favorites
                        </button>
                        {user.is_artist && (
                            <button 
                                className={`${styles.tabBtn} ${activeTab === 'uploads' ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab('uploads')}
                            >
                                Uploads
                            </button>
                        )}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'favorites' ? (
                        <motion.div 
                            key="favorites"
                            className={styles.songList}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {likes.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                            <path d="M9 18V5l12-2v13"/>
                                            <circle cx="6" cy="18" r="3"/>
                                            <circle cx="18" cy="16" r="3"/>
                                        </svg>
                                    </div>
                                    <p>No liked songs yet</p>
                                    <Link href="/artists" className={styles.emptyLink}>Explore Artists →</Link>
                                </div>
                            ) : (
                                <>
                                    {likes.map((song, i) => (
                                        <motion.div 
                                            key={song.id} 
                                            className={styles.songRow}
                                            onMouseEnter={() => setHoveredSong(i)}
                                            onMouseLeave={() => setHoveredSong(null)}
                                            initial={{ opacity: 0, x: -30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.03, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                            style={{
                                                opacity: hoveredSong !== null && hoveredSong !== i ? 0.3 : 1,
                                                transition: 'opacity 0.4s ease'
                                            }}
                                        >
                                            {/* Hover background */}
                                            <motion.div 
                                                className={styles.rowHoverBg}
                                                initial={false}
                                                animate={{ opacity: hoveredSong === i ? 1 : 0 }}
                                                transition={{ duration: 0.3 }}
                                            />

                                            <div className={styles.songContent}>
                                                <span className={styles.songIndex} style={{
                                                    color: hoveredSong === i ? '#fff' : undefined
                                                }}>
                                                    {String(i + 1).padStart(2, '0')}
                                                </span>
                                                
                                                <div className={styles.songImage}>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={song.cover_url || '/placeholder.png'} alt="" />
                                                    <div className={styles.songImageOverlay} style={{
                                                        opacity: hoveredSong === i ? 0 : 1
                                                    }} />
                                                </div>

                                                <div className={styles.songMeta}>
                                                    <span className={styles.songTitle}>{song.song_title}</span>
                                                    <span className={styles.songArtist}>{song.artist_name}</span>
                                                </div>
                                            </div>

                                            <div className={styles.songRight}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: hoveredSong === i ? 1 : 0.3 }}>
                                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                                </svg>
                                            </div>
                                        </motion.div>
                                    ))}

                                    <Link href="/artists" className={styles.exploreLink}>
                                        <span>+ Explore More Artists</span>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M5 12h14M12 5l7 7-7 7"/>
                                        </svg>
                                    </Link>
                                </>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="uploads"
                            className={styles.songList}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="17 8 12 3 7 8"/>
                                        <line x1="12" y1="3" x2="12" y2="15"/>
                                    </svg>
                                </div>
                                <p>No uploads yet</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </div>
    );
}
