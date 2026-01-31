'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import gsap from 'gsap';
import { getCache, setCache } from '@/lib/client-cache';
import styles from './top20.module.scss';
import { useUI } from '@/context/UIContext';
// iTunes RSS Interfaces
interface RSSImage {
  label: string;
  attributes: { height: string };
}

interface RSSEntry {
  'im:name': { label: string };
  'im:image': RSSImage[];
  'im:artist': { label: string };
  link: { attributes: { href: string; title?: string; type?: string; rel?: string } }[];
  id: { label: string; attributes: { 'im:id': string } };
}

interface RSSFeed {
  feed: {
    entry: RSSEntry[];
  };
}

// Cleaned Data Interface
interface TopSong {
  id: string;
  rank: number;
  title: string;
  artist: string;
  image: string;
  previewUrl?: string;
}

export default function Top20Page() {
  const { showToast } = useUI();
  const [songs, setSongs] = useState<TopSong[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listRef = useRef<HTMLElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    setIsMounted(true);
    
    // Check Auth
    fetch('/api/auth/me').then(res => {
         if (res.ok) return res.json();
         return { user: null };
    }).then(data => setIsAuthenticated(!!data.user));

    // Fetch likes
    fetch('/api/likes')
        .then(res => res.ok ? res.json() : [])
        .then((likes: any[]) => {
            const titles = new Set(likes.map(l => l.song_title));
            setLikedTrackIds(titles);
        });
  }, []);

  const toggleLike = async (e: React.MouseEvent, song: TopSong) => {
    e.stopPropagation();

    if (!isAuthenticated) {
        if (confirm('You must be logged in to add songs to favorites. Go to login?')) {
            window.location.href = '/auth';
        }
        return;
    }

    const isLiked = likedTrackIds.has(song.title);
    const newSet = new Set(likedTrackIds);
    if (isLiked) newSet.delete(song.title);
    else newSet.add(song.title);
    setLikedTrackIds(newSet);

    try {
        await fetch('/api/likes', {
            method: 'POST',
            body: JSON.stringify({
                artist_name: song.artist,
                song_title: song.title,
                cover_url: song.image
            }),
            headers: { 'Content-Type': 'application/json' }
        });
        showToast(isLiked ? 'Removed from favorites' : 'Added to favorites', isLiked ? 'info' : 'success');
    } catch (err) {
        console.error('Failed to toggle like');
        showToast('Failed to update favorites', 'error');
    }
  };

  // Drag to Scroll Logic
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [initialScrollTop, setInitialScrollTop] = useState(0);

  const handleListMouseDown = (e: React.MouseEvent) => {
    if(!listRef.current) return;
    setIsDragging(true);
    setStartY(e.pageY - listRef.current.offsetTop);
    setInitialScrollTop(listRef.current.scrollTop);
    lenisRef.current?.stop();
  };

  const handleListMouseUp = () => {
    setIsDragging(false);
    lenisRef.current?.start();
  };

  const handleListMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !listRef.current) return;
    e.preventDefault();
    const y = e.pageY - listRef.current.offsetTop;
    const walk = (y - startY) * 2; // Scroll speed multiplier
    listRef.current.scrollTop = initialScrollTop - walk;
  }; 
  
  // Smooth Scroll Logic
  useEffect(() => {
    if (loading) return;
    
    const scrollContainer = listRef.current;
    if (!scrollContainer) return;

    // Initialize Lenis on the list element
    const lenis = new Lenis({
        wrapper: scrollContainer,
        content: scrollContainer.firstElementChild as HTMLElement,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    function update(time: number) {
        lenis.raf(time * 1000);
    }
    
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
        lenis.destroy();
        gsap.ticker.remove(update);
    };
  }, [loading]);

  // Fetch Logic
  useEffect(() => {
    const fetchTop20 = async () => {
      const CACHE_KEY = 'top20-data-v1';
      const cached = getCache<TopSong[]>(CACHE_KEY);

      if (cached) {
          setSongs(cached);
          setLoading(false);
          return;
      }

      try {
        // Fetch from generic endpoint to allow geo-located results instead of US-hardcoded
        const res = await fetch('https://itunes.apple.com/rss/topsongs/limit=20/json');
        const data: RSSFeed = await res.json();
        
        const cleanData: TopSong[] = data.feed.entry.map((entry, idx) => {
           // Find highest res image (usually last in array)
           const images = entry['im:image'];
           let imageUrl = images[images.length - 1].label;
           // Hack to get higher res (iTunes often returns 170x170, we want 600x600+)
           imageUrl = imageUrl.replace('170x170', '600x600').replace('55x55', '600x600').replace('100x100', '600x600');

           // Find preview url
           const previewLink = entry.link.find(l => l.attributes.type?.includes('audio') || l.attributes.rel === 'enclosure');

           return {
             id: entry.id.attributes['im:id'],
             rank: idx + 1,
             title: entry['im:name'].label,
             artist: entry['im:artist'].label,
             image: imageUrl,
             previewUrl: previewLink?.attributes.href
           };
        });

        setSongs(cleanData);
        setCache(CACHE_KEY, cleanData, 60); // Cache for 1 hour
      } catch (error) {
        console.error('Failed to fetch Top 20', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTop20();
  }, []);

  // Audio Control
  useEffect(() => {
    // Stop audio when changing song selection
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setProgress(0);
    }
  }, [selectedIndex]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration || 30; // Default to 30s preview
      setProgress((current / duration) * 100);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const song = songs[selectedIndex];
      if (song?.previewUrl) {
        if (audioRef.current.src !== song.previewUrl) {
            audioRef.current.src = song.previewUrl;
        }
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // 3D Tilt Logic (Copied from Artists for consistency)
  const heroRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const { left, top, width, height } = heroRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    const centerX = width / 2;
    const centerY = height / 2;
    const rotateX = ((y - centerY) / centerY) * -5; // Slightly stronger tilt
    const rotateY = ((x - centerX) / centerX) * 5;  
    setTiltStyle({
      transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      transition: 'transform 0.1s ease-out'
    });
  };
  
  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'rotateX(0deg) rotateY(0deg)',
      transition: 'transform 0.5s ease-out'
    });
  };

  if (loading) return (
    <div className={styles.page} style={{ display: 'grid', placeItems: 'center' }}>
        LOADING CHARTS...
    </div>
  );

  const selectedSong = songs[selectedIndex];

  return (
    <div className={styles.page}>
      <div className={styles.noiseOverlay} />
      <div className={styles.gridLines} />
      
      <audio 
        ref={audioRef} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => { setIsPlaying(false); setProgress(0); }} 
      />

      {/* LEFT LIST */}
      <aside 
        className={styles.listSection} 
        ref={listRef}
        onMouseDown={handleListMouseDown}
        onMouseUp={handleListMouseUp}
        onMouseLeave={handleListMouseUp}
        onMouseMove={handleListMouseMove}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="lenis-content">
        <div className={styles.header}>
            <motion.h1 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ duration: 0.6, delay: 0.5 }}
            >
              Top 20
            </motion.h1>
            <motion.p
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }} // Fully visible
               transition={{ delay: 0.7, duration: 0.6 }}
            >
              iTunes US Charts • Updated Weekly
            </motion.p>
        </div>
        <AnimatePresence mode="wait">
        {isMounted && (
        <div>
            {songs.map((song, idx) => (
                <motion.div 
                  initial={{ x: -20, opacity: 0, filter: 'blur(5px)' }}
                  animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -20, filter: 'blur(5px)' }}
                  whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  transition={{ delay: 0.05 * idx + 0.8, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  key={song.id} 
                  className={`${styles.trackItem} ${idx === selectedIndex ? styles.active : ''}`}
                  onClick={() => setSelectedIndex(idx)}
                >
                    <span className={styles.rank}>{String(song.rank).padStart(2, '0')}</span>
                    <div className={styles.trackInfo}>
                        <span className={styles.trackName}>{song.title}</span>
                        <span className={styles.artistName}>{song.artist}</span>
                    </div>

                    <motion.button 
                        className={styles.btnLike}
                        onClick={(e) => toggleLike(e, song)}
                        initial={false}
                        animate={{ 
                            scale: likedTrackIds.has(song.title) ? 1 : 1,
                            color: likedTrackIds.has(song.title) ? '#ef4444' : '#ffffff'
                        }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill={likedTrackIds.has(song.title) ? "currentColor" : "none"} 
                            stroke="currentColor" 
                            strokeWidth="2"
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </motion.button>

                    {/* VISUALIZER IF PLAYING THIS SONG */}
                    {selectedIndex === idx && isPlaying && (
                       <div className={styles.playingIndicator}>
                          <div className={styles.bar}></div>
                          <div className={styles.bar}></div>
                          <div className={styles.bar}></div>
                       </div>
                    )}
                </motion.div>
            ))}
        </div>
        )}
        </AnimatePresence>
        </div>
      </aside>

      {/* RIGHT PREVIEW */}
      <main 
         className={styles.previewSection}
         // @ts-ignore - CSS custom property for dynamic background
         style={{ '--bg-image': `url(${selectedSong?.image || ''})` } as React.CSSProperties}
      >
        <div className={styles.bigRank}>
             {String(selectedSong.rank).padStart(2, '0')}
        </div>

        <AnimatePresence mode="wait">
             <motion.div 
               key={`info-${selectedSong.id}`}
               className={styles.songInfo}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 0.5 }}
             >
                <motion.h2 
                  className={styles.bigTitle}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                >
                  {selectedSong.title}
                </motion.h2>
                <motion.h3 
                  className={styles.bigArtist}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                >
                  {selectedSong.artist}
                </motion.h3>
             </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
             <motion.div
               key={selectedSong.id}
               className={styles.artworkContainer}
               ref={heroRef}
               onMouseMove={handleMouseMove}
               onMouseLeave={handleMouseLeave}
               style={tiltStyle}
               initial={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
               animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
               exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
               transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
             >
                <Image 
                   src={selectedSong.image}
                   alt={selectedSong.title} 
                   fill
                   className={styles.artwork}
                   priority
                   sizes="(max-width: 768px) 100vw, 50vw"
                />
             </motion.div>
        </AnimatePresence>
        
        {/* PLAY BUTTON */}
        <div className={styles.controls}>
             <div className={styles.playWrapper}>
                {/* SVG Progress Ring */}
                <svg className={styles.progressRing} width="100" height="100" viewBox="0 0 100 100">
                  <circle 
                    className={styles.progressRingBg}
                    cx="50" cy="50" r="48" 
                    fill="none" 
                    strokeWidth="2"
                  />
                  <circle 
                    className={styles.progressRingFg}
                    cx="50" cy="50" r="48" 
                    fill="none" 
                    strokeWidth="2"
                    strokeDasharray="301.59" // 2 * PI * 48
                    strokeDashoffset={301.59 - (301.59 * progress) / 100}
                  />
                </svg>
                
                <button className={styles.playButton} onClick={togglePlay}>
                    {isPlaying ? (
                        <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                    ) : (
                        <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    )}
                </button>
             </div>
        </div>
      </main>
    </div>
  );
}
