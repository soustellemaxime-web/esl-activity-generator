async function initHome() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const dashboardBtn = document.getElementById("dashboardBtn");
  if (user && dashboardBtn) {
    dashboardBtn.classList.remove("hidden");
  }
}

function goToDashboard() {
  window.location.href = "dashboard.html";
}

document.addEventListener("DOMContentLoaded", initHome);