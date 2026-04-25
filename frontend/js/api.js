window.API_URL = window.location.hostname 
    === "localhost" 
    ? "http://localhost:3000" 
    : window.location.origin;
    
const { createClient } = window.supabase;
const supabaseClient = createClient(
    "https://bqgvquzfsoqjygguuamb.supabase.co", 
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZ3ZxdXpmc29xanlnZ3V1YW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMDc5ODQsImV4cCI6MjA5MDU4Mzk4NH0.uULf9SpNQ3rFtfNHZ2ulmJESQB3Eum3lMTRFleff4X8"
);

async function checkUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const authEl = document.getElementById("auth");
    const logoutBtn = document.getElementById("logoutBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const saveBtn = document.getElementById("saveBtn");
    const loadBtn = document.getElementById("loadBtn");
    const warning = document.getElementById("loginWarning");
    if (downloadBtn) {
        if (user) {
            downloadBtn.classList.remove("locked");
            downloadBtn.disabled = false;
            saveBtn.classList.remove("locked");
            saveBtn.disabled = false;
            loadBtn.classList.remove("locked");
            loadBtn.disabled = false;
            warning.style.display = "none";
        } else {
            downloadBtn.classList.add("locked");
            saveBtn.classList.add("locked");
            loadBtn.classList.add("locked");
            //downloadBtn.disabled = true;
            warning.style.display = "block";
        }
    }
    if (user) {
        if (authEl) authEl.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "block";
        // Get user plan
        const { data: profile, error } = await supabaseClient.from("profiles").select("plan, plan_expires_at").eq("id", user.id).single();
        if (error) {
            console.error("Error fetching user profile:", error);
            return;
        }
        // Store globally
        window.userPlan = profile.plan;
        //Check if plan is expired
        if (profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date()) {
            console.log("User plan has expired");
            window.userPlan = "free";
        }
    }
    else {
        if (authEl) authEl.style.display = "block";
        if (logoutBtn) logoutBtn.style.display = "none";
    }
}

function needsImages(data) {
    return data.displayMode !== "text" || data.matching || data.mcq || data.fill;
}

//Function to attach all handlers
function attachAllHandlers() {
    attachEditableHandlers();
    attachCardControls();
    attachQuestionControls();
    attachDeleteQuestion();
    attachQuestionSorting();
    attachImagePicker();
    attachMCQControls();
    attachMCQSorting();
    attachMatchingControls();
    attachMatchingSorting();
    attachOpenSorting();
    attachStickerDrag();
    attachStickerDelete();
    attachStickerResize();
    attachStickerRotate();
    attachBorderHover();
    attachBorderApply();
}


