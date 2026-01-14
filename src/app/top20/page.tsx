'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [songs, setSongs] = useState<TopSong[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch Logic
  useEffect(() => {
    const fetchTop20 = async () => {
      try {
        const res = await fetch('https://itunes.apple.com/us/rss/topsongs/limit=20/json');
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
    <div className={"p-top20"} style={{ display: 'grid', placeItems: 'center' }}>
        LOADING CHARTS...
    </div>
  );

  const selectedSong = songs[selectedIndex];

  return (
    <div className={"p-top20"}>
      <div className={"noiseOverlay"} />
      <div className={"gridLines"} />
      
      <audio 
        ref={audioRef} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => { setIsPlaying(false); setProgress(0); }} 
      />

      {/* LEFT LIST */}
      <aside className={"listSection"}>
        <div className={"header"}>
            <motion.h1 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ duration: 0.6 }}
            >
              Top 20
            </motion.h1>
            <motion.p
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }} // Fully visible
               transition={{ delay: 0.2, duration: 0.6 }}
            >
              iTunes US Charts • Updated Weekly
            </motion.p>
        </div>
        <div className={"list"}>
            {songs.map((song, idx) => (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * idx, duration: 0.3 }}
                  key={song.id} 
                  className={`${"trackItem"} ${idx === selectedIndex ? "active" : ''}`}
                  onClick={() => setSelectedIndex(idx)}
                >
                    <span className={"rank"}>{String(song.rank).padStart(2, '0')}</span>
                    <div className={"trackInfo"}>
                        <span className={"trackName"}>{song.title}</span>
                        <span className={"artistName"}>{song.artist}</span>
                    </div>
                    {/* VISUALIZER IF PLAYING THIS SONG */}
                    {selectedIndex === idx && isPlaying && (
                       <div className={"playingIndicator"}>
                          <div className={"bar"}></div>
                          <div className={"bar"}></div>
                          <div className={"bar"}></div>
                       </div>
                    )}
                </motion.div>
            ))}
        </div>
      </aside>

      {/* RIGHT PREVIEW */}
      <main 
         className={"previewSection"}
         // @ts-ignore - CSS custom property for dynamic background
         style={{ '--bg-image': `url(${selectedSong?.image || ''})` } as React.CSSProperties}
      >
        <div className={"bigRank"}>
             {String(selectedSong.rank).padStart(2, '0')}
        </div>

        <AnimatePresence mode="wait">
             <motion.div 
               key={`info-${selectedSong.id}`}
               className={"songInfo"}
               initial={{ y: 40, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: -40, opacity: 0 }}
               transition={{ duration: 0.5, delay: 0.2 }}
             >
                <h2 className={"bigTitle"}>{selectedSong.title}</h2>
                <h3 className={"bigArtist"}>{selectedSong.artist}</h3>
             </motion.div>

             <motion.div
               key={selectedSong.id}
               className={"artworkContainer"}
               ref={heroRef}
               onMouseMove={handleMouseMove}
               onMouseLeave={handleMouseLeave}
               style={tiltStyle}
               initial={{ opacity: 0, scale: 0.95, y: 30, rotateX: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
               exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
               transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} 
             >
                <img 
                   src={`/api/proxy-image?url=${encodeURIComponent(selectedSong.image)}`}
                   alt={selectedSong.title} 
                   className={"artwork"}
                />
             </motion.div>
        </AnimatePresence>
        
        {/* PLAY BUTTON */}
        <div className={"controls"}>
             <div className={"playWrapper"}>
                {/* SVG Progress Ring */}
                <svg className={"progressRing"} width="100" height="100" viewBox="0 0 100 100">
                  <circle 
                    className={"progressRingBg"}
                    cx="50" cy="50" r="48" 
                    fill="none" 
                    strokeWidth="2"
                  />
                  <circle 
                    className={"progressRingFg"}
                    cx="50" cy="50" r="48" 
                    fill="none" 
                    strokeWidth="2"
                    strokeDasharray="301.59" // 2 * PI * 48
                    strokeDashoffset={301.59 - (301.59 * progress) / 100}
                  />
                </svg>
                
                <button className={"playButton"} onClick={togglePlay}>
                    {isPlaying ? (
                        <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                    ) : (
                        <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24" style={{ marginLeft: '4px' }}>
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
