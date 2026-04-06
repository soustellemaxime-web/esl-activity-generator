async function initHome() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (user) {
    document.getElementById("dashboardBtn").classList.remove("hidden");
    document.getElementById("loginHint").classList.add("hidden");
  }
}

function goToDashboard() {
  window.location.href = "dashboard.html";
}

document.addEventListener("DOMContentLoaded", initHome);