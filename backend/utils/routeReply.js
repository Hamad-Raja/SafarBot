function formatDateForReply(dateStr) {
  // keep simple (you can improve later)
  return dateStr ? dateStr : "";
}

function formatRoutesReply(routes, from, to, dateStr) {
  if (!routes || routes.length === 0) {
    const d = dateStr ? ` (${dateStr})` : "";
    return `Maaf kijiye, ${from} se ${to}${d} ke liye koi route available nahi.`;
  }

  const d = dateStr ? ` (${formatDateForReply(dateStr)})` : "";
  const top = routes.slice(0, 3);

  const lines = top.map((r, i) => {
    const provider = r.operator || "NA";
    const time = r.departureTime || "NA";
    const price = (r.price ?? 0) > 0 ? `Rs ${r.price}` : "Price NA";
    const seats = (r.availableSeats ?? 0) > 0 ? `${r.availableSeats} seats` : "Seats NA";
    return `${i + 1}) ${provider} — ${time} — ${price} (${seats})`;
  });

  return (
    `${from} se ${to}${d} ke routes available hain:\n` +
    `${lines.join("\n")}\n` +
    `Konsi route book karni hai? (1/2/3 ya "Faisal Movers")`
  );
}