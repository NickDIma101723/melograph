'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './profile.module.scss';

// Mock Data for Favorites
const FAVORITES = [
    { id: 1, title: "Midnight City", artist: "M83", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/4b/41/51/4b415162-8438-e4b7-a309-8084d5df6fa5/0724386348352.jpg/600x600bb.jpg" },
    { id: 2, title: "Starboy", artist: "The Weeknd", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/37/10/7b/37107b9a-4f51-789a-0e98-250325f77891/16UMGIM46098.jpg/600x600bb.jpg" },
    { id: 3, title: "Do I Wanna Know?", artist: "Arctic Monkeys", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/44/7f/0b/447f0b8d-d55a-eaf2-ffdf-542095cc1fe0/887828031795.jpg/600x600bb.jpg" },
    { id: 4, title: "Borderline", artist: "Tame Impala", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/91/92/2e/91922eeb-aa71-464a-297e-d00be339589d/00602508738321.rgb.jpg/600x600bb.jpg" },
];

const UPLOADS = [
    { id: 101, title: "My New Beat Demo", date: "Jan 12, 2026", form: "WAV" },
    { id: 102, title: "Ambient Background #4", date: "Dec 30, 2025", form: "MP3" },
];

export default function ProfilePage() {
    // Determine if User is an Artist (simulated state, could come from context/auth)
    // For demo purposes, we will default to true or toggle via UI
    const [isArtist, setIsArtist] = useState(true); 
    const [activeTab, setActiveTab] = useState<'favorites' | 'uploads'>('favorites');

    return (
        <div className={styles.page}>
            <div className={styles.noiseOverlay} />
            <div className={styles.gridLines} />

            {/* NEW LAYOUT STRUCTURE */}


            <div className={styles.profileWrapper}>
                
                {/* SWISS STYLE HERO HEADER */}
                <header className={styles.profileHeader}>
                    {/* LEFT: AVATAR / IMAGE */}
                    <div className={styles.avatarWrapper}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Niko" alt="User Avatar" />
                        <div className={styles.statusIndicator}>
                            {isArtist ? 'Verified Artist' : 'Active User'}
                        </div>
                    </div>

                    {/* RIGHT: INFO BLOCK */}
                    <div className={styles.infoBlock}>
                        <div className={styles.topBar}>
                            <div className={styles.metaLabel}>
                                {isArtist ? 'Artist Profile' : 'Listener Profile'}
                            </div>
                            <div className={styles.actionRow}>
                                <button className="btnDev" onClick={() => setIsArtist(!isArtist)}>
                                    [DEV] Role
                                </button>
                                <button>Edit Profile</button>
                            </div>
                        </div>

                        <h1 className={styles.bigName}>
                            NIKO_DEV
                        </h1>

                        <div className={styles.statsGrid}>
                            <div className={styles.statUnit}>
                                <span className={styles.statLabel}>Total Plays</span>
                                <span className={styles.statValue}>142,392</span>
                            </div>
                            <div className={styles.statUnit}>
                                <span className={styles.statLabel}>Followers</span>
                                <span className={styles.statValue}>{isArtist ? '12.4k' : '24'}</span>
                            </div>
                            <div className={styles.statUnit}>
                                <span className={styles.statLabel}>Region</span>
                                <span className={styles.statValue}>Tokyo, JP</span>
                            </div>
                            <div className={styles.statUnit}>
                                <span className={styles.statLabel}>Joined</span>
                                <span className={styles.statValue}>2024</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* TEXT NAVIGATION (LIKE ARTIST DETAILS) */}
                <div className={styles.navContainer}>
                    <nav className={styles.glassNav}>
                        <button 
                            className={`${styles.navLink} ${activeTab === 'favorites' ? styles.active : ''}`}
                            onClick={() => setActiveTab('favorites')}
                        >
                            LIBRARY
                        </button>
                        {isArtist && (
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
                                {FAVORITES.map((song, i) => (
                                    <div key={song.id} className={styles.listRow} style={{ transitionDelay: `${i * 50}ms` }}>
                                        {/* Rank */}
                                        <div className={styles.rankNum}>
                                            {String(i + 1).padStart(2, '0')}
                                        </div>
                                        
                                        {/* Image */}
                                        <div className={styles.rowImage}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={song.cover} alt={song.title} />
                                        </div>

                                        {/* Info */}
                                        <div className={styles.rowInfo}>
                                            <h3>{song.title}</h3>
                                            <p>{song.artist}</p>
                                        </div>

                                        {/* Duration (Mock) */}
                                        <div className={styles.rowDuration}>
                                            3:42
                                        </div>

                                        {/* Action */}
                                        <button className={styles.btnPlay}>▶</button>
                                    </div>
                                ))}
                                
                                <div className={styles.exploreRow}>
                                    + Explore More Music
                                </div>
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
                                    <h2>Manage Releases</h2>
                                    <button className={styles.actionBtn}>NEW UPLOAD +</button>
                                </div>
                                
                                <div className={styles.trackList}>
                                    {UPLOADS.map((upload, i) => (
                                        <div key={upload.id} className={styles.trackRow}>
                                            <span className={styles.rowTitle}>{upload.title}</span>
                                            <span style={{opacity: 0.5}}>{upload.form}</span>
                                            <span style={{opacity: 0.5}}>{upload.date}</span>
                                            <div style={{textAlign: 'right'}}>
                                                <span className={styles.statusTag}>LIVE</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

            </div>
        </div>
    );
}
