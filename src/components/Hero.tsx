"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import YouTube from "react-youtube";
import { motion } from "framer-motion";
import { useUI } from "@/context/UIContext";

// FEATURED ARTISTS DATA
const FEATURED_ARTISTS = [
  {
    id: 'uzi',
    artist: 'Lil Uzi Vert',
    song: 'What You Saying',
    album: 'What You Saying - Single',
    year: '2025',
    genre: 'Hip-Hop / Rap',
    videoId: 's_TUESTU7_4',
    previewUrl: 'https://video-ssl.itunes.apple.com/itunes-assets/Video221/v4/56/a4/51/56a4514d-be4c-af34-a648-4f0edc8ebd32/mzvf_10910503337687684418.1920w.h264lc.U.p.m4v',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/ee/24/92/ee249222-bfef-2abe-b8d0-16f0f35a3b17/8721465006940.png/1000x1000bb.jpg',
    link: 'https://LilUziVert.lnk.to/WhatYouSaying',
    badge: {
      title: 'EA',
      subtitle: 'II'
    },
    cardColor: '#D8C5E5'
  },
  {
    id: 'sombr',
    artist: 'Sombr',
    song: 'Back to Being Friends',
    album: 'Structure - EP',
    year: '2024',
    genre: 'Alternative',
    videoId: 'c8zq4kAn_O0',
    previewUrl: 'https://video-ssl.itunes.apple.com/itunes-assets/Video221/v4/be/fa/b6/befab6aa-1af3-081e-b646-b09cb0c5b300/mzvf_10026529937376233414.1920w.h264lc.U.p.m4v',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/5d/d5/ad/5dd5ad1b-fabf-9218-77f0-3adbfd5328ac/054391237118.jpg/1000x1000bb.jpg',
    link: 'https://music.apple.com/us/album/back-to-being-friends/1739091873',
    badge: {
      title: 'SO',
      subtitle: 'MBR'
    },
    cardColor: '#9FB1BC'
  },
  {
    id: 'kendrick',
    artist: 'Kendrick Lamar',
    song: 'luther',
    album: 'GNX',
    year: '2025',
    genre: 'Hip-Hop',
    videoId: 'sNY_2TEmzho',
    previewUrl: 'https://video-ssl.itunes.apple.com/itunes-assets/Video211/v4/9c/1f/b4/9c1fb45e-2d6f-dfec-417e-505888393068/mzvf_8741738360778228765.1920w.h264lc.U.p.m4v',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Video211/v4/c7/a0/44/c7a04494-9008-2321-f83e-156b76e547fc/25UMGIM55207.crop.jpg/1000x1000bb.jpg',
    link: 'https://music.apple.com/us/album/gnx/1781353928',
    badge: {
      title: 'GN',
      subtitle: 'X'
    },
    cardColor: '#C4B2A6'
  }
];

