Hooks.once("init", () => {
  console.log("mnm-3e-addit | Token Y-sorting enabled");

  // Save a reference to the original sorting function
  const originalSort = CONFIG.Canvas.objectClass.prototype._sortPlaceables;

  // Override with our custom sorting logic
  CONFIG.Canvas.objectClass.prototype._sortPlaceables = function (...args) {
    // Call the original function first
    const result = originalSort.call(this, ...args);

    // Then sort placeables by Y position (top-to-bottom)
    this.placeables.sort((a, b) => {
      const ay = a.y ?? a.document.y;
      const by = b.y ?? b.document.y;
      return ay - by;
    });

    return result;
  };
});