async function renderFromState() {
    if (!window.worksheetState.stickers) {
        window.worksheetState.stickers = [];
    }
    const data = getPageData();
    if (data.mode === "custom") {
        const imageMap = {};
        window.worksheetState.exercises.forEach(ex => {
            if (ex.type === "fill" || ex.type === "open") {
                ex.questions.forEach(q => {
                    if (q.image) {
                        const key = q.image;
                        imageMap[key] = q.image;
                    }
                });
            }
            if (ex.type === "mcq") {
                ex.questions.forEach(q => {
                    if (q.image) {
                        const key = q.image;
                        imageMap[key] = q.image;
                    }
                });
            }
            if (ex.type === "matching") {
                ex.pairs.forEach(p => {
                    if (p.image) {
                        const key = p.image;
                        imageMap[key] = p.image;
                    }
                });
            }
        });
        data.imageMap = imageMap;
    }
    data.customExercises = window.worksheetState.exercises;
    const currentPage = window.worksheetState.currentPage;
    data.stickers = window.worksheetState.stickers.filter(
        s => s.pageIndex === currentPage
    );
    const res = await fetch(`${API_URL}/api/worksheet/preview`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });
    const html = await res.text();
    document.getElementById("preview").innerHTML = html;
    if (window.API_BASE === "worksheet") {
        const pages = document.querySelectorAll("#preview .page");
        // if no page before, reset properly
        if (pages.length > 0 && window.worksheetState.currentPage >= pages.length) {
            window.worksheetState.currentPage = pages.length - 1;
        }
        // fix empty → first page case
        if (pages.length > 0 && window.worksheetState.currentPage === undefined) {
            window.worksheetState.currentPage = 0;
        }
        // SHOW ONLY CURRENT PAGE
        pages.forEach((page, index) => {
            page.style.display = index === window.worksheetState.currentPage ? "" : "none";
        });
        renderPageControls();
    }
    attachAllHandlers();
    if (window.API_BASE === "worksheet") {
        const previewEl = document.getElementById("preview");
        previewEl.querySelectorAll(".page").forEach(page => {
            Sortable.create(page, {
            animation: 150,
            draggable: ".exercise-card",
            onEnd: () => {
                const newOrder = [];
                const temp = [...window.worksheetState.exercises];
                document.querySelectorAll(".exercise-card").forEach(card => {
                const type = card.dataset.type;
                const index = temp.findIndex(ex => ex.type === type);
                if (index !== -1) {
                    newOrder.push(temp[index]);
                    temp.splice(index, 1);
                }
                });
                window.worksheetState.exercises = newOrder;
            }
            });
        });
    }
}

function initializeStateFromPreview() {
    const state = [];
    document.querySelectorAll(".exercise-card").forEach(card => {
        const type = card.dataset.type;
        if (type === "fill") {
            const questions = [];
            card.querySelectorAll(".fill-question").forEach(q => {
                const sentence = q.querySelector("[data-editable]")?.textContent || "";
                const img = q.querySelector("img")?.src || null;
                questions.push({ sentence, image: img });
            });
            state.push({ type, questions });
        }
    });
    window.worksheetState.exercises = state;
}

function updateStateText(flatIndex, newText) {
    let count = 0;
    for (const ex of window.worksheetState.exercises) {
        //Open question exercise
        if (ex.type === "open") {
            for (let q of ex.questions) {
                if (count === flatIndex) {
                    q.question = newText;
                    return;
                }
                count++;
            }
        }
        //Fill exercise
        if (ex.type === "fill") {
            for (let q of ex.questions) {
                if (count === flatIndex) {
                    q.sentence = newText;
                    return;
                }
                count++;
            }
        }
        //MCQ exercise
        if (ex.type === "mcq") {
            for (let q of ex.questions) {
                if (count === flatIndex) {
                    q.question = newText;
                    return;
                }
                count++;
                for (let i = 0; i < q.choices.length; i++) {
                    if (count === flatIndex) {
                        q.choices[i] = newText;
                        return;
                    }
                    count++;
                }
            }
        }
        //Matching exercise
        if (ex.type === "matching") {
            for (let p of ex.pairs) {
                if (count === flatIndex) {
                p.word = newText;
                return;
                }
                count++;
            }
        }
    }
}

