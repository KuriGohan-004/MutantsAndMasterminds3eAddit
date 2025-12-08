/**************************************
 * Disable Token Movement Ruler
 * Foundry VTT v13+
 **************************************/

Hooks.once("init", () => {

  // Ensure libWrapper exists
  if (!globalThis.libWrapper) {
    console.error("Disable Token Ruler | libWrapper is required!");
    return;
  }

  /**
   * Override TokenRuler.isVisible so it always returns false.
   * This completely hides the measured path when dragging tokens.
   */
  libWrapper.register(
    "disable-token-ruler",
    "TokenRuler.prototype.isVisible",
    function () {
      return false;   // always hide ruler
    },
    "OVERRIDE"
  );

  /**
   * OPTIONAL: Override ruler drawing style functions so nothing is shown.
   * This covers weird cases where modules force rendering.
   */
  libWrapper.register(
    "disable-token-ruler",
    "TokenRuler.prototype._getWaypointStyle",
    function () {
      return { alpha: 0 };
    },
    "OVERRIDE"
  );

  libWrapper.register(
    "disable-token-ruler",
    "TokenRuler.prototype._getSegmentStyle",
    function () {
      return { alpha: 0 };
    },
    "OVERRIDE"
  );

  libWrapper.register(
    "disable-token-ruler",
    "TokenRuler.prototype._getGridHighlightStyle",
    function () {
      return { alpha: 0 };
    },
    "OVERRIDE"
  );
});

/**
 * Ensure the scene refreshes token rulers so hiding takes effect.
 */
Hooks.on("updateToken", (_doc, _update, _options, userId) => {
  if (userId === game.user.id) {
    for (let token of canvas.tokens.placeables) {
      token.renderFlags.set({ refreshState: true });
    }
  }
});
