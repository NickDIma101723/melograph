---
applyTo: '**'
---
# Architecture Note
- The '/artists' page uses Server-Side Rendering (SSR) with a 'loading.tsx' fallback to ensure instant navigation feedback.
- Data is fetched via 'getAllArtistsData' in 'page.tsx' and passed to 'ArtistsClient' as 'initialArtists'.
- 'ArtistsClient' uses this prop to initialize state, bypassing client-side fetching unless data is missing.
- Client-side caching is implemented in 'client-cache.ts' but is secondary to the SSR architecture for the main list.