async function preview() {
    const previewDiv = document.getElementById("preview");
    previewDiv.innerHTML = "";
    const scrollY = window.scrollY;
    previewDiv.innerHTML = `
    <div style="text-align:center; padding:20px;">
        ⏳ Generating ${window.API_BASE}...
    </div>
    `;

    let data;
    if (typeof getPageData === "function") {
        data = getPageData(); // Worksheet has custom getPageData to include exercises
    } else if (window.API_BASE === "flashcards") {
        data = getFlashcardState(); // Flashcards gets some data from global state
    } else {
        data = getFormData(); // Default for bingo and others
    }

    if (window.API_BASE === "flashcards") {
        if (data.mode === "custom") {
            // handled entirely in frontend
        } else {
            if (needsImages(data)) {
            window.globalImageMap = await loadImages(data.words, window.globalImageMap);
            }
            data.imageMap = window.globalImageMap;
        }
    } else {
        if (needsImages(data)) {
            window.globalImageMap = await loadImages(data.words, window.globalImageMap);
        }
        data.imageMap = window.globalImageMap;
        }
    const res = await fetch(`${API_URL}/api/${window.API_BASE}/preview`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
    })
    const html = await res.text()
    document.getElementById("preview").innerHTML = html;
    // make preview editable in custom mode
    if (data.mode === "custom") {
        if (window.API_BASE === "worksheet") {
            attachAllHandlers();
        } else if (window.API_BASE === "flashcards") {
            //attachEditableHandlers();
        }
    }
    if (window.API_BASE === "worksheet") {
        const previewEl = document.getElementById("preview");
        previewEl.querySelectorAll(".page").forEach(page => {
            Sortable.create(page, {
            animation: 150,
            draggable: ".exercise-card"
            });
        });
    }
    if (data.mode === "custom") {
        if (window.API_BASE === "worksheet") {
            renderFromState();
        }
        if (window.API_BASE === "flashcards") {
            renderFlashcardsV2();
            return;
        }
    }
    window.scrollTo(0, scrollY);
}

