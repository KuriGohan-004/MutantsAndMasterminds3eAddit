Hooks.on("updateToken", async (tokenDoc, changes, options, userId) => {
  // Only run if token effects changed
  if (!("effects" in changes)) return;

  const token = tokenDoc.object;
  if (!token) return;

  // Name of the status we're checking
  const STATUS_NAME = "Incapacitated";

  // Get current active effects on the token
  const effects = tokenDoc.effects.map(e => e.toLowerCase());

  // Check if incapacitated is currently active
  const isIncapacitated =
    effects.some(e => e.includes(STATUS_NAME.toLowerCase()));

  // Apply or remove tint
  if (isIncapacitated) {
    // Make token red
    await tokenDoc.update({ tint: "#ff0000" });
  } else {
    // Clear tint
    await tokenDoc.update({ tint: null });
  }
});
