const TMDB_API_KEY = 'ffeb9dbb8408b7e809488246f384887b';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export const tmdbService = {
  async searchMovie(title) {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=vi-VN`
      );
      const data = await response.json();
      return data.results && data.results.length > 0 ? data.results[0] : null;
    } catch (error) {
      console.error('TMDB Search Error:', error);
      return null;
    }
  },

  async getFullMovieDetails(tmdbId) {
    try {
      // Fetch details, credits, videos, and release dates in parallel
      // NOTE: For videos, we don't use language=vi-VN because trailers are usually listed under en-US or no language
      const [detailsRes, creditsRes, videosRes, releaseRes] = await Promise.all([
        fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=vi-VN`),
        fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}&language=vi-VN`),
        fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/videos?api_key=${TMDB_API_KEY}`),
        fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/release_dates?api_key=${TMDB_API_KEY}`)
      ]);

      const details = await detailsRes.json();
      const credits = await creditsRes.json();
      const videos = await videosRes.json();
      const releases = await releaseRes.json();

      // 1. Extract trailer (Robust search)
      const trailer = videos.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer') || 
                      videos.results?.find(v => v.site === 'YouTube' && v.type === 'Teaser') ||
                      videos.results?.find(v => v.site === 'YouTube');

      // 2. Extract certification (Age Rating)
      // Look for VN first, then US as fallback
      let ageRating = '';
      const vnRelease = releases.results?.find(r => r.iso_3166_1 === 'VN');
      const usRelease = releases.results?.find(r => r.iso_3166_1 === 'US');
      
      if (vnRelease) {
        ageRating = vnRelease.release_dates.find(d => d.certification)?.certification || '';
      }
      if (!ageRating && usRelease) {
        ageRating = usRelease.release_dates.find(d => d.certification)?.certification || '';
      }

      return {
        title: details.title,
        description: details.overview,
        duration: details.runtime,
        release_date: details.release_date,
        poster: details.poster_path ? `${TMDB_IMAGE_BASE}${details.poster_path}` : '',
        rating: Math.round(details.vote_average * 10),
        genre: details.genres?.map(g => g.name.replace(/^phim\s+/i, '')).join(', '),
        actors: credits.cast?.slice(0, 10).map(c => c.name).join(', '),
        trailer_url: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : '',
        age: ageRating || 'P'
      };
    } catch (error) {
      console.error('TMDB Details Error:', error);
      return null;
    }
  }
};
