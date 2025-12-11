Hooks.on("ready", () => {
  console.log("mnm-3e-addit | Auto token flipping ready.");
});

/**
 * Whenever a token is updated (movement, targeting, etc), adjust flip state.
 */
Hooks.on("updateToken", (scene, token, updateData) => {
  if (!game.settings.get("mnm-3e-addit", "autoFlipTokens")) return;

  const tokenDoc = scene.tokens.get(token._id);
  if (!tokenDoc) return;

  // Determine the token's current rendered object
  const t = canvas.tokens.get(token._id);
  if (!t || !t.icon) return;

  let scaleX = t.icon.scale.x;

  // ------------------------
  // 1. If token has a target, face the target
  // ------------------------
  const targets = t.actor?.targets ?? game.user.targets;
  const target = [...targets][0];

  if (target) {
    const targetX = target.x;
    const tokenX = t.x;

    const shouldFlip = targetX > tokenX; // target to the right

    t.icon.scale.x = shouldFlip ? Math.abs(scaleX) * -1 : Math.abs(scaleX);
    return;
  }

  // ------------------------
  // 2. Otherwise, flip based on movement direction
  // ------------------------
  if (updateData.x !== undefined) {
    const oldX = token.x;
    const newX = updateData.x;

    if (newX > oldX) {
      // moving right → flip
      t.icon.scale.x = -Math.abs(scaleX);
    } else if (newX < oldX) {
      // moving left → unflip
      t.icon.scale.x = Math.abs(scaleX);
    }
  }
});
