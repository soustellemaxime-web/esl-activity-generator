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