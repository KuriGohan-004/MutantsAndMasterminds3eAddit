const MODULE_ID = "mnm-3e-addit";
const STATUS_NAME = "incapacitated"; // exact status effect name to match (case-insensitive)
const TINT_COLOR = "#ff0000";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "enableIncapTint", {
    name: "Enable Incapacitated Token Tinting",
    hint: "If enabled, tokens with the 'incapacitated' status (or an Active Effect labeled 'incapacitated') will be tinted red.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
});

/**
 * Returns true if the given TokenDocument currently has the 'incapacitated' status
 * in any of the ways we care about:
 *  - an ActiveEffect on the Actor with label/icon containing the name
 *  - an entry in tokenDoc.effects (the standard token status icons)
 */
function tokenHasIncapacitated(tokenDoc) {
  if (!tokenDoc) return false;
  const name = STATUS_NAME.toLowerCase();

  // 1) Check tokenDoc.effects (array of icon paths or IDs)
  try {
    if (Array.isArray(tokenDoc.effects)) {
      if (tokenDoc.effects.some(e => e && `${e}`.toLowerCase().includes(name))) return true;
    }
  } catch (err) {
    // ignore
  }

  // 2) Check actor active effects (labels/icons)
  const actor = tokenDoc.actor;
  if (actor && actor.effects) {
    try {
      // actor.effects is a Collection of ActiveEffectDocument
      if (actor.effects.find(e => {
        const lbl = (e.data?.label || "").toString().toLowerCase();
        const icon = (e.data?.icon || "").toString().toLowerCase();
        return lbl === name || lbl.includes(name) || icon.includes(name);
      })) return true;
    } catch (err) {
      // ignore
    }
  }

  return false;
}

/**
 * Apply or remove tint on a single TokenDocument depending on whether it has the status.
 * Avoids unnecessary updates.
 */
async function applyTintForToken(tokenDoc) {
  if (!tokenDoc) return;
  // Respect user setting
  if (!game.settings.get(MODULE_ID, "enableIncapTint")) return;

  const has = tokenHasIncapacitated(tokenDoc);
  const currentTint = tokenDoc.data?.tint ?? null;
  const desiredTint = has ? TINT_COLOR : null;

  // Avoid updating when nothing to change
  const equal = (a, b) => {
    // null/undefined/'' considered equal
    const na = (a === null || a === undefined || a === "") ? null : a;
    const nb = (b === null || b === undefined || b === "") ? null : b;
    return na === nb;
  };
  if (equal(currentTint, desiredTint)) return;

  // Update token document
  try {
    await tokenDoc.update({ tint: desiredTint });
  } catch (err) {
    console.error(`${MODULE_ID} | Failed to update token tint:`, err);
  }
}

/**
 * Apply tint to all canvas tokens that correspond to the provided actor
 * (used when actor's active effects change).
 */
async function applyTintForActor(actor) {
  if (!actor || !canvas) return;
  const tokens = canvas.tokens.placeables.filter(t => t.actor && t.actor.id === actor.id);
  await Promise.all(tokens.map(t => applyTintForToken(t.document)));
}

/* -------------------- Hooks -------------------- */

/**
 * updateToken:
 * - watch changes.effects (the token status icons array) to respond when user toggles token status.
 * - skip events where we are only updating the tint (avoid recursion): if 'tint' is present in changes, ignore.
 */
Hooks.on("updateToken", async (tokenDoc, changes) => {
  try {
    if (!game.settings.get(MODULE_ID, "enableIncapTint")) return;

    // If our own tint change triggered this update, ignore to prevent loop
    if (changes && Object.prototype.hasOwnProperty.call(changes, "tint")) return;

    // Only act when effects changed (token status icons), or actor changed
    if (changes && Object.prototype.hasOwnProperty.call(changes, "effects")) {
      await applyTintForToken(tokenDoc);
    }
  } catch (err) {
    console.error(`${MODULE_ID} | updateToken handler error:`, err);
  }
});

/**
 * updateActor:
 * - If actor's active effects changed, update tokens for that actor.
 * - We check if the update included effect/flags changes; even if it didn't, we run a quick check.
 */
Hooks.on("updateActor", async (actor, diff, options, userId) => {
  try {
    if (!game.settings.get(MODULE_ID, "enableIncapTint")) return;
    // If the diff explicitly includes changes to 'effects' or flags, run update
    const changedEffects = diff && Object.prototype.hasOwnProperty.call(diff, "effects");
    const changedFlags = diff && Object.prototype.keys ? Object.keys(diff).some(k => k === "flags") : false;
    if (changedEffects || changedFlags) {
      await applyTintForActor(actor);
    } else {
      // As a fallback, do a light check (safe)
      await applyTintForActor(actor);
    }
  } catch (err) {
    console.error(`${MODULE_ID} | updateActor handler error:`, err);
  }
});

/**
 * Active effect create/delete/update hooks
 * These hooks are fired when active effects are created/removed/updated.
 * We find the parent actor (if any) and update its tokens' tint.
 */
Hooks.on("createActiveEffect", async (effectDoc, options, userId) => {
  try {
    if (!game.settings.get(MODULE_ID, "enableIncapTint")) return;
    const parent = effectDoc.parent;
    if (parent?.documentName === "Actor") {
      await applyTintForActor(parent);
    } else if (parent?.documentName === "Token") {
      // A token-specific effect changed; update that token
      const tokDoc = parent;
      await applyTintForToken(tokDoc);
    }
  } catch (err) {
    console.error(`${MODULE_ID} | createActiveEffect handler error:`, err);
  }
});

Hooks.on("deleteActiveEffect", async (effectDoc, options, userId) => {
  try {
    if (!game.settings.get(MODULE_ID, "enableIncapTint")) return;
    const parent = effectDoc.parent;
    if (parent?.documentName === "Actor") {
      await applyTintForActor(parent);
    } else if (parent?.documentName === "Token") {
      const tokDoc = parent;
      await applyTintForToken(tokDoc);
    }
  } catch (err) {
    console.error(`${MODULE_ID} | deleteActiveEffect handler error:`, err);
  }
});

Hooks.on("updateActiveEffect", async (effectDoc, changes, options, userId) => {
  try {
    if (!game.settings.get(MODULE_ID, "enableIncapTint")) return;
    const parent = effectDoc.parent;
    if (parent?.documentName === "Actor") {
      await applyTintForActor(parent);
    } else if (parent?.documentName === "Token") {
      const tokDoc = parent;
      await applyTintForToken(tokDoc);
    }
  } catch (err) {
    console.error(`${MODULE_ID} | updateActiveEffect handler error:`, err);
  }
});

/* On canvas ready, do a pass to ensure tokens are correct (useful after module enable/setting change) */
Hooks.on("ready", async () => {
  try {
    if (!game.settings.get(MODULE_ID, "enableIncapTint")) return;
    if (!canvas) return;
    for (const t of canvas.tokens.placeables) {
      await applyTintForToken(t.document);
    }
  } catch (err) {
    console.error(`${MODULE_ID} | ready handler error:`, err);
  }
});
