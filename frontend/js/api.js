window.API_URL = window.location.hostname 
    === "localhost" 
    ? "http://localhost:3000" 
    : window.location.origin;
    
const { createClient } = window.supabase;
const supabaseClient = createClient(
    "https://bqgvquzfsoqjygguuamb.supabase.co", 
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZ3ZxdXpmc29xanlnZ3V1YW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMDc5ODQsImV4cCI6MjA5MDU4Mzk4NH0.uULf9SpNQ3rFtfNHZ2ulmJESQB3Eum3lMTRFleff4X8"
);

async function checkUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const authEl = document.getElementById("auth");
    const logoutBtn = document.getElementById("logoutBtn");
    if (user) {
        if (authEl) {
            authEl.style.display = "none";
        }
        if (logoutBtn) {
            logoutBtn.style.display = "block";
        }
    }
    else {
        if (authEl) {
            authEl.style.display = "block";
        }
        if (logoutBtn) {
            logoutBtn.style.display = "none";
        }
    }
}

function needsImages(data) {
    return data.displayMode !== "text" || data.matching || data.mcq || data.fill;
}

//Function to attach all handlers
function attachAllHandlers() {
    attachEditableHandlers();
    attachCardControls();
    attachQuestionControls();
    attachDeleteQuestion();
    attachQuestionSorting();
    attachImagePicker();
    attachMCQControls();
    attachMCQSorting();
    attachMatchingControls();
    attachMatchingSorting();
    attachOpenSorting();
    attachStickerDrag();
    attachStickerDelete();
    attachStickerResize();
    attachStickerRotate();
    attachBorderHover();
    attachBorderApply();
}


async function renderFromState() {
    if (!window.worksheetState.stickers) {
        window.worksheetState.stickers = [];
    }
    const data = getPageData();
    data.customExercises = window.worksheetState.exercises;
    data.stickers = window.worksheetState.stickers;
    const res = await fetch(`${API_URL}/api/worksheet/preview`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });
    const html = await res.text();
    document.getElementById("preview").innerHTML = html;
    attachAllHandlers();
    if (window.API_BASE === "worksheet") {
        const previewEl = document.getElementById("preview");
        previewEl.querySelectorAll(".page").forEach(page => {
            Sortable.create(page, {
            animation: 150,
            draggable: ".exercise-card",
            onEnd: () => {
                const newOrder = [];
                const temp = [...window.worksheetState.exercises];
                document.querySelectorAll(".exercise-card").forEach(card => {
                const type = card.dataset.type;
                const index = temp.findIndex(ex => ex.type === type);
                if (index !== -1) {
                    newOrder.push(temp[index]);
                    temp.splice(index, 1);
                }
                });
                window.worksheetState.exercises = newOrder;
            }
            });
        });
    }
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
        //Open question exercise
        if (ex.type === "open") {
            for (let q of ex.questions) {
                if (count === flatIndex) {
                    q.question = newText;
                    return;
                }
                count++;
            }
        }
        //Fill exercise
        if (ex.type === "fill") {
            for (let q of ex.questions) {
                if (count === flatIndex) {
                    q.sentence = newText;
                    return;
                }
                count++;
            }
        }
        //MCQ exercise
        if (ex.type === "mcq") {
            for (let q of ex.questions) {
                if (count === flatIndex) {
                    q.question = newText;
                    return;
                }
                count++;
                for (let i = 0; i < q.choices.length; i++) {
                    if (count === flatIndex) {
                        q.choices[i] = newText;
                        return;
                    }
                    count++;
                }
            }
        }
        //Matching exercise
        if (ex.type === "matching") {
            for (let p of ex.pairs) {
                if (count === flatIndex) {
                p.word = newText;
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

    let data;
    if (typeof getPageData === "function") {
        data = getPageData(); // Worksheet has custom getPageData to include exercises
    } else if (window.API_BASE === "flashcards") {
        data = getFlashcardState(); // Flashcards gets some data from global state
    } else {
        data = getFormData(); // Default for bingo and others
    }

    if (needsImages(data)) {
    window.globalImageMap = await loadImages(data.words, window.globalImageMap);
    }

    data.imageMap = window.globalImageMap;
    const res = await fetch(`${API_URL}/api/${window.API_BASE}/preview`, {
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
        attachAllHandlers();
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
        if (window.worksheetState.exercises.length === 0) {
            initializeStateFromPreview();
        }
        renderFromState();
    }
    window.scrollTo(0, scrollY);
}


async function download() {
    const btn = document.getElementById("downloadBtn");
    btn.disabled = true;
    btn.textContent = "⏳ Generating PDF...";
    try {
        let data;
        if (typeof getPageData === "function") {
            data = getPageData(); // Worksheet has custom getPageData to include exercises
        } else if (window.API_BASE === "flashcards") {
            data = getFlashcardState(); // Flashcards gets some data from global state
        } else {
            data = getFormData(); // Default for bingo and others
        }

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
            data.stickers = window.worksheetState.stickers;
        }  
        const res = await fetch(`${API_URL}/api/${window.API_BASE}/generate`, {
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

checkUser();