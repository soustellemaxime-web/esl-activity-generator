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

async function cancelSubscription() {
  const confirmCancel = confirm(
    "Are you sure you want to cancel your subscription?\n\nYou will keep access until the end of your billing period."
  );
  if (!confirmCancel) return;
  const { data: { session } } = await supabaseClient.auth.getSession();
  const res = await fetch("/api/stripe/cancel-subscription", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${session.access_token}`
    }
  });
  const data = await res.json();
  if (data.success) {
    alert("Subscription will end at the end of billing period 👍");
  } else {
    alert("Error: " + data.error);
  }
}