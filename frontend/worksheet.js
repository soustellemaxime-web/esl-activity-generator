window.API_BASE = "worksheet";
window.worksheetState = {
  exercises: [],
  font: "font-default",
};
window.borderMode = {
  active: false,
  style: null
};
const BASE_URL = "http://localhost:3000";

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

// trigger preview
document.getElementById("words")
  .addEventListener("input", debounce(preview, 500));

document.getElementById("title")
  .addEventListener("input", debounce(preview, 500));

document.querySelectorAll("#matching, #mcq, #fill, #wsearch, #sbuilding")
  .forEach(el => el.addEventListener("change", debounce(preview, 500)));

function showFontPicker() {
  const fonts = [
    "font-default", 
    "font-handwriting", 
    "font-school", 
    "font-kid",
    "font-fun",
  ];
  const picker = document.createElement("div");
  picker.id = "fontPicker";
  picker.innerHTML = fonts.map(font => `
    <div class="font-option ${font}" data-font="${font}">Aa Bb Cc</div>
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
  document.querySelectorAll(".exercise-card").forEach((card, cardIndex) => {
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
          ex.questions.push({
            question: "New question?",
            choices: ["Option 1", "Option 2", "Option 3"]
          });
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
  document.querySelectorAll(".exercise-card").forEach((card, cardIndex) => {
    const questions = card.querySelectorAll(".fill-question");
    questions.forEach((qEl, qIndex) => {
      const btn = qEl.querySelector(".delete-question");
      if (btn) {
        btn.onclick = () => {
          const ex = window.worksheetState.exercises[cardIndex];
          if (ex && ex.type === "fill") {
            ex.questions.splice(qIndex, 1);
            if (ex.questions.length === 0) {
              ex.questions.push({
                sentence: "New sentence ______.",
                image: null
              });
            }
            renderFromState();
          }
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
    const questions = card.querySelectorAll(".fill-question, .mcq-question");
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
  const selectedLayout =
  document.querySelector(".layout-option.selected")?.dataset.layout || "4";
  const mode = document.querySelector('input[name="mode"]:checked')?.value || "auto";
  const customText = document.getElementById("customInput")?.value || "";

  return {
    ...base,
    mode,
    customText,
    matching: document.getElementById("matching")?.checked || false,
    mcq: document.getElementById("mcq")?.checked || false,
    fill: document.getElementById("fill")?.checked || false,
    wsearch: document.getElementById("wsearch")?.checked || false,
    sbuilding: document.getElementById("sbuilding")?.checked || false,
    layout: selectedLayout,
    font: window.worksheetState.font,
  };
}

document.querySelectorAll(".layout-option").forEach(option => {
  option.addEventListener("click", () => {
    document.querySelectorAll(".layout-option")
      .forEach(o => o.classList.remove("selected"));
    option.classList.add("selected");
    preview(); // update instantly
  });
});

document.querySelectorAll('input[name="mode"]').forEach(radio => {
  radio.addEventListener("change", () => {
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
  renderFromState();
});

document.getElementById("addMCQ").addEventListener("click", () => {
  window.worksheetState.exercises.push({
    type: "mcq",
    questions: [
      {
        question: "What is this?",
        choices: ["dog", "cat", "bird"],
        image: null
      }
    ]
  });
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
      img.onclick = (e) => {
        e.stopPropagation();
        window.worksheetState.stickers.push({
          id: crypto.randomUUID(),
          src: img.src,
          x: 100,
          y: 100,
          width: 80,
          height: 80,
          rotation: 0
        });
        picker.style.display = "none";
        renderFromState();
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