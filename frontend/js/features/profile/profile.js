async function initProfile() {
    const user = await getCurrentUser();
    if (!user) {
        document.getElementById("notLogged").classList.remove("hidden");
        return;
    }
    document.getElementById("profile-container").classList.remove("hidden");
    document.getElementById("saveUsernameBtn").onclick = saveUsername;
    loadProfile();
}

function getUserIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadProfile() {
  const userId = getUserIdFromURL();
  if (!userId) return;
  const profileItems = document.getElementById("profile-items");
  const user = await getCurrentUser();
  const isOwner = user && user.id === userId;
  if (isOwner) {
    document.getElementById("username-edit").classList.remove("hidden");
  }
  try {
    profileItems.innerHTML = Array(5).fill(`
      <div class="profile-card skeleton">
        <div class="profile-preview skeleton-box"></div>
        <div class="skeleton-title"></div>
        <div class="skeleton-meta"></div>
      </div>
    `).join("");
    const { data: { session } } = await supabaseClient.auth.getSession();
    const res = await fetch(`/api/profile/${userId}`, {
        headers: {
            "Authorization": `Bearer ${session.access_token}`
        }
    });
    const data = await res.json();
    if (data.username) {
      document.getElementById("usernameInput").value = data.username;
    }
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
    const visibilityCapitalized = item.visibility.charAt(0).toUpperCase() + item.visibility.slice(1);
    const div = document.createElement("div");
    div.className = "profile-item-card";
    div.innerHTML = `
      <div class="card" onclick="openItem('${item.id}', '${item.visibility}')">
        <div class="profile-item-preview">
          ${getEmojiType(item.type)}
        </div>
        <div class="profile-item-badge ${item.type}">
          ${item.type}
        </div>
        <strong>${item.title || "Untitled"}</strong>
        <div style="font-size:12px; color:#666;">
          ${getEmojiVisibility(item.visibility)} ${visibilityCapitalized}
        </div>
        ${item.visibility === "public" ? `
          <div class="profile-meta">
            <div class="profile-ratingStars">
              ${[1,2,3,4,5].map(i => {
                if (i <= item.rating_avg) return `<span>⭐</span>`;
                if (i - 0.5 <= item.rating_avg) return `<span style="opacity:0.6">⭐</span>`;
                return `<span style="opacity:0.3">⭐</span>`;
              }).join("")}
              ${item.rating_avg || "0"}
            </div>
          </div>
        ` : ""}
      </div>
    `;
    container.appendChild(div);
  });
}

function getEmojiType(type) {
  if (type === "worksheet") return "📄";
  if (type === "bingo") return "🎯";
  if (type === "flashcards") return "🃏";
  return "📦";
}

function getEmojiVisibility(visibility) {
  if (visibility === "private") return "🔒";
  if (visibility === "public") return "🌍";
  return "📦";
}

function openItem(id, visibility) {
  if (visibility === "public") {
    window.location.href = `/community-item.html?id=${id}`;
  }
  else return;
}

async function saveUsername() {
  const input = document.getElementById("usernameInput");
  const username = input.value;
  if (!username) {
    alert("Username cannot be empty");
    return;
  }
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const res = await fetch(`/api/profile/username`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ username })
    });
    const result = await res.json();
    if (!res.ok) {
      alert(result.error || "Failed to update username");
      return;
    }
    // update UI instantly
    document.getElementById("profile-username").textContent = username;
    alert("Username updated!");
  } catch (err) {
    console.error(err);
    alert("Error updating username");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initProfile();
});