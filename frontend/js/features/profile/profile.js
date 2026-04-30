async function initProfile() {
    const user = await getCurrentUser();
    if (!user) {
        document.getElementById("notLogged").classList.remove("hidden");
        return;
    }
    document.getElementById("profile-container").classList.remove("hidden");
    loadProfile();
}

function getUserIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadProfile() {
  const userId = getUserIdFromURL();
  if (!userId) return;
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const res = await fetch(`/api/profile/${userId}`, {
        headers: {
            "Authorization": `Bearer ${session.access_token}`
        }
    });
    const data = await res.json();
    console.log(data);
    // Fill UI
    document.getElementById("profile-username").textContent = data.username || data.id.slice(0, 6);;
    document.getElementById("profile-plan").textContent = data.plan;
    document.getElementById("stat-rating").textContent = `⭐ ${data.avgRating || 0}`;
    document.getElementById("stat-items").textContent = `📦 ${data.totalItems || 0} items`;
    document.getElementById("stat-shared").textContent = `🌍 ${data.sharedItems || 0} shared`;
    renderProfileItems(data.items);
  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

function renderProfileItems(items) {
  const container = document.getElementById("profile-items");
  container.innerHTML = "";
  if (!items || items.length === 0) {
    container.innerHTML = "<p>No items yet.</p>";
    return;
  }
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "profile-item-card";
    div.innerHTML = `
      <div class="card">
        <strong>${item.title || "Untitled"}</strong>
        <div style="font-size:12px; color:#666;">
          ${item.type} • ${item.visibility}
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initProfile();
});