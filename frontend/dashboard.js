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
    const res = await fetch(`${API_URL}/worksheets?user_id=${user_id}`);
    const data = await res.json();
    renderList(data.filter(w => w.type === "worksheet"), "worksheetsList", "worksheet");
    renderList(data.filter(w => w.type === "bingo"), "bingoList", "bingo");
    renderList(data.filter(w => w.type === "flashcards"), "flashcardsList", "flashcard");
}

function renderList(items, containerId, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = items.map(item => `
        <div class="worksheet-item">
            <div class="worksheet-info">
                <strong>${item.title}</strong>
                <span class="worksheet-date">
                ${new Date(item.created_at).toLocaleString()}
                </span>
            </div>

            <div style="display:flex; gap:6px;">
                <button onclick="openItem('${item.id}', '${type}')">Open</button>
                <button class="btn danger" onclick="deleteItem('${item.id}')">Delete</button>
            </div>
        </div>
    `).join("");
}

function openItem(id, type) {
    if (type === "worksheet") {
        window.location.href = `worksheet.html?load=${id}`;
    } else if (type === "bingo") {
        window.location.href = `bingo.html?load=${id}`;
    } else if (type === "flashcard") {
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

document.addEventListener("DOMContentLoaded", initDashboard);