let zoom = 0.8;
let currentPage = 0;

function updatePages() {
  const pages = document.querySelectorAll("#preview .page");
  if (!pages.length) return;
  pages.forEach((p, i) => {
    if (i === currentPage) {
      p.style.visibility = "visible";
      p.style.position = "relative";
    } else {
      p.style.visibility = "hidden";
      p.style.position = "absolute";
    }
  });
  const pageLabel = document.getElementById("ci-page-info");
  if (pageLabel) {
    pageLabel.textContent = `${currentPage + 1} / ${pages.length}`;
  }
  const prevBtn = document.getElementById("ci-prev");
  const nextBtn = document.getElementById("ci-next");
  if (prevBtn && nextBtn) {
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage === pages.length - 1;
  }
  const fsLabel = document.getElementById("ci-fullscreen-page");
  if (fsLabel) {
    fsLabel.textContent = `${currentPage + 1} / ${pages.length}`;
  }
}

function applyZoom() {
  const preview = document.getElementById("preview");
  if (!preview) return;
  preview.style.transform = `scale(${zoom})`;
  preview.style.transformOrigin = "top center";
  const zoomLabel = document.getElementById("ci-zoom-level");
  if (zoomLabel) {
    zoomLabel.textContent = Math.round(zoom * 100) + "%";
  }
}

