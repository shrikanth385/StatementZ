import { createThemeController } from "./theme.js";

const dualsStatePrefix = "statementz-duals-state:";

function createAppShell({
  createInputField,
  currencyOptions,
  dropdownManager,
  elements,
  marketplaceOptions,
  onRefreshWorkspaceOutput,
  onRenderWorkspaceTool,
  state,
  stateCommands,
  stateQueries,
}) {
  const themeController = createThemeController(elements.themeToggle);

  function renderInputInto(container, config) {
    container.textContent = "";

    container.appendChild(createInputField(config));
  }

  function updateHeaderDropdownTrigger(trigger, { label, controls }) {
    trigger.textContent = label;
    trigger.setAttribute("aria-haspopup", "true");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", controls);
  }

  function createHeaderRadioOption({
    option,
    inputName,
    className = "",
    inputClassName,
    activeValue,
  }) {
    const label = document.createElement("label");

    label.className = `dropdown-option ${className}`.trim();

    const input = document.createElement("input");

    input.type = "radio";
    input.name = inputName;
    input.className = inputClassName;
    input.value = option.value;
    input.checked = option.value === activeValue;

    label.append(input, option.label);

    return label;
  }

  const headerDropdownConfigs = Object.freeze({
    currency: {
      options: currencyOptions,
      inputName: "headerCurrency",
      inputClassName: "currency-radio",
      stateKey: "activeCurrency",
      dropdown: elements.currencyDropdown,
      trigger: elements.currencyDropdownTrigger,
      labelPrefix: "Currency",
      controls: "currencyDropdown",
    },

    marketplace: {
      options: marketplaceOptions,
      inputName: "headerMarketplace",
      inputClassName: "marketplace-radio",
      stateKey: "activeMarketplace",
      dropdown: elements.marketplaceDropdown,
      trigger: elements.marketplaceDropdownTrigger,
      labelPrefix: "Marketplace",
      controls: "marketplaceDropdown",
    },
  });

  function getHeaderDropdownOption(config) {
    return (
      config.options.find(({ value }) => value === state[config.stateKey]) ||
      config.options[0]
    );
  }

  function updateHeaderDropdown(config) {
    const selectedOption = getHeaderDropdownOption(config);

    updateHeaderDropdownTrigger(config.trigger, {
      label: `${config.labelPrefix}: ${selectedOption.label}`,
      controls: config.controls,
    });
  }

  function renderHeaderDropdown(config) {
    config.dropdown.replaceChildren(
      ...config.options.map((option) =>
        createHeaderRadioOption({
          option,
          inputName: config.inputName,
          inputClassName: config.inputClassName,
          activeValue: state[config.stateKey],
        }),
      ),
    );

    updateHeaderDropdown(config);
  }

  function renderHeaderDropdowns() {
    Object.values(headerDropdownConfigs).forEach(renderHeaderDropdown);
  }

  function setTheme(isLightMode) {
    themeController.apply(isLightMode);
  }

  function initializeTheme() {
    themeController.initialize();
  }

  function handleThemeChange(event) {
    if (event.target !== elements.themeToggle) {
      return;
    }

    const isLightMode = event.target.checked;

    themeController.set(isLightMode);
  }

  function createFaviconDataUrl({ label, background, foreground = "#ffffff" }) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <rect width="64" height="64" rx="12" fill="${background}"/>
        <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
          font-family="Arial, sans-serif" font-size="34" font-weight="800"
          fill="${foreground}">${label}</text>
      </svg>
    `.trim();

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  function setFavicon(variant = "default") {
    const favicon =
      variant === "dual"
        ? { label: "D", background: "#b91c1c" }
        : { label: "S", background: "#4f9fa3" };

    elements.favicon?.setAttribute("href", createFaviconDataUrl(favicon));
  }

  function getSerializableAppState(activeTool) {
    return {
      activeTool: activeTool === "bellboy" ? "opening" : activeTool,
      appState: stateQueries.serializableSnapshot(),
      isLightMode: document.body.classList.contains("theme-light"),
    };
  }

  function applySerializableAppState(snapshot) {
    if (!snapshot?.appState) {
      return;
    }

    stateCommands.hydrate(snapshot.appState);

    setTheme(Boolean(snapshot.isLightMode));
  }

  function getDualsSnapshotFromUrl() {
    const url = new URL(window.location.href);
    const handoffId = url.searchParams.get("duals");

    if (!handoffId) {
      return null;
    }

    const storageKey = `${dualsStatePrefix}${handoffId}`;
    const serializedState = localStorage.getItem(storageKey);

    localStorage.removeItem(storageKey);
    url.searchParams.delete("duals");
    window.history.replaceState(null, "", url);

    try {
      return serializedState ? JSON.parse(serializedState) : null;
    } catch {
      return null;
    }
  }

  function syncHydratedHeaderInputs() {
    const customerInput = document.querySelector("#customerNameHeader");

    if (customerInput) {
      customerInput.value = state.customerName;
    }
  }

  async function initializeHydratedApplication(snapshot) {
    applySerializableAppState(snapshot);
    elements.bootScreen.classList.add("hidden");
    const initialTool = snapshot.activeTool === "bellboy"
      ? "opening"
      : snapshot.activeTool || "opening";

    await onRenderWorkspaceTool(initialTool, {
      preserveState: true,
      shouldRenderHeader: true,
    });
    syncHydratedHeaderInputs();
  }

  function openDualsTab(activeTool) {
    const handoffId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    localStorage.setItem(
      `${dualsStatePrefix}${handoffId}`,
      JSON.stringify(getSerializableAppState(activeTool)),
    );

    const url = new URL(window.location.href);
    url.searchParams.set("duals", handoffId);

    window.open(url.href, "_blank", "noopener");
  }

  function renderHeaderInputs() {
    renderInputInto(elements.headerLeft, {
      label: "Enter Customer Name",
      placeholder: "Customer Name",
      id: "customerNameHeader",
      className: "header-input-group",
      dataset: {
        nameInput: "customer",
      },
    });

    renderHeaderDropdowns();
  }

  function renderBootInputs() {
    const input = elements.bootInputContainer?.querySelector("#agentNameInput");
    const warning = elements.bootInputContainer?.querySelector("#agentNameInputWarning");

    if (!input) {
      return false;
    }

    input.dataset.nameInput = "agent";
    input.setAttribute("autocomplete", "name");

    if (warning) {
      warning.textContent = "";
    }

    return true;
  }

  function handleHeaderDropdownChange(event) {
    const config = Object.values(headerDropdownConfigs).find(({ inputClassName }) =>
      event.target.matches(`.${inputClassName}`),
    );

    if (!config) {
      return;
    }

    state[config.stateKey] = event.target.value;

    updateHeaderDropdown(config);

    onRefreshWorkspaceOutput();

    dropdownManager.closeAll();
  }

  function handleDualsClick(button, activeTool) {
    if (button !== elements.dualsButton) {
      return;
    }

    openDualsTab(activeTool);
  }

  return Object.freeze({
    getDualsSnapshotFromUrl,
    handleDualsClick,
    handleHeaderDropdownChange,
    handleThemeChange,
    initializeHydratedApplication,
    initializeTheme,
    renderBootInputs,
    renderHeaderInputs,
    setFavicon,
  });
}

export { createAppShell };
