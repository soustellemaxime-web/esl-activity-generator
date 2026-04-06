window.API_BASE = "flashcards";

window.flashcardState = {
  words: [],
  displayMode: "text",
  cutLines: false,
  imageMap: {}
};

function getFlashcardState() {
  const data = getFormData();
  return {
    words: data.words,
    displayMode: data.displayMode,
    cutLines: data.cutLines,
    imageMap: window.globalImageMap || {}
  }
}

async function saveFlashcards() {
  const state = getFlashcardState();
  const { data: { user } } = await supabaseClient.auth.getUser();
  await fetch(`${API_URL}/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: "Flashcards - " + new Date().toLocaleString(),
      type: "flashcards",
      data: state,
      user_id: user.id
    })
  });
  alert("Flashcards saved successfully!");
}

async function loadFlashcard(id) {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const res = await fetch(`${API_URL}/worksheets/${id}?user_id=${user.id}`);
  const item = await res.json();
  const state = item.data;
  document.getElementById("words").value = state.words.join("\n");
  document.getElementById("displayMode").value = state.displayMode;
  document.getElementById("cutLines").checked = state.cutLines;
  window.globalImageMap = state.imageMap || {};
  preview();
}

async function loadFlashcards() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const res = await fetch(`${API_URL}/worksheets?user_id=${user.id}&type=flashcards`);
  const flashcards = await res.json();
  const container = document.getElementById("flashcardsList");
  container.innerHTML = flashcards.map(f => `
    <div class="worksheet-item">
      <div class="worksheet-info">
        <strong>${f.title || "Flashcards"}</strong>
        <span class="worksheet-date">${new Date(f.created_at).toLocaleString()}</span>
      </div>
      <div style="display:flex; gap:6px;">
        <button onclick="loadFlashcard('${f.id}')">Open</button>
      </div>
    </div>
  `).join("");
}

async function reloadImage(word, cardElement) {
  try {
    const res = await fetch(`${API_URL}/api/images?word=${encodeURIComponent(word)}`);
    const data = await res.json();

    if (!data.image) return;

    const img = cardElement.querySelector("img");
    if (img) {
      img.src = data.image;
    }

  } catch (err) {
    console.error("Reload image failed:", err);
  }
}

document.getElementById("words").addEventListener("input", debounce(preview, 500));
document.getElementById("displayMode").addEventListener("change", debounce(preview, 500));
document.getElementById("cutLines").addEventListener("change", debounce(preview, 500));