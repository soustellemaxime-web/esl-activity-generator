async function loadItem() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;
  try {
    const res = await fetch(`${API_URL}/api/community/${id}`);
    if (!res.ok) throw new Error("Failed to fetch item");
    const item = await res.json();
    renderItem(item);
  } catch (err) {
    console.error("Error loading item:", err);
  }
}

async function renderItem(item) {
  document.getElementById("itemTitle").textContent = item.title;
  document.getElementById("rating").textContent = `⭐ ${item.rating_avg || 0}`;
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

document.addEventListener("DOMContentLoaded", loadItem);