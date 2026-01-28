'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import YouTube from 'react-youtube';
import { getCache, setCache } from '@/lib/client-cache';
import { ArtistData } from '@/lib/artist-data';
import STATIC_DATA from '@/lib/static-artist-data.json';
import styles from './artists.module.scss';

// iTunes Search API Interface
interface ItunesArtist {
  artistName: string;
  primaryGenreName?: string;
  artworkUrl100?: string; // We will upscale this
  amgArtistId?: number; // External ID
}

// Internal Artist Shape REMOVED - Imported from lib

const ROSTER = [
  'Kendrick Lamar',
  'Manos', 
  'Sombr',
  'Frank Ocean',
  'Juice WRLD',
  'XXXTENTACION',
  'Lil Peep',
  'Mac Miller',
  'Tame Impala',
  'Bjork',
  'Aphex Twin',
  'Tyler, The Creator',
  'Playboi Carti',
  'FKA Twigs',
  'Daft Punk',
  'The Weeknd',
  'Lana Del Rey',
  'Kanye West',
  'Radiohead',
  'Gorillaz',
  'Rosalia',
  'Travis Scott',
  'Lorde',
  'Drake',
  'J. Cole',
  'Billie Eilish',
  'SZA',
  'A$AP Rocky', 
  'Kid Cudi',
  'Post Malone'
];

// Atmospheric colors for "Mood Shift" (Step 4 of user request)
const ARTIST_MOODS: Record<string, string> = {
  'Kendrick Lamar': '#381212', // Deep Red
  'Frank Ocean': '#14291a',   // Muted Green
  'Tame Impala': '#201026',   // Psychedelic Purple
  'Bjork': '#262410',         // Organic Olive
  'Aphex Twin': '#261010',    // Industrial Rust
  'Tyler, The Creator': '#102624', // Teal/Blue
  'FKA Twigs': '#26101e',     // Deep Magenta
  'Daft Punk': '#1a1a1a',     // Robot Chrome
  'The Weeknd': '#300a0a',    // Dark Cherry
  'Lana Del Rey': '#1a2026',  // Vintage Blue
  'Kanye West': '#26201a',    // Earthy Brown
  'Radiohead': '#1a1a1a',     // Glitch Grey
  'Gorillaz': '#1a2620',      // Zombie Green
  'Rosalia': '#381212',       // Motomami Red
  'Travis Scott': '#261a10',  // Cactus Jack Brown
  'Lorde': '#262410',         // Solar Power Gold
  'Sombr': '#1a0b2e',          // Deep Indigo
  'Manos': '#102624',         // Midnight Teal (Custom)
  'Juice WRLD': '#0d041a',     // 999 Purple
  'XXXTENTACION': '#050505',   // Bad Vibes Black
  'Lil Peep': '#1c0a13',       // Hellboy Pink-Black
  'Mac Miller': '#0a151f',     // Swimming Blue
  'Playboi Carti': '#1f0303',  // Vamp Red
  'Drake': '#1a1705',          // OVO Gold-Black
  'J. Cole': '#051a0b',        // Forest Hills Green
  'Billie Eilish': '#0a1a05',  // Blohsh Green
  'SZA': '#0a151f',            // SOS Ocean
  'A$AP Rocky': '#000000',     // Testing Black
  'Kid Cudi': '#120a1f',       // MOTM Purple
  'Post Malone': '#1f160a',    // Beerbongs Yellow-Brown
};

