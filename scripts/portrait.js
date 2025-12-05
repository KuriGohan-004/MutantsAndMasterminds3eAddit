const MODULE_ID = "mnm-3e-addit";

/* ---------------------------------------- */
/* SETTINGS REGISTRATION                     */
/* ---------------------------------------- */

Hooks.once("init", () => {

  // Enable/Disable overlay
  game.settings.register(MODULE_ID, "enablePortraitOverlay", {
    name: "Enable Character Portrait Overlay",
    hint: "Displays a portrait of each player's assigned character in the UI.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // Portrait display mode
  game.settings.register(MODULE_ID, "portraitMode", {
    name: "Portrait Mode",
    hint: "Choose whether to use the portrait image or token image.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      "token-then-portrait": "Mode 1 — Token image if present, otherwise portrait",
      "portrait-only": "Mode 2 — Always portrait"
    },
    default: "token-then-portrait"
  });

  // Position CSS
  game.settings.register(MODULE_ID, "portraitPosition", {
    name: "Portrait Position",
    hint: "CSS position (e.g. `bottom: 10px; left: 10px;`)",
    scope: "world",
    config: true,
    type: String,
    default: "bottom: 10px; left: 10px;"
  });

});


/* ---------------------------------------- */
/* HELPER FUNCTIONS                          */
/* ---------------------------------------- */

function getPlayerActor() {
  const user = game.user;
  if (!user?.character) return null;
  return game.actors.get(user.character.id);
}

function getPortraitImage(actor) {
  return actor?.img ?? null;
}

function getTokenImage(actor) {
  if (!canvas?.tokens) return null;
  const token = canvas.tokens.placeables.find(t => t.actor?.id === actor.id);
  return token?.document.texture.src ?? null;
}

function selectPortraitImage(actor) {
  const mode = game.settings.get(MODULE_ID, "portraitMode");

  if (mode === "portrait-only") {
    return getPortraitImage(actor);
  }

  // Mode 1 (token if present)
  const tokenImg = getTokenImage(actor);
  return tokenImg || getPortraitImage(actor);
}


/* ---------------------------------------- */
/* OVERLAY UI CREATION                       */
/* ---------------------------------------- */

let overlayEl = null;

function createOverlay() {
  if (overlayEl) return overlayEl;

  overlayEl = document.createElement("div");
  overlayEl.id = "mnm-portrait-overlay";
  overlayEl.style.position = "fixed";
  overlayEl.style.zIndex = 999999; // above everything
  overlayEl.style.width = "100px";
  overlayEl.style.height = "100px";
  overlayEl.style.borderRadius = "20px";
  overlayEl.style.overflow = "hidden";
  overlayEl.style.background = "#0000";
  overlayEl.style.display = "none"; // hidden by default

  document.body.appendChild(overlayEl);
  return overlayEl;
}

function updateOverlay() {
  const enabled = game.settings.get(MODULE_ID, "enablePortraitOverlay");
  if (!enabled) return hideOverlay();

  const actor = getPlayerActor();
  if (!actor) return hideOverlay();

  // pick image
  const img = selectPortraitImage(actor);
  if (!img) return hideOverlay();

  const pos = game.settings.get(MODULE_ID, "portraitPosition");
  const userColor = game.user?.color ?? "#ffffff";

  const el = createOverlay();
  el.style.cssText = `
    position: fixed;
    ${pos}
    width: 100px;
    height: 100px;
    z-index: 999999;
    border-radius: 20px;
    border: 5px solid ${userColor};
    box-shadow: 0 0 10px ${userColor}77;
    overflow: hidden;
  `;

  el.style.display = "block";
  el.innerHTML = `<img src="${img}" style="width:100%; height:100%; object-fit:cover;" />`;
}

function hideOverlay() {
  if (overlayEl) overlayEl.style.display = "none";
}


/* ---------------------------------------- */
/* HOOKS                                    */
/* ---------------------------------------- */

// On render, scene change, token change, or user character change…
const overlayEvents = [
  "ready",
  "updateActor",
  "updateToken",
  "controlToken",
  "canvasReady",
  "updateUser",
  "updateSetting"
];

overlayEvents.forEach(h => {
  Hooks.on(h, () => updateOverlay());
});
