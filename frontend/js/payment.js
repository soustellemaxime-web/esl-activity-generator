async function upgrade(plan) {
  const { data: { session } } = await supabaseClient.auth.getSession();
  const res = await fetch("/api/stripe/create-checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ plan })
  });
  const data = await res.json();
  console.log("Stripe response:", data);
  if (!data.url) {
    alert("Stripe error: " + (data.error || "No URL returned"));
    return;
  }
  window.location.href = data.url;
}