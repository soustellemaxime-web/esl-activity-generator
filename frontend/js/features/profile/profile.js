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
    const res = await fetch(`/api/profile/${userId}`);
    const data = await res.json();
    console.log(data);
    // Fill UI
    document.getElementById("profile-username").textContent = data.username || data.id.slice(0, 6);;
    document.getElementById("profile-plan").textContent = data.plan;
    document.getElementById("stat-rating").textContent = `⭐ ${data.avgRating || 0}`;
    document.getElementById("stat-items").textContent = `📦 ${data.totalItems || 0} items`;
    document.getElementById("stat-shared").textContent = `🌍 ${data.sharedItems || 0} shared`;
  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initProfile();
});