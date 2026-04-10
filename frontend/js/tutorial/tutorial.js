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
  const el = document.querySelector(step.element);
  if (!el) return;
  // AUTO ACTION FIRST
  if (step.action) {
    step.action();
  }
  // WAIT if needed
  let targetEl = el;
  if (step.waitForVisible) {
    try {
      targetEl = await waitForElementVisible(step.element);
    } catch (e) {
      console.warn(e);
    }
  }
  // NOW highlight
  highlightElement(targetEl, step);
  showTutorialBox(step, targetEl);
  // WAIT FOR CLICK
  if (step.waitForClick) {
    const handler = () => {
      el.removeEventListener("click", handler);
      nextStep(feature);
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
  const rect = el.getBoundingClientRect();
  box.innerHTML = `
    <p>${step.text}</p>
    <div class="tutorial-actions">
      ${
        step.waitForClick
          ? `<span class="tutorial-hint">👉 Click the highlighted element to continue</span>`
          : `<button id="tutorial-next">Next →</button>`
      }
      <button id="tutorial-skip">Skip</button>
    </div>
  `;
  const padding = 12;
  // Default below
  let top = rect.bottom + window.scrollY + padding;
  let left = rect.left + window.scrollX;
  // If too low → show above
  if (top + 120 > window.innerHeight + window.scrollY) {
    top = rect.top + window.scrollY - 120;
  }
  // Prevent going off right
  if (left + 260 > window.innerWidth) {
    left = window.innerWidth - 270;
  }
  box.style.top = top + "px";
  box.style.left = left + "px";
  const nextBtn = document.getElementById("tutorial-next");
  if (nextBtn) {
    nextBtn.onclick = () => nextStep(window.API_BASE);
  }
  document.getElementById("tutorial-skip").onclick = endTutorial;
}

function waitForElementVisible(selector, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function check() {
      const el = document.querySelector(selector);
      if (el && el.offsetParent !== null) {
        resolve(el);
      } else if (Date.now() - start > timeout) {
        reject("Element not visible: " + selector);
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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTutorial);
} else {
  initTutorial();
}