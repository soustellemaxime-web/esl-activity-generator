async function loadHeader() {
  const res = await fetch("header.html");
  const html = await res.text();

  document.body.insertAdjacentHTML("afterbegin", html);

  setupHeader();
}

async function setupHeader() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const welcome = document.getElementById("userWelcome");
    const toggleTheme = document.getElementById("toggleTheme");

    //Welcome message and button visibility
    if (user) {
        loginBtn.style.display = "none";
        logoutBtn.style.display = "inline-block";
        welcome.textContent = `Welcome ${user.email}`;
    } else {
        loginBtn.style.display = "inline-block";
        logoutBtn.style.display = "none";
        welcome.textContent = "";
    }

    //Auth buttons
    logoutBtn.onclick = async () => {
        await supabaseClient.auth.signOut();
        location.reload();
    };

    loginBtn.onclick = () => {
        document.getElementById("auth").style.display = "block";
    };

    //Dark mode toggle
    toggleTheme.onclick = () => {
        document.body.classList.toggle("dark");
    };

    //Language toggle
    if (window.applyTranslations) {
        applyTranslations(currentLang);
    }
    if (window.updateLangButton) {
        updateLangButton();
    }
    const langBtn = document.getElementById("toggleLang");
    if (langBtn && window.toggleLanguage) {
        langBtn.onclick = toggleLanguage;
    }

    //Home button
    const homeBtn = document.getElementById("homeBtn");
    const path = window.location.pathname;
    const isHome = path.endsWith("index.html") || path === "/" || path === "";
    if (isHome) {
        homeBtn.style.display = "none";
    } else {
        homeBtn.style.display = "inline-block";
        homeBtn.onclick = () => {
            location.href = "index.html";
        };
    }
}

loadHeader();