export default function Hero() {
  const { toggleMenu } = useUI();
  const heroRef = useRef(null);
  const isPanning = useRef(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentArtistIndex, setCurrentArtistIndex] = useState(0);
  const activeArtist = FEATURED_ARTISTS[currentArtistIndex];
  
  // Dynamic Island State
  const [showDynamicIsland, setShowDynamicIsland] = useState(false);
  const swipeStartX = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      // Increased breakpoint to match S24 Ultra and larger phones
      setIsMobile(window.innerWidth <= 1024);
    };
    
    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Swipe Detection for Mobile (Horizontal Swipe Left)
  useEffect(() => {
    if (!isMobile) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      swipeStartX.current = e.touches[0].clientX;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const swipeEndX = e.changedTouches[0].clientX;
      const swipeDistance = swipeStartX.current - swipeEndX;
      
      // Swipe LEFT detected (at least 50px)
      if (swipeDistance > 50) {
        // If menu is closed, this opens it. If open, toggle might close it, 
        // but typically swipe left on hero means "Open Menu" if the menu slides from right.
        toggleMenu();
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, toggleMenu]);

  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextArtist = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 800); // 800ms cooldown matching transition

    setCurrentArtistIndex((prev) => (prev + 1) % FEATURED_ARTISTS.length);
    setIsMiniPlaying(false);
    setMiniProgress(0);
    setIsVideoPlaying(false);
    setVideoProgress(0);
    // Clear refs to prevent stale access
    playerRef.current = null;
    modalPlayerRef.current = null;
    fullScreenPlayerRef.current = null;
  };

  const prevArtist = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 800);

    setCurrentArtistIndex((prev) => (prev - 1 + FEATURED_ARTISTS.length) % FEATURED_ARTISTS.length);
    setIsMiniPlaying(false);
    setMiniProgress(0);
    setIsVideoPlaying(false);
    setVideoProgress(0);
    // Clear refs to prevent stale access
    playerRef.current = null;
    modalPlayerRef.current = null;
    fullScreenPlayerRef.current = null;
  };

  const goToArtist = (index: number) => {
    if (isTransitioning || index === currentArtistIndex) return;
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 800);

    setCurrentArtistIndex(index);
    setIsMiniPlaying(false);
    setMiniProgress(0);
    setIsVideoPlaying(false);
    setVideoProgress(0);
    // Clear refs to prevent stale access
    playerRef.current = null;
    modalPlayerRef.current = null;
    fullScreenPlayerRef.current = null;
  };

  // --- Scroll & Keyboard Navigation ---
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Prevent unintended rapid scrolling
      if (Math.abs(e.deltaY) < 20) return; 

      if (e.deltaY > 0) {
        // Scrolling Down -> Next
        setCurrentArtistIndex((prev) => (prev + 1) % FEATURED_ARTISTS.length);
      } else {
        // Scrolling Up -> Prev
        setCurrentArtistIndex((prev) => (prev - 1 + FEATURED_ARTISTS.length) % FEATURED_ARTISTS.length);
      }
    };

    // Debounced wrapper
    let timeout: NodeJS.Timeout;
    const debouncedWheel = (e: WheelEvent) => {
        if(timeout) return;
        handleWheel(e);
        timeout = setTimeout(() => {
             // @ts-expect-error - Clearing timeout reference
             timeout = null; 
        }, 1000); // 1 second cooldown
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          setCurrentArtistIndex((prev) => (prev + 1) % FEATURED_ARTISTS.length);
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          setCurrentArtistIndex((prev) => (prev - 1 + FEATURED_ARTISTS.length) % FEATURED_ARTISTS.length);
      }
    };

    window.addEventListener('wheel', debouncedWheel);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('wheel', debouncedWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);

    // Disable scrolling when Hero is active (Home Page)
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    // Force background to black to hide any gaps
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#000";
    
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.backgroundColor = originalBg;
    };
  }, []);
  const playerRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modalPlayerRef = useRef<any>(null);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Separate state for Mini Player (Audio)
  const [isMiniPlaying, setIsMiniPlaying] = useState(false);

  const [miniProgress, setMiniProgress] = useState(0);
  const [miniDuration, setMiniDuration] = useState(0);

  // Manage body class for Navbar visibility
  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add('video-mode-active');
    } else {
      document.body.classList.remove('video-mode-active');
    }

    return () => {
      document.body.classList.remove('video-mode-active');
    };
  }, [isModalOpen]);
  
  // Separate state for Video Modal (Video)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  const miniProgressInterval = useRef<NodeJS.Timeout | null>(null);
  const videoProgressInterval = useRef<NodeJS.Timeout | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fullScreenPlayerRef = useRef<any>(null);

  const formatTime = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Clear intervals on unmount
  useEffect(() => {
    return () => {
      if (miniProgressInterval.current) clearInterval(miniProgressInterval.current);
      if (videoProgressInterval.current) clearInterval(videoProgressInterval.current);
    };
  }, []);

  // --- Mini Player Logic ---
  const startMiniProgressTracking = () => {
    if (miniProgressInterval.current) clearInterval(miniProgressInterval.current);
    miniProgressInterval.current = setInterval(() => {
      if (modalPlayerRef.current && typeof modalPlayerRef.current.getCurrentTime === 'function') {
        const currentTime = modalPlayerRef.current.getCurrentTime();
        const totalDuration = modalPlayerRef.current.getDuration();
        if (totalDuration) {
          setMiniDuration(totalDuration);
          setMiniProgress((currentTime / totalDuration) * 100);
        }
      }
    }, 100);
  };

  const stopMiniProgressTracking = () => {
    if (miniProgressInterval.current) clearInterval(miniProgressInterval.current);
  };

  const handleMiniSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!modalPlayerRef.current || !miniDuration) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max(x / rect.width, 0), 1);
    
    const seekTime = percentage * miniDuration;
    if (typeof modalPlayerRef.current.seekTo === 'function') {
        modalPlayerRef.current.seekTo(seekTime, true);
    }
    setMiniProgress(percentage * 100);
  };

  const toggleMiniPlayPause = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!modalPlayerRef.current) return;
    
    if (isMiniPlaying) {
      if (typeof modalPlayerRef.current.pauseVideo === 'function') {
        modalPlayerRef.current.pauseVideo();
      }
      setIsMiniPlaying(false);
      stopMiniProgressTracking();
    } else {
      if (typeof modalPlayerRef.current.playVideo === 'function') {
        modalPlayerRef.current.playVideo();
      }
      setIsMiniPlaying(true);
      startMiniProgressTracking();
    }
  };

  // --- Video Modal Logic ---
  const startVideoProgressTracking = () => {
    if (videoProgressInterval.current) clearInterval(videoProgressInterval.current);
    videoProgressInterval.current = setInterval(() => {
      if (fullScreenPlayerRef.current && typeof fullScreenPlayerRef.current.getCurrentTime === 'function') {
        const currentTime = fullScreenPlayerRef.current.getCurrentTime();
        const totalDuration = fullScreenPlayerRef.current.getDuration();
        if (totalDuration) {
          setVideoDuration(totalDuration);
          setVideoProgress((currentTime / totalDuration) * 100);
        }
      }
    }, 100);
  };

  const stopVideoProgressTracking = () => {
    if (videoProgressInterval.current) clearInterval(videoProgressInterval.current);
  };

  const handleVideoSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!fullScreenPlayerRef.current || !videoDuration) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max(x / rect.width, 0), 1);
    
    const seekTime = percentage * videoDuration;
    if (typeof fullScreenPlayerRef.current.seekTo === 'function') {
        fullScreenPlayerRef.current.seekTo(seekTime, true);
    }
    setVideoProgress(percentage * 100);
  };

  const toggleVideoPlayPause = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!fullScreenPlayerRef.current) return;

    if (isVideoPlaying) {
      if (typeof fullScreenPlayerRef.current.pauseVideo === 'function') {
          fullScreenPlayerRef.current.pauseVideo();
      }
      setIsVideoPlaying(false);
      stopVideoProgressTracking();
    } else {
      if (typeof fullScreenPlayerRef.current.playVideo === 'function') {
          fullScreenPlayerRef.current.playVideo();
      }
      setIsVideoPlaying(true);
      startVideoProgressTracking();
    }
  };

  const toggleMiniPlayer = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const willBeOpen = !isMiniPlayer;
    setIsMiniPlayer(willBeOpen);
    
    if (willBeOpen) {
      // Opening: Auto play
      if (modalPlayerRef.current) {
        if (typeof modalPlayerRef.current.playVideo === 'function') {
           modalPlayerRef.current.playVideo();
        }
        setIsMiniPlaying(true);
        startMiniProgressTracking();
      }
    } else {
      // Closing: Pause
      if (modalPlayerRef.current) {
        if (typeof modalPlayerRef.current.pauseVideo === 'function') {
           modalPlayerRef.current.pauseVideo();
        }
        setIsMiniPlaying(false);
        stopMiniProgressTracking();
      }
    }
  };

  const openModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
    
    // Pause audio player if playing
    if (isMiniPlaying && modalPlayerRef.current) {
      if (typeof modalPlayerRef.current.pauseVideo === 'function') {
        modalPlayerRef.current.pauseVideo();
      }
      setIsMiniPlaying(false);
      stopMiniProgressTracking();
    }
    
    // Start video player
    if (fullScreenPlayerRef.current) {
        if (typeof fullScreenPlayerRef.current.playVideo === 'function') {
           fullScreenPlayerRef.current.playVideo();
        }
        setIsVideoPlaying(true);
        startVideoProgressTracking();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    
    // Stop video player
    if (fullScreenPlayerRef.current) {
        if (typeof fullScreenPlayerRef.current.pauseVideo === 'function') {
             fullScreenPlayerRef.current.pauseVideo();
        }
        setIsVideoPlaying(false);
        stopVideoProgressTracking();
    }
  };

  const modalVideoOptions = {
    playerVars: {
      autoplay: 0, 
      controls: 0, 
      rel: 0,
      showinfo: 0,
      modestbranding: 1,
      disablekb: 1, 
      fs: 0, 
      vq: 'hd2160', 
      origin: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  };

  if (!hasMounted) return null;

  return (
    <motion.div
      key={activeArtist.id} // Re-mount component when artist changes to refresh video
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: "easeOut" }}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <section className="hero" ref={heroRef}>
        <div className="hero__video-wrapper">
          <video
            ref={playerRef}
            key={`hero-${activeArtist.id}`}
            src={activeArtist.previewUrl}
            className="hero__video-iframe"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            autoPlay
            muted
            loop
            playsInline
            poster={activeArtist.artwork}
          />
        </div>

        <div className="hero__grain"></div>
        <div className="hero__overlay"></div>
        
        {/* RIGHT EDGE - Mobile Swipe Hint */}
        {isMobile && (
          <motion.div 
            className="hero__edge-indicator"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            onClick={toggleMenu} // Added Click Handler
          >
            <div className="hero__edge-handle"></div>
            <span className="hero__edge-text">MENU</span>
          </motion.div>
        )}

        {/* SIDE NAVIGATION */}
        {!isMobile && (
          <div className="hero__side-nav">
            {FEATURED_ARTISTS.map((artist, index) => (
               <div 
                 key={artist.id}
                 className={`hero__side-nav-item ${index === currentArtistIndex ? 'active' : ''}`}
                 onClick={(e) => { e.stopPropagation(); goToArtist(index); }}
               >
                  <div className="hero__side-nav-line" />
                  <span className="hero__side-nav-number">0{index + 1}</span>
               </div>
            ))}
          </div>
        )}
        
        <div className="hero__content">
          <motion.div 
            className="hero__title-massive"
            key={`title-${activeArtist.id}`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
          >
            <span>{activeArtist.badge.title}</span>
            <span className="outline">{activeArtist.badge.subtitle}</span>
          </motion.div>
          <motion.div 
            className="hero__subtitle"
            key={`subtitle-${activeArtist.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {activeArtist.genre.toUpperCase()} EXPERIENCE
          </motion.div>
        </div>

        {/* Hidden YouTube Player for Audio */}
        <div style={{ display: 'none' }}>
          <YouTube
            key={`audio-${activeArtist.id}`}
            videoId={activeArtist.videoId}
            opts={modalVideoOptions}
            onReady={(event) => {
              modalPlayerRef.current = event.target;
              // Don't auto play initially
            }}
            onStateChange={(event) => {
              // 1 = Playing, 2 = Paused, 0 = Ended
              if (event.data === 1) {
                setIsMiniPlaying(true);
                startMiniProgressTracking();
              } else if (event.data === 2) {
                setIsMiniPlaying(false);
                stopMiniProgressTracking();
              } else if (event.data === 0) {
                // Auto-replay when video ends
                event.target.seekTo(0);
                event.target.playVideo();
              }
            }}
          />
        </div>

        {/* Music Info Card */}
        <motion.div 
          key={isMobile ? "mobile-card" : "desktop-card"}
          className={`music-card ${isMiniPlayer ? "mini-player-active" : ""} ${(isVideoPlaying || isMiniPlaying) ? "playing" : ""}`} 
          drag={isMobile ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={isMobile ? 0 : 0.1}
          dragMomentum={!isMobile}
          onDragStart={() => { if (!isMobile) isPanning.current = true; }}
          onDragEnd={(_, info) => {
             if (isMobile) return;
             setTimeout(() => { isPanning.current = false; }, 50);
             if (Math.abs(info.offset.x) > 50) {
                  toggleMenu();
             }
          }}
          onClick={() => {
            if (!isPanning.current) {
               toggleMiniPlayer();
            }
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
          style={{ '--card-bg': activeArtist.cardColor } as React.CSSProperties}
        >
          <div 
            className="music-card__artwork" 
            onClick={openModal} 
            style={{ cursor: 'pointer' }}
          >
            <Image 
              src={activeArtist.artwork} 
              alt={`${activeArtist.song} - Artwork`}
              width={80}
              height={80}
              style={{ objectFit: 'cover' }}
              // Optimizing: Use lazy loading to prevent blocking during rapid slides
              loading="lazy" 
            />
            <div className="music-card__overlay">
              <button className="music-card__play-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Info Content */}
          <div className="music-card__content">
            <div className="music-card__header">
              <span className="music-card__label">LATEST RELEASE</span>
              <span className="music-card__year">{activeArtist.year}</span>
            </div>
            <div className="music-card__info">
              <h2 className="music-card__artist">{activeArtist.artist}</h2>
              <h3 className="music-card__song">{activeArtist.song}</h3>
              <p className="music-card__album">{activeArtist.album}</p>
            </div>
            <div className="music-card__footer">
              <span className="music-card__genre">{activeArtist.genre}</span>
              <div className="music-card__waveform">
                <span></span><span></span><span></span><span></span>
              </div>
            </div>
          </div>

          {/* Mini Player Content */}
          <div className="music-card__player-controls">
            <div className="music-card__player-header">
              <div className="music-card__player-info">
                  <span className="music-card__player-title">{activeArtist.song}</span>
                  <span className="music-card__player-artist">{activeArtist.artist}</span>
              </div>
              <button className="music-card__back-btn" onClick={(e) => { e.stopPropagation(); toggleMiniPlayer(); }} aria-label="Minimize Player">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
            
            <div className="music-card__progress-container" onClick={handleMiniSeek}>
              <div className="music-card__progress-track">
                <div 
                  className="music-card__progress-fill" 
                  style={{ width: `${miniProgress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="music-card__time-display">
              <span className="current">{formatTime((miniProgress / 100) * miniDuration)}</span>
              <span className="total">{formatTime(miniDuration)}</span>
            </div>

            <div className="music-card__controls-row">
              <button className="music-card__control-btn" onClick={(e) => { 
                e.stopPropagation(); 
                prevArtist();
              }} aria-label="Previous Song">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/> 
                </svg>
              </button>
              
              <button className="music-card__main-play-btn" onClick={toggleMiniPlayPause} aria-label={isMiniPlaying ? "Pause" : "Play"}>
                {isMiniPlaying ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button className="music-card__control-btn" onClick={(e) => { 
                e.stopPropagation(); 
                nextArtist();
              }} aria-label="Next Song">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      <div className={`video-modal ${isModalOpen ? "open" : ""}`} style={{ zIndex: 3000 }}>
        {/* Top Header */}
        <div className="video-modal__header" style={{ pointerEvents: 'auto' }}>
          <div className="video-modal__logo">
            <span>{activeArtist.badge.title}</span>
            <span>{activeArtist.badge.subtitle}</span>
          </div>
          <button 
             className="video-modal__close" 
             onClick={closeModal}
             style={{ cursor: 'pointer', zIndex: 3001, pointerEvents: 'auto' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="video-modal__content">
          {isModalOpen && (
            <div className="video-modal__player">
              <YouTube
                videoId={activeArtist.videoId}
                opts={modalVideoOptions}
                className="video-modal__youtube"
                onReady={(event) => {
                  fullScreenPlayerRef.current = event.target;
                  event.target.setPlaybackQuality('highres');
                  if (typeof event.target.playVideo === 'function') {
                     event.target.playVideo();
                  }
                }}
                onStateChange={(event) => {
                  if (event.data === 1) {
                    setIsVideoPlaying(true);
                    startVideoProgressTracking();
                  } else if (event.data === 2) {
                    setIsVideoPlaying(false);
                    stopVideoProgressTracking();
                  } else if (event.data === 0) {
                    event.target.seekTo(0);
                    // Safe call
                    if (typeof event.target.playVideo === 'function') {
                      event.target.playVideo();
                    }
                  }
                }}
              />

              {/* Text Overlay */}
              <div className="video-modal__overlay">
                <h1 className="video-modal__title">
                  {activeArtist.artist.toUpperCase()} -<br />{activeArtist.song.toUpperCase()}
                </h1>
              </div>

              {/* Bottom Control Bar */}
              <div className="video-modal__controls">
                <div className="video-modal__progress-wrapper" onClick={handleVideoSeek}>
                  <div className="video-modal__progress-bg">
                    <div 
                      className="video-modal__progress-bar" 
                      style={{ width: `${videoProgress}%` }}
                    >
                      <div className="video-modal__progress-thumb"></div>
                    </div>
                  </div>
                </div>

                <div className="video-modal__time-display" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-geist-mono)',
                  marginTop: '8px',
                  marginBottom: '16px'
                }}>
                  <span>{formatTime((videoProgress / 100) * videoDuration)}</span>
                  <span>{formatTime(videoDuration)}</span>
                </div>
                
                <div className="video-modal__bottom-bar">
                  <div className="video-modal__bottom-left">
                    <button className="video-modal__play-btn" onClick={toggleVideoPlayPause}>
                      {isVideoPlaying ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16"></rect>
                          <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                    <div className="video-modal__artist-badge">
                      <svg className="video-modal__keyhole" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="9" r="5" />
                        <path d="M8 22L16 22L14.5 13H9.5L8 22Z" />
                      </svg>
                      <div className="video-modal__badge-text">
                        <span className="video-modal__badge-title">{activeArtist.song.toUpperCase()}</span>
                        <span className="video-modal__badge-subtitle">{activeArtist.artist.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  <a 
                    href={activeArtist.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="video-modal__project-info"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <span>STREAM NOW</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
