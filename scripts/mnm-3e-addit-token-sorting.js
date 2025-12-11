Hooks.once("init", () => {
  console.log("mnm-3e-addit | Registering Auto Token Flip setting");

  // Register the module setting
  game.settings.register("mnm-3e-addit", "autoFlipTokens", {
    name: "Enable Auto Token Flip",
    hint: "Automatically flip tokens horizontally based on movement or target position.",
    scope: "world",       // saved globally
    config: true,         // appears in Module Settings
    type: Boolean,
    default: true
  });
});

// Hook to automatically flip tokens when updated
Hooks.on("updateToken", (scene, token, updateData) => {
  // Make sure the setting exists and is enabled
  if (!game.settings.get("mnm-3e-addit", "autoFlipTokens")) return;

  const t = canvas.tokens.get(token._id);
  if (!t) return;

  let scaleX = t.icon.scale.x;

  // 1️⃣ If the token has a target, face the target
  const targets = t.actor?.targets ?? game.user.targets;
  const target = [...targets][0];

  if (target) {
    const targetX = target.x;
    const tokenX = t.x;

    // Flip if target is to the right, otherwise unflip
    t.icon.scale.x = targetX > tokenX ? -Math.abs(scaleX) : Math.abs(scaleX);
    return;
  }

  // 2️⃣ Otherwise, flip based on movement direction
  if (updateData.x !== undefined) {
    const oldX = token.x;
    const newX = updateData.x;

    if (newX > oldX) {
      t.icon.scale.x = -Math.abs(scaleX); // moving right → flip
    } else if (newX < oldX) {
      t.icon.scale.x = Math.abs(scaleX);  // moving left → unflip
    }
  }
});
