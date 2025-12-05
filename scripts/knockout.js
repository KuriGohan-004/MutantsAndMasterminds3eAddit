const MODULE_ID = "mnm-3e-addit";
const STATUS_NAME = "Incapacitated";
const TINT_COLOR = "#ff0000";

Hooks.once("init", () => {
  // Register module setting
  game.settings.register(MODULE_ID, "enableIncapTint", {
    name: "Enable Incapacitated Token Tinting",
    hint: "If enabled, tokens with the Incapacitated status will be tinted red.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
});

Hooks.on("updateToken", async (tokenDoc, changes) => {
  // Only run if the effects list changed
  if (!("effects" in changes)) return;

  // If feature is disabled, do nothing
  if (!game.settings.get(MODULE_ID, "enableIncapTint")) return;

  const effects = tokenDoc.effects.map(e => e.toLowerCase());

  const isIncapacitated =
    effects.some(e => e.includes(STATUS_NAME.toLowerCase()));

  // Apply tint if incapacitated
  if (isIncapacitated) {
    await tokenDoc.update({ tint: TINT_COLOR });
  } else {
    // Remove tint if not
    await tokenDoc.update({ tint: null });
  }
});
