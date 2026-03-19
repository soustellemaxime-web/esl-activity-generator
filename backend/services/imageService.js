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
      return { source: "cache", images: data };
    }
  }

  // 2. Fetch from Pixabay
  const query = `${key}`; //make it kid-friendly //TODO: let the user choose style
  const url = `https://pixabay.com/api/?key=${API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=3`;

  const response = await fetch(url);
  const data = await response.json();

  const image = data.hits[0]?.webformatURL || null;

  // 3. Save to cache
  cache[key] = {
    data: image,
    timestamp: Date.now()
  };

  return { source: "api", image };
}

module.exports = { getImages };