window.API_BASE = "worksheet";
window.worksheetState = {
  exercises: []
};

// trigger preview
document.getElementById("words")
  .addEventListener("input", debounce(preview, 500));

document.querySelectorAll("#matching, #mcq, #fill, #wsearch, #sbuilding")
  .forEach(el => el.addEventListener("change", debounce(preview, 500)));

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