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

function loadCommunity() {
  const grid = document.getElementById("communityGrid");
  grid.innerHTML = mockData.map(renderCard).join("");
}

function openItem(id) {
  const item = mockData.find(i => i.id === id);
  localStorage.setItem("selectedCommunityItem", JSON.stringify(item));
  window.location.href = "/community-item.html";
}

document.addEventListener("DOMContentLoaded", () => {
    initCommunity();
    loadCommunity();
});