async function upgrade() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  const res = await fetch("/api/stripe/create-checkout", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${session.access_token}`
    }
  });
  const data = await res.json();
  console.log("Stripe response:", data);
  if (!data.url) {
    alert("Stripe error: " + (data.error || "No URL returned"));
    return;
  }
  window.location.href = data.url;
}