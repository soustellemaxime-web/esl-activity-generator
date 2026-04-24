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

function renderItem(item) {
  document.getElementById("itemTitle").textContent = item.title;
  document.getElementById("rating").textContent =
    `⭐ ${item.rating_avg || 0}`;
  document.getElementById("preview").innerHTML = `
    <div style="font-size: 50px; text-align:center;">
      ${getEmoji(item.type)}
    </div>
  `;
  // store for template usage
  window.currentItem = item;
}

function getEmoji(type) {
  if (type === "worksheet") return "📄";
  if (type === "bingo") return "🎯";
  if (type === "flashcards") return "🃏";
}

function useTemplate() {
  if (!window.currentItem) return;
  localStorage.setItem("templateData", JSON.stringify(window.currentItem));
  if (window.currentItem.type === "worksheet") {
    window.location.href = "/worksheet.html";
  }
  if (window.currentItem.type === "bingo") {
    window.location.href = "/bingo.html";
  }
  if (window.currentItem.type === "flashcards") {
    window.location.href = "/flashcards.html";
  }
}

document.addEventListener("DOMContentLoaded", loadItem);