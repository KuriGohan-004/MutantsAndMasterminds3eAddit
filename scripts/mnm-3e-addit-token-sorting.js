Hooks.once("init", () => {
  console.log("mnm-3e-addit | Token Y-sorting enabled");

  /**
   * Override the sorting logic for tokens.
   * Foundry calls this automatically whenever tokens need reordered.
   */
  libWrapper.register(
    "mnm-3e-addit",
    "CONFIG.Canvas.objectClass.prototype._sortPlaceables",
    function (wrapped, ...args) {
      // Perform original sorting first
      const result = wrapped(...args);

      // Then force sorting by Y (top-to-bottom)
      this.placeables.sort((a, b) => {
        const ay = a.y ?? a.document.y;
        const by = b.y ?? b.document.y;
        return ay - by;
      });

      return result;
    },
    "WRAPPER"
  );
});
