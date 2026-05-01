let currentPage = 1;

async function initProfile() {
    const user = await getCurrentUser();
    if (!user) {
        document.getElementById("notLogged").classList.remove("hidden");
        return;
    }
    document.getElementById("profile-container").classList.remove("hidden");
    document.getElementById("saveUsernameBtn").onclick = saveUsername;
    loadProfile(1);
}

function getUserIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function loadSkeleton() {
  // Header skeleton
  document.getElementById("profile-username").innerHTML =
    `<div class="skeleton-title" style="width:120px;"></div>`;
  document.getElementById("profile-plan").innerHTML =
    `<div class="skeleton-box" style="width:50px; height:20px;"></div>`;
  document.getElementById("stat-rating").innerHTML =
    `<div class="skeleton-meta" style="width:60px;"></div>`;
  document.getElementById("stat-items").innerHTML =
    `<div class="skeleton-meta" style="width:80px;"></div>`;
  document.getElementById("stat-shared").innerHTML =
    `<div class="skeleton-meta" style="width:90px;"></div>`;
}

async function loadProfile(page = 1) {
  currentPage = page;
  const userId = getUserIdFromURL();
  if (!userId) return;
  const profileItems = document.getElementById("profile-items");
  const user = await getCurrentUser();
  const isOwner = user && user.id === userId;
  if (isOwner) {
    document.getElementById("username-edit").classList.remove("hidden");
  }
  try {
    profileItems.innerHTML = Array(8).fill(`
      <div class="profile-card skeleton">
        <div class="profile-preview skeleton-box"></div>
        <div class="skeleton-title"></div>
        <div class="skeleton-meta"></div>
      </div>
    `).join("");
    loadSkeleton();
    const { data: { session } } = await supabaseClient.auth.getSession();
    const res = await fetch(`/api/profile/${userId}?page=${page}&pageLimit=8`, {
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
    document.getElementById("profile-plan").innerHTML = getTierImage(data.plan);
    document.getElementById("stat-rating").textContent = `⭐ ${data.avgRating || 0}`;
    document.getElementById("stat-items").textContent = `📦 ${data.totalItems || 0} items`;
    document.getElementById("stat-shared").textContent = `🌍 ${data.sharedItems || 0} shared`;
    usernameInput.classList.remove("skeleton-box");
    usernameInput.placeholder = "Enter username";
    renderProfileItems(data.items);
    renderPagination(data.pagination);
  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

function renderPagination(pagination) {
  const container = document.getElementById("profile-pagination");
  container.innerHTML = "";
  if (!pagination || pagination.totalPages <= 1) return;
  for (let i = 1; i <= pagination.totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === pagination.page) {
      btn.style.fontWeight = "bold";
      btn.style.background = "#ddd";
    }
    btn.onclick = () => loadProfile(i);
    container.appendChild(btn);
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

function getTierImage(tier) {
  if (tier === "free") return `<img class="tier-icon" src="assets/mascots/freeTier.png" alt="Free Tier" title="Free Tier">`
  if (tier === "premium") return `<img class="tier-icon" src="assets/mascots/premiumTier.png" alt="Premium Tier" title="Premium Tier">`;
  if (tier === "vip") return `<img class="tier-icon" src="assets/mascots/vipTier.png" alt="VIP Tier" title="VIP Tier">`;
  return "";
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