async function loadItem() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;
  try {
    const res = await fetch(`${API_URL}/api/community/${id}`, {
      headers: {
        "Authorization": `Bearer ${session?.access_token || ""}`
      }
    });
    if (!res.ok) throw new Error("Failed to fetch item");
    const item = await res.json();
    renderItem(item);
  } catch (err) {
    console.error("Error loading item:", err);
  }
}

async function renderItem(item) {
  document.getElementById("itemTitle").textContent = item.title;
  document.getElementById("ratingValue").textContent = `⭐ ${item.rating_avg || 0} (${item.rating_count || 0})`;
  const previewEl = document.getElementById("preview");
  previewEl.innerHTML = "Loading preview...";
  try {
    const res = await fetch(`${API_URL}/api/community/${item.id}/preview`, {
      method: "POST"
    });
    if (!res.ok) throw new Error("Preview failed");
    const html = await res.text();
    previewEl.innerHTML = html;
  } catch (err) {
    console.error(err);
    previewEl.innerHTML = "Failed to load preview";
  }
  if (item.user_rating) {
    const stars = document.querySelectorAll("#ratingStars span");
    stars.forEach((star, index) => {
      star.style.opacity = index < item.user_rating ? "1" : "0.3";
    });
  }
  window.currentItem = item;
}

function getEmoji(type) {
  if (type === "worksheet") return "📄";
  if (type === "bingo") return "🎯";
  if (type === "flashcards") return "🃏";
}

function useTemplate() {
  if (!window.currentItem) return;
  const item = window.currentItem;
  if (item.type === "worksheet") {
    window.location.href = `worksheet.html?load=${item.id}`;
  }
  if (item.type === "bingo") {
    window.location.href = `/bingo.html?load=${item.id}`;
  }
  if (item.type === "flashcards") {
    window.location.href = `/flashcards.html?load=${item.id}`;
  }
}

async function downloadItem() {
  const item = window.currentItem;
  if (!item) return;
  let data = typeof item.data === "string"
    ? JSON.parse(item.data)
    : item.data;
  if (item.type === "worksheet") {
    data.mode = "custom"; 
    data.customExercises = data.customExercises || data.exercises || [];
    data.exercises = [];
    data.imageMap = data.imageMap || {};
    data.baseUrl = window.API_URL;
  }
  if (item.type === "flashcards" && data.mode === "custom") {
    data.baseUrl = window.API_URL;
    data.cards = (data.words || []).map(word => ({
      text: word,
      image: data.imageMap?.[word] || null
    }));
  }
  await downloadFromData(data, item.type, item.title);
}

async function rate(value) {
  const item = window.currentItem;
  if (!item) return;
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    alert("Please log in to rate");
    return;
  }
  const stars = document.querySelectorAll("#ratingStars span");
  stars.forEach((star, index) => {
    star.style.opacity = index < value ? "1" : "0.3";
  });
  try {
    const res = await fetch(`${API_URL}/api/community/${item.id}/rate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ rating: value })
    });
    if (!res.ok) throw new Error("Rating failed");
    const data = await res.json();
    // update UI instantly
    document.getElementById("ratingValue").textContent =
      `⭐ ${data.rating_avg.toFixed(1)} (${data.rating_count})`;
  } catch (err) {
    console.error(err);
    alert("Failed to rate");
  }
}

document.addEventListener("DOMContentLoaded", loadItem);