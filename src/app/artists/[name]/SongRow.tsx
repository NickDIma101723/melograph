'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

// Enhanced Song Interface
interface Song { 
    id: string; 
    title: string; 
    album: string; 
    duration: string; 
    plays: string; 
    cover?: string;
    artistName?: string; // Need this for like payload
}

interface SongRowProps {
    song: Song;
    index: number;
    isLiked?: boolean;
    onToggleLike?: (song: Song) => void;
}

export default function SongRow({ song, index, isLiked = false, onToggleLike }: SongRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
      className="song-row"
      style={{ display: 'grid', gridTemplateColumns: '40px 50px 1fr 40px 60px', alignItems: 'center', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
      <div className="index" style={{ textAlign: 'center', color: '#888' }}>{isHovered ? '▶' : index + 1}</div>
      <div className="cover-art" style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden' }}>
        {song.cover && <Image src={song.cover} alt={song.album} fill style={{ objectFit: 'cover' }} />}
      </div>
      <div className="info">
        <div className="title" style={{ fontWeight: 600 }}>{song.title}</div>
        {/* <div className="album" style={{ fontSize: '0.8rem', opacity: 0.6 }}>{song.album}</div> */}
      </div>
      
      {/* LIKE BUTTON */}
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleLike && onToggleLike(song); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: isLiked ? '#ff4444' : '#fff', opacity: isLiked || isHovered ? 1 : 0, transition: 'all 0.2s' }}
      >
        {isLiked ? '♥' : '♡'}
      </button>

      <div className="duration" style={{ fontSize: '0.9rem', opacity: 0.6, textAlign: 'right' }}>{song.duration}</div>
    </motion.div>
  );
}