async function download() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        alert("Please log in to download");
        return;
    }
    const btn = document.getElementById("downloadBtn");
    btn.disabled = true;
    btn.textContent = "⏳ Generating PDF...";
    try {
        let data;
        if (typeof getPageData === "function") {
            data = getPageData(); // Worksheet has custom getPageData to include exercises
        } else if (window.API_BASE === "flashcards") {
            data = getFlashcardState(); // Flashcards gets some data from global state
        } else {
            data = getFormData(); // Default for bingo and others
        }
        if (needsImages(data) && data.mode !== "custom") {
            window.globalImageMap = await loadImages(data.words, window.globalImageMap);
        }
        if (data.mode === "custom" && window.API_BASE === "flashcards") {
            data.imageMap = window.flashcardState.imageMap;
        } else {
            data.imageMap = window.globalImageMap;
        }
        if (window.API_BASE === "flashcards" && data.mode === "custom") {
            data.words = [...window.flashcardState.words];
            data.borders = window.flashcardState.borders || {};
            data.imageMap = { ...window.flashcardState.imageMap };
            data.baseUrl = window.API_URL;
            data.cards = data.words.map(word => ({
                text: word,
                image: data.imageMap[word] || null
            }));
        }
        if (window.API_BASE === "worksheet") {
            const previewEl = document.getElementById("preview");
            const ordered = [];
            previewEl.querySelectorAll(".exercise-card").forEach(card => {
                ordered.push(card.dataset.type);
            });
            data.exercises = ordered;
        }
        
        if (data.mode === "custom" && window.API_BASE === "worksheet") {
            data.customExercises = window.worksheetState.exercises;
            data.exercises = [];
            data.stickers = window.worksheetState.stickers;
        }  
        const { data: { session } } = await supabaseClient.auth.getSession();
        const res = await fetch(`${API_URL}/api/${window.API_BASE}/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`
            },
            body: JSON.stringify(data)
        })
        // Check if response is ok
        if (!res.ok) {
            const errorData = await res.json();
            if (res.status === 403) {
                showUpgradeModal("download");
            } else if (res.status === 401) {
                alert("Unauthorized. Please log in again.");
            } else {
                alert("Error: " + (errorData.error || "Something went wrong"));
            }
            return;
        }
        // If ok
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${window.API_BASE}.pdf`
        a.click()
    } catch (err) {
        console.error(err);
    }
    btn.disabled = false;
    btn.textContent = "⬇️ Download PDF";
}

async function downloadFromData(data, type, filename = "activity") {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const res = await fetch(`${API_URL}/api/${type}/generate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token || ""}`
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 403) {
            showUpgradeModal("download");
        } else if (res.status === 401) {
            alert("Please log in");
        } else {
            alert(errorData.error || "Download failed");
        }
        return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function renderPageControls() {
  const container = document.getElementById("pageControls");
  if (!container) return;
  const pages = document.querySelectorAll("#preview .page");
  container.innerHTML = "";
  pages.forEach((_, index) => {
    const btn = document.createElement("button");
    btn.textContent = index + 1;
    if (index === window.worksheetState.currentPage) {
      btn.classList.add("active");
    }
    btn.onclick = () => {
      window.worksheetState.currentPage = index;
      renderFromState();
    };
    container.appendChild(btn);
  });
}

function showUpgradeModal(type) {
    const modal = document.getElementById("upgrade-upgradeModal");
    const title = modal.querySelector(".modal-title-text");
    const message = modal.querySelector("p");
    if (type === "download") {
        title.textContent = "🚫 Daily download limit reached";
        message.textContent = "Upgrade to continue downloading pdfs.";
        title.setAttribute("data-i18n", "downloadLimitTitle");
        message.setAttribute("data-i18n", "downloadLimitMessage");
    }
    if (type === "save") {
        title.textContent = "🚫 Save limit reached";
        message.textContent = "Upgrade to save more activities.";
        title.setAttribute("data-i18n", "saveLimitTitle");
        message.setAttribute("data-i18n", "saveLimitMessage");
    }
    applyTranslations(currentLang);
    modal.classList.remove("upgrade-hidden");
}
function hideUpgradeModal() {
  document.getElementById("upgrade-upgradeModal").classList.add("upgrade-hidden");
}

async function loadModal() {
  const res = await fetch("/components/upgradeModal.html");
  const html = await res.text();
  document.body.insertAdjacentHTML("beforeend", html);
  document.getElementById("upgrade-closeModal").onclick = hideUpgradeModal;
  document.getElementById("upgrade-goUpgrade").onclick = () => {
    window.location.href = "/payment.html";
  };
}

function renderLimit(id, label, used, limit) {
  const el = document.getElementById(id);
  const tLabel = t(label);
  if (!limit) {
    el.innerHTML = `
        <div class="limit-label">
            <span>${tLabel} : </span>
            <span>${t("noLimit")}</span>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width:100%"></div>
        </div>
    `;
    return;
  }
  const remaining = limit - used;
  const percent = (used / limit) * 100;
  el.innerHTML = `
    <div class="limit-label">
      <span>${tLabel} : </span>
      <span>${t("limitUsed", { used, limit })}</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width:${percent}%"></div>
    </div>
  `;
  // Change color based on usage
  const fill = el.querySelector(".progress-fill");
  if (percent < 40) {
    fill.style.backgroundColor = "green";
  } else if (percent === 100) {
    fill.style.backgroundColor = "red";
  } else {
    fill.style.backgroundColor = "orange";
  }
}

function updateLimitsUI(data) {
  const container = document.getElementById("limitsBar");
  if (!data || !data.limits) return;
  container.classList.remove("hidden");
  renderLimit(
    "saveLimit",
    "savesLabel",
    data.limits.saves.used,
    data.limits.saves.limit
  );
  renderLimit(
    "downloadLimit",
    "downloadsLabel",
    data.limits.downloads.used,
    data.limits.downloads.limit
  );
}

async function loadLimits() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;
  const res = await fetch(`${API_URL}/limits`, {
    headers: {
      "Authorization": `Bearer ${session.access_token}`
    }
  });
  if (!res.ok) {
    console.error("Failed to fetch limits");
    return;
  }
  const data = await res.json();
  window.currentLimitsData = data;
  updateLimitsUI(data);
}

function refreshLimitsUI() {
  if (!window.currentLimitsData) return;
  updateLimitsUI(window.currentLimitsData);
}

//Check if im in worksheet, bingo or flashcards and load modal
document.addEventListener("DOMContentLoaded", () => {
  if (
    window.API_BASE === "worksheet" ||
    window.API_BASE === "bingo" ||
    window.API_BASE === "flashcards"
  ) {
    loadModal();
    loadLimits();
  }
});

checkUser();