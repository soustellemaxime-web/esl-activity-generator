window.globalImageMap = {};

async function loadImages(words, existingMap = {}) {
  const uniqueWords = [...new Set(words)];
  const missingWords = uniqueWords.filter(word => !(word in existingMap));

  if (missingWords.length === 0) {
    return existingMap;
  }

  const promises = missingWords.map(word =>
    fetch(`${API_URL}/api/images?word=${word}`)
      .then(res => res.json())
      .then(async data => {
        const imageUrl = data.images?.[0];

        if (!imageUrl) return { word, image: null };

        const res = await fetch(imageUrl);
        const blob = await res.blob();

        const base64 = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });

        return { word, image: base64 };
      })
  );

  const results = await Promise.all(promises);

  const newMap = { ...existingMap };

  results.forEach(({ word, image }) => {
    newMap[word] = image;
  });

  return newMap;
}

function showImagePicker(images, word = "", icon, onSelect, options = {}) {
  const { allowSearch = false, allowUpload = false } = options;
  const existing = document.getElementById("image-picker");
  if (existing) existing.remove();
  const picker = document.createElement("div");
  picker.id = "image-picker";
  picker.innerHTML = `
    <div class="picker-content">
      ${allowSearch || allowUpload ? `
        <div class="picker-toolbar">
          ${allowSearch ? `
            <input type="text" id="picker-search" placeholder="Search..." value="${word}" />
            <button id="picker-search-btn">🔍</button>
          ` : ""}
          ${allowUpload ? `
            <input type="file" id="picker-upload" accept="image/*" hidden />
            <button id="picker-upload-btn">📁 Upload</button>
          ` : ""}
        </div>
      ` : ""}
      <div class="image-grid">
        ${images.length > 0 
          ? images.map(img => `<img src="${img}" />`).join("")
          : `<div class="empty-picker">Type a word to search images 🔍</div>`
        }
      </div>
    </div>
  `;
  document.body.appendChild(picker);
  const grid = picker.querySelector(".image-grid");
  function bindImageClick(imgEl) {
    imgEl.onclick = async () => {
      const res = await fetch(imgEl.src);
      const blob = await res.blob();
      const base64 = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      if (onSelect) {
        // worksheet custom
        onSelect(base64);
      } else {
        // bingo / flashcards / worksheets auto
        globalImageMap[word] = base64;
        document.querySelectorAll(`img[data-word="${word}"]`).forEach(el => {
          el.src = base64;
          el.style.opacity = "0.5";
          setTimeout(() => el.style.opacity = "1", 200);
        });
      }
      if (icon) icon.classList.remove("loading");
      picker.remove();
    };
  }
  // bind initial images
  grid.querySelectorAll("img").forEach(bindImageClick);
  // SEARCH (only if enabled)
  if (allowSearch) {
    const searchInput = picker.querySelector("#picker-search");
    const searchBtn = picker.querySelector("#picker-search-btn");
    searchBtn.onclick = async () => {
      const newWord = searchInput.value.trim();
      if (!newWord) return;
      word = newWord;
      const res = await fetch(`${API_URL}/api/images?word=${newWord}&t=${Date.now()}`);
      const data = await res.json();
      if (!data.images) return;
      grid.innerHTML = data.images.map(img => `<img src="${img}" />`).join("");
      // rebind clicks
      grid.querySelectorAll("img").forEach(bindImageClick);
    };
  }
  // UPLOAD (only if enabled)
  if (allowUpload) {
    const uploadBtn = picker.querySelector("#picker-upload-btn");
    const uploadInput = picker.querySelector("#picker-upload");
    uploadBtn.onclick = () => uploadInput.click();
    uploadInput.onchange = () => {
      const file = uploadInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        if (onSelect) {
          onSelect(base64);
        } else {
          globalImageMap[word] = base64;
        }
        picker.remove();
      };
      reader.readAsDataURL(file);
    };
  }
  // click outside closes
  picker.onclick = (e) => {
    if (e.target === picker) {
      if (icon) icon.classList.remove("loading");
      picker.remove();
    }
  };
}

document.addEventListener("click", async (e) => {
    const icon = e.target.closest(".reload-icon");
    if (!icon) return;

    const container = icon.closest(".image-container");
    const img = container.querySelector("img");
    if (!img) return;

    const word = img.dataset.word;

    icon.classList.add("loading");

    const res = await fetch(`${API_URL}/api/images?word=${word}&t=${Date.now()}`);
    const data = await res.json();

    if (!data.images || data.images.length === 0) {
        icon.classList.remove("loading");
        return;
    }
    showImagePicker(data.images, word, icon);
});
