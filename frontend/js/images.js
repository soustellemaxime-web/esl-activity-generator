window.globalImageMap = {};

async function loadImages(words, existingMap = {}) {
  const uniqueWords = [...new Set(words)];
  const missingWords = uniqueWords.filter(word => !(word in existingMap));

  if (missingWords.length === 0) {
    return existingMap;
  }

  const promises = missingWords.map(word =>
    fetch(`http://localhost:3000/api/images?word=${word}`)
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

function showImagePicker(images, word, icon) {
  // remove old picker
  const existing = document.getElementById("image-picker");
  if (existing) existing.remove();

  const picker = document.createElement("div");
  picker.id = "image-picker";

  picker.innerHTML = `
    <div class="picker-content">
      ${images.map(img => `<img src="${img}" />`).join("")}
    </div>
  `;

  document.body.appendChild(picker);

  // click on image
  picker.querySelectorAll("img").forEach(imgEl => {
    imgEl.onclick = async () => {
      const res = await fetch(imgEl.src);
      const blob = await res.blob();

      const base64 = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      globalImageMap[word] = base64;

      document.querySelectorAll(`img[data-word="${word}"]`).forEach(el => {
        el.src = base64;
        el.style.opacity = "0.5";
        setTimeout(() => el.style.opacity = "1", 200);
      });

      icon.classList.remove("loading");
      picker.remove();
    };
  });

  // click outside closes
  picker.onclick = (e) => {
    if (e.target === picker) {
      icon.classList.remove("loading");
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

    const res = await fetch(`http://localhost:3000/api/images?word=${word}&t=${Date.now()}`);
    const data = await res.json();

    if (!data.images || data.images.length === 0) {
        icon.classList.remove("loading");
        return;
    }
    showImagePicker(data.images, word, icon);
});
