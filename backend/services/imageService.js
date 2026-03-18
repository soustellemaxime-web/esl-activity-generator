const fetch = require("node-fetch")

const API_KEY = process.env.PIXABAY_API_KEY

async function getImage(word) {

  const url =
    `https://pixabay.com/api/?key=${API_KEY}&q=${word}&image_type=vector&per_page=3`

  const res = await fetch(url)
  const data = await res.json()

  if (data.hits.length === 0) return null

  return data.hits[0].webformatURL
}

module.exports = getImage