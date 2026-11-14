function createStatementCatalog({ state, stateCommands, source = "./statements.json" }) {
  let statements = {};
  let loading;

  function load() {
    if (!loading) {
      loading = fetch(source)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Statement library request failed (${response.status}).`);
          }
          return response.json();
        })
        .then((data) => {
          if (!data || typeof data !== "object" || Array.isArray(data)) {
            throw new TypeError("Statement library must be a JSON object.");
          }
          statements = data;
          return statements;
        })
        .catch((error) => {
          // Allow a later call to retry instead of permanently caching a rejection.
          loading = undefined;
          throw error;
        });
    }

    return loading;
  }

  function get(key) {
    return statements[key];
  }

  function has(key) {
    return Object.hasOwn(statements, key);
  }

  function getRandom(key) {
    const options = statements[key] || [];
    return options[Math.floor(Math.random() * options.length)] || statements.default;
  }

  function refresh(key) {
    stateCommands.setActiveFragment(key, getRandom(key));
    return state.activeFragments[key];
  }

  function getCached(key) {
    if (!state.activeFragments[key]) refresh(key);
    return state.activeFragments[key];
  }

  function interpolate(template) {
    const replacements = {
      agentName: state.agentName || "[Enter agent name]",
      customerName: state.customerName || "[Enter customer name]",
      ...state.dynamicInputs,
    };

    return String(template).replace(/\$\{(.*?)\}/g, (_, key) => {
      const value = replacements[key];
      const normalizedValue = value == null ? "" : String(value).trim();
      return normalizedValue || `[Enter ${key}]`;
    });
  }

  return Object.freeze({
    get,
    getCached,
    getRandom,
    has,
    interpolate,
    load,
    refresh,
  });
}

export { createStatementCatalog };
