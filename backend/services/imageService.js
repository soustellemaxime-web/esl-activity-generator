require("dotenv").config();

const API_KEY = process.env.PIXABAY_API_KEY
const cache = {};
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24h

async function getImages(word) {
  const key = word.toLowerCase();

  // 1. Check cache
  if (cache[key]) {
    const { data, timestamp } = cache[key];

    if (Date.now() - timestamp < CACHE_DURATION) {

      const images = data;

      const randomIndex = Math.floor(Math.random() * images.length);
      const image = images[randomIndex];

      return { source: "cache", image };
    }
  }

  // 2. Fetch from Pixabay
  const query = `${key}`; //make it kid-friendly //TODO: let the user choose style
  const url = `https://pixabay.com/api/?key=${API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=3`;

  const response = await fetch(url);
  /*
  const remaining = response.headers.get("X-RateLimit-Remaining");
  const limit = response.headers.get("X-RateLimit-Limit");
  console.log(`📊 Pixabay quota: ${remaining}/${limit} remaining`);
  */
  const data = await response.json();

  const hits = data.hits;

  let image = null;

  if (hits.length > 0) {
    const randomIndex = Math.floor(Math.random() * hits.length);
    image = hits[randomIndex].webformatURL;
  }

  // 3. Save to cache
  cache[key] = {
    data: hits.map(img => img.webformatURL),
    timestamp: Date.now()
  };

  return { source: "api", image };
}

module.exports = { getImages };