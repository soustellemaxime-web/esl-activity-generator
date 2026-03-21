window.API_BASE = "worksheet";

// trigger preview
document.getElementById("words")
  .addEventListener("input", debounce(preview, 500));

document.querySelectorAll("#matching, #mcq, #fill")
  .forEach(el => el.addEventListener("change", debounce(preview, 500)));

function getPageData() {
  const base = getFormData();

  return {
    ...base,
    matching: document.getElementById("matching")?.checked || false,
    mcq: document.getElementById("mcq")?.checked || false,
    fill: document.getElementById("fill")?.checked || false
  };
}