export default function ArtistsClient({ initialArtists }: { initialArtists: ArtistData[] }) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Instant Render: Initialize with STATIC JSON (0ms latency)
  // Casting STATIC_DATA to ArtistData[] because JSON imports can be inferred types
  const [artists, setArtists] = useState<ArtistData[]>(STATIC_DATA as unknown as ArtistData[]);
  
  // Force animation by waiting for mount
  const [isMounted, setIsMounted] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    const t = setTimeout(() => setIsInitialLoad(false), 2000);
    return () => clearTimeout(t);
  }, []);
  
  // We have data immediately, so no loading state
  const [hasData, setHasData] = useState(true);
  
  // Genre & Filter State
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Audio/Video State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const youtubePlayerRef = useRef<any>(null); // For YouTube Player API
  const [isPlaying, setIsPlaying] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false); // Track navigation state

  // CLIENT-SIDE BACKGROUND FETCH (Optional Sync)
  // We still fetch to get fresher data (like bio or song updates), but the UI is already full.
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const res = await fetch('/api/artists-data');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        
        // Only update if we have new valid data
        if (isMounted && Array.isArray(data) && data.length > 0) {
           setArtists(data); 
        }
      } catch (err) {
        console.warn("Background refresh disabled or failed - using static data.");
      }
    };

    // Delay fetch slightly to prioritize main thread for animation
    const t = setTimeout(loadData, 2000);
    return () => { 
        isMounted = false; 
        clearTimeout(t);
    };
  }, []);

  // Force overflow hidden to prevent scrollbars
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Stop media when artist changes
  useEffect(() => {
    try {
      if (audioRef.current) audioRef.current.pause();
      if (videoRef.current) videoRef.current.pause();
      
      // Safely handle YouTube Pause
      const yt = youtubePlayerRef.current;
      if (yt && typeof yt.pauseVideo === 'function') {
        try {
           // check if player is NOT destroyed (if possible, though API doesn't give easy way)
           // checking getIframe() is a common trick
           if (typeof yt.getIframe === 'function' && yt.getIframe()) {
              yt.pauseVideo();
           }
        } catch(e) { 
          // Ignore YT errors on unmount
        }
      }
    } catch(e) {
      console.warn("Media cleanup warning:", e);
    }
    setIsPlaying(false);
  }, [selectedIndex]);

  const togglePlay = (e: React.MouseEvent, url: string | undefined, isVideo?: boolean, youtubeId?: string) => {
    e.stopPropagation();
    
    // NUCLEAR SAFETY CHECKS: Ensure refs exist before touching them
    const audio = audioRef.current;
    const video = videoRef.current;
    const yt = youtubePlayerRef.current;

    // Safety wrapper to check src usage - Robust against nulls
    const safeSrc = (el: HTMLMediaElement | null) => el?.src ?? '';

    try {
      // Stop others
      if (audio && !audio.paused && safeSrc(audio) !== url) audio.pause();
      if (video && !video.paused && safeSrc(video) !== url) video.pause();
    } catch(err) {
      console.warn("Error checking/pausing media refs:", err);
    }
    
    // YT Handle
    if (youtubeId) {
       if (yt && typeof yt.getPlayerState === 'function') {
          try {
              const state = yt.getPlayerState();
              if (isPlaying && (state === 1 || state === 3)) {
                if (typeof yt.pauseVideo === 'function') yt.pauseVideo();
                setIsPlaying(false);
              } else {
                if (audio) audio.pause();
                if (video) video.pause();
                
                if (typeof yt.playVideo === 'function') {
                   yt.playVideo();
                }
                setIsPlaying(true);
              }
          } catch(e) { console.error('YT Player Error:', e); }
       }
       return;
    }

    // Native Handle
    if (!url) return;
    const media = isVideo ? video : audio;
    
    if (!media) {
       console.warn('Media element missing:', isVideo ? 'video' : 'audio');
       return;
    }
    
    // Safe assignment
    if (safeSrc(media) !== url) {
      try { media.src = url; } catch(e) { /* ignore */ }
    }

    if (isPlaying && !media.paused) {
      media.pause();
      setIsPlaying(false);
    } else {
      try {
        if (audio) audio.pause();
        if (video) video.pause();
        if (yt && typeof yt.pauseVideo === 'function') {
           try { yt.pauseVideo(); } catch(e) { /* safe */ }
        }

        media.play().catch(e => console.error("Playback failed", e));
        setIsPlaying(true);
      } catch(e) { console.error("Media Toggle Error", e); }
    }
  };
  
  // 3D Tilt Logic
  const heroRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});

  // Drag-to-Scroll Logic for Artist List
  const listRef = useRef<HTMLElement>(null);
  const isDown = useRef(false);
  const startY = useRef(0);
  const scrollTopRef = useRef(0);
  const isDragging = useRef(false); 
  
  // Momentum Physics State
  const velY = useRef(0);
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafId.current) cancellationFrame(rafId.current);
    };
    function cancellationFrame(id: number) {
      window.cancelAnimationFrame(id);
    }
  }, []);

  const startDrag = (e: React.MouseEvent) => {
    if (!listRef.current) return;
    isDown.current = true;
    isDragging.current = false;
    startY.current = e.pageY - listRef.current.offsetTop;
    scrollTopRef.current = listRef.current.scrollTop;
    
    // Reset Momentum
    lastY.current = e.pageY;
    lastTime.current = Date.now();
    velY.current = 0;
    if (rafId.current) cancelAnimationFrame(rafId.current);

    listRef.current.style.cursor = 'grabbing';
    listRef.current.style.userSelect = 'none'; // Vital for smooth feel
  };

  const stopDrag = () => {
    if (!listRef.current) return;
    isDown.current = false;
    listRef.current.style.cursor = 'grab';
    listRef.current.style.removeProperty('user-select');
    setTimeout(() => { isDragging.current = false; }, 0);
    
    // Trigger Momentum
    beginMomentum();
  };

  const onDrag = (e: React.MouseEvent) => {
    if (!isDown.current || !listRef.current) return;
    e.preventDefault();
    const y = e.pageY - listRef.current.offsetTop;
    const walk = (y - startY.current) * 1.5; // Multiplier
    listRef.current.scrollTop = scrollTopRef.current - walk;
    
    // Calculate Velocity for Momentum
    const now = Date.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
       const dy = e.pageY - lastY.current;
       velY.current = dy / dt; // px/ms
       lastY.current = e.pageY;
       lastTime.current = now;
    }

    if (Math.abs(walk) > 5) {
      isDragging.current = true;
    }
  };
  
  const beginMomentum = () => {
      // Threshold to start momentum
      if (Math.abs(velY.current) < 0.1) return;
      
      const loop = () => {
          if (!listRef.current) return;
          
          // Apply friction
          velY.current *= 0.97; // Smoother glide (was 0.95)
          
          const step = velY.current * 16; // Movement per frame
          listRef.current.scrollTop -= step;
          
          if (Math.abs(velY.current) > 0.05) {
              rafId.current = requestAnimationFrame(loop);
          }
      };
      rafId.current = requestAnimationFrame(loop);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const { left, top, width, height } = heroRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    const centerX = width / 2;
    const centerY = height / 2;
    const rotateX = ((y - centerY) / centerY) * -2; 
    const rotateY = ((x - centerX) / centerX) * 2;  
    setTiltStyle({
      transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      transition: 'transform 0.3s ease-out'
    });
  };
  
  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'rotateX(0deg) rotateY(0deg)',
      transition: 'transform 0.6s ease-out'
    });
  };

  useEffect(() => {
    // If we already have data from Server Component (initialArtists), skip client fetch
    if (initialArtists && initialArtists.length > 0) return;

    const fetchArtists = async () => {
      const CACHE_KEY = 'artists-data-v1';
      const cached = getCache<ArtistData[]>(CACHE_KEY);

      if (cached) {
          setArtists(cached);
          setHasData(true);
          return;
      }

      try {
        // Fetch artists data (cached)
        const res = await fetch('/api/artists-data');
        if (res.ok) {
            const data = await res.json();
            setArtists(data);
            setHasData(true);
            setCache(CACHE_KEY, data, 60);
        } else {
            console.error("Failed to load artists data");
        }
      } catch (error) {
        console.error('Error fetching artists:', error);
      } 
    };
    fetchArtists();
  }, []);
  
  if (artists.length === 0) return null; // Safe guard

  // Filter Logic
  const uniqueGenres = ['All', ...Array.from(new Set(artists.map(a => a.strGenre))).sort()];
  
  const filteredArtists = selectedGenre === 'All' 
    ? artists 
    : artists.filter(a => a.strGenre === selectedGenre);

  // If filter leaves us empty (shouldn't happen if logic is sound), fallback to full list
  const activeList = filteredArtists.length > 0 ? filteredArtists : artists;
  
  const safeIndex = Math.min(selectedIndex, Math.max(0, activeList.length - 1));
  const selectedArtist = activeList[safeIndex];
  const nextIndex = (safeIndex + 1) % activeList.length;
  const nextArtist = activeList[nextIndex];
  const moodColor = ARTIST_MOODS[selectedArtist.strArtist] || '#000000';

  return (
    <motion.div 
      className={"p-artists"} 
      style={{ transition: 'background-color 1s ease' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }} // Graceful page entry
    >
      {/* Page Content continues... */}
      
      {/* Navigation Overlay - Removed/Hidden */}
      <AnimatePresence>
        {isNavigating && <div style={{display: 'none'}} />}
      </AnimatePresence>

      {/* BACKGROUND EFFECTS */}
      <div className={"noiseOverlay"} />
      <div className={"gridLines"} />
      
      {/* Hidden Audio Element */}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      
      {/* PAGE LABEL / LOGO - Handled by Global Navbar now */}

      {/* MASSIVE BACKGROUND TYPOGRAPHY (Restored Dynamic Name) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10, // Behind Hero (z-50) but above Background
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        <AnimatePresence mode="popLayout">
          <motion.h1
            key={selectedArtist.idArtist}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '18vw', // Massive relative size
              lineHeight: 0.8,
              fontWeight: 900,
              color: 'transparent',
              WebkitTextStroke: '0.1px rgba(255,255,255,0.15)', // Super thin stroke
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              position: 'absolute'
            }}
          >
            {selectedArtist.strArtist}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* 4. Background + lighting change (Atmosphere) */}
      <motion.div 
        animate={{ backgroundColor: moodColor }}
        transition={{ duration: 1.2, ease: "linear" }}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          opacity: 0.8
        }}
      />

      {/* 5. BACKGROUND VIDEO (If Available - iTunes or YouTube) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
        <AnimatePresence mode="popLayout" initial={false}>
          {(selectedArtist.isVideo || selectedArtist.youtubeId) && (
            <motion.div
              key={selectedArtist.idArtist}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ 
                opacity: isPlaying ? 0.6 : 0, 
                scale: 1
              }}
              exit={{ 
                opacity: 0,
                scale: 1.05 // Subtle zoom out on exit to match "elevator" feel loosely
              }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              style={{ 
                position: 'absolute', 
                inset: 0, 
                width: '100%', 
                height: '100%' 
              }}
            >
              {/* ITUNES VIDEO */}
              <video 
                ref={videoRef}
                muted={false} 
                loop={false}
                playsInline
                onEnded={() => setIsPlaying(false)}
                style={{ 
                  display: selectedArtist.youtubeId ? 'none' : 'block',
                  width: '100%', height: '100%', objectFit: 'cover', 
                  // Optimized: Removed heavy blur/saturate filters that cause lag
                  filter: 'brightness(0.8)' 
                }} 
              />
              
              {/* YOUTUBE VIDEO */}
              {selectedArtist.youtubeId && (
                <div style={{ 
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                  pointerEvents: 'none',
                }}>
                  <YouTube
                      key={selectedArtist.youtubeId} 
                      videoId={selectedArtist.youtubeId}
                      opts={{
                        height: '100%',
                        width: '100%',
                        playerVars: {
                          autoplay: 0,
                          controls: 0,
                          disablekb: 1,
                          fs: 0,
                          loop: 1,
                          modestbranding: 1,
                          playsinline: 1,
                          rel: 0,
                          showinfo: 0,
                          mute: 0,
                          playlist: selectedArtist.youtubeId,
                          origin: typeof window !== 'undefined' ? window.location.origin : undefined
                        }
                      }}
                      onReady={(event) => {
                        youtubePlayerRef.current = event.target;
                        if (isPlaying) event.target.playVideo();
                      }}
                      onStateChange={(event) => {
                        if (event.data === 0) setIsPlaying(false);
                      }}
                      style={{ width: '100%', height: '100%' }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <motion.div
        animate={{ opacity: isPlaying && selectedArtist.isVideo ? 0.3 : 0 }}
        transition={{ duration: 1 }}
        style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', mixBlendMode: 'overlay' }}
      >
         {/* Texture Overlay */}
      </motion.div>
      
      {/* LEFT SIDEBAR - BRUTALIST INDEX */}
      <aside className={styles.sidebar}>
        {/* Simple Raw Text Toggle */}
        <div className={styles.filterWrapper}>
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.8 }}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            style={{
              background: 'transparent', 
              border: 'none', 
              color: '#fff', 
              fontSize: '0.8rem',
              fontFamily: 'var(--font-geist-mono)',
              fontWeight: 700, 
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              padding: '0.5rem 0', 
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            whileHover={{ 
              opacity: 0.7
            }}
          >
            {isFilterOpen ? '// CLOSE' : '[ + ] FILTER'}
          </motion.button>
        </div>

        <nav 
          ref={listRef}
          className={styles.artistList} 
          style={{ position: 'relative', cursor: 'grab' }}
          onMouseDown={startDrag}
          onMouseLeave={stopDrag}
          onMouseUp={stopDrag}
          onMouseMove={onDrag}
        >
          <AnimatePresence mode="wait">
            {isFilterOpen ? (
               <motion.div
                 key="genre-list"
                 className={styles.listAnimationWrapper}
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 10 }}
               >
                 {uniqueGenres.map((genre, i) => (
                   <motion.button
                      key={genre}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: { delay: i * 0.05 } }}
                      onClick={(e) => {
                         if (isDragging.current) {
                           e.stopPropagation();
                           return;
                         }
                        setSelectedGenre(genre);
                        setSelectedIndex(0);
                        setIsFilterOpen(false);
                      }}
                      className={styles.artistButton}
                      style={{ 
                        color: genre === selectedGenre ? '#fff' : 'rgba(255,255,255,0.3)',
                        borderColor: 'transparent',
                        fontSize: '1rem',
                        paddingLeft: 0,
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-geist-mono)',
                        borderLeft: genre === selectedGenre ? '2px solid #fff' : '2px solid transparent'
                      }}
                      whileHover={{ x: 5, color: '#fff', borderLeftColor: '#fff' }}
                   >
                     {genre}
                   </motion.button>
                 ))}
               </motion.div>
            ) : isMounted && (
               <motion.div
                 key="artist-list"
                 className={styles.listAnimationWrapper}
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1, transition: { delay: 1.0 } }}
                 exit={{ opacity: 0 }}
               >
                 {activeList.map((artist, idx) => (
                    <motion.button
                      key={artist.idArtist}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ 
                        opacity: 1, 
                        x: 0, 
                        transition: { 
                          delay: idx * 0.04 + 1.2,
                          duration: 0.6,
                          ease: [0.22, 1, 0.36, 1]
                        } 
                      }}
                      onClick={(e) => {
                        if (isDragging.current) {
                           e.stopPropagation();
                           return;
                        }
                        setSelectedIndex(idx);
                      }}
                      className={`${styles.artistButton} ${artist.idArtist === selectedArtist.idArtist ? styles.active : ''}`}
                    >
                      {artist.strArtist}
                    </motion.button>
                 ))}
                 
                 {activeList.length === 0 && (
                   <div style={{ opacity: 0.5, fontStyle: 'italic', fontSize: '0.9rem' }}>// VOID //</div>
                 )}
               </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </aside>

      {/* CENTER - HERO IMAGE */}
      <section className={styles.heroSection}>
        <div 
          className={styles.heroImage}
          ref={heroRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={tiltStyle}
        >
          <AnimatePresence mode="popLayout" initial={true}>
            {/* removed conditional selectedArtist.strArtistThumb check to allow placeholder */}
              <motion.div
                key={selectedArtist.idArtist}
                style={{ position: 'absolute', inset: 0, cursor: isNavigating ? 'wait' : 'pointer' }}
                onClick={() => {
                   if (isNavigating) return;
                   setIsNavigating(true);
                   router.push(`/artists/${encodeURIComponent(selectedArtist.strArtist)}`);
                }}
              >
                  {/* VERTICAL CAMERA PAN (THE "ELEVATOR" EFFECT)
                      - Simulates the camera physically moving DOWN a long strip of images.
                      - Current Image: Moves UP and OUT (y: -100%)
                      - Next Image: Moves UP and IN (y: 100% -> 0%)
                  */}
                  <motion.div
                    initial={{ 
                      y: '100%',     // Flush with the bottom
                      scale: 1,
                      filter: 'brightness(1)',
                      opacity: 1 // Start visible for solid slide
                    }}
                    animate={{ 
                      y: '0%',       // Centers in viewport
                      scale: 1,
                      filter: 'brightness(1)',
                      opacity: 1,
                      zIndex: 10,
                      transition: { 
                        delay: isInitialLoad ? 1.2 : 0.05,
                        duration: 1.2, // Slower, more cinematic entrance
                        ease: [0.22, 1, 0.36, 1] // Custom refined bezier
                      }
                    }}
                    exit={{ 
                      y: '-100%',    // Moves up
                      scale: 1,      
                      filter: 'brightness(0.8)', 
                      opacity: 1, // Keep visible for solid slide
                      zIndex: 5,
                      transition: { 
                        duration: 0.8, 
                        ease: [0.65, 0, 0.35, 1] 
                      }
                    }}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                  >
                     {selectedArtist.strArtistThumb ? ( 
                         <Image 
                           src={selectedArtist.strArtistThumb} 
                           alt={selectedArtist.strArtist}
                           fill
                           priority
                           sizes="(max-width: 1000px) 100vw, 50vw"
                           className={styles.artistImageImg}
                           style={{ objectFit: 'cover' }}
                         />
                     ) : (
                         <div style={{width:'100%', height:'100%', background:'#222'}} />
                     )}
                     
                     {/* Overlay Text for "View Profile" etc could go here */}
                  </motion.div>
              </motion.div>
          </AnimatePresence>
        </div>

        {/* MOBILE ONLY: Explicit Artist Name under Image to fill void */}
        <motion.h2
           key={selectedArtist.strArtist + "_mobile_title"}
           className={styles.mobileArtistTitle}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           transition={{ duration: 0.5, delay: 0.2 }}
        >
            {selectedArtist.strArtist}
        </motion.h2>

      </section>

      {/* RIGHT SIDE - NEXT ARTIST */}
      <aside className={styles.sideSection}>
        <div className={styles.sideImage}>
          <AnimatePresence mode="popLayout" initial={false}>
            {nextArtist.strArtistThumb ? (
              <motion.div 
                 key={nextArtist.idArtist}
                 style={{ width: '100%', height: '100%', position: 'absolute' }}
                 initial={{ y: '100%', opacity: 0.7 }} 
                 animate={{ 
                  y: '0%', 
                  opacity: 0.7, 
                  transition: { 
                    delay: 0.05,
                    duration: 1.2,
                    ease: [0.22, 1, 0.36, 1] 
                  }
                 }}
                 exit={{ y: '-100%', opacity: 0.7, transition: { duration: 0.8 } }}
              >
                 <Image
                    src={nextArtist.strArtistThumb.replace('1200x1200bb', '600x600bb')}
                    alt={nextArtist.strArtist}
                    fill
                    className="object-cover"
                    style={{ objectFit: 'cover' }}
                    sizes="20vw"
                 />
              </motion.div>
            ) : (
                <motion.div
                 key={`placeholder-${nextArtist.idArtist}`}
                 style={{ width: '100%', height: '100%', position: 'absolute', background: '#111' }}
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 0.3 }}
                 exit={{ opacity: 0 }}
                />
            )}
          </AnimatePresence>
        </div>
        <div className={styles.indicator}>
          {safeIndex + 1} / {activeList.length}
        </div>
      </aside>
    </motion.div>
  );
}
