function needsImages(data) {
    return data.displayMode !== "text" || data.matching || data.mcq || data.fill;
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
        document.querySelectorAll("[data-editable]").forEach(el => {
            el.setAttribute("contenteditable", "false");
            el.addEventListener("click", (e) => {
                e.stopPropagation();
                el.setAttribute("contenteditable", "true");
                el.classList.add("editing");
                el.focus();
            });
            el.addEventListener("blur", () => {
                el.setAttribute("contenteditable", "false");
                el.classList.remove("editing");
            });

        });
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
            const edited = [];
            document.querySelectorAll(".exercise-card").forEach(card => {
                edited.push(card.innerHTML);
        });
        data.customContent = edited;
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