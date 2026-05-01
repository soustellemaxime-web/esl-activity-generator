const mockData = [
  { id: "1", title: "Animals Worksheet", type: "worksheet", rating: 4.5 },
  { id: "2", title: "Food Bingo", type: "bingo", rating: 4.2 },
  { id: "3", title: "Colors Flashcards", type: "flashcards", rating: 5 }
];

async function initCommunity() {
    const user = await getCurrentUser();
    if (!user) {
        document.getElementById("notLogged").classList.remove("hidden");
        return;
    }
    document.getElementById("communityContent").classList.remove("hidden");
}

function getCreatorName(item) {
  return item.username || item.itemUserId?.slice(0, 6);
}

function goToProfile(userId) {
  window.location.href = `/profile.html?id=${userId}`;
}

function renderCard(item) {
  let html = `
    <div class="community-card" onclick="openItem('${item.id}')">
      <div class="community-preview">
        ${getEmoji(item.type)}
      </div>
      <div class="community-badge ${item.type}">
        ${item.type}
      </div>
      <h3>${item.title}</h3>
      <div class="community-meta">
        <div class="ratingStars">
          ${[1,2,3,4,5].map(i => {
            if (i <= item.rating) return `<span>⭐</span>`;
            if (i - 0.5 <= item.rating) return `<span style="opacity:0.6">⭐</span>`;
            return `<span style="opacity:0.3">⭐</span>`;
          }).join("")}
          ${item.rating || "0"}
        </div>
      </div>
      <div class="community-creator">
        Created by 
        <span class="profile-link" onclick="event.stopPropagation(); goToProfile('${item.itemUserId}')">
          ${getCreatorName(item)}
        </span>
      </div>
    </div>
  `;
  return html;
}

function getEmoji(type) {
  if (type === "worksheet") return "📄";
  if (type === "bingo") return "🎯";
  if (type === "flashcards") return "🃏";
  return "📦";
}

async function loadCommunity() {
  const grid = document.getElementById("communityGrid");
  try {
    const search = document.getElementById("searchInput").value;
    const type = document.getElementById("filterType").value;
    const sort = document.getElementById("sortSelect").value;
    // Skeleton loading
    const grid = document.getElementById("communityGrid");
    grid.innerHTML = Array(5).fill(`
      <div class="community-card skeleton">
        <div class="community-preview skeleton-box"></div>
        <div class="skeleton-title"></div>
        <div class="skeleton-meta"></div>
      </div>
    `).join("");
    const res = await fetch(
      `${API_URL}/api/community?search=${encodeURIComponent(search)}&type=${type}&sort=${sort}`
    );
    if (!res.ok) throw new Error("API failed");
    const data = await res.json();
    const formatted = data.map(item => ({
      username: item.username,
      id: item.id,
      itemUserId: item.user_id,
      title: item.title,
      type: item.type,
      rating: item.rating_avg
    }));
    grid.innerHTML = formatted.map(renderCard).join("");
  } catch (err) {
    console.warn("Using mock data", err);
    grid.innerHTML = mockData.map(renderCard).join("");
  }
}

function openItem(id) {
  window.location.href = `/community-item.html?id=${id}`;
}

async function loadFeatured() {
  const grid = document.getElementById("featuredGrid");
  try {
    grid.innerHTML = Array(5).fill(`
      <div class="community-card skeleton">
        <div class="community-preview skeleton-box"></div>
        <div class="skeleton-title"></div>
        <div class="skeleton-meta"></div>
      </div>
    `).join("");
    const res = await fetch(`${API_URL}/api/community/featured`);
    const data = await res.json();
    const formatted = data.map(item => ({
      username: item.username,
      id: item.id,
      itemUserId: item.user_id,
      title: item.title,
      type: item.type,
      rating: item.rating_avg
    }));
    grid.innerHTML = formatted.map(renderCard).join("");
  } catch (err) {
    console.error("Featured failed", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
    initCommunity();
    loadFeatured();
    loadCommunity();
});

document.getElementById("filterType").addEventListener("change", loadCommunity);

document.getElementById("searchInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    loadCommunity();
  }
});