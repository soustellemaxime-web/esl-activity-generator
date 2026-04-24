let currentLang = localStorage.getItem("lang") || "en";

function updateLangButton() {
    const img = document.getElementById("langIcon");
    if (!img) return;
    img.src = currentLang === "en"
        ? "https://flagcdn.com/w20/th.png"
        : "https://flagcdn.com/w20/gb.png";
}

function applyTranslations(lang) {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = translations[lang][key] || key;
  });
}

function toggleLanguage() {
  currentLang = currentLang === "en" ? "th" : "en";
  localStorage.setItem("lang", currentLang);
  applyTranslations(currentLang);
  refreshLimitsUI();
  updateLangButton();
}

function t(key, vars = {}) {
  let text = translations[currentLang][key] || key;
  // replace variables like {{used}} {{limit}}
  Object.keys(vars).forEach(k => {
    text = text.replace(`{{${k}}}`, vars[k]);
  });
  return text;
}

const langBtn = document.getElementById("toggleLang");
if (langBtn) {
  langBtn.addEventListener("click", toggleLanguage);
}
applyTranslations(currentLang);
updateLangButton();