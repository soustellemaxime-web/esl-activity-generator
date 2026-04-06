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
      <div class="worksheet-item">
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
  document.querySelectorAll(".tab").forEach(btn => btn.classList.remove("active"));
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


document.addEventListener("DOMContentLoaded", initDashboard);