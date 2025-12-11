Hooks.once("init", () => {
  console.log("mnm-3e-addit | Registering Auto Token Flip setting");

  // Register the module setting
  game.settings.register("mnm-3e-addit", "autoFlipTokens", {
    name: "Enable Auto Token Flip",
    hint: "Automatically flip tokens horizontally based on movement or target position.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
});

Hooks.on("updateToken", (scene, tokenDoc, updateData, options, userId) => {
  // Check the setting
  if (!game.settings.get("mnm-3e-addit", "autoFlipTokens")) return;

  // Get the rendered token on the canvas
  const token = canvas.tokens.get(tokenDoc._id);
  if (!token) return;

  let scaleX = token.icon.scale.x || 1;

  // 1️⃣ Check for target
  const targets = token.actor?.targets ?? game.user.targets;
  const target = [...targets][0];

  if (target) {
    const targetX = target.x;
    const tokenX = token.x;

    token.icon.scale.x = targetX > tokenX ? -Math.abs(scaleX) : Math.abs(scaleX);
    return;
  }

  // 2️⃣ If no target, flip based on movement
  if (updateData.x !== undefined) {
    const oldX = tokenDoc.x ?? token.x;
    const newX = updateData.x;

    if (newX > oldX) {
      token.icon.scale.x = -Math.abs(scaleX); // moving right → flip
    } else if (newX < oldX) {
      token.icon.scale.x = Math.abs(scaleX); // moving left → unflip
    }
  }
});
