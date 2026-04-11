let currentStep = 0;

function startTutorial(feature = "flashcards") {
  document.body.classList.add("tutorial-active");
  currentStep = 0;
  showStep(feature);
}

async function showStep(feature) {
  // REMOVE previous target
  document.querySelectorAll(".tutorial-target").forEach(el => {
    el.classList.remove("tutorial-target");
    el.style.pointerEvents = "";
    el.style.zIndex = "";
  });
  const step = tutorialSteps[feature][currentStep];
  // INTRO STEP (no highlight)
  if (step.type === "intro" || step.type === "outro") {
    showTutorialBox(step, document.body);
    return;
  }
  let el;
  if (step.index !== undefined) {
    const elements = document.querySelectorAll(step.element);
    el = elements[step.index];
  } else {
    el = document.querySelector(step.element);
  }
  if (!el) return;
  // AUTO ACTION FIRST
  if (step.action) {
    step.action();
  }
  // WAIT if needed
  let targetEl = el;
  if (step.waitForVisible) {
    try {
      targetEl = await waitForElementVisible(step);
    } catch (e) {
      console.warn(e);
    }
  }
  // AUTO INPUT
  if (step.autoInput) {
    targetEl.value = step.autoInput;
    targetEl.dispatchEvent(new Event("input"));
  }
  if (step.hint) {
    const wrapper = targetEl.parentElement;
    if (wrapper) {
      // Force layout first
      targetEl.offsetHeight;
      wrapper.dataset.hint = step.hint;
      wrapper.classList.add("tutorial-hint-input");
    }
  }
  // WAIT FOR INPUT
  if (step.waitForInput) {
    const handler = () => {
      const lines = targetEl.value
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean);
      const lastWord = lines[lines.length - 1]?.toLowerCase();
      // Check expected word
      if (step.expectedInput) {
        if (lastWord === step.expectedInput.toLowerCase()) {
          targetEl.removeEventListener("input", handler);
          nextStep(feature);
        }
      } else {
        // fallback (basic behavior)
        if (lines.length >= 2) {
          targetEl.removeEventListener("input", handler);
          nextStep(feature);
        }
      }
    };
    targetEl.addEventListener("input", handler);
  }
  // WAIT FOR SELECT CHANGE
  if (step.waitForChange) {
    const handler = () => {
      const value = targetEl.value;
      if (step.expectedValue) {
        if (value === step.expectedValue) {
          targetEl.removeEventListener("change", handler);
          nextStep(feature);
        }
      } else {
        targetEl.removeEventListener("change", handler);
        nextStep(feature);
      }
    };
    targetEl.addEventListener("change", handler);
  }
  // Highlight
  highlightElement(targetEl, step);
  showTutorialBox(step, targetEl);
  // Wait for click if needed
  if (step.waitForClick) {
    const handler = (e) => {
      if (!targetEl.contains(e.target)) return;
      targetEl.removeEventListener("click", handler);
      // wait for next UI to appear
      setTimeout(() => {
        nextStep(feature);
      }, 100); // slight delay for async UI
    };
    targetEl.addEventListener("click", handler);
  }
}

function nextStep(feature) {
  currentStep++;
  if (currentStep >= tutorialSteps[feature].length) {
    endTutorial();
    return;
  }
  showStep(feature);
}

function endTutorial() {
  document.body.classList.remove("tutorial-active");
  const overlay = document.getElementById("tutorial-overlay");
  const box = document.getElementById("tutorial-box");
  const highlight = document.getElementById("tutorial-highlight");
  [overlay, box, highlight].forEach(el => {
    if (el) {
      el.classList.add("tutorial-fade-out");
      setTimeout(() => el.remove(), 200);
    }
  });
}

