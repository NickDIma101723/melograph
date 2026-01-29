'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import styles from './dashboard.module.scss';
import Navbar from '@/components/Navbar';

interface DashboardData {
    topTracks: { title: string; artist: string; image: string }[];
    news: { title: string; link: string; date: string }[];
    stats: { activeUsers: number; streamsToday: number };
    lastUpdated: string;
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentTime, setCurrentTime] = useState<string>('');

    useEffect(() => {
        // Initial set
        setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));

        // Update loop
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetch('/api/dashboard')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch data');
                return res.json();
            })
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
    }, []);

    // Minimalist entrance
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.1 } 
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
    };

    return (
        <main className={styles.dashboard}>
            <Navbar />
            
            <div className={styles.wrapper}>
                <header className={styles.header}>
                    <motion.h1 
                        className={styles.title}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    >
                        <span>DASHBOARD // V.2.4</span>
                        Control Center
                    </motion.h1>
                    <motion.div 
                        className={styles.meta}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div style={{marginBottom: '0.5rem'}}>
                            <span className={styles.statusIndicator}></span>
                            SYSTEM ONLINE
                        </div>
                        <div>Server Time: {currentTime || '--:--:--'}</div>
                        <div>Region: EU-WEST-1</div>
                    </motion.div>
                </header>
                
                {error && <div className={styles.error}>SYSTEM ERROR: {error}</div>}
                
                {/* Curtain Loading State */}
                <motion.div
                    initial={{ top: 0 }}
                    animate={{ top: loading ? 0 : '-150vh' }}
                    transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
                    style={{ 
                        position: 'fixed', 
                        top: 0,
                        left: 0, 
                        width: '100%', 
                        height: '100vh', 
                        background: '#000',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none'
                    }}
                >
                    <svg 
                        style={{ 
                            position: 'absolute', 
                            top: '100%', 
                            left: 0, 
                            width: '100%', 
                            height: '40vh', 
                            fill: '#000',
                            display: 'block',
                            marginTop: '-2px'
                        }}
                        viewBox="0 0 1440 320"
                        preserveAspectRatio="none"
                    >
                        <path d="M0,0 L1440,0 L1440,0 C1440,0 1100,100 720,100 C340,100 0,0 0,0 Z" />
                    </svg>
                </motion.div>
                
                {data && (
                    <motion.div 
                        className={styles.mainGrid}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {/* COLUMN 1: ANALYTICS */}
                        <div className={styles.analyticsCol}>
                            <div className={styles.sectionTitle}>REAL-TIME ANALYTICS</div>
                            
                            <motion.div className={styles.statCard} variants={itemVariants}>
                                <span className={styles.statLabel}>Active Listeners</span>
                                <span className={styles.statValue}>{data.stats.activeUsers.toLocaleString()}</span>
                                <div className={styles.statGraph}>
                                    <div className={styles.bar} style={{ width: '65%' }}></div>
                                </div>
                            </motion.div>

                            <motion.div className={styles.statCard} variants={itemVariants}>
                                <span className={styles.statLabel}>Daily Cycles</span>
                                <span className={styles.statValue}>{data.stats.streamsToday.toLocaleString()}</span>
                                <div className={styles.statGraph}>
                                    <div className={styles.bar} style={{ width: '82%' }}></div>
                                </div>
                            </motion.div>

                            <motion.div className={styles.statCard} variants={itemVariants}>
                                <span className={styles.statLabel}>Database Sync</span>
                                <span className={styles.statValue} style={{ fontSize: '1.5rem' }}>
                                    {new Date(data.lastUpdated).toLocaleDateString()}
                                </span>
                                <div className={styles.statGraph}>
                                    <div className={styles.bar} style={{ width: '100%' }}></div>
                                </div>
                            </motion.div>
                        </div>

                        {/* COLUMN 2: TRACKS */}
                        <div className={styles.tracksCol}>
                            <div className={styles.sectionTitle}>GLOBAL TOP 20</div>
                            
                            {data.topTracks.slice(0, 10).map((track, i) => (
                                <motion.div 
                                    key={i} 
                                    className={styles.trackRow}
                                    variants={itemVariants}
                                >
                                    <span className={styles.trackIndex}>{(i + 1).toString().padStart(2, '0')}</span>
                                    <div className={styles.trackImg}>
                                        <Image 
                                            src={track.image || '/images/placeholder.jpg'} 
                                            alt={track.title} 
                                            width={60} 
                                            height={60} 
                                        />
                                    </div>
                                    <div className={styles.trackInfo}>
                                        <h3>{track.title}</h3>
                                        <p>{track.artist}</p>
                                    </div>
                                    <div className={styles.trackMeta}>FLAC</div>
                                </motion.div>
                            ))}
                        </div>

                        {/* COLUMN 3: NEWS */}
                        <div className={styles.newsCol}>
                            <div className={styles.sectionTitle}>LATEST TRANSMISSIONS</div>
                            
                            {data.news.map((item, i) => (
                                <motion.a 
                                    key={i} 
                                    href={item.link} 
                                    className={styles.newsCard}
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className={styles.newsHeader}>
                                        <span className={styles.newsDate}>{item.date}</span>
                                        <span className={styles.newsIcon}>↗</span>
                                    </div>
                                    <h4 className={styles.newsTitle}>{item.title}</h4>
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