function toggleFullscreen() {
  const el = document.querySelector(".ci-preview-viewport");
  if (!el) return;
  if (!document.fullscreenElement) {
    el.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

async function loadItem() {
  document.getElementById("itemSkeleton").style.display = "block";
  document.getElementById("itemContent").classList.add("hidden");
  const { data: { session } } = await supabaseClient.auth.getSession();
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;
  try {
    const res = await fetch(`${API_URL}/api/community/${id}`, {
      headers: {
        "Authorization": `Bearer ${session?.access_token || ""}`
      }
    });
    if (!res.ok) throw new Error("Failed to fetch item");
    const item = await res.json();
    renderItem(item);
    document.getElementById("itemSkeleton").style.display = "none";
    document.getElementById("itemContent").classList.remove("hidden");
  } catch (err) {
    console.error("Error loading item:", err);
  }
  if (window.userPlan !== "vip") {
    document.getElementById("useTemplateBtn").classList.add("locked");
  }
}

async function renderItem(item) {
  document.getElementById("itemTitle").textContent = item.title;
  document.getElementById("ratingValue").textContent = `⭐ ${item.rating_avg || 0} (${item.rating_count || 0})`;
  const previewEl = document.getElementById("preview");
  previewEl.innerHTML = "Loading preview...";
  try {
    const res = await fetch(`${API_URL}/api/community/${item.id}/preview`, {
      method: "POST"
    });
    if (!res.ok) throw new Error("Preview failed");
    const html = await res.text();
    previewEl.innerHTML = html;
    applyZoom();
    updatePages();
  } catch (err) {
    console.error(err);
    previewEl.innerHTML = "Failed to load preview";
  }
  if (item.user_rating) {
    const stars = document.querySelectorAll("#ratingStars span");
    stars.forEach((star, index) => {
      star.style.opacity = index < item.user_rating ? "1" : "0.3";
    });
  }
  window.currentItem = item;
}

function getEmoji(type) {
  if (type === "worksheet") return "📄";
  if (type === "bingo") return "🎯";
  if (type === "flashcards") return "🃏";
}

function useTemplate() {
  if (!window.currentItem) return;
  const item = window.currentItem;
  if (window.userPlan !== "vip") {
    showUpgradeModal("template");
    return;
  }
  if (item.type === "worksheet") {
    window.location.href = `worksheet.html?load=${item.id}`;
  }
  if (item.type === "bingo") {
    window.location.href = `/bingo.html?load=${item.id}`;
  }
  if (item.type === "flashcards") {
    window.location.href = `/flashcards.html?load=${item.id}`;
  }
}

async function downloadItem() {
  const item = window.currentItem;
  if (!item) return;
  let data = typeof item.data === "string"
    ? JSON.parse(item.data)
    : item.data;
  if (item.type === "worksheet") {
    data.mode = "custom"; 
    data.customExercises = data.customExercises || data.exercises || [];
    data.exercises = [];
    data.imageMap = data.imageMap || {};
    data.baseUrl = window.API_URL;
  }
  if (item.type === "flashcards" && data.mode === "custom") {
    data.baseUrl = window.API_URL;
    data.cards = (data.words || []).map(word => ({
      text: word,
      image: data.imageMap?.[word] || null
    }));
  }
  await downloadFromData(data, item.type, item.title, true);
}

async function rate(value) {
  const item = window.currentItem;
  if (!item) return;
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    alert("Please log in to rate");
    return;
  }
  const stars = document.querySelectorAll("#ratingStars span");
  stars.forEach((star, index) => {
    star.style.opacity = index < value ? "1" : "0.3";
  });
  try {
    const res = await fetch(`${API_URL}/api/community/${item.id}/rate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ rating: value })
    });
    if (!res.ok) throw new Error("Rating failed");
    const data = await res.json();
    // update UI instantly
    document.getElementById("ratingValue").textContent =
      `⭐ ${data.rating_avg.toFixed(1)} (${data.rating_count})`;
  } catch (err) {
    console.error(err);
    alert("Failed to rate");
  }
}

function updateCommunityLimitUI(data) {
  const container = document.getElementById("limitsBar");
  if (!data || !data.limits) return;
  container.classList.remove("hidden");
  const community = data.limits.communityDownloads;
  renderLimit(
    "communityDownloadLimit",
    "downloadsCommunityLabel",
    community.used,
    community.limit
  );
}

async function loadLimitsCommunity() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;
  const res = await fetch(`${API_URL}/limits`, {
    headers: {
      "Authorization": `Bearer ${session.access_token}`
    }
  });
  if (!res.ok) return;
  const data = await res.json();
  updateCommunityLimitUI(data);
}

document.addEventListener("DOMContentLoaded", () =>
  {
    loadItem();
    loadModal();
    loadLimitsCommunity();
    // Zoom
    const zoomInBtn = document.getElementById("ci-zoom-in");
    if (zoomInBtn) {
      zoomInBtn.onclick = () => {
        zoom += 0.1;
        applyZoom();
      };
    }
    const zoomOutBtn = document.getElementById("ci-zoom-out");
    if (zoomOutBtn) {
      zoomOutBtn.onclick = () => {
        zoom = Math.max(0.5, zoom - 0.1);
        applyZoom();
      };
    }
    // Pagination
    const nextBtn = document.getElementById("ci-next");
    if (nextBtn) {
      nextBtn.onclick = () => {
        const pages = document.querySelectorAll("#preview .page");
        if (currentPage < pages.length - 1) {
          currentPage++;
          updatePages();
        }
      };
    }
    const prevBtn = document.getElementById("ci-prev");
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (currentPage > 0) {
          currentPage--;
          updatePages();
        }
      };
    }
    // Fullscreen
    const fullscreenBtn = document.getElementById("ci-fullscreen");
    if (fullscreenBtn) {
      fullscreenBtn.onclick = toggleFullscreen;
    }
    document.addEventListener("keydown", (e) => {
      // only when fullscreen is active
      if (!document.fullscreenElement) return;
      if (e.key === "ArrowRight") {
        const pages = document.querySelectorAll("#preview .page");
        if (currentPage < pages.length - 1) {
          currentPage++;
          updatePages();
        }
      }
      if (e.key === "ArrowLeft") {
        if (currentPage > 0) {
          currentPage--;
          updatePages();
        }
      }
    });
    document.addEventListener("fullscreenchange", () => {
      const hint = document.getElementById("ci-fullscreen-hint");
      if (!hint) return;
      if (!document.fullscreenElement) {
        hint.classList.add("hidden");
      } else {
        hint.classList.remove("hidden");
      }
    });
    const fsPrev = document.getElementById("ci-fs-prev");
    const fsNext = document.getElementById("ci-fs-next");
    if (fsPrev) {
      fsPrev.onclick = () => {
        if (currentPage > 0) {
          currentPage--;
          updatePages();
        }
      };
    }
    if (fsNext) {
      fsNext.onclick = () => {
        const pages = document.querySelectorAll("#preview .page");
        if (currentPage < pages.length - 1) {
          currentPage++;
          updatePages();
        }
      };
    }
  }
);