function highlightElement(el, step = {}) {
  const rect = el.getBoundingClientRect();
  const padding = step.padding || 6;
  const offsetX = step.offsetX || 0;
  const offsetY = step.offsetY || 0;
  let highlight = document.getElementById("tutorial-highlight");
  if (!highlight) {
    highlight = document.createElement("div");
    highlight.id = "tutorial-highlight";
    document.body.appendChild(highlight);
  }
  el.classList.add("tutorial-target");  
  highlight.style.top = rect.top + window.scrollY - padding + offsetY + "px";
  highlight.style.left = rect.left + window.scrollX - padding + offsetX + "px";
  highlight.style.width = rect.width + padding * 2 + "px";
  highlight.style.height = rect.height + padding * 2 + "px";
  highlight.style.pointerEvents = "none";
}

function showTutorialBox(step, el) {
  let box = document.getElementById("tutorial-box");
  if (!box) {
    box = document.createElement("div");
    box.id = "tutorial-box";
    document.body.appendChild(box);
  }
  box.innerHTML = `
    <div class="tutorial-topbar">
      <button id="tutorial-lang-btn" class="tutorial-lang-btn">
        🌍
      </button>
    </div>
    <p ${step.textKey ? `data-i18n="${step.textKey}"` : ""}>
      ${step.text || ""}
    </p>
    <div class="tutorial-actions">
      ${
        step.type === "outro"
          ? `<button id="tutorial-finish" data-i18n="tutorial_finish"></button>`
          : (step.waitForClick || step.waitForInput || step.waitForChange)
          ? `<span class="tutorial-hint" data-i18n="${
              step.waitForInput
                ? "tutorial_hint_type"
                : step.waitForChange
                ? "tutorial_hint_select"
                : "tutorial_hint_click"
            }"></span>`
          : `<button id="tutorial-next" data-i18n="tutorial_next"></button>`
      }
      <button id="tutorial-skip" data-i18n="tutorial_skip"></button>
    </div>
  `;
  const langBtn = document.getElementById("tutorial-lang-btn");
  if (langBtn) {
    langBtn.onclick = () => {
      toggleLanguage();
      applyTranslations(currentLang);
    };
  }
  // INTRO STEP → CENTER ONLY
  if (step.type === "intro" || step.type === "outro") {
    box.style.top = "50%";
    box.style.left = "50%";
    box.style.transform = "translate(-50%, -50%)";
  } else {
    box.style.transform = "";
    const rect = el.getBoundingClientRect();
    const padding = 12;
    let top = rect.bottom + window.scrollY + padding;
    let left = rect.left + window.scrollX;
    if (top + 120 > window.innerHeight + window.scrollY) {
      top = rect.top + window.scrollY - 120;
    }
    if (left + 260 > window.innerWidth) {
      left = window.innerWidth - 270;
    }
    box.style.top = top + "px";
    box.style.left = left + "px";
  }
  if (step.type === "outro") {
    box.classList.add("outro");
  } else {
    box.classList.remove("outro");
  }
  const finishBtn = document.getElementById("tutorial-finish");
  if (finishBtn) {
    finishBtn.onclick = endTutorial;
  }
  const nextBtn = document.getElementById("tutorial-next");
  if (nextBtn) {
    nextBtn.onclick = () => nextStep(window.API_BASE);
  }
  document.getElementById("tutorial-skip").onclick = endTutorial;
  applyTranslations(currentLang);
}

function waitForElementVisible(step, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function check() {
      let el;
      if (step.index !== undefined) {
        const elements = document.querySelectorAll(step.element);
        el = elements[step.index];
      } else {
        el = document.querySelector(step.element);
      }
      if (el && el.offsetParent !== null) {
        resolve(el);
      } else if (Date.now() - start > timeout) {
        reject("Element not visible: " + step.element);
      } else {
        requestAnimationFrame(check);
      }
    }
    check();
  });
}

function initTutorial() {
  if (!localStorage.getItem("tutorialSeen")) {
    startTutorial(window.API_BASE);
    localStorage.setItem("tutorialSeen", "true");
  }
}

const replayBtn = document.getElementById("replayTutorialBtn");

if (replayBtn) {
  replayBtn.addEventListener("click", () => {
    startTutorial(window.API_BASE);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTutorial);
} else {
  initTutorial();
}