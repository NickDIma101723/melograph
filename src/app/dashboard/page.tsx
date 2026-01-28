'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
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

    return (
        <main className={styles.dashboard}>
            <Navbar />
            
            <div className="container">
                <h1>Global Music Dashboard</h1>
                
                {error && <div style={{color: 'red'}}>Error: {error}</div>}
                
                {loading ? (
                    <div className={styles.loading}>Loading Real-time Data...</div>
                ) : data ? (
                    <div className={styles.grid}>
                        
                        {/* Top Tracks Column */}
                        <div className={styles.card}>
                            <h2>🌍 Top Global Tracks</h2>
                            {data.topTracks.map((track, i) => (
                                <div key={i} className={styles.songItem} style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                    <div style={{position: 'relative', width: 40, height: 40, flexShrink: 0}}>
                                        <Image src={track.image} alt={track.title} fill style={{objectFit: 'cover', borderRadius: '4px'}} />
                                    </div>
                                    <div>
                                        <h3 style={{fontSize: '1rem', margin: 0}}>{i + 1}. {track.title}</h3>
                                        <p style={{margin: 0, opacity: 0.7}}>{track.artist}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* News Column */}
                        <div className={styles.card}>
                            <h2>📰 Latest Music News</h2>
                            {data.news.map((item, i) => (
                                <div key={i} className={styles.newsItem}>
                                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                                        <h3>{item.title}</h3>
                                    </a>
                                    <p>{new Date(item.date).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>

                        {/* Stats Column */}
                        <div className={styles.card}>
                            <h2>⚡ System Status</h2>
                            <div className={styles.statItem}>
                                <p>Active Users</p>
                                <div className={styles.statBox}>{data.stats.activeUsers.toLocaleString()}</div>
                            </div>
                            <div className={styles.statItem} style={{marginTop: '2rem'}}>
                                <p>Streams Today</p>
                                <div className={styles.statBox}>{data.stats.streamsToday.toLocaleString()}</div>
                            </div>
                            <p style={{marginTop: '2rem', fontSize: '0.8rem', opacity: 0.5}}>
                                Last Cached: {new Date(data.lastUpdated).toLocaleTimeString()}
                            </p>
                        </div>

                    </div>
                ) : null}
            </div>
        </main>
    );
}
