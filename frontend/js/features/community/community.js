const mockData = [
  { id: "1", title: "Animals Worksheet", type: "worksheet", rating: 4.5 },
  { id: "2", title: "Food Bingo", type: "bingo", rating: 4.2 },
  { id: "3", title: "Colors Flashcards", type: "flashcards", rating: 5 }
];

async function initCommunity() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        document.getElementById("notLogged").classList.remove("hidden");
        return;
    }
    document.getElementById("communityContent").classList.remove("hidden");
}

function renderCard(item) {
  return `
    <div class="community-card" onclick="openItem('${item.id}')">
      <div class="community-preview">
        ${getEmoji(item.type)}
      </div>
      <div class="community-badge ${item.type}">
        ${item.type}
      </div>
      <h3>${item.title}</h3>
      <div class="community-meta">
        <span class="rating">⭐ ${item.rating || "0"}</span>
      </div>
    </div>
  `;
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
    const res = await fetch(`${API_URL}/api/community`);
    if (!res.ok) throw new Error("API failed");
    const data = await res.json();
    const formatted = data.map(item => ({
      id: item.id,
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

document.addEventListener("DOMContentLoaded", () => {
    initCommunity();
    loadCommunity();
});