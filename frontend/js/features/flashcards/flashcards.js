window.API_BASE = "flashcards";

window.flashcardState = {
  words: [],
  displayMode: "text",
  cutLines: false,
  imageMap: {}
};

function syncToV2() {
  window.flashcardStateV2 = {
    mode: getMode(),
    words: [...window.flashcardState.words],
    imageMap: { ...window.flashcardState.imageMap },
    borders: { ...window.flashcardState.borders },
    settings: {
      displayMode: document.getElementById("displayMode").value,
      cutLines: document.getElementById("cutLines").checked
    }
  };
}

window.flashcardBorderMode = {
  active: false,
  style: null
};

window.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("load");
  if (!id) return;
  if (window.API_BASE === "bingo") loadBingo(id);
  if (window.API_BASE === "worksheet") loadWorksheet(id);
  if (window.API_BASE === "flashcards") loadFlashcard(id);
});

function enableFlashcardBorderMode(style) {
  window.flashcardBorderMode.active = true;
  window.flashcardBorderMode.style = style;
  document.body.classList.add("border-mode");
}

function getFlashcardState() {
  const data = getFormData();
  const mode = getMode();
  if (mode === "custom") {
    return {
      mode,
      words: window.flashcardState.words,
      displayMode: data.displayMode,
      cutLines: data.cutLines,
      imageMap: window.flashcardState.imageMap,
      borders: window.flashcardState.borders || {}
    };
  }
  return {
    mode,
    words: data.words,
    displayMode: data.displayMode,
    cutLines: data.cutLines,
    imageMap: window.globalImageMap || {},
    borders: window.flashcardState.borders || {}
  };
}

function toggleDashboard() {
  const el = document.getElementById("dashboard");
  el.classList.toggle("hidden");
  if (!el.classList.contains("hidden")) {
    loadFlashcards();
  }
}

async function saveFlashcards() {
  const state = getFlashcardState();
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    alert("You must be logged in to save flashcards.");
    return;
  }
  await fetch(`${API_URL}/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: "Flashcards - " + new Date().toLocaleString(),
      type: "flashcards",
      data: state,
      user_id: user.id
    })
  });
  alert("Flashcards saved successfully!");
}

async function loadFlashcard(id) {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    alert("You must be logged in to load flashcards.");
    return;
  }
  const res = await fetch(`${API_URL}/worksheets/${id}?user_id=${user.id}`);
  const item = await res.json();
  const state = item.data;
  // 1. Restore form values
  document.getElementById("words").value = state.words.join("\n");
  document.getElementById("displayMode").value = state.displayMode;
  document.getElementById("cutLines").checked = state.cutLines;
  // 2. Restore FULL state (important)
  window.flashcardState.words = state.words || [];
  window.flashcardState.imageMap = state.imageMap || {};
  window.flashcardState.borders = state.borders || {};
    // 3. Decide mode FIRST
  const hasCustomData =
    Object.keys(window.flashcardState.imageMap).length > 0 ||
    Object.keys(window.flashcardState.borders).length > 0;
  if (hasCustomData) {
    document.querySelector('input[name="mode"][value="custom"]').checked = true;
  } else {
    document.querySelector('input[name="mode"][value="auto"]').checked = true;
  }
  // 4. NOW sync (mode is correct)
  syncToV2();
  updateFlashcardModeUI();
  if (hasCustomData) {
    renderFlashcardsV2();
  } else {
    preview();
  }
}

async function loadFlashcards() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const res = await fetch(`${API_URL}/worksheets?user_id=${user.id}&type=flashcards`);
  const flashcards = await res.json();
  const container = document.getElementById("worksheetsList");
  container.innerHTML = flashcards.map(f => `
    <div class="worksheet-item">
      <div class="worksheet-info">
        <strong>${f.title || "Flashcards"}</strong>
        <span class="worksheet-date">${new Date(f.created_at).toLocaleString()}</span>
      </div>
      <div style="display:flex; gap:6px;">
        <button onclick="loadFlashcard('${f.id}')">Open</button>
        <button class="btn danger" onclick="deleteFlashcard('${f.id}')">
          Delete
        </button>
      </div>
    </div>
  `).join("");
}

async function deleteFlashcard(id) {
  const confirmed = confirm("Delete this flashcard?");
  if (!confirmed) return;
  const { data: { user } } = await supabaseClient.auth.getUser();
  await fetch(`${API_URL}/worksheets/${id}?user_id=${user.id}`, {
    method: "DELETE"
  });
  loadFlashcards();
}

async function reloadImage(word, cardElement) {
  try {
    const res = await fetch(`${API_URL}/api/images?word=${encodeURIComponent(word)}`);
    const data = await res.json();

    if (!data.image) return;

    const img = cardElement.querySelector("img");
    if (img) {
      img.src = data.image;
    }

  } catch (err) {
    console.error("Reload image failed:", err);
  }
}

function getMode() {
  return document.querySelector('input[name="mode"]:checked')?.value || "auto";
}

function convertFlashcardsToCustom() {
  const data = getFormData();
  // words from form (already handled earlier but safe)
  window.flashcardState.words = [...data.words];
  // images from global map
  window.flashcardState.imageMap = {
    ...(window.globalImageMap || {})
  };
}

function initModeSwitch() {
  const radios = document.querySelectorAll('input[name="mode"]');
  if (!radios.length) return;
  radios.forEach(radio => {
    radio.addEventListener("change", async () => {
      const mode = getMode();
      if (mode === "custom") {
        const formData = getFormData();
        window.flashcardState.words = [...formData.words];
        await preview();
        convertFlashcardsToCustom();
        syncToV2();
        updateFlashcardModeUI();
        renderFlashcardsV2();
      } else {
        syncToV2();
        updateFlashcardModeUI();
        preview();
      }
    });
  });
}

function renderCustomFlashcards() {
  const container = document.getElementById("preview");
  const words = window.flashcardState.words;
  const imageMap = window.flashcardState.imageMap;
  const displayMode = document.getElementById("displayMode").value;
  const cutLines = document.getElementById("cutLines").checked;
  container.innerHTML = `
    <div class="flashcards-container">
      <div class="page ${cutLines ? "cut-lines" : ""}">
        ${words.map((word, i) => {
          const image = imageMap[word];
          const borderStyle = window.flashcardState.borders?.[i] || "";
          return `
            <div class="flashcard ${borderStyle}" data-index="${i}">
              <button class="delete-card" data-index="${i}">❌</button>
              ${displayMode !== "text" ? `
                <div class="image-container" data-index="${i}">
                  ${image ? `<img src="${image}">` : `<div class="image-placeholder">➕</div>`}
                </div>
              ` : ""}
              ${displayMode !== "image" ? `
                <p contenteditable="true" data-index="${i}" class="flashcard-text">
                  ${word}
                </p>
              ` : ""}
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
  attachFlashcardEditHandlers();
  //enables borders
  attachFlashcardBorders();
}

function renderFlashcardsV2() {
  const state = window.flashcardStateV2;
  if (state.mode === "custom") {
    renderCustomFlashcards();
  } else {
    preview(); // still uses old system
  }
}

function attachFlashcardBorders() {
  document.querySelectorAll(".flashcard").forEach((card, index) => {
    // Hover preview
    card.onmouseenter = () => {
      if (!window.flashcardBorderMode?.active) return;
      const style = window.flashcardBorderMode.style || "border-classic";
      card.classList.add("border-preview", style);
    };
    card.onmouseleave = () => {
      if (!window.flashcardBorderMode?.active) return;
      const style = window.flashcardBorderMode.style || "border-classic";
      card.classList.remove("border-preview", style);
    };
    // Apply border
    card.onclick = (e) => {
      if (!window.flashcardBorderMode?.active) return;
      e.stopPropagation();
      const style = window.flashcardBorderMode.style || "border-classic";
      if (!window.flashcardState.borders) {
        window.flashcardState.borders = {};
      }
      FlashcardActions.setBorder(index, style);
      document.body.classList.remove("border-mode");
      window.flashcardBorderMode.active = false;
      renderFlashcardsV2();
    };
  });
}

function attachFlashcardEditHandlers() {
  // TEXT EDIT
  document.querySelectorAll(".flashcard-text").forEach(el => {
    el.addEventListener("input", () => {
      const i = el.dataset.index;
      const oldWord = window.flashcardState.words[i];
      const newWord = el.textContent.trim();
      // move image mapping
      if (window.flashcardState.imageMap[oldWord]) {
        window.flashcardState.imageMap[newWord] = window.flashcardState.imageMap[oldWord];
        delete window.flashcardState.imageMap[oldWord];
      }
      FlashcardActions.updateWord(i, newWord);
    });
  });
  // IMAGE EDIT
  document.querySelectorAll(".image-container").forEach(el => {
    el.onclick = (e) => {
      if (window.flashcardBorderMode?.active) return; // disable image editing in border mode
      e.stopPropagation();
      const i = el.dataset.index;
      const word = window.flashcardState.words[i];
      showImagePicker([], word, el, (img) => {
        FlashcardActions.setImage(word, img);
        renderFlashcardsV2();
      }, {
        allowSearch: true,
        allowUpload: true
      });
    };
  });
  // DELETE CARD
  document.querySelectorAll(".delete-card").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const i = btn.dataset.index;
      FlashcardActions.deleteCard(i);
      renderFlashcardsV2();
    };
  });
}

function updateFlashcardModeUI() {
  const mode = getMode();
  const words = document.getElementById("words");
  if (mode === "custom") {
    words.closest(".section").style.display = "none";
  } else {
    words.closest(".section").style.display = "block";
  }
  document.getElementById("addCardBtn").classList.toggle("hidden", mode !== "custom");
}

function showFlashcardBorderPicker() {
  const styles = [
    "border-classic",
    "border-dashed",
    "border-rounded",
    "border-fun",
    "border-magic",
    "border-flowers",
    "border-stars",
    "border-school",
    "border-ocean",
    "border-rainbows",
    "border-candies",
    "border-party",
    "border-dinosaurs",
    "border-vehicles",
  ];
  const picker = document.createElement("div");
  picker.id = "borderPicker";
  picker.innerHTML = styles.map(style => `
    <div class="border-option ${style}" data-style="${style}">Aa</div>
  `).join("");
  document.body.appendChild(picker);
  picker.querySelectorAll(".border-option").forEach(opt => {
    opt.onclick = () => {
      enableFlashcardBorderMode(opt.dataset.style);

      picker.querySelectorAll(".border-option")
        .forEach(o => o.classList.remove("active"));

      opt.classList.add("active");
    };
  });
  function handleOutsideClick(e) {
    if (!picker.contains(e.target)) {
      picker.remove();
      document.body.classList.remove("border-mode");
      window.flashcardBorderMode.active = false;
      document.removeEventListener("click", handleOutsideClick);
    }
  }
  setTimeout(() => {
    document.addEventListener("click", handleOutsideClick);
  }, 0);
}

function selectFlashcardBorder(style) {
  enableFlashcardBorderMode(style);
  document.getElementById("borderPicker").classList.add("hidden");
  document.body.classList.add("border-mode");
}

window.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("addCardBtn");
  if (addBtn) {
    addBtn.onclick = () => {
      FlashcardActions.addCard();
      renderFlashcardsV2();
    };
  }
  const words = document.getElementById("words");
  if (words) {
    words.addEventListener("input", debounce(preview, 500));
  }
  const displayMode = document.getElementById("displayMode");
  if (displayMode) {
    displayMode.addEventListener("change", debounce(preview, 500));
  }
  const cutLines = document.getElementById("cutLines");
  if (cutLines) {
    cutLines.addEventListener("change", debounce(preview, 500));
  }
});

initModeSwitch();