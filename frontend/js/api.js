function needsImages(data) {
    return data.displayMode !== "text" || data.matching || data.mcq || data.fill;
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

async function renderFromState() {
  const data = getPageData();
  data.customExercises = window.worksheetState.exercises;
  const res = await fetch(`http://localhost:3000/api/worksheet/preview`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data)
  });
  const html = await res.text();
  document.getElementById("preview").innerHTML = html;
  attachEditableHandlers();
  attachCardControls();
}

function initializeStateFromPreview() {
    const state = [];
    document.querySelectorAll(".exercise-card").forEach(card => {
        const type = card.dataset.type;
        if (type === "fill") {
            const questions = [];
            card.querySelectorAll(".fill-question").forEach(q => {
                const sentence = q.querySelector("[data-editable]")?.textContent || "";
                const img = q.querySelector("img")?.src || null;
                questions.push({ sentence, image: img });
            });
            state.push({ type, questions });
        }
    });
    window.worksheetState.exercises = state;
}

function updateStateText(flatIndex, newText) {
    let count = 0;
    for (const ex of window.worksheetState.exercises) {
        if (ex.type === "fill") {
            for (let q of ex.questions) {
                if (count === flatIndex) {
                    q.sentence = newText;
                    return;
                }
                count++;
            }
        }
    }
}

async function preview() {
    const previewDiv = document.getElementById("preview");
    previewDiv.innerHTML = "";
    const scrollY = window.scrollY;
    previewDiv.innerHTML = `
    <div style="text-align:center; padding:20px;">
        ⏳ Generating ${window.API_BASE}...
    </div>
    `;

    const data = (typeof getPageData === "function")
    ? getPageData()
    : getFormData();

    if (needsImages(data)) {
    window.globalImageMap = await loadImages(data.words, window.globalImageMap);
    }

    data.imageMap = window.globalImageMap;
    const res = await fetch(`http://localhost:3000/api/${window.API_BASE}/preview`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
    })

    const html = await res.text()

    document.getElementById("preview").innerHTML = html;
    
    // make preview editable in custom mode
    if (data.mode === "custom") {
        attachEditableHandlers();
    }

    if (data.mode === "custom" && window.worksheetState.exercises.length === 0) {
        initializeStateFromPreview();
    }

    if (window.API_BASE === "worksheet") {
        const previewEl = document.getElementById("preview");
        previewEl.querySelectorAll(".page").forEach(page => {
            Sortable.create(page, {
            animation: 150,
            draggable: ".exercise-card"
            });
        });
    }

    if (data.mode === "custom") {
        attachCardControls();
    }
    window.scrollTo(0, scrollY);
}


async function download() {

    const btn = document.getElementById("downloadBtn");
    btn.disabled = true;
    btn.textContent = "⏳ Generating PDF...";

    try {
        const data = (typeof getPageData === "function")
        ? getPageData()
        : getFormData();

        if (needsImages(data)) {
        window.globalImageMap = await loadImages(data.words, window.globalImageMap);
        }

        data.imageMap = window.globalImageMap;

        if (window.API_BASE === "worksheet") {
            const previewEl = document.getElementById("preview");
            const ordered = [];
            previewEl.querySelectorAll(".exercise-card").forEach(card => {
                ordered.push(card.dataset.type);
            });
            data.exercises = ordered;
        }

        if (data.mode === "custom") {
            data.customExercises = window.worksheetState.exercises;
            data.exercises = [];
        }
            
        const res = await fetch(`http://localhost:3000/api/${window.API_BASE}/generate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
        })

        const blob = await res.blob()

        const url = window.URL.createObjectURL(blob)

        const a = document.createElement("a")
        a.href = url
        a.download = `${window.API_BASE}.pdf`
        a.click()
    } catch (err) {
    console.error(err);
    }
    btn.disabled = false;
    btn.textContent = "⬇️ Download PDF";
}