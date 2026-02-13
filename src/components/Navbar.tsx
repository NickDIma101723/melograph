'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { useUI } from '@/context/UIContext';
import { usePathname } from 'next/navigation';
import { getCache, setCache, safeJson } from '@/lib/client-cache';
import { LazyMotion, domAnimation } from 'framer-motion';

const Navbar = () => {
  const { isMenuOpen, toggleMenu } = useUI();
  const pathname = usePathname();
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<Array<{ id: string; label: string; href: string; image: string }>>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if we are on an artist detail page (e.g. /artists/name) but not the main artists list (/artists)
  const isArtistDetail = pathname?.startsWith('/artists/') && pathname.split('/').filter(Boolean).length > 1;

  useEffect(() => {
    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me', { cache: 'no-store' }); // Ensure fresh check
            if (res.ok) {
                const data = await safeJson(res, { user: null });
                if (data?.user) setIsAuthenticated(true);
                else setIsAuthenticated(false);
            }
        } catch (e) {
            console.error('Auth check failed', e);
            setIsAuthenticated(false);
        }
    };
    checkAuth();

    const fetchMenuItems = async () => {
      // Clear old cache keys
      if (typeof window !== 'undefined') {
        localStorage.removeItem('menu-images-v1');
        localStorage.removeItem('menu-images-v2');
      }
      const CACHE_KEY = 'menu-images-v3';
      const cached = getCache<Array<{ id: string; label: string; href: string; image: string }>>(CACHE_KEY);
      
      if (cached) {
          setMenuItems(cached);
          return;
      }

      try {
        const response = await fetch('/api/menu-images');
        if (response.ok) {
          const data = await safeJson(response, []);
          setMenuItems(data);
          setCache(CACHE_KEY, data, 60); // Cache for 1 hour
        }
      } catch (error) {
        console.error('Failed to fetch menu items:', error);
      }
    };

    fetchMenuItems();
  }, []);

  const displayedItems = menuItems.map(item => {
    if (item.label === 'LOGIN' && isAuthenticated) {
        // Change LOGIN to LOGOUT
        // Note: We might want a dedicated handler rather than just a link wrapper, 
        // but for now let's point to profile which allows logout, or handle logout.
        // Actually, request was "login should turn into alog out button"
        return { ...item, id: 'VII', label: 'LOGOUT', href: '/profile' }; // Using profile or we can add logout handler
    }
    return item;
  }).filter(item => {
     return true;
  });

  useEffect(() => {
    if (isMenuOpen && displayedItems.length > 0) {
      document.body.style.overflow = 'hidden';
      // Only update if different to avoid loop
      setHoveredImage(prev => prev !== displayedItems[0].image ? displayedItems[0].image : prev);
    } else {
      // Only restore default scrolling if NOT on the home page (Hero handles Home)
      if (pathname !== '/') {
        document.body.style.overflow = 'unset';
      }
    }
  }, [isMenuOpen, displayedItems, pathname]);

  return (
    <LazyMotion features={domAnimation}>
      <nav className={`navbar ${isMenuOpen ? 'is-open' : ''} ${pathname === '/' ? 'navbar--home' : ''} ${isArtistDetail ? 'navbar--artist-detail' : ''}`}>
        <div className="navbar__top-bar">
          <div className="navbar__corner navbar__corner--tl" style={{ mixBlendMode: 'difference' }}>
            <AnimatePresence>
              {!isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Link href="/" className="navbar__logo-link">
                    {/* Architectural Monolith */}
                    <div className="navbar__logo-monolith" />

                    {/* Typographic Block */}
                    <div className="navbar__logo-text-group">
                      <span className="navbar__logo-title">
                        MELOGRAPH
                      </span>
                      <div className="navbar__logo-subtitle-container">
                        <div className="navbar__logo-divider" />
                        <span className="navbar__logo-subtitle">
                          ARCHIVE
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="navbar__corner navbar__corner--tr">
            <button className="navbar__menu-btn" onClick={toggleMenu}>
              <div className={`navbar__icon ${isMenuOpen ? 'open' : ''}`}>
                {isMenuOpen ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                ) : (
                  <Image 
                    src="/image.png" 
                    alt="Menu" 
                    width={48} 
                    height={48} 
                    className="music-note" 
                    style={{ filter: 'brightness(0) invert(1)' }}
                    priority 
                  />
                )}
              </div>
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { delay: 0.2, duration: 0.5 } }}
            style={{ pointerEvents: 'auto' }} // Ensure clicks work
          >
            <div className="menu-grid">
              
              {/* Left Column: Slides from Left */}
              <motion.div 
                className="menu-nav-col"
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                exit={{ x: '-100%' }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="menu-header-meta">
                  <span>// MAIN_MENU</span>
                  <span>// SELECT_VIEW</span>
                </div>

                {/* Massive background text for depth */}
                <div className="menu-bg-text">
                  NAVIGATION SYSTEM
                </div>
                
                <nav className="nav-list">
                  {displayedItems.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 + (i * 0.1), duration: 0.8, ease: "easeOut" }}
                    >
                      <Link 
                        href={item.href} 
                        className="nav-link-item"
                        onClick={(e) => {
                            if (item.label === 'LOGOUT') {
                                e.preventDefault();
                                fetch('/api/auth/logout', { method: 'POST' }).then(() => {
                                    window.location.href = '/auth';
                                });
                            }
                            toggleMenu();
                        }}
                        onMouseEnter={() => setHoveredImage(item.image)}
                      >
                        <span className="nav-id">{item.id}</span>
                        <span className="nav-label">{item.label}</span>
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                <div className="menu-footer-meta">
                  MELOGRAPH_VISUALS<br/>
                  STREAM_READY
                </div>
              </motion.div>

              {/* Right Column: Slides from Right */}
              <motion.div 
                className="menu-visual-col"
                initial={{ x: '100%' }}
                animate={{ x: '0%' }}
                exit={{ x: '100%' }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ position: 'relative', height: '100%' }} // Ensure height is explicit
              >
                <AnimatePresence mode="popLayout">
                  {hoveredImage && (
                    <motion.div
                      key={hoveredImage}
                      className="visual-container"
                      initial={{ opacity: 0 }} // Start invisible but full size
                      animate={{ opacity: 1 }} // Fade in
                      exit={{ opacity: 0, zIndex: -1 }} 
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                    >
                      <Image 
                        src={hoveredImage} 
                        alt="Preview" 
                        fill 
                        style={{ objectFit: 'cover' }}
                        priority 
                        unoptimized
                      />
                      <div className="shine-overlay"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="visual-scanlines"></div>
              </motion.div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
};

export default Navbar;
