const MODULE_ID = "mnm-3e-addit";
let overlayEl = null;

/* ---------------------------- */
/* SETTINGS                     */
/* ---------------------------- */

Hooks.once("init", () => {

  game.settings.register(MODULE_ID, "portraitEnabled", {
    name: "Enable Character Portrait Overlay",
    hint: "Displays the assigned player character portrait on screen.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "portraitMode", {
    name: "Portrait Mode",
    hint: "Mode 1: token image if present else portrait. Mode 2: always portrait.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      "token-then-portrait": "Mode 1 — token then portrait",
      "portrait-only": "Mode 2 — portrait only"
    },
    default: "token-then-portrait"
  });

  game.settings.register(MODULE_ID, "portraitSize", {
    name: "Portrait Size (%)",
    hint: "Height of portrait as % of screen height.",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 5, max: 30, step: 1 },
    default: 12
  });

  game.settings.register(MODULE_ID, "portraitPosX", {
    name: "Portrait X Position (%)",
    hint: "Horizontal position from left side.",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 0, max: 100, step: 1 },
    default: 2
  });

  game.settings.register(MODULE_ID, "portraitPosY", {
    name: "Portrait Y Position (%)",
    hint: "Vertical position from bottom of screen.",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 0, max: 100, step: 1 },
    default: 2
  });

});

/* ---------------------------- */
/* HELPER FUNCTIONS             */
/* ---------------------------- */

function getPlayerActor() {
  return game.user?.character ?? null;
}

function getPortraitImage(actor) {
  return actor?.img ?? null;
}

function getTokenImage(actor) {
  if (!canvas?.tokens?.placeables) return null;
  const token = canvas.tokens.placeables.find(t => t.actor?.id === actor.id);
  return token?.document.texture?.src ?? null;
}

function selectImage(actor) {
  const mode = game.settings.get(MODULE_ID, "portraitMode");
  if (!actor) return null;
  if (mode === "portrait-only") return getPortraitImage(actor);
  return getTokenImage(actor) || getPortraitImage(actor);
}

function ensureOverlay() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement("div");
  overlayEl.id = "mnm3e-portrait-overlay";
  overlayEl.style.position = "fixed";
  overlayEl.style.pointerEvents = "none";
  overlayEl.style.overflow = "hidden";
  overlayEl.style.display = "none";
  overlayEl.style.borderRadius = "15px";
  overlayEl.style.border = "4px solid #fff";
  overlayEl.style.boxShadow = "0 0 8px #000";
  overlayEl.style.zIndex = 999999;
  document.body.appendChild(overlayEl);
  return overlayEl;
}

function hideOverlay() {
  if (overlayEl) overlayEl.style.display = "none";
}

function updateOverlay() {
  if (!game.settings.get(MODULE_ID, "portraitEnabled")) return hideOverlay();

  const actor = getPlayerActor();
  if (!actor) return hideOverlay();

  const img = selectImage(actor);
  if (!img) return hideOverlay();

  const sizePerc = game.settings.get(MODULE_ID, "portraitSize");
  const posX = game.settings.get(MODULE_ID, "portraitPosX");
  const posY = game.settings.get(MODULE_ID, "portraitPosY");

  const heightPx = window.innerHeight * (sizePerc / 100);
  const widthPx = heightPx;
  const xPx = window.innerWidth * (posX / 100);
  const yPx = window.innerHeight * (posY / 100);

  const color = game.user?.color ?? "#ffffff";

  const el = ensureOverlay();
  el.style.display = "block";
  el.style.width = `${widthPx}px`;
  el.style.height = `${heightPx}px`;
  el.style.left = `${xPx}px`;
  el.style.bottom = `${yPx}px`;
  el.style.border = `4px solid ${color}`;
  el.style.boxShadow = `0 0 10px ${color}77`;
  el.innerHTML = `<img src="${img}" style="width:100%; height:100%; object-fit:cover;" />`;
}

/* ---------------------------- */
/* HOOKS                       */
/* ---------------------------- */

// Always update when the world is ready, scene loads, tokens update, or settings change
["ready", "canvasReady", "updateToken", "updateActor", "updateUser", "updateSetting"].forEach(hook => {
  Hooks.on(hook, updateOverlay);
});
