import React from 'react';
import Image from 'next/image';
interface VinylRecordProps {
  isPlaying: boolean;
  imageSrc: string;
}

const VinylRecord: React.FC<VinylRecordProps> = ({ isPlaying, imageSrc }) => {
  return (
    <div className={"c-vinyl-record"}>
      <div className={"recordContainer"}>
        <div className={`${"record"} ${isPlaying ? "playing" : ''}`}>
          <div className={"label"}>
            <Image 
              src={imageSrc} 
              alt="Vinyl Label" 
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>
      
      <div className={`${"tonearm"} ${isPlaying ? "playing" : ''}`}>
        <svg viewBox="0 0 200 400" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Pivot Base */}
          <circle cx="146" cy="52" r="25" fill="#2a2a2a" stroke="#111" strokeWidth="2"/>
          <circle cx="146" cy="52" r="10" fill="#111"/>
          <circle cx="146" cy="52" r="4" fill="#444"/>
          
          {/* Counterweight */}
          <rect x="130" y="10" width="32" height="40" rx="4" fill="#333" transform="rotate(-15 146 52)"/>
          
          {/* Main Arm */}
          <path d="M146 52 L130 300" stroke="#d4d4d4" strokeWidth="8" strokeLinecap="round"/>
          
          {/* Curved part */}
          <path d="M130 300 Q128 330 90 340" stroke="#d4d4d4" strokeWidth="8" strokeLinecap="round" fill="none"/>
          
          {/* Headshell */}
          <g transform="translate(85, 338) rotate(15)">
            <rect x="-15" y="0" width="30" height="45" rx="2" fill="#1a1a1a"/>
            <rect x="-10" y="45" width="20" height="8" fill="#d4d4d4"/>
            <rect x="-2" y="53" width="4" height="6" fill="#111"/>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default VinylRecord;
