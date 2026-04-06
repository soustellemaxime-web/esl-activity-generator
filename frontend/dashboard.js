async function initDashboard() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        document.getElementById("notLogged").classList.remove("hidden");
        return;
    }
    document.getElementById("dashboardContent").classList.remove("hidden");
    loadAll(user.id);
}

async function loadAll(user_id) {
    showLoading("worksheetTab");
    showLoading("flashcardsTab");
    showLoading("bingoTab");
    const res = await fetch(`${API_URL}/worksheets?user_id=${user_id}`);
    const data = await res.json();
    renderList(data.filter(x => x.type === "worksheet"), "worksheetTab", "worksheet");
    renderList(data.filter(x => x.type === "flashcards"), "flashcardsTab", "flashcards");
    renderList(data.filter(x => x.type === "bingo"), "bingoTab", "bingo");
}

function renderList(items, containerId, type) {
  const container = document.getElementById(containerId);
  container.innerHTML = items.map(item => {
    const preview = getPreview(item);
    return `
      <div class="worksheet-item"
        onmouseenter="showHoverPreview(event, '${encodeURIComponent(JSON.stringify(item))}')"
        onmousemove="moveHoverPreview(event)"
        onmouseleave="hideHoverPreview()"
      >
        <div class="worksheet-info">
          <strong>${item.title}</strong>
          <span class="worksheet-date">
            ${new Date(item.created_at).toLocaleString()}
          </span>
          <div class="preview-text">${preview}</div>
        </div>
        <div style="display:flex; gap:6px;">
          <button onclick="openItem('${item.id}', '${type}')">Open</button>
          <button class="btn danger" onclick="deleteItem('${item.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join("");
}

function openItem(id, type) {
    if (type === "worksheet") {
        window.location.href = `worksheet.html?load=${id}`;
    } else if (type === "bingo") {
        window.location.href = `bingo.html?load=${id}`;
    } else if (type === "flashcards") {
        window.location.href = `flashcards.html?load=${id}`;
    }
}

async function deleteItem(id) {
    const confirmed = confirm("Delete this item?");
    if (!confirmed) return;
    const { data: { user } } = await supabaseClient.auth.getUser();
    await fetch(`${API_URL}/worksheets/${id}?user_id=${user.id}`, {
        method: "DELETE"
    });
    initDashboard();
}

function switchTab(event, type) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
  document.getElementById(type + "Tab").classList.remove("hidden");
  document.querySelectorAll(".tab-dashboard").forEach(btn => btn.classList.remove("active"));
  event.target.classList.add("active");
}

function showLoading(containerId) {
    const el = document.getElementById(containerId);
    el.innerHTML = `
        <div style="text-align:center; padding:20px;">
            ⏳ Loading...
        </div>
    `;
}

function getPreview(item) {
    const data = item.data;
    if (item.type === "flashcards") {
        return data.words?.slice(0, 4).join(" • ");
    }
    if (item.type === "bingo") {
        return `${data.gridSize}x${data.gridSize} • ` + data.words?.slice(0, 3).join(" • ");
    }
    if (item.type === "worksheet") {
        return data.exercises?.map(e => e.type).join(" • ") || "Worksheet";
    }
    return "";
}

function showHoverPreview(event, encodedItem) {
  const item = JSON.parse(decodeURIComponent(encodedItem));
  const preview = document.getElementById("hoverPreview");
  preview.innerHTML = buildHoverContent(item);
  preview.classList.remove("hidden");
  moveHoverPreview(event);
}

function moveHoverPreview(event) {
  const preview = document.getElementById("hoverPreview");
  preview.style.left = event.clientX + 15 + "px";
  preview.style.top = event.clientY + 15 + "px";
}

function hideHoverPreview() {
  document.getElementById("hoverPreview").classList.add("hidden");
}

function buildHoverContent(item) {
  const data = item.data;
  if (item.type === "flashcards") {
    return `
      <strong>🃏 Flashcards</strong>
      <div>${data.words.slice(0, 8).join("<br>")}</div>
    `;
  }
  if (item.type === "bingo") {
    return `
        <strong>🎯 Bingo (${data.gridSize}x${data.gridSize})</strong>
        <div class="mini-bingo">
        ${buildMiniBingoGrid(data)}
        </div>
    `;
    }
  if (item.type === "worksheet") {
    return `
        <strong>📝 Worksheet</strong>
        <div class="mini-worksheet">
        ${buildMiniWorksheet(data)}
        </div>
    `;
    }
  return "";
}

function buildMiniBingoGrid(data) {
  const size = data.gridSize;
  const words = data.words || [];
  let cells = [];
  for (let i = 0; i < size * size; i++) {
    if (data.freeCenter && i === Math.floor((size * size) / 2)) {
      cells.push("FREE");
    } else {
      cells.push(words[i] || "");
    }
  }
  return `
    <div class="mini-grid" style="grid-template-columns: repeat(${size}, 1fr);">
      ${cells.map(w => `<div class="mini-cell">${w}</div>`).join("")}
    </div>
  `;
}

function buildMiniWorksheet(data) {
  const exercises = data.exercises || [];
  return `
    <div class="mini-ws-grid">
      ${exercises.map(ex => `
        <div class="mini-ws-card">
          ${getExerciseIcon(ex.type)}
          <span>${formatType(ex.type)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function getExerciseIcon(type) {
  if (type === "matching") return "🔤";
  if (type === "mcq") return "🧠";
  if (type === "fill") return "📝";
  if (type === "open") return "❓";
  return "📄";
}

function formatType(type) {
  return type.toUpperCase();
}

document.addEventListener("DOMContentLoaded", initDashboard);