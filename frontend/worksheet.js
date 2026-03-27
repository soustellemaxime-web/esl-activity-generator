window.API_BASE = "worksheet";
window.worksheetState = {
  exercises: []
};

// trigger preview
document.getElementById("words")
  .addEventListener("input", debounce(preview, 500));

document.getElementById("title")
  .addEventListener("input", debounce(preview, 500));

document.querySelectorAll("#matching, #mcq, #fill, #wsearch, #sbuilding")
  .forEach(el => el.addEventListener("change", debounce(preview, 500)));

function updateModeUI() {
  const mode = document.querySelector('input[name="mode"]:checked')?.value;
  const auto = document.getElementById("auto-settings");
  const autoWords = document.getElementById("auto-settings-words");
  const custom = document.getElementById("custom-settings");
  if (mode === "custom") {
    auto.style.display = "none";
    autoWords.style.display = "none";
    custom.style.display = "block";
  } else {
    auto.style.display = "block";
    autoWords.style.display = "block";
    custom.style.display = "none";
  }
  if (mode === "custom" && window.worksheetState.exercises.length === 0) {
    preview().then(() => {
      initializeStateFromPreview();
    });
  }
}

function attachQuestionControls() {
  document.querySelectorAll(".exercise-card").forEach((card, cardIndex) => {
    const addBtn = card.querySelector(".add-question");

    if (addBtn) {
      addBtn.onclick = () => {
        const ex = window.worksheetState.exercises[cardIndex];

        if (ex.type === "fill") {
          ex.questions.push({
            sentence: "New sentence ______.",
            image: null
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
  document.querySelectorAll(".sticker").forEach(sticker => {
    sticker.onmousedown = (e) => {
      e.preventDefault();
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
    layout: selectedLayout
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

const STICKERS = [
  "/assets/stickers/teacher.png",
  "/assets/stickers/studentboy.png",
  "/assets/stickers/studentgirl.png",
];

document.getElementById("addSticker").addEventListener("click", () => {
  const sticker = STICKERS[Math.floor(Math.random() * STICKERS.length)];
  window.worksheetState.stickers.push({
    src: sticker,
    x: 100,
    y: 100,
  });
  renderFromState();
});