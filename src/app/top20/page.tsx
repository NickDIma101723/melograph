'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import gsap from 'gsap';
import { getCache, setCache, safeJson } from '@/lib/client-cache';
import styles from './top20.module.scss';
import { useUI } from '@/context/UIContext';

// Apple Music RSS API Interfaces
interface AppleMusicEntry {
  id: string;
  name: string;
  artistName: string;
  artworkUrl100: string;
  url: string;
  genres?: { name: string }[];
}

interface AppleMusicFeed {
  feed: {
    results: AppleMusicEntry[];
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
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listRef = useRef<HTMLElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    setIsMounted(true);
    
    // Check Auth
    fetch('/api/auth/me').then(res => {
         if (res.ok) return safeJson(res, { user: null });
         return { user: null };
    }).then(data => setIsAuthenticated(!!data?.user));

    // Fetch likes
    fetch('/api/likes')
        .then(res => res.ok ? safeJson(res, []) : [])
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
                cover_url: song.image,
                preview_url: song.previewUrl // Added
            }),
            headers: { 'Content-Type': 'application/json' }
        });
        setTimeout(() => {
            showToast(isLiked ? 'Removed from favorites' : 'Added to favorites', isLiked ? 'info' : 'success');
        }, 1000);
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
    const fetchTop100 = async () => {
      // Clear any old cache keys from previous versions
      if (typeof window !== 'undefined') {
        localStorage.removeItem('top20-data-v1');
        localStorage.removeItem('top100-data-v1');
      }
      const CACHE_KEY = 'top100-data-v2';
      const cached = getCache<TopSong[]>(CACHE_KEY);

      if (cached) {
          setSongs(cached);
          setLoading(false);
          return;
      }

      try {
        // Apple Music Top 100: Global chart (proxied to avoid CORS)
        const res = await fetch('/api/top100');
        const data = await safeJson<AppleMusicFeed>(res);
        if (!data?.feed?.results) throw new Error('Invalid Apple Music data');
        
        const cleanData: TopSong[] = data.feed.results.map((entry, idx) => {
           // Upscale artwork from 100x100 to 600x600
           const imageUrl = entry.artworkUrl100
             .replace('100x100bb', '600x600bb')
             .replace('100x100', '600x600');

           return {
             id: entry.id,
             rank: idx + 1,
             title: entry.name,
             artist: entry.artistName,
             image: imageUrl,
             previewUrl: undefined // Apple Music RSS doesn't include preview URLs
           };
        });

        setSongs(cleanData);
        setCache(CACHE_KEY, cleanData, 60); // Cache for 1 hour
      } catch (error) {
        console.error('Failed to fetch Top 100', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTop100();
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
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 30;
      setCurrentTime(cur);
      setDuration(dur);
      setProgress((cur / dur) * 100);
    }
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Play a specific song by index (fetches preview if needed)
  const playSong = async (idx: number) => {
    if (!audioRef.current) return;
    const song = songs[idx];
    if (!song) return;

    // If different song, stop current
    if (idx !== selectedIndex || !isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    }
    setSelectedIndex(idx);

    if (song.previewUrl) {
      audioRef.current.src = song.previewUrl;
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    setLoadingPreview(true);
    try {
      const itunesRes = await fetch(`/api/itunes-lookup?id=${song.id}`);
      const itunesData = await itunesRes.json();
      const previewUrl = itunesData?.results?.[0]?.previewUrl;
      if (previewUrl) {
        setSongs(prev => prev.map((s, i) => i === idx ? { ...s, previewUrl } : s));
        audioRef.current.src = previewUrl;
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        showToast('No preview available for this song', 'info');
      }
    } catch {
      showToast('Failed to load preview', 'error');
    } finally {
      setLoadingPreview(false);
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      await playSong(fullscreenIndex ?? selectedIndex);
    }
  };

  // Open fullscreen player and start 30-sec preview
  const openFullscreen = async (idx: number) => {
    setFullscreenIndex(idx);
    setSelectedIndex(idx);
    await playSong(idx);
  };

  const closeFullscreen = () => {
    setFullscreenIndex(null);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const fsNavigate = async (direction: 1 | -1) => {
    const newIdx = ((fullscreenIndex ?? selectedIndex) + direction + songs.length) % songs.length;
    await openFullscreen(newIdx);
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * (audioRef.current.duration || 30);
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
              Top 100
            </motion.h1>
            <motion.p
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }} // Fully visible
               transition={{ delay: 0.7, duration: 0.6 }}
            >
              Apple Music Global Charts • Updated Daily
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
                  transition={{ delay: Math.min(0.02 * idx + 0.3, 2), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  key={song.id} 
                  className={`${styles.trackItem} ${idx === selectedIndex ? styles.active : ''}`}
                  onClick={() => setSelectedIndex(idx)}
                >
                    <span className={styles.rank}>{String(song.rank).padStart(2, '0')}</span>

                    {/* Album Art Thumbnail */}
                    <div className={styles.trackThumb}>
                      <Image
                        src={song.image}
                        alt=""
                        width={48}
                        height={48}
                        className={styles.trackThumbImg}
                        draggable={false}
                      />
                      {/* Playing overlay on thumbnail */}
                      {selectedIndex === idx && isPlaying && (
                        <div className={styles.thumbPlayingOverlay}>
                          <div className={styles.playingIndicator}>
                            <div className={styles.bar}></div>
                            <div className={styles.bar}></div>
                            <div className={styles.bar}></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={styles.trackInfo}>
                        <span className={styles.trackName}>{song.title}</span>
                        <span className={styles.artistName}>{song.artist}</span>
                    </div>

                    {/* Play full song button */}
                    <motion.button
                        className={styles.btnPreview}
                        onClick={(e) => { e.stopPropagation(); openFullscreen(idx); }}
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        PLAY
                    </motion.button>

                    <motion.button 
                        className={styles.btnLike}
                        onClick={(e) => toggleLike(e, song)}
                        initial={false}
                        animate={{ 
                            color: likedTrackIds.has(song.title) ? '#ef4444' : '#ffffff',
                        }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        <svg 
                            width="16" 
                            height="16" 
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

      {/* FULLSCREEN PLAYER MODAL */}
      <AnimatePresence>
        {fullscreenIndex !== null && songs[fullscreenIndex] && (
          <motion.div
            className={styles.fsOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ '--fs-bg': `url(${songs[fullscreenIndex].image})` } as React.CSSProperties}
          >
            {/* Close button */}
            <button className={styles.fsClose} onClick={closeFullscreen}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Big Album Art with play overlay */}
            <motion.div
              className={styles.fsArtwork}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              key={`fs-art-${songs[fullscreenIndex].id}`}
              onClick={togglePlay}
            >
              <Image
                src={songs[fullscreenIndex].image}
                alt={songs[fullscreenIndex].title}
                fill
                className={styles.fsArtworkImg}
                priority
              />
              {/* Play/Pause overlay */}
              <div className={styles.fsPlayOverlay}>
                {loadingPreview ? (
                  <div className={styles.fsSpinner} />
                ) : isPlaying ? (
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </div>
            </motion.div>

            {/* Song info */}
            <div className={styles.fsInfo}>
              <div className={styles.fsRank}>#{String(songs[fullscreenIndex].rank).padStart(2, '0')}</div>
              <h2 className={styles.fsTitle}>{songs[fullscreenIndex].title}</h2>
              <h3 className={styles.fsArtist}>{songs[fullscreenIndex].artist}</h3>
            </div>

            {/* Progress bar */}
            <div className={styles.fsProgressWrap}>
              <span className={styles.fsTime}>{formatTime(currentTime)}</span>
              <div className={styles.fsProgressBar} onClick={seekTo}>
                <div className={styles.fsProgressFill} style={{ width: `${progress}%` }} />
              </div>
              <span className={styles.fsTime}>{formatTime(duration)}</span>
            </div>

            {/* Bottom controls */}
            <div className={styles.fsControls}>
              <motion.button className={styles.fsBtn} onClick={() => fsNavigate(-1)} whileTap={{ scale: 0.9 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </motion.button>

              <motion.button
                className={styles.fsBtnPlay}
                onClick={togglePlay}
                whileTap={{ scale: 0.95 }}
              >
                {loadingPreview ? (
                  <div className={styles.fsSpinnerDark} />
                ) : isPlaying ? (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </motion.button>

              <motion.button className={styles.fsBtn} onClick={() => fsNavigate(1)} whileTap={{ scale: 0.9 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </motion.button>
            </div>

            {/* Like + Apple Music buttons */}
            <div className={styles.fsActions}>
              <motion.button
                className={`${styles.fsActionBtn} ${likedTrackIds.has(songs[fullscreenIndex].title) ? styles.liked : ''}`}
                onClick={(e) => toggleLike(e, songs[fullscreenIndex])}
                whileTap={{ scale: 0.9 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24"
                  fill={likedTrackIds.has(songs[fullscreenIndex].title) ? 'currentColor' : 'none'}
                  stroke="currentColor" strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {likedTrackIds.has(songs[fullscreenIndex].title) ? 'Liked' : 'Like'}
              </motion.button>

              <motion.button
                className={styles.fsActionBtn}
                onClick={() => window.open(`https://music.apple.com/song/${songs[fullscreenIndex].id}`, '_blank')}
                whileTap={{ scale: 0.9 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Apple Music
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
