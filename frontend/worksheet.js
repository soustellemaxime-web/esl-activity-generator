window.API_BASE = "worksheet";
window.worksheetState = {
  exercises: []
};

// trigger preview
document.getElementById("words")
  .addEventListener("input", debounce(preview, 500));

document.querySelectorAll("#matching, #mcq, #fill, #wsearch, #sbuilding")
  .forEach(el => el.addEventListener("change", debounce(preview, 500)));

function updateModeUI() {
  const mode = document.querySelector('input[name="mode"]:checked')?.value;
  const auto = document.getElementById("auto-settings");
  const custom = document.getElementById("custom-settings");
  if (mode === "custom") {
    auto.style.display = "none";
    custom.style.display = "block";
  } else {
    auto.style.display = "block";
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
  document.querySelectorAll(".exercise-card").forEach((card) => {
    const index = Number(card.dataset.index);
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
    const questions = card.querySelectorAll(".fill-question");
    questions.forEach((qEl, qIndex) => {
      const imgContainer = qEl.querySelector("[data-image]");
      if (!imgContainer) return;
      imgContainer.onclick = async () => {
        const ex = window.worksheetState.exercises[cardIndex];
        const question = ex?.questions[qIndex];
        if (!question) return;
        // extract a basic word (temporary solution)
        let word = question.sentence
          .replace(/\d+\.\s*/, "")   // remove "1. "
          .replace("______", "")     // remove blank
          .trim();
        if (!word) word = "object";
        const res = await fetch(`http://localhost:3000/api/images?word=${word}&t=${Date.now()}`);
        const data = await res.json();
        if (!data.images || data.images.length === 0) return;
        showImagePicker(data.images, word, imgContainer, (selectedImage) => {
          question.image = selectedImage;
          renderFromState();
        });
      };
    });
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