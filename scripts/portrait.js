/**
 * mnm-3e-addit — Character Portrait Overlay (percentage-based + size setting)
 */

const MODULE_ID = "mnm-3e-addit";

/* ---------------------------------------- */
/* SETTINGS                                 */
/* ---------------------------------------- */

Hooks.once("init", () => {

  // Enable / disable (GM)
  game.settings.register(MODULE_ID, "portraitEnabled", {
    name: "Enable Character Portrait Overlay",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // Mode
  game.settings.register(MODULE_ID, "portraitMode", {
    name: "Portrait Mode",
    scope: "world",
    config: true,
    type: String,
    choices: {
      "token-then-portrait": "Mode 1 — Token image if present, else portrait",
      "portrait-only": "Mode 2 — Always portrait image"
    },
    default: "token-then-portrait"
  });

  // Size (%) of screen height
  game.settings.register(MODULE_ID, "portraitSize", {
    name: "Portrait Size (percent of screen height)",
    scope: "world",
    config: true,
    type: Number,
    range: {
      min: 5,
      max: 30,
      step: 1
    },
    default: 12
  });

  // Position X (% from left)
  game.settings.register(MODULE_ID, "portraitPosX", {
    name: "Portrait X Position (%)",
    scope: "world",
    config: true,
    type: Number,
    range: {
      min: 0,
      max: 100,
      step: 1
    },
    default: 2
  });

  // Position Y (% from bottom)
  game.settings.register(MODULE_ID, "portraitPosY", {
    name: "Portrait Y Position (%)",
    scope: "world",
    config: true,
    type: Number,
    range: {
      min: 0,
      max: 100,
      step: 1
    },
    default: 2
  });
});


/* ---------------------------------------- */
/* UI HELPERS                               */
/* ---------------------------------------- */

let overlay = null;

function ensureOverlay() {
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "mnm3e-portrait-overlay";
  overlay.style.position = "fixed";
  overlay.style.pointerEvents = "none";
  overlay.style.overflow = "hidden";
  overlay.style.display = "none";
  overlay.style.borderRadius = "15px";
  overlay.style.border = "4px solid #ffffff";
  overlay.style.boxShadow = "0 0 8px #000";
  overlay.style.zIndex = 999999;

  document.body.appendChild(overlay);
  return overlay;
}

function hideOverlay() {
  if (overlay) overlay.style.display = "none";
}


/* ---------------------------------------- */
/* IMAGE SOURCE LOGIC                        */
/* ---------------------------------------- */

function getPlayerActor() {
  return game.user?.character ?? null;
}

function getPortraitImage(actor) {
  return actor?.img ?? null;
}

function getTokenImage(actor) {
  if (!canvas?.tokens?.placeables) return null;
  const token = canvas.tokens.placeables.find(t => t.actor?.id === actor.id);
  return token ? token.document.texture.src : null;
}

function selectImage(actor) {
  const mode = game.settings.get(MODULE_ID, "portraitMode");

  if (mode === "portrait-only") {
    return getPortraitImage(actor);
  }

  const tokenImg = getTokenImage(actor);
  return tokenImg || getPortraitImage(actor);
}


/* ---------------------------------------- */
/* DRAW FUNCTION                             */
/* ---------------------------------------- */

function updatePortraitOverlay() {
  // Gate - on/off
  if (!game.settings.get(MODULE_ID, "portraitEnabled")) {
    hideOverlay();
    return;
  }

  // Must have a player actor
  const actor = getPlayerActor();
  if (!actor) {
    hideOverlay();
    return;
  }

  const img = selectImage(actor);
  if (!img) {
    hideOverlay();
    return;
  }

  // Read settings
  const sizePerc = game.settings.get(MODULE_ID, "portraitSize");
  const posX = game.settings.get(MODULE_ID, "portraitPosX");
  const posY = game.settings.get(MODULE_ID, "portraitPosY");

  // Convert percentage to screen pixels
  const heightPx = window.innerHeight * (sizePerc / 100);
  const widthPx = heightPx;  // square

  const xPx = (window.innerWidth * (posX / 100));
  const yPx = (window.innerHeight * (posY / 100));

  // Player color border
  const color = game.user?.color ?? "#ffffff";

  // Create element if needed
  const el = ensureOverlay();
  el.style.display = "block";

  el.style.width = `${widthPx}px`;
  el.style.height = `${heightPx}px`;

  el.style.left = `${xPx}px`;
  el.style.bottom = `${yPx}px`;

  el.style.border = `4px solid ${color}`;
  el.style.boxShadow = `0 0 10px ${color}77`;

  el.innerHTML = `
    <img src="${img}" style="
      width:100%;
      height:100%;
      object-fit:cover;
    " />
  `;
}


/* ---------------------------------------- */
/* HOOKS                                    */
/* ---------------------------------------- */

[
  "ready",
  "updateUser",
  "updateActor",
  "updateToken",
  "canvasReady",
  "updateScene",
  "updateSetting"
].forEach(hook => {
  Hooks.on(hook, updatePortraitOverlay);
});
