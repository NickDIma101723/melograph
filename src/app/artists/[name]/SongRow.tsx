'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

interface Song { id: string; title: string; album: string; duration: string; plays: string; cover?: string; }

export default function SongRow({ song, index }: { song: Song; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
      className="song-row">
      <div className="index">{isHovered ? '▶' : index + 1}</div>
      <div className="cover-art">
        {song.cover && <Image src={song.cover} alt={song.album} fill />}
      </div>
      <div className="info">
        <div className="title">{song.title}</div>
        <div className="album">{song.album}</div>
      </div>
      <div className="duration">{song.duration}</div>
    </motion.div>
  );
}
