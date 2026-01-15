'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import YouTube from 'react-youtube';
// iTunes Search API Interface
interface ItunesArtist {
  artistName: string;
  primaryGenreName?: string;
  artworkUrl100?: string; // We will upscale this
  amgArtistId?: number; // External ID
}

// Internal Artist Shape
interface ArtistData {
  idArtist: string;
  strArtist: string;
  strGenre: string;
  strArtistThumb: string;
  strBiographyEN: string; // Won't get real bio from iTunes, but that's okay
  strStyle: string;
  previewUrl?: string;
  isVideo?: boolean;
  youtubeId?: string; // New field for YouTube fallback
}

const ROSTER = [
  'Kendrick Lamar',
  'Manos', 
  'Sombr',
  'Frank Ocean',
  'Tame Impala',
  'Bjork',
  'Aphex Twin',
  'Tyler, The Creator',
  'FKA Twigs',
  'Daft Punk',
  'The Weeknd',
  'Lana Del Rey',
  'Kanye West',
  'Radiohead',
  'Gorillaz',
  'Rosalia',
  'Travis Scott',
  'Lorde'
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
};

export default function ArtistsPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [artists, setArtists] = useState<ArtistData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Audio/Video State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const youtubePlayerRef = useRef<any>(null); // For YouTube Player API
  const [isPlaying, setIsPlaying] = useState(false);

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

    // Safety wrapper to check src usage
    const safeSrc = (el: HTMLMediaElement | null) => el ? el.src : '';

    // Stop others
    if (audio && !audio.paused && safeSrc(audio) !== url) audio.pause();
    if (video && !video.paused && safeSrc(video) !== url) video.pause();
    
    // YT Handle
    if (youtubeId) {
       if (yt && typeof yt.getPlayerState === 'function') {
          try {
              const state = yt.getPlayerState();
              if (isPlaying && (state === 1 || state === 3)) {
                yt.pauseVideo();
                setIsPlaying(false);
              } else {
                if (audio) audio.pause();
                if (video) video.pause();
                yt.playVideo();
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
    if (media.src !== url) {
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
    const fetchArtists = async () => {
      try {
        const res = await fetch('/api/artists-data');
        if (res.ok) {
            const data = await res.json();
            setArtists(data);
        } else {
            console.error("Failed to load artists data");
        }
      } catch (error) {
        console.error('Error fetching artists:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, []);

  // Show a minimal loading screen
  if (loading) return (
    <div className={"p-artists"} style={{ display: 'grid', placeItems: 'center', background: '#000' }}>
      <div style={{ color: '#fff', fontFamily: 'var(--font-geist-mono)', fontSize: '0.9rem', opacity: 0.7 }}>
        LOADING...
      </div>
    </div>
  );
  
  if (artists.length === 0) return null;

  const selectedArtist = artists[selectedIndex];
  const nextIndex = (selectedIndex + 1) % artists.length;
  const nextArtist = artists[nextIndex];
  const moodColor = ARTIST_MOODS[selectedArtist.strArtist] || '#000000';

  return (
    <motion.div 
      className={"p-artists"} 
      style={{ transition: 'background-color 1s ease' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Page Content continues... */}
      
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
      <motion.div
        animate={{ opacity: isPlaying && (selectedArtist.isVideo || selectedArtist.youtubeId) ? 0.6 : 0 }}
        transition={{ duration: 1 }}
        style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}
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
             filter: 'blur(30px) saturate(1.5)' 
           }} 
        />
        
        {/* YOUTUBE VIDEO */}
        {selectedArtist.youtubeId && (
          <div style={{ 
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
            pointerEvents: 'none', 
            opacity: isPlaying ? 1 : 0,
            transition: 'opacity 0.5s ease'
          }}>
             <YouTube
                key={selectedArtist.youtubeId} // Force remount on artist change
                videoId={selectedArtist.youtubeId}
                opts={{
                  height: '100%',
                  width: '100%',
                  playerVars: {
                    autoplay: 0,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    loop: 1, // Loop it for vibes
                    modestbranding: 1,
                    playsinline: 1,
                    rel: 0,
                    showinfo: 0,
                    mute: 0, // Ensure sound is on
                    playlist: selectedArtist.youtubeId, // Required for loop: 1 to work!
                    origin: typeof window !== 'undefined' ? window.location.origin : undefined
                  }
                }}
                onReady={(event) => {
                  youtubePlayerRef.current = event.target;
                  // Auto-play if we are already in a playing state (e.g. user clicked quickly)
                  if (isPlaying) {
                     event.target.playVideo();
                  }
                }}
                onStateChange={(event) => {
                  if (event.data === 0) setIsPlaying(false); // Ended
                }}
                // Using inline style or global class to avoid module mismatch if class is missing
                style={{ width: '100%', height: '100%' }}
             />
          </div>
        )}
      </motion.div>
      <motion.div
        animate={{ opacity: isPlaying && selectedArtist.isVideo ? 0.3 : 0 }}
        transition={{ duration: 1 }}
        style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', mixBlendMode: 'overlay' }}
      >
         {/* Texture Overlay */}
      </motion.div>
      
      {/* LEFT SIDEBAR */}
      <aside className={"sidebar"}>
        <nav className={"artistList"}>
          {artists.map((artist, idx) => (
            <button
              key={artist.idArtist}
              onClick={() => setSelectedIndex(idx)}
              className={`${"artistButton"} ${idx === selectedIndex ? "active" : ''}`}
            >
              {artist.strArtist}
            </button>
          ))}
        </nav>
      </aside>

      {/* CENTER - HERO IMAGE */}
      <section className={"heroSection"}>
        <div 
          className={"heroImage"}
          ref={heroRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={tiltStyle}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {selectedArtist.strArtistThumb && (
              <motion.div
                key={selectedArtist.idArtist}
                style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
                onClick={(e) => {
                  if (selectedArtist.previewUrl || selectedArtist.youtubeId) {
                    togglePlay(e, selectedArtist.previewUrl, selectedArtist.isVideo, selectedArtist.youtubeId);
                  }
                }}
              >
                  {/* VERTICAL CAMERA PAN (THE "ELEVATOR" EFFECT)
                      - Simulates the camera physically moving DOWN a long strip of images.
                      - Current Image: Moves UP and OUT (y: -100%)
                      - Next Image: Moves UP and IN (y: 100% -> 0%)
                  */}
                  <motion.img 
                    // Add timestamp to bust browser cache while we debug
                    src={`/api/proxy-image?url=${encodeURIComponent(selectedArtist.strArtistThumb)}&cb=${Date.now()}`}
                    alt={selectedArtist.strArtist}
                    initial={{ 
                      y: '100%',     // Starts below the viewport (Camera hasn't reached it yet)
                      scale: 1,
                      filter: 'brightness(1)'
                    }}
                    animate={{ 
                      y: '0%',       // Centers in viewport
                      scale: 1,
                      filter: 'brightness(1)',
                      zIndex: 10,
                      transition: { 
                        duration: 0.8, 
                        ease: [0.65, 0, 0.35, 1] // "Cubic-bezier" for smooth camera inertia
                      }
                    }}
                    exit={{ 
                      y: '-100%',    // Moves up (Camera continues moving down past it)
                      scale: 1,      // Keep scale consistent for "continuous strip" feel
                      filter: 'brightness(0.8)', // Slight dim as it passes
                      zIndex: 5,
                      transition: { 
                        duration: 0.8, 
                        ease: [0.65, 0, 0.35, 1] 
                      }
                    }}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      position: 'absolute',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)' // Less shadow
                    }}
                  />

                  {/* Audio Control Overlay - INVISIBLE CLICK AREA */}
                  {/* The entire card is now the button. Visual button removed per user request. */}

                  {/* ARTIST "LOGO" TREATMENT REMOVED */}

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* RIGHT SIDE - NEXT ARTIST */}
      <aside className={"sideSection"}>
        <div className={"sideImage"}>
          <AnimatePresence mode="popLayout" initial={false}>
            {nextArtist.strArtistThumb && (
              <motion.img 
                key={nextArtist.idArtist} // Key ensures React treats this as a new element per artist
                src={`/api/proxy-image?url=${encodeURIComponent(nextArtist.strArtistThumb)}&cb=${Date.now()}`}
                alt={nextArtist.strArtist}
                initial={{ y: '100%', opacity: 0 }} // Start from bottom
                animate={{ 
                  y: '0%', 
                  opacity: 0.7, // Side image is usually dimmer per CSS, ensuring it here
                  transition: { 
                    duration: 0.8, 
                    ease: [0.65, 0, 0.35, 1],
                    delay: 0.1 // Slight lag behind main image for organic feel
                  }
                }}
                exit={{ 
                  y: '-100%', // Exit to top
                  opacity: 0, 
                  transition: { duration: 0.8, ease: [0.65, 0, 0.35, 1] } 
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  position: 'absolute'
                }}
              />
            )}
          </AnimatePresence>
        </div>
        <div className={"indicator"}>
          {selectedIndex + 1} / {artists.length}
        </div>
      </aside>
    </motion.div>
  );
}
