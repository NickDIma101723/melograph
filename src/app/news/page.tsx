'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { getCache, setCache } from '@/lib/client-cache';
import styles from './news.module.scss';
interface Article {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Layout logic
  const featuredArticle = articles.length > 0 ? articles[0] : null;
  const standardArticles = articles.length > 0 ? articles.slice(1, 13) : []; // Show more articles in grid

  useEffect(() => {
    // Fetch news
    async function fetchNews() {
      const CACHE_KEY = 'news-data-v1';
      const cached = getCache<Article[]>(CACHE_KEY);

      if (cached) {
          setArticles(cached);
          setLoading(false);
          return;
      }

      try {
        const res = await fetch('/api/news');
        let validArticles = [];

        if (res.ok) {
           const data = await res.json();
           if (data.articles) validArticles = data.articles;
        }

        if (validArticles && validArticles.length > 0) {
          const filtered = validArticles.filter((article: Article) => 
            article.urlToImage && 
            article.title !== "[Removed]" &&
            article.description
          );
          setArticles(filtered);
          setCache(CACHE_KEY, filtered, 30); // Cache for 30 mins
        } else {
             setArticles([]);
        }
      } catch (error) {
        console.warn('News fetch error:', error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
    
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleImageError = (url: string) => {
    setImageErrors(prev => new Set(prev).add(url));
  };

  return (
    <>
      <main className={styles.page}>
        <div className={styles.noiseOverlay} />
        <div className={styles.gridLines} />
        <div className={styles.contentContainer}>
            
            {/* Massive Header */}
            <header className={styles.headerWrapper}>
                <motion.h1 
                  className={styles.mainTitle}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                >
                    <span>LATEST</span>
                    <span className={styles.hollow}>TRANSMISSIONS</span>
                </motion.h1>
                <div className={styles.headerMeta}>
                    <span>/ ARCHIVE_2025</span>
                    <span>/ AUDIO_VISUAL_FEED</span>
                    <span>/ SCROLL_TO_ACCESS</span>
                </div>
            </header>

            {loading && (
               <div className={styles.loadingState}>
                   INITIALIZING_FEED...
               </div>
            )}

            {/* Featured Article Block */}
            <AnimatePresence>
            {!loading && featuredArticle && isMounted && (
                <motion.section 
                    className={styles.featuredSection}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
                >
                    <div className={styles.featuredImageSide}>
                         {featuredArticle.urlToImage && !imageErrors.has(featuredArticle.urlToImage) ? (
                            <Image
                                src={featuredArticle.urlToImage}
                                alt={featuredArticle.title}
                                fill
                                className="object-cover"
                                priority
                                sizes="(max-width: 768px) 100vw, 50vw"
                                onError={() => featuredArticle.urlToImage && handleImageError(featuredArticle.urlToImage)}
                            />
                         ) : (
                             <div className={styles.noImagePlaceholder}>SIGNAL_LOST</div>
                         )}
                    </div>
                    <div className={styles.featuredTextSide}>
                        <div className={styles.featuredTag}>Breaking News</div>
                        <h2 className={styles.featuredHeadline}>
                            <a href={featuredArticle.url} target="_blank" rel="noopener noreferrer">
                                {featuredArticle.title}
                            </a>
                        </h2>
                        <p className={styles.featuredSummary}>
                            {featuredArticle.description}
                        </p>
                        <a href={featuredArticle.url} target="_blank" rel="noopener noreferrer" className={styles.readMoreBtn}>
                            Read Full Story <span>→</span>
                        </a>
                    </div>
                </motion.section>
            )}
            </AnimatePresence>

            {/* Brutalist Grid */}
            {!loading && isMounted && (
                <div className={styles.mainGrid}>
                    <AnimatePresence>
                    {standardArticles.map((article, i) => (
                        <motion.a 
                           key={i} 
                           href={article.url} 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className={styles.newsCard}
                           initial={{ opacity: 0, y: 30 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: 30 }}
                           transition={{ duration: 0.6, delay: 0.9 + (i * 0.05), ease: "easeOut" }}
                        >
                            <div className={styles.cardTopBar}>
                                <span>NO. {String(i + 1).padStart(3, '0')}</span>
                                <span>{formatDate(article.publishedAt)}</span>
                            </div>
                            <div className={styles.cardThumb}>
                                {article.urlToImage && !imageErrors.has(article.urlToImage) ? (
                                    <Image
                                        src={article.urlToImage}
                                        alt={article.title}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                        onError={() => article.urlToImage && handleImageError(article.urlToImage)}
                                    />
                                ) : (
                                    <div className={styles.noImagePlaceholder}>NO_VISUAL</div>
                                )}
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.cardSource}>{article.source.name}</div>
                                <h3 className={styles.cardTitle}>{article.title}</h3>
                                <div className={styles.cardArrow}>
                                    READ_TRANSMISSION <span>→</span>
                                </div>
                            </div>
                        </motion.a>
                    ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
      </main>
    </>
  );
}
