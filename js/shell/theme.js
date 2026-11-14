const themeStorageKey = "statementz-theme";

function createThemeController(toggle) {
  function apply(isLightMode) {
    document.body.classList.toggle("theme-light", isLightMode);

    if (toggle) {
      toggle.checked = isLightMode;
    }
  }

  function save(isLightMode) {
    localStorage.setItem(themeStorageKey, isLightMode ? "light" : "dark");
  }

  function initialize() {
    apply(localStorage.getItem(themeStorageKey) === "light");
  }

  function set(isLightMode) {
    apply(isLightMode);
    save(isLightMode);
  }

  return Object.freeze({ apply, initialize, set });
}

export { createThemeController };
