'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
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

  // Layout logic
  const featuredArticle = articles.length > 0 ? articles[0] : null;
  const standardArticles = articles.length > 0 ? articles.slice(1, 13) : []; // Show more articles in grid

  useEffect(() => {
    // Fetch news
    async function fetchNews() {
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
      <main className={"p-news"}>
        <div className={"noiseOverlay"} />
        <div className={"gridLines"} />
        <div className={"contentContainer"}>
            
            {/* Massive Header */}
            <header className={"headerWrapper"}>
                <motion.h1 
                  className={"mainTitle"}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    <span>LATEST</span>
                    <span className={"hollow"}>TRANSMISSIONS</span>
                </motion.h1>
                <div className={"headerMeta"}>
                    <span>/ ARCHIVE_2025</span>
                    <span>/ AUDIO_VISUAL_FEED</span>
                    <span>/ SCROLL_TO_ACCESS</span>
                </div>
            </header>

            {loading && (
               <div className={"loadingState"}>
                   INITIALIZING_FEED...
               </div>
            )}

            {/* Featured Article Block */}
            {!loading && featuredArticle && (
                <section className={"featuredSection"}>
                    <div className={"featuredImageSide"}>
                         {featuredArticle.urlToImage && !imageErrors.has(featuredArticle.urlToImage) ? (
                            <Image
                                src={featuredArticle.urlToImage}
                                alt={featuredArticle.title}
                                fill
                                className="object-cover"
                                priority
                                unoptimized
                                onError={() => featuredArticle.urlToImage && handleImageError(featuredArticle.urlToImage)}
                            />
                         ) : (
                             <div className={"noImagePlaceholder"}>SIGNAL_LOST</div>
                         )}
                    </div>
                    <div className={"featuredTextSide"}>
                        <div className={"featuredTag"}>Breaking News</div>
                        <h2 className={"featuredHeadline"}>
                            <a href={featuredArticle.url} target="_blank" rel="noopener noreferrer">
                                {featuredArticle.title}
                            </a>
                        </h2>
                        <p className={"featuredSummary"}>
                            {featuredArticle.description}
                        </p>
                        <a href={featuredArticle.url} target="_blank" rel="noopener noreferrer" className={"readMoreBtn"}>
                            Read Full Story <span>→</span>
                        </a>
                    </div>
                </section>
            )}

            {/* Brutalist Grid */}
            {!loading && (
                <div className={"mainGrid"}>
                    {standardArticles.map((article, i) => (
                        <a 
                           key={i} 
                           href={article.url} 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className={"newsCard"}
                        >
                            <div className={"cardTopBar"}>
                                <span>NO. {String(i + 1).padStart(3, '0')}</span>
                                <span>{formatDate(article.publishedAt)}</span>
                            </div>
                            <div className={"cardThumb"}>
                                {article.urlToImage && !imageErrors.has(article.urlToImage) ? (
                                    <Image
                                        src={article.urlToImage}
                                        alt={article.title}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                        onError={() => article.urlToImage && handleImageError(article.urlToImage)}
                                    />
                                ) : (
                                    <div className={"noImagePlaceholder"}>NO_VISUAL</div>
                                )}
                            </div>
                            <div className={"cardBody"}>
                                <div className={"cardSource"}>{article.source.name}</div>
                                <h3 className={"cardTitle"}>{article.title}</h3>
                                <div className={"cardArrow"}>
                                    READ_TRANSMISSION <span>→</span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
      </main>
    </>
  );
}
