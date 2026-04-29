window.API_BASE = "bingo";

window.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("load");
  if (!id) return;
  if (window.API_BASE === "bingo") loadBingo(id);
  if (window.API_BASE === "worksheet") loadWorksheet(id);
  if (window.API_BASE === "flashcards") loadFlashcard(id);
});

function getBingoState() {
  const data = getFormData();
  return {
    title: data.title,
    words: data.words,
    gridSize: data.gridSize,
    freeCenter: data.freeCenter,
    cardCount: data.cardCount,
    uppercase: data.uppercase,
    displayMode: data.displayMode,
    imageMap: window.globalImageMap || {}
  };
}

function toggleDashboard() {
  const el = document.getElementById("dashboard");
  el.classList.toggle("hidden");
  if (!el.classList.contains("hidden")) {
    loadBingos();
  }
}

async function saveBingoWithVisibility(title, visibility) {
  const state = getBingoState();
  const user = await getCurrentUser();
  if (!user) {
    alert("You must be logged in to save bingos.");
    return;
  }
  const { data: { session } } = await supabaseClient.auth.getSession();
  const res = await fetch(`${API_URL}/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      title,
      type: "bingo",
      data: state,
      user_id: user.id,
      visibility,
      id: window.currentItemId || null
    })
  });
  if (!res.ok) {
    const errorData = await res.json();
    if (res.status === 403) {
      showUpgradeModal("save");
    } else {
      alert(errorData.error || "Save failed");
    }
    return;
  }
  showToast(
    visibility === "public"
      ? "Bingo shared to community!"
      : "Bingo saved successfully!", "success"
  );
}

async function loadBingo(id) {
  const dashboard = document.getElementById("dashboard");
  dashboard.classList.add("fade-out");
  setTimeout(() => dashboard.classList.add("hidden"), 200);
  window.currentItemId = id;
  const user = await getCurrentUser();
  const res = await fetch(`${API_URL}/worksheets/${id}?user_id=${user.id}&type=bingo`);
  const item = await res.json();
  const state = item.data;
  document.getElementById("title").value = state.title || "";
  document.getElementById("words").value = state.words.join("\n");
  document.getElementById("gridSize").value = state.gridSize;
  document.getElementById("freeCenter").checked = state.freeCenter;
  document.getElementById("cardCount").value = state.cardCount;
  if (document.getElementById("uppercase")) {
    document.getElementById("uppercase").checked = state.uppercase;
  }
  document.getElementById("displayMode").value = state.displayMode;
  window.globalImageMap = state.imageMap || {};
  preview();
  showToast("Bingo loaded!", "success");
}

async function loadBingos() {
    const user = await getCurrentUser();
    if (!user) {
        alert("You must be logged in to load bingos.");
        return;
    }
    const res = await fetch(`${API_URL}/worksheets?user_id=${user.id}&type=bingo`);
    const bingos = await res.json();
    const container = document.getElementById("worksheetsList");
    container.innerHTML = bingos.map(b => `
        <div class="worksheet-item">
          <div class="worksheet-info">
            <strong>${b.title || "Bingo"}</strong>
            <span class="worksheet-date">${new Date(b.created_at).toLocaleString()}</span>
          </div>
          <div style="display:flex; gap:6px;">
            <button onclick="loadBingo('${b.id}')">Open</button>
            <button class="btn danger" onclick="deleteBingo('${b.id}')">
              Delete
            </button>
          </div>
        </div>
    `).join("");
}

async function deleteBingo(id) {
    const confirmed = confirm("Delete this bingo?");
    if (!confirmed) return;
    const user = await getCurrentUser();
    await fetch(`${API_URL}/worksheets/${id}?user_id=${user.id}`, {
        method: "DELETE"
    });
    loadBingos();
}

function updateWordRequirement() {
  const gridSize = Number(document.getElementById("gridSize").value);
  const freeCenter = document.getElementById("freeCenter").checked;

  const words = parseWords(document.getElementById("words").value);

  const currentCount = words.length;

  let required = gridSize * gridSize;
  if (freeCenter) required -= 1;

  const remaining = required - currentCount;

  const element = document.getElementById("wordRequirement");

  element.style.color = remaining > 0 ? "red" : "green";

  let message = `Words: ${currentCount} / ${required}`;
  if (remaining > 0) message += ` (${remaining} more needed)`;

  element.textContent = message;
}

document.getElementById("gridSize").addEventListener("change", updateWordRequirement);
document.getElementById("freeCenter").addEventListener("change", updateWordRequirement);
document.getElementById("words").addEventListener("input", updateWordRequirement);

// preview triggers
document.getElementById("words").addEventListener("input", debounce(preview, 500));
document.getElementById("gridSize").addEventListener("change", debounce(preview, 500));
document.getElementById("cardCount").addEventListener("input", debounce(preview, 500));
document.getElementById("freeCenter").addEventListener("change", debounce(preview, 500));
if (document.getElementById("uppercase")) {
  document.getElementById("uppercase").addEventListener("change", debounce(preview, 500));
}
document.getElementById("title").addEventListener("input", debounce(preview, 500));

updateWordRequirement();