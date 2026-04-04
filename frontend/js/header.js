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
    const togglePassword = document.getElementById("togglePassword");

    if (togglePassword) {
        togglePassword.onclick = () => {
            const isHidden = modalPassword.type === "password";
            modalPassword.type = isHidden ? "text" : "password";
            togglePassword.textContent = isHidden ? "🙈" : "👁️";
        };
    }

    //Modal elements
    const modal = document.getElementById("loginModal");
    const closeModal = document.getElementById("closeModal");
    const modalEmail = document.getElementById("modalEmail");
    const modalPassword = document.getElementById("modalPassword");
    const modalMessage = document.getElementById("modalMessage");
    const modalLoginBtn = document.getElementById("modalLoginBtn");
    const modalSignupBtn = document.getElementById("modalSignupBtn");

    closeModal.onclick = () => {
        modal.classList.add("hidden");
    };
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.add("hidden");
        }
    };

    document.getElementById("loginForm").onsubmit = async (e) => {
        e.preventDefault();
        const email = modalEmail.value;
        const password = modalPassword.value;
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            modalMessage.textContent = error.message;
            modalMessage.style.color = "red";
        } else {
            modal.classList.add("hidden");
            location.reload();
        }
    };
    modalSignupBtn.onclick = async () => {
        const email = modalEmail.value;
        const password = modalPassword.value;
        const { error } = await supabaseClient.auth.signUp({ email, password });
        if (error) {
            modalMessage.textContent = error.message;
            modalMessage.style.color = "red";
        } else {
            modalMessage.textContent = "Sign up successful!";
            modalMessage.style.color = "green";
        }
    };

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
        modal.classList.remove("hidden");
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