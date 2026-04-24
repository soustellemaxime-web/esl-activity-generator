window.API_BASE = "worksheet";
window.worksheetState = {
  title: "",
  layout: "4",
  exercises: [],
  stickers: [],
  font: "font-default",
};
window.borderMode = {
  active: false,
  style: null
};
window.currentPage = 0;

const BASE_URL = API_URL; 

const STICKERS = {
  People: [
    `${BASE_URL}/assets/stickers/teacher.png`,
    `${BASE_URL}/assets/stickers/studentboy.png`,
    `${BASE_URL}/assets/stickers/studentgirl.png`,
  ],
  Animals: [
    `${BASE_URL}/assets/stickers/panda.png`,
    `${BASE_URL}/assets/stickers/rabbit.png`,
    `${BASE_URL}/assets/stickers/koala.png`,
    `${BASE_URL}/assets/stickers/dog.png`,
  ],
  Fruits: [
    `${BASE_URL}/assets/stickers/apple.png`,
    `${BASE_URL}/assets/stickers/banana.png`,
    `${BASE_URL}/assets/stickers/grapes.png`,
    `${BASE_URL}/assets/stickers/pineapple.png`,
    `${BASE_URL}/assets/stickers/strawberry.png`,
    `${BASE_URL}/assets/stickers/watermelon.png`,
  ],
  Vehicles: [
    `${BASE_URL}/assets/stickers/helicopter.png`,
    `${BASE_URL}/assets/stickers/airplane.png`,
  ]
};

const LIMITS = {
  "1": { fill: 9, match: 9, mcq: [{ questions: 4, choices: 2 }, { questions: 3, choices: 3 }, { questions: 3, choices: 4 }], open: 3 },
  "2": { fill: 4, match: 4, mcq: [{ questions: 1, choices: 8 }, { questions: 2, choices: 2 }], open: 1 },
  "3": { fill: 2, match: 2, mcq: [{ questions: 1, choices: 4 }], open: 1 },
  "4": { fill: 4, match: 4, mcq: [{ questions: 2, choices: 2 }], open: 2 }
};

// trigger preview
document.getElementById("words")
  .addEventListener("input", debounce(preview, 500));

document.getElementById("title")
  .addEventListener("input", (e) => {
    window.worksheetState.title = e.target.value;
    debounce(preview, 500)();
  });

window.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("load");
  if (!id) return;
  if (window.API_BASE === "bingo") loadBingo(id);
  if (window.API_BASE === "worksheet") openWorksheet(id);
  if (window.API_BASE === "flashcards") loadFlashcard(id);
});

document.querySelectorAll("#matching, #mcq, #fill")
  .forEach(el => el.addEventListener("change", debounce(preview, 500)));

function getCurrentLayout() {
  return document.querySelector(".layout-option.selected")?.dataset.layout || "4";
}

function toggleDashboard() {
  const el = document.getElementById("dashboard");
  el.classList.toggle("hidden");
  if (!el.classList.contains("hidden")) {
    loadWorksheets();
  }
}

async function saveWorksheet() {
  const state = window.worksheetState;
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    alert("You must be logged in to save worksheets.");
    return;
  }
  const { data: { session } } = await supabaseClient.auth.getSession();
  const res = await fetch(`${BASE_URL}/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      title: state.title,
      type: "worksheet",
      data: state,
      user_id: user.id
    })
  });
  if (!res.ok) {
    const errorData = await res.json();
    if (res.status === 403) {
      showUpgradeModal("save");
    } else {
      alert(errorData.error || "Save failed");
    }
    return;
  }
  alert("Worksheet saved successfully!");
}

async function loadWorksheets() { 
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    alert("You must be logged in to load worksheets.");
    return;
  }
  const res = await fetch(`${BASE_URL}/worksheets?user_id=${user.id}&type=worksheet`);
  const data = await res.json();
  const container = document.getElementById("worksheetsList");
  container.innerHTML = data.map(w => `
    <div class="worksheet-item">
      <div class="worksheet-info">
        <strong>${w.title}</strong>
        <span class="worksheet-date">
          ${new Date(w.created_at).toLocaleString()}
        </span>
      </div>
      <div style="display:flex; gap:6px;">
        <button class="btn secondary" onclick="openWorksheet('${w.id}')">
          Open
        </button>
        <button class="btn danger" onclick="deleteWorksheet('${w.id}')">
          Delete
        </button>
      </div>
    </div>
  `).join('')
}

async function openWorksheet(id) {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const res = await fetch(`${BASE_URL}/worksheets/${id}?user_id=${user.id}`);
  const data = await res.json();
  window.worksheetState = data.data;
  document.getElementById("title").value = window.worksheetState.title;
  document.querySelectorAll(".layout-option").forEach(o => o.classList.remove("selected"));
  const el = document.querySelector(`.layout-option[data-layout="${window.worksheetState.layout}"]`);
  if (el) el.classList.add("selected");
  // FORCE CUSTOM MODE
  const customRadio = document.querySelector('input[name="mode"][value="custom"]');
  if (customRadio) customRadio.checked = true;
  // update UI
  updateModeUI();
  renderFromState();
}

async function deleteWorksheet(id) {
  const confirmed = confirm("Delete this worksheet?");
  if (!confirmed) return;
  const { data: { user } } = await supabaseClient.auth.getUser();
  await fetch(`${BASE_URL}/worksheets/${id}?user_id=${user.id}`, {
    method: "DELETE"
  });
  loadWorksheets();
}

function checkLimits(ex) {
  const layout = window.worksheetState.layout;
  const limits = LIMITS[layout];
  if (!limits) return null;
  if (ex.type === "fill" && ex.questions.length > limits.fill) {
    return `For the selected layout, you can only have up to ${limits.fill} fill-in-the-blank questions.`;
  }
  if (ex.type === "matching" && ex.pairs.length > limits.match) {
    return `For the selected layout, you can only have up to ${limits.match} matching pairs.`;
  }
  if (ex.type === "mcq") {
    const configs = limits.mcq;
    const isValid = configs.some(config => {
      //check questions
      if (ex.questions.length > config.questions) return false;
      //check choices for each question
      return ex.questions.every(q => q.choices.length <= config.choices);
    });
    if (!isValid) {
      return `For the selected layout, your MCQ questions must fit one of these configurations: ${configs.map(c => `${c.questions} questions x ${c.choices} choices`).join(" OR ")}`;
    }
  }
  if (ex.type === "open" && ex.questions.length > limits.open) {
    return `For the selected layout, you can only have up to ${limits.open} open questions.`;
  }

  return null;
}

function showFontPicker() {
  const fonts = [
    "font-default",
    "font-handwriting",
    "font-school",
    "font-fun",
    "font-round",
    "font-soft",
    "font-bubble",
    "font-playful",
    "font-crazy"
  ];
  const picker = document.createElement("div");
  picker.id = "fontPicker";
  picker.innerHTML = fonts.map(font => `
    <div class="font-option ${font}" data-font="${font}">The cat is big.</div>
  `).join("");
  document.body.appendChild(picker);
  picker.querySelectorAll(".font-option").forEach(opt => {
    opt.onclick = () => {
      window.worksheetState.font = opt.dataset.font;
      //highlight selection
      picker.querySelectorAll(".font-option").forEach(o => o.classList.remove("active"));
      opt.classList.add("active");
      const previewEl = document.getElementById("preview");
      previewEl.classList.remove(...fonts);
      previewEl.classList.add(opt.dataset.font);
      //document.body.removeChild(picker);
    }
  });
  function handleOutsideClick(e) {
    if (!picker.contains(e.target)) {
      picker.remove();
      document.removeEventListener("click", handleOutsideClick);
    }
  }
  setTimeout(() => {
    document.addEventListener("click", handleOutsideClick);
  }, 0);
}

function exitBorderMode() {
  window.borderMode.active = false;
  window.borderMode.style = null;
  document.body.classList.remove("border-mode");
}

function showBorderPicker() {
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
      window.borderMode.active = true;
      window.borderMode.style = opt.dataset.style;
      //highlight selection
      picker.querySelectorAll(".border-option").forEach(o => o.classList.remove("active"));
      opt.classList.add("active");
      document.body.classList.add("border-mode");
    }
  });
  function handleOutsideClick(e) {
    if (!picker.contains(e.target)) {
      picker.remove();
      exitBorderMode();
      document.removeEventListener("click", handleOutsideClick);
    }
  }
  setTimeout(() => {
    document.addEventListener("click", handleOutsideClick);
  }, 0);
}     

function updateModeUI() {
  const mode = document.querySelector('input[name="mode"]:checked')?.value;
  const auto = document.getElementById("auto-settings");
  const autoWords = document.getElementById("auto-settings-words");
  const custom = document.getElementById("custom-settings");
  const decorations = document.getElementById("decorations");
  if (mode === "custom") {
    auto.style.display = "none";
    autoWords.style.display = "none";
    custom.style.display = "block";
    decorations.style.display = "block";

  } else {
    auto.style.display = "block";
    autoWords.style.display = "block";
    custom.style.display = "none";
    decorations.style.display = "none";
  }
  if (mode === "custom" && window.worksheetState.exercises.length === 0) {
    preview().then(() => {
      initializeStateFromPreview();
    });
  }
}

function attachBorderHover() {
  document.querySelectorAll(".exercise-card").forEach((card, index) => {
    card.onmouseenter = () => {
      if (!window.borderMode.active) return;
      const style = window.borderMode.style || "border-classic";
      card.classList.add("border-preview", style);
    };
    card.onmouseleave = () => {
      if (!window.borderMode.active) return;
      const style = window.borderMode.style || "border-classic";
      card.classList.remove("border-preview", style);
    };
  });
}

function attachBorderApply() {
  document.querySelectorAll(".exercise-card").forEach((card, index) => {
    card.onclick = (e) => {
      if (!window.borderMode.active) return;
      e.stopPropagation();
      const style = window.borderMode.style || "border-classic";
      window.worksheetState.exercises[index].borderStyle = style;
      exitBorderMode();
      renderFromState();
    };
  });
}

function attachQuestionControls() {
  document.querySelectorAll(".exercise-card").forEach((card) => {
    const addBtn = card.querySelector(".add-question");
    if (addBtn) {
      addBtn.onclick = () => {
        const realIndex = parseInt(card.dataset.index);
        const ex = window.worksheetState.exercises[realIndex];
        if (ex.type === "fill") {
          ex.questions.push({
            sentence: "New sentence ______.",
            image: null
          });
        }
        if (ex.type === "mcq") {
          const layout = getCurrentLayout();
          const defaultChoices = LIMITS[layout].mcq[0].choices; // get choices from limits config
          ex.questions.push({
            question: `Question ${ex.questions.length + 1}`,
            choices: Array.from({ length: defaultChoices }, (_, i) => `Option ${i + 1}`)
          });
        }
        if (ex.type === "open") {
          ex.questions.push({
            question: `Question ${ex.questions.length + 1}`,
            image: null
          });
        }
        //Check limits
        const warning = checkLimits(ex);
        if (warning) {
          alert(warning);
          //revert changes
          ex.questions.pop();
          return;
        }
        renderFromState();
      };
    }
  });
}

function attachCardControls() {
  const cards = Array.from(document.querySelectorAll(".exercise-card"));
  cards.forEach((card, index) => {
    const delBtn = card.querySelector(".delete-card");
    const dupBtn = card.querySelector(".duplicate-card");
    if (delBtn) {
      delBtn.onclick = () => {
        window.worksheetState.exercises.splice(index, 1);
        renderFromState();
      };
    }
    if (dupBtn) {
      dupBtn.onclick = () => {
        const copy = JSON.parse(JSON.stringify(window.worksheetState.exercises[index]));
        window.worksheetState.exercises.splice(index + 1, 0, copy);
        renderFromState();
      };
    }
  });
}

function attachEditableHandlers() {
  document.querySelectorAll("[data-editable]").forEach((el, index) => {
    el.setAttribute("contenteditable", "true");
    el.addEventListener("input", () => {
      updateStateText(index, el.textContent);
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") e.preventDefault();
    });
  });
}

function attachDeleteQuestion() {
  document.querySelectorAll(".exercise-card").forEach((card) => {
    const realIndex = parseInt(card.dataset.index);
    const ex = window.worksheetState.exercises[realIndex];
    const questions = card.querySelectorAll(".fill-question, .mcq-question, .open-question");
    questions.forEach((qEl, qIndex) => {
      const btn = qEl.querySelector(".delete-question");
      if (btn) {
        btn.onclick = () => {
          if (!ex) return;
          ex.questions.splice(qIndex, 1);
          if (ex.questions.length === 0) {
            if (ex.type === "fill") {
              ex.questions.push({
                sentence: "New sentence ______.",
                image: null
              });
            }
            if (ex.type === "mcq") {
              ex.questions.push({
                question: `Question 1`,
                choices: ["Option 1", "Option 2"]
              });
            }
            if (ex.type === "open") {
              ex.questions.push({
                question: `Question 1`,
                image: null
              });
            }
          }
          renderFromState();
        };
      }
    });
  });
}

function attachQuestionSorting() {
  document.querySelectorAll(".exercise-card").forEach((card, cardIndex) => {
    const container = card.querySelector(".questions-container");
    if (!container) return;
    Sortable.create(container, {
      animation: 150,
      draggable: ".fill-question",
      onEnd: (evt) => {
        const ex = window.worksheetState.exercises[cardIndex];
        if (!ex || ex.type !== "fill") return;
        const moved = ex.questions.splice(evt.oldIndex, 1)[0];
        ex.questions.splice(evt.newIndex, 0, moved);
        renderFromState();
      }
    });
  });
}

function attachImagePicker() {
  document.querySelectorAll(".exercise-card").forEach((card, cardIndex) => {
    const questions = card.querySelectorAll(".fill-question, .mcq-question, .open-question");
    questions.forEach((qEl, qIndex) => {
      const imgContainer = qEl.querySelector("[data-image]");
      if (!imgContainer) return;
      imgContainer.onclick = async () => {
        const ex = window.worksheetState.exercises[cardIndex];
        const question = ex?.questions[qIndex];
        if (!question) return;
        showImagePicker([], "", imgContainer, (selectedImage) => {
          question.image = selectedImage;
          renderFromState();
        }, {allowSearch: true, allowUpload: true});
      };
    });
    // MATCHING EXERCISE IMAGE PICKER
    const ex = window.worksheetState.exercises[cardIndex];
    if (ex?.type === "matching") {
      const rows = card.querySelectorAll(".matching-row");
      rows.forEach((row, pairIndex) => {
        const imgContainer = row.querySelector("[data-image]");
        if (!imgContainer) return;
        imgContainer.onclick = () => {
          const pair = ex.pairs?.[pairIndex];
          if (!pair) return;
          showImagePicker([], "", imgContainer, (selectedImage) => {
            pair.image = selectedImage;
            renderFromState();
          }, { allowSearch: true, allowUpload: true });
        };
      });
    }
  });
}

function attachMCQControls() {
  document.querySelectorAll(".exercise-card").forEach((card, cardIndex) => {
    const ex = window.worksheetState.exercises[cardIndex];
    if (!ex || ex.type !== "mcq") return;
    const questions = card.querySelectorAll(".mcq-question");
    questions.forEach((qEl, qIndex) => {
      // ADD CHOICE
      const addBtn = qEl.querySelector(".add-choice");
      if (addBtn) {
        addBtn.onclick = () => {
          ex.questions[qIndex].choices.push("New choice");
          //Check limits
          const warning = checkLimits(ex);
          if (warning) {
            alert(warning);
            ex.questions[qIndex].choices.pop();
            return;
          }
          renderFromState();
        };
      }
      // DELETE CHOICE
      const choiceEls = qEl.querySelectorAll(".mcq-choice");
      choiceEls.forEach((choiceEl, choiceIndex) => {
        const delBtn = choiceEl.querySelector(".delete-choice");
        if (delBtn) {
          delBtn.onclick = () => {
            const choices = ex.questions[qIndex].choices;
            choices.splice(choiceIndex, 1);
            // prevent empty list
            if (choices.length === 0) {
              choices.push("New choice");
            }
            renderFromState();
          };
        }
      });
    });
  });
}

function attachMCQSorting() {
  document.querySelectorAll(".exercise-card").forEach((card, cardIndex) => {
    const ex = window.worksheetState.exercises[cardIndex];
    if (!ex || ex.type !== "mcq") return;
    const questionEls = card.querySelectorAll(".mcq-question");
    questionEls.forEach((qEl, qIndex) => {
      const container = qEl.querySelector(".mcq-choices");
      if (!container) return;
      Sortable.create(container, {
        animation: 150,
        draggable: ".mcq-choice",
        onEnd: (evt) => {
          const choices = ex.questions[qIndex].choices;
          const moved = choices.splice(evt.oldIndex, 1)[0];
          choices.splice(evt.newIndex, 0, moved);
          renderFromState();
        }
      });
    });
  });
}

function attachMatchingControls() {
  document.querySelectorAll(".exercise-card").forEach((card, cardIndex) => {
    const ex = window.worksheetState.exercises[cardIndex];
    if (!ex || ex.type !== "matching") return;
    const rows = card.querySelectorAll(".matching-row");
    // ADD PAIR
    const addBtn = card.querySelector(".add-pair");
    if (addBtn) {
      addBtn.onclick = () => {
        ex.pairs.push({ word: "New", image: null });
        //Check limits
        const warning = checkLimits(ex);
        if (warning) {
          alert(warning);
          ex.pairs.pop();
          return;
        }
        renderFromState();
      };
    }
    // DELETE PAIR
    rows.forEach((row, pairIndex) => {
      const btn = row.querySelector(".delete-pair");
      if (btn) {
        btn.onclick = () => {
          ex.pairs.splice(pairIndex, 1);
          if (ex.pairs.length === 0) {
            ex.pairs.push({ word: "New", image: null });
          }
          renderFromState();
        };
      }
    });
  });
}

function attachMatchingSorting() {
  document.querySelectorAll(".exercise-card").forEach((card, cardIndex) => {
    const ex = window.worksheetState.exercises[cardIndex];
    if (!ex || ex.type !== "matching") return;
    const container = card.querySelector(".matching-container");
    if (!container) return;
    Sortable.create(container, {
      animation: 150,
      draggable: ".matching-row",
      onEnd: (evt) => {
        const moved = ex.pairs.splice(evt.oldIndex, 1)[0];
        ex.pairs.splice(evt.newIndex, 0, moved);
        renderFromState();
      }
    });
  });
}

function attachOpenSorting() {
  document.querySelectorAll(".exercise-card").forEach((card, cardIndex) => {
    const ex = window.worksheetState.exercises[cardIndex];
    if (!ex || ex.type !== "open") return;
    const container = card.querySelector(".questions-container");
    if (!container) return;
    Sortable.create(container, {
      animation: 150,
      draggable: ".open-question",
      onEnd: (evt) => {
        const moved = ex.questions.splice(evt.oldIndex, 1)[0];
        ex.questions.splice(evt.newIndex, 0, moved);
        renderFromState();
      }
    });
  });
}

function attachStickerDrag() {
  document.querySelectorAll(".sticker-wrapper").forEach(sticker => {
    sticker.onmousedown = (e) => {
      e.preventDefault();
      if (e.target.closest(".resize-handle") || e.target.closest(".rotate-handle")) {
        return;
      }
      const startX = e.clientX;
      const startY = e.clientY;
      const initialLeft = sticker.offsetLeft;
      const initialTop = sticker.offsetTop;
      function onMouseMove(e) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const x = initialLeft + dx;
        const y = initialTop + dy;
        sticker.style.left = x + "px";
        sticker.style.top = y + "px";
      }
      function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        const index = sticker.dataset.index;
        window.worksheetState.stickers[index].x = parseInt(sticker.style.left);
        window.worksheetState.stickers[index].y = parseInt(sticker.style.top);
      }
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };
  });
}

function attachStickerResize() {
  document.querySelectorAll(".sticker-wrapper").forEach(sticker => {
    const handle = sticker.querySelector(".resize-handle");
    if (!handle) return;
    handle.onmousedown = (e) => {
      e.stopPropagation();
      document.body.style.userSelect = "none";
      const startX = e.clientX;
      const startWidth = sticker.offsetWidth;
      function onMouseMove(e) {
        const dx = e.clientX - startX;
        let newWidth = startWidth + dx;
        // Set limits
        newWidth = Math.max(30, Math.min(300, newWidth));
        sticker.style.width = newWidth + "px";
        sticker.style.height = newWidth + "px"; //keep square
      }
      function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.userSelect = "";
        const index = sticker.dataset.index;
        window.worksheetState.stickers[index].width = parseInt(sticker.style.width);
        window.worksheetState.stickers[index].height = parseInt(sticker.style.height);
      }
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };
  });
}

function attachStickerRotate() {
  document.querySelectorAll(".sticker-wrapper").forEach(sticker => {
    const handle = sticker.querySelector(".rotate-handle");
    if (!handle) return;
    handle.onmousedown = (e) => {
      e.stopPropagation();
      document.body.style.userSelect = "none";
      const rect = sticker.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
      const index = sticker.dataset.index;
      const initialRotation = window.worksheetState.stickers[index].rotation || 0;
      let currentRotation = initialRotation;
      function onMouseMove(e) {
        const currentAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
        currentRotation = initialRotation + (currentAngle - startAngle);
        // normalize
        if (currentRotation > 180) currentRotation -= 360;
        if (currentRotation < -180) currentRotation += 360;
        sticker.style.transform = `rotate(${currentRotation}deg)`;
      }
      function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.userSelect = "";
        window.worksheetState.stickers[index].rotation = currentRotation;
      }
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };
  });
}   

function attachStickerDelete() {
  document.querySelectorAll(".sticker-wrapper").forEach(sticker => {
    const btn = sticker.querySelector(".sticker-delete");
    if (!btn) return;
    btn.onclick = (e) => {
      e.stopPropagation();
      const index = sticker.dataset.index;
      window.worksheetState.stickers.splice(index, 1);
      renderFromState();
    };
  });
}

function getPageData() {
  const base = getFormData();
  const mode = document.querySelector('input[name="mode"]:checked')?.value || "auto";
  const customText = document.getElementById("customInput")?.value || "";

  return {
    ...base,
    mode,
    customText,
    matching: document.getElementById("matching")?.checked || false,
    mcq: document.getElementById("mcq")?.checked || false,
    fill: document.getElementById("fill")?.checked || false,
    layout: window.worksheetState.layout,
    font: window.worksheetState.font,
  };
}

document.querySelectorAll(".layout-option").forEach(option => {
  option.addEventListener("click", () => {
    document.querySelectorAll(".layout-option")
      .forEach(o => o.classList.remove("selected"));
    option.classList.add("selected");
    window.worksheetState.layout = option.dataset.layout;
    preview(); // update instantly
  });
});

document.querySelectorAll('input[name="mode"]').forEach(radio => {
  radio.addEventListener("change", async () => {
    const mode = document.querySelector('input[name="mode"]:checked')?.value || "auto";
    if (mode === "custom") {
      await preview();
      if (window.globalImageMap) {
        convertAutoToCustom();
      }
    }
    updateModeUI();
    preview(); // update instantly
  });
});

// Events for adding the custom exercises
document.getElementById("addFill").addEventListener("click", () => {
  window.worksheetState.exercises.push({
    type: "fill",
    questions: [
      {
        sentence: "I see a ______.",
        image: null
      }
    ]
  });
  if (window.worksheetState.currentPage === undefined) {
    window.worksheetState.currentPage = 0;
  }
  renderFromState();
});

document.getElementById("addMCQ").addEventListener("click", () => {
  window.worksheetState.exercises.push({
    type: "mcq",
    questions: [
      {
        question: "What is this?",
        choices: ["dog", "cat"],
        image: null
      }
    ]
  });
  if (window.worksheetState.currentPage === undefined) {
    window.worksheetState.currentPage = 0;
  }
  renderFromState();
});

document.getElementById("addMatching").addEventListener("click", () => {
  window.worksheetState.exercises.push({
    type: "matching",
    pairs: [
      { word: "dog", image: null },
      { word: "cat", image: null }
    ]
  });
  if (window.worksheetState.currentPage === undefined) {
    window.worksheetState.currentPage = 0;
  }
  renderFromState();
});

document.getElementById("addOpenQuestion").addEventListener("click", () => {
  window.worksheetState.exercises.push({
    type: "open",
    questions: [
      { 
        question: "Write your question here.",
        image: null 
      }
    ]
  });
  if (window.worksheetState.currentPage === undefined) {
    window.worksheetState.currentPage = 0;
  }
  renderFromState();
});

// Add sticker button event
document.getElementById("addSticker").addEventListener("click", () => {
  showStickerPicker();
});

//Add border button event
document.getElementById("addBorder").addEventListener("click", () => {
  showBorderPicker();
});

// Add font button event
document.getElementById("addFont").addEventListener("click", () => {
  showFontPicker();
});

function showStickerPicker() {
  let picker = document.getElementById("stickerPicker");
  if (!picker) {
    picker = document.createElement("div");
    picker.id = "stickerPicker";
    picker.onclick = (e) => {
      e.stopPropagation();
    }
    document.body.appendChild(picker);
  }
  let currentCategory = "People";
  function renderPicker() {
    picker.innerHTML = `
      <div class="sticker-tabs">
        ${Object.keys(STICKERS).map(cat => `
          <button class="sticker-tab ${cat === currentCategory ? "active" : ""}" data-cat="${cat}">
            ${cat}
          </button>
        `).join("")}
      </div>
      <div class="sticker-grid">
        ${STICKERS[currentCategory].map(src => `
          <img src="${src}" class="sticker-option"/>
        `).join("")}
      </div>
    `;
    // Tab click
    picker.querySelectorAll(".sticker-tab").forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        currentCategory = btn.dataset.cat;
        renderPicker();
      };
    });
    // Sticker click
    picker.querySelectorAll(".sticker-option").forEach(img => {
      img.onmousedown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const ghost = document.createElement("img");
        ghost.src = img.src;
        ghost.style.position = "fixed";
        ghost.style.pointerEvents = "none";
        ghost.style.zIndex = "9999";
        document.body.appendChild(ghost);
        function onmousemove(e) {
          ghost.style.left = e.clientX + "px";
          ghost.style.top = e.clientY + "px";
        };
        function onmouseup(e) {
          document.removeEventListener("mousemove", onmousemove);
          document.removeEventListener("mouseup", onmouseup);
          ghost.remove();
          const preview = document.getElementById("preview");
          const rect = preview.getBoundingClientRect();
          //check if dropped inside preview
          if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
            window.worksheetState.stickers.push({
              id: crypto.randomUUID(),
              src: img.src,
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
              rotation: 0,
              pageIndex: window.worksheetState.currentPage,
            });
            renderFromState();
          }
        };
        document.addEventListener("mousemove", onmousemove);
        document.addEventListener("mouseup", onmouseup);
      };
    });
  }
  renderPicker();
  picker.style.display = "block";
  setTimeout(() => {
    function handleOutsideClick(e) {
      const button = document.getElementById("addSticker");
      if (!picker.contains(e.target) && !button.contains(e.target)) {
        picker.style.display = "none";
        document.removeEventListener("click", handleOutsideClick);
      }
    }
    document.addEventListener("click", handleOutsideClick);
  }, 0);
}

function convertAutoToCustom() {
  const data = getPageData();
  const exercises = [];
  //Matching
  if (data.matching) {
    const pairs = (data.words || []).map(word => ({
      word,
      image: window.globalImageMap?.[word] || null
    }));
    exercises.push({
      type: "matching",
      pairs
    });
  }
  // MCQ
  if (data.mcq) {
    const questions = (data.words || []).slice(0, 3).map(word => ({
      question: "What is this?",
      choices: [word],
      image: window.globalImageMap?.[word] || null
    }));
    exercises.push({
      type: "mcq",
      questions
    });
  }
  // FILL
  if (data.fill) {
    const questions = (data.words || []).map(word => ({
      sentence: "This is a ______.",
      image: window.globalImageMap?.[word] || null
    }));
    exercises.push({
      type: "fill",
      questions
    });
  }
  window.worksheetState.exercises = exercises;
}