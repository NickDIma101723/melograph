'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';
import YouTube from 'react-youtube';
import SongRow from './SongRow';
import styles from './ArtistDetailView.module.scss';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TopTracksList({ data, themeColor }: { data: any, themeColor: string }) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    // Mouse interaction for 3D Tilt
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-0.5, 0.5], [10, -10]);
    const rotateY = useTransform(x, [-0.5, 0.5], [-10, 10]);

    // Spring physics
    const springRotateX = useSpring(rotateX, { stiffness: 80, damping: 20, mass: 1 });
    const springRotateY = useSpring(rotateY, { stiffness: 80, damping: 20, mass: 1 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        x.set((mouseX / rect.width) - 0.5);
        y.set((mouseY / rect.height) - 0.5);
    };

    const handleHover = (i: number | null, previewUrl?: string) => {
        setHoveredIndex(i);
        if (i !== null && audioRef.current && previewUrl) {
            audioRef.current.src = previewUrl;
            audioRef.current.play().catch(() => {});
        } else if (i === null && audioRef.current) {
            audioRef.current.pause();
        }
    };

    return (
        <section 
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { x.set(0); y.set(0); handleHover(null); }}
            style={{ 
                padding: '8rem 5%', 
                background: '#050505',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                color: '#fff',
                overflow: 'hidden',
                perspective: '1200px'
            }}
        >
            <audio ref={audioRef} />
            
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'minmax(400px, 1.2fr) 1fr', 
                gap: '8rem', 
                alignItems: 'start',
                maxWidth: '1800px',
                margin: '0 auto',
                width: '100%',
                position: 'relative',
                zIndex: 2
            }}>
                {/* LEFT: THE LIST */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                     <div style={{ 
                        marginBottom: '4rem', fontFamily: 'var(--font-geist-mono)', 
                        textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.2em', opacity: 0.6,
                        display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.2)',
                        paddingBottom: '2rem'
                     }}>
                        <span style={{ width: '6px', height: '6px', background: 'currentColor', borderRadius: '50%' }} />
                        Selected Works
                     </div>

                     {data.songs.slice(0, 8).map((song: any, i: number) => {
                         const isActive = i === hoveredIndex;
                         return (
                             <motion.div 
                                key={song.trackId}
                                onMouseEnter={() => handleHover(i, song.previewUrl)}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                style={{ 
                                    cursor: 'pointer',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    mixBlendMode: 'normal'
                                }}
                             >
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'baseline', 
                                    justifyContent: 'space-between',
                                    padding: '1.5rem 0',
                                    position: 'relative',
                                    opacity: hoveredIndex !== null && !isActive ? 0.3 : 1,
                                    transition: 'opacity 0.4s ease'
                                }}>
                                    <span style={{ 
                                        fontSize: '2rem', fontWeight: 400, fontFamily: 'var(--font-geist-sans)', letterSpacing: '-0.03em',
                                        color: isActive ? themeColor : '#fff', transition: 'color 0.4s ease'
                                    }}>{song.trackName}</span>
                                    
                                    <span style={{ 
                                        fontFamily: 'var(--font-geist-mono)', fontSize: '0.9rem', 
                                        color: isActive ? themeColor : 'rgba(255,255,255,0.3)',
                                        transition: 'color 0.4s ease',
                                        transform: isActive ? 'rotate(-90deg)' : 'rotate(0deg)',
                                        transformOrigin: 'center',
                                    }}>
                                        0{i+1}
                                    </span>
                                </div>
                                <div style={{ 
                                    width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden'
                                }}>
                                    <motion.div 
                                        initial={{ width: '0%' }}
                                        animate={{ width: isActive ? '100%' : '0%' }}
                                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                        style={{ height: '100%', background: '#fff', position: 'absolute', left: 0, top: 0 }}
                                    />
                                </div>
                             </motion.div>
                         );
                     })}
                </div>

                {/* RIGHT: THE 3D PANEL */}
                <div style={{ height: '80vh', position: 'sticky', top: '10vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AnimatePresence>
                    {hoveredIndex !== null && (
                        <motion.div
                           key="modal"
                           initial={{ opacity: 0, scale: 0.9, rotateX: 10, filter: 'blur(10px)' }}
                           animate={{ opacity: 1, scale: 1, rotateX: 0, filter: 'blur(0px)' }}
                           exit={{ opacity: 0, scale: 0.95, filter: 'blur(20px)', transition: { duration: 0.3 } }}
                           transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                           style={{ 
                               width: '100%', aspectRatio: '16/9', boxShadow: '0 40px 100px -30px rgba(0,0,0,0.8)',
                               rotateX: springRotateX, rotateY: springRotateY, transformStyle: 'preserve-3d',
                               background: '#111', position: 'relative', perspective: '1000px', border: '1px solid rgba(255,255,255,0.1)'
                           }}
                        >
                             <div style={{ position: 'absolute', inset: '0', overflow: 'hidden' }}>
                                 <AnimatePresence mode="wait">
                                     {data.songs[hoveredIndex] && (
                                         <motion.div
                                            key={data.songs[hoveredIndex].trackId}
                                            initial={{ scale: 1.1, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 1.05, opacity: 0 }}
                                            transition={{ duration: 0.4 }}
                                            style={{ position: 'absolute', inset: '-20px' }} 
                                         >
                                             <Image 
                                                src={data.songs[hoveredIndex].artworkUrl100.replace('100x100bb', '1000x1000bb')}
                                                alt="Art" fill
                                                style={{ objectFit: 'cover', opacity: 0.8 }}
                                             />
                                              <div style={{ 
                                                  position: 'absolute', inset: 0, pointerEvents: 'none',
                                                  background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
                                                  backgroundSize: '100% 2px, 3px 100%',
                                              }} />
                                         </motion.div>
                                     )}
                                 </AnimatePresence>
                             </div>
                             <motion.div 
                                style={{ position: 'absolute', bottom: '2rem', left: '2rem', color: '#fff', transform: 'translateZ(60px)', mixBlendMode: 'difference' }}
                             >
                                <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>Now Playing</div>
                                <div style={{ fontSize: '2rem', fontFamily: 'serif', lineHeight: 1 }}>{data.songs[hoveredIndex]?.trackName}</div>
                             </motion.div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ArtistDetailView({ data, name, monthlyListeners, themeColor }: { data: any, name: string, monthlyListeners: string, themeColor: string }) {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const [viewMode, setViewMode] = useState<'scroll' | 'grid'>('scroll');
  
  // Full Song Playback State (YouTube)
  const [currentTrackId, setCurrentTrackId] = useState<number | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // YouTube and Audio Fallback Refs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const audioFallbackRef = useRef<HTMLAudioElement | null>(null);
  const [isFallbackPlaying, setIsFallbackPlaying] = useState(false);

  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (isPlaying && playerRef.current) {
          interval = setInterval(() => {
              // YouTube Progress
              if (typeof playerRef.current.getCurrentTime === 'function') {
                  setCurrentTime(playerRef.current.getCurrentTime());
              }
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle Audio Fallback Ends
  useEffect(() => {
      const audio = audioFallbackRef.current;
      if (!audio) return;
      
      const handleEnded = () => {
          setIsPlaying(false);
          setIsFallbackPlaying(false);
      };
      
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  const playFullSong = async (song: any) => {
      // Toggle Pause if clicking same active track
      if (currentTrackId === song.trackId) {
          if (isPlaying) {
              if (isFallbackPlaying) {
                   audioFallbackRef.current?.pause();
              } else {
                   playerRef.current?.pauseVideo();
              }
              setIsPlaying(false);
          } else {
              if (isFallbackPlaying) {
                   audioFallbackRef.current?.play();
              } else {
                   playerRef.current?.playVideo();
              }
              setIsPlaying(true);
          }
          return;
      }

      // Stop Previous
      setIsPlaying(false);
      setIsFallbackPlaying(false);
      playerRef.current?.stopVideo(); // Stop any finding/playing
      if (audioFallbackRef.current) {
          audioFallbackRef.current.pause();
          audioFallbackRef.current.currentTime = 0;
      }

      // Start New Track
      setIsLoading(true);
      setCurrentTrackId(song.trackId);
      
      // Strategy: Client-Side YouTube Search via Playlist API
      // This bypasses server-side scraping limitations completely by letting the 
      // user's browser resolve the "Search" directly in the iframe.
      try {
          const query = `${song.artistName} - ${song.trackName} Official Audio`;
          console.log(`Searching Client-Side: ${query}`);

          if (playerRef.current && typeof playerRef.current.loadPlaylist === 'function') {
               // Load a "Search" playlist and play the first result
               playerRef.current.loadPlaylist({
                   list: query,
                   listType: 'search',
                   index: 0,
                   startSeconds: 0
               });
               playerRef.current.setLoop(false); // Can't loop a search playlist safely
               setIsPlaying(true);
               setIsLoading(false);
               setVideoId('search'); // Dummy state to indicate active
          } else {
              throw new Error("Player not ready");
          }
      } catch (err) {
          console.warn("Client-side search failed, falling back to iTunes Preview:", err);
          
          // Fallback to iTunes Preview URL
          if (song.previewUrl && audioFallbackRef.current) {
              audioFallbackRef.current.src = song.previewUrl;
              try {
                  await audioFallbackRef.current.play();
                  setIsPlaying(true);
                  setIsFallbackPlaying(true);
                  setVideoId(null);
              } catch (e) {
                  console.error("Fallback playback failed", e);
                  alert("Unable to play this track.");
                  setCurrentTrackId(null);
                  setIsPlaying(false);
              }
          } else {
              alert("Playback unavailable for this track.");
              setCurrentTrackId(null);
          }
          setIsLoading(false);
      }
  };

  const onPlayerReady = (event: any) => {
    playerRef.current = event.target;
    if (isPlaying) event.target.playVideo();
  };

  const onPlayerStateChange = (event: any) => {
      // 1 = Playing, 2 = Paused
      setIsPlaying(event.data === 1);
  };

  useEffect(() => {
    return () => {
       // Cleanup if needed
    };
  }, []);
  
  // Scroll Handle for Horizontal Section
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const targetScroll = useRef(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const smoothScrollLoop = () => {
    if (!scrollContainerRef.current) return;

    const current = scrollContainerRef.current.scrollLeft;
    const diff = targetScroll.current - current;

    // Smoother damping: 0.04 (was 0.06) - Very fluid
    if (Math.abs(diff) > 0.5) {
      scrollContainerRef.current.scrollLeft = current + diff * 0.04;
      rafId.current = requestAnimationFrame(smoothScrollLoop);
    } else {
      scrollContainerRef.current.scrollLeft = targetScroll.current;
      rafId.current = null;
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    if (viewMode === 'scroll' && scrollContainerRef.current) {
        // Only hijack vertical scroll if the content overflows horizontally
        const isOverflowing = scrollContainerRef.current.scrollWidth > scrollContainerRef.current.clientWidth;

        if (isOverflowing) {
            // Standardize scrolling: Always prevent page vertical scroll if we are interacting with this container
            // UNLESS it's a pure horizontal trackpad swipe which browsers handle naturally
            
            const isVerticalScroll = Math.abs(e.deltaY) > Math.abs(e.deltaX);
            
            if (isVerticalScroll && e.deltaY !== 0) {
                 // HIJACK: Convert vertical wheel to horizontal scroll
                 
                 const currentScroll = targetScroll.current;
                 const maxScroll = scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth;

                 // Logic: If at edge, normally we'd return to allow page scroll
                 // BUT user requested "not when i scroll left that it goes up"
                 // So we will clamp and consume the event even at edges to prevent accidental vertical jumps
                 
                 // However, we need a way to escape. The user can simply move mouse out of the area.
                 
                 if (rafId.current === null) {
                     targetScroll.current = scrollContainerRef.current.scrollLeft;
                 }
                 
                 targetScroll.current += e.deltaY * 0.7; // Speed factor
                 targetScroll.current = Math.max(0, Math.min(targetScroll.current, maxScroll));
                 
                 if (rafId.current === null) {
                    rafId.current = requestAnimationFrame(smoothScrollLoop);
                 }
            }
        }
    }
  };

  // Dedup Albums by Name
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniqueAlbums = React.useMemo(() => {
      if (!data?.albums) return [];
      const seen = new Set();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.albums.filter((a: any) => {
          const key = a.collectionName.toLowerCase().replace(/\s*\(.*?\)\s*/g, ''); // Remove (Deluxe), (clean) etc
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
      });
  }, [data.albums]);

  // Derived Statistics
  const artistStats = React.useMemo(() => {
      if (!data) return null;

      // 1. Years Active (Start Year)
      let startYear;
      if (data.albums && data.albums.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const years = data.albums.map((a: any) => new Date(a.releaseDate).getFullYear());
        startYear = Math.min(...years);
      }
      const activeYears = startYear && !isNaN(startYear) ? `${startYear} — Present` : 'Unknown';

      // 2. Record Label
      let label = 'Independent';
      if (data.albums && data.albums.length > 0) {
         // Usually copyright info is in the most recent album
         // Albums are already sorted newest first in the data fetcher
         const latestDetails = data.albums[0];
         if (latestDetails.copyright) {
            // Remove "℗ 2024 " prefix if present to just get the name
            label = latestDetails.copyright.replace(/℗\s*\d{4}\s*/, '').replace(/^Copyright \d{4}\s*/, '');
            // Truncate if too long
            if (label.length > 40) label = label.substring(0, 40) + '...';
         }
      }

      // 3. Origin
      const origin = data.info.country === 'USA' ? 'United States' : (data.info.country || 'International');

      return {
          years: activeYears,
          origin: origin,
          label: label
      };

  }, [data]);


  return (
    <div className={styles.container}>
       {/* CURTAIN ANIMATION */}
       <motion.div
         initial={{ top: 0 }}
         animate={{ top: '-150vh' }}
         transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
         style={{ 
             position: 'fixed', 
             left: 0, 
             width: '100%', 
             height: '100vh', 
             background: '#000',
             zIndex: 9999,
             display: 'flex',
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

      {/* 1. HERO SECTION - Card Layout */}
      <section 
          className={styles.heroSection}
          style={{ background: themeColor }}
      >
      <nav className={styles.navigationBar}>
         <Link href="/artists" className={styles.closeButton}>
            <motion.div
               initial="rest"
               whileHover="hover"
               animate="rest"
               style={{ display: 'flex', alignItems: 'center', gap: '15px' }}
            >
                {/* Desktop: Text 'Return' handled via CSS to hide on mobile */}
                <span className={styles.desktopReturnText}>RETURN</span>
                
                <motion.div
                    className={styles.iconWrapper}
                    variants={{
                        rest: { backgroundColor: 'rgba(255,255,255,0)', scale: 1 },
                        hover: { backgroundColor: 'rgba(255,255,255,1)', scale: 1.1 }
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="2"
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                        className={styles.closeIconSVG}
                    >
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </motion.div>
            </motion.div>
         </Link>
      </nav>
      
      {/* Mobile Logo Independent of Nav */}
      <div className={styles.mobileLogoContainer}>
         <div style={{ width: '8px', height: '8px', background: '#fff' }} />
         <span style={{ fontWeight: 800, letterSpacing: '-1px', fontSize: '1.2rem', color: '#fff' }}>MELOGRAPH</span>
      </div>
        
        {/* LEFT SIDE - IMAGE */}
        <div className={styles.heroImageWrapper}>
             {data.albums && data.albums[0] ? (
                <Image 
                    src={data.albums[0].artworkUrl100.replace('100x100bb', '600x600bb')}
                    alt={name}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ 
                        objectFit: 'cover', 
                        filter: 'grayscale(100%) brightness(0.9) contrast(1.2)' 
                    }} 
                />
             ) : (
                <div style={{ width: '100%', height: '100%', background: '#222' }} />
             )}
        </div>

        {/* RIGHT SIDE - CONTENT */}
        <div className={styles.heroContent}>
           
           {/* Top Bar removed - Moved to global nav */}

           <motion.h1 
             className={styles.artistTitle}
             initial={{ x: 50, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
           >
             {name}
           </motion.h1>

           <motion.div 
             className={styles.heroStats}
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.3 }}
           >
              <div>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6, marginBottom: '0.2rem' }}>Monthly Listeners</div>
                  <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-geist-mono)', fontWeight: 600 }}>{monthlyListeners}</div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                 <div className={styles.genreTag}>
                    {data.info.primaryGenreName}
                 </div>
                 <div className={styles.genreTag}>
                    2026
                 </div>
              </div>
           </motion.div>
        </div>
      </section>

      {/* 2. STATS & INFO BAR (Brutalist Grid) */}
      <motion.div 
         className={styles.statsGrid}
         initial={{ opacity: 0, y: 20 }}
         whileInView={{ opacity: 1, y: 0 }}
         viewport={{ once: true }}
      >
         {[
           { label: 'Primary Genre', val: data.info.primaryGenreName },
           { label: 'Years Active', val: artistStats?.years || 'Unknown' }, 
           { label: 'Origin', val: artistStats?.origin || 'International' },
           { label: 'Record Label', val: artistStats?.label || 'Indie' } 
         ].map((stat, i) => (
           <div key={i} className={styles.statItem}>
              <span className={styles.statLabel}>
                ( 0{i+1} ) {stat.label}
              </span>
              <span className={styles.statValue}>
                {stat.val}
              </span>
           </div>
         ))}
      </motion.div>

      <section className={styles.tracksSection}>
        <div className={styles.sectionHeader}>
            <h2>
              TOP TRACKS
            </h2>
             <div className={styles.mostPlayedBadge}>
                 <div className={styles.dot} style={{ background: themeColor, boxShadow: `0 0 10px ${themeColor}` }}></div>
                 <span>Most Played</span>
             </div>
        </div>
        
        {data.songs.slice(0, 5).map((song: any, i: number) => {
             const isActive = song.trackId === currentTrackId;
             const isLoadingThis = isLoading && isActive;
             const isPlayingThis = isActive && isPlaying;

             return (
               <motion.div 
                 key={song.trackId}
                 onClick={() => playFullSong(song)}
                 initial={{ opacity: 0, y: 10 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "100px" }}
                 transition={{ duration: 0.3, delay: i * 0.03 }}
                 className={`${styles.trackRow} ${isActive ? styles.active : ''} ${isLoadingThis ? styles.loading : ''}`}
                 style={{
                    '--local-theme': themeColor
                 } as React.CSSProperties}
               >
                   {/* Background Overlay */}
                   <div className={styles.bgOverlay} />

                   {/* CONTENT */}
                   <div className={styles.rowContent}>
                        {/* 1. INDEX / EQ / PLAY ICON */}
                        <div className={styles.indexColumn}>
                             {isLoadingThis ? (
                               <motion.div 
                                 animate={{ rotate: 360 }}
                                 transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                 style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto' }}
                               />
                             ) : (isActive && isPlaying) ? (
                                  <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', justifyContent: 'flex-end', height: '14px' }}>
                                      {[1,2,3].map(n => (
                                          <motion.div 
                                             key={n}
                                             animate={{ height: ['20%', '100%', '30%', '80%'] }}
                                             transition={{ repeat: Infinity, duration: 0.4 + (n * 0.1) }}
                                             style={{ width: '3px', background: themeColor }}
                                          />
                                      ))}
                                  </div>
                             ) : (
                                <>
                                    <span className={styles.indexNum}>
                                        {i < 9 ? `0${i+1}` : i+1}
                                    </span>
                                    <svg 
                                        className={styles.playIconSVG}
                                        width="14" height="14" viewBox="0 0 24 24" fill={themeColor} stroke={themeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                    </svg>
                                </>
                             )}
                        </div>

                        {/* 2. IMAGE (Optimized Size) */}
                        <div className={styles.trackImage}>
                             <Image 
                                src={song.artworkUrl100}
                                alt="Art"
                                fill
                                sizes="50px"
                                priority={i < 4}
                             />
                        </div>

                        {/* 3. TITLE & META */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <h3 className={styles.trackTitle}>
                                {song.trackName}
                            </h3>
                            <div className={styles.collectionText}>
                                {song.collectionName}
                            </div>
                        </div>

                        {/* 4. DURATION / ACTION */}
                        <div className={styles.actionColumn}>
                             <span className={styles.playActionText}>
                                {isActive ? (isPlaying ? 'PAUSE' : 'RESUME') : 'PLAY NOW'}
                             </span>
                             {(() => {
                                const ms = song.trackTimeMillis || 0;
                                const mins = Math.floor(ms / 60000);
                                const secs = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
                                return `${mins}:${secs}`;
                             })()}
                        </div>
                   </div>
               </motion.div>
             );
        })}
      </section>
      {/* 4. DISCOGRAPHY */}
      <section className={styles.discographySection}>
         <div className={styles.discographyHeader}>
             <h2 className={styles.discographyTitle}>
                DISCOGRAPHY
             </h2>
             <button 
                onClick={() => setViewMode(prev => prev === 'scroll' ? 'grid' : 'scroll')}
                className={styles.viewToggle}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
             >
                {viewMode === 'scroll' ? (
                   <>
                     <span>Show Grid</span>
                     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                   </>
                ) : (
                   <>
                     <span>Show Scroll</span>
                     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="10" rx="2" /></svg>
                   </>
                )}
             </button>
         </div>
         
         <motion.div 
             key={viewMode}
             ref={viewMode === 'scroll' ? scrollContainerRef : null}
             onWheel={viewMode === 'scroll' ? onWheel : undefined}
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             {...(viewMode === 'scroll' ? { 'data-lenis-prevent': '' } : {})}
             className={`${styles.albumsContainer} ${viewMode === 'scroll' ? styles.scrollMode : styles.gridMode}`}
         >
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {uniqueAlbums.map((album: any, i: number) => (
               <motion.div 
                 key={album.collectionId}
                 initial={{ opacity: 0, scale: 0.9 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true, margin: "-50px" }}
                 transition={{ duration: 0.4, delay: (i % 8) * 0.05 }}
                 className={styles.albumCard}
                 style={{ 
                    // Override SCSS fixed width when in grid mode
                    width: viewMode === 'grid' ? '100%' : undefined,
                    minWidth: viewMode === 'grid' ? '0' : undefined
                 }}
               >
                  <div className={styles.albumCoverWrapper}>
                    <Image
                      src={album.artworkUrl100.replace('100x100bb', '600x600bb')}
                      alt={album.collectionName}
                      fill
                      priority={i < 2}
                      sizes="(max-width: 768px) 150px, 300px"
                      style={{ objectFit: 'cover' }}
                    />
                    <div className={styles.bwOverlay} />
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#000', color: '#fff', padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      {new Date(album.releaseDate).getFullYear()}
                    </div>
                  </div>
                  <div className={styles.albumTitle}>{album.collectionName}</div>
                  <div className={styles.albumInfo}>{album.trackCount} Tracks</div>
               </motion.div>
            ))}
         </motion.div>
      </section>

      {/* HIDDEN YOUTUBE PLAYER & AUDIO FALLBACK */}
      <div style={{ display: 'none' }}>
        <audio ref={audioFallbackRef} />
        {/* Always render player to ensure ref is ready for client-side search */}
        <YouTube 
            opts={{ 
                height: '0', 
                width: '0', 
                playerVars: { 
                    autoplay: 1, 
                    playsinline: 1,
                    controls: 0,
                    disablekb: 1
                } 
            }}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
        />
      </div>

      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
        body {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}