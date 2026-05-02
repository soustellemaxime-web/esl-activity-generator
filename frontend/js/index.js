async function initHome() {
  const user = await getCurrentUser();
  const dashboardBtn = document.getElementById("dashboardBtn");
  if (user && dashboardBtn) {
    dashboardBtn.classList.remove("hidden");
  }
}

function goToDashboard() {
  window.location.href = "dashboard.html";
}

const params = new URLSearchParams(window.location.search);

if (params.get("success")) {
  alert("🎉 You've upgraded your plan! Thank you for your support <3");
}

if (params.get("canceled")) {
  alert("Payment Canceled.");
}

document.addEventListener("DOMContentLoaded", initHome);