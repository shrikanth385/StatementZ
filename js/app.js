import { applyDataset, createButton, createElement, getAll } from "./core/domUtils.js";
import {
  clockPeriods,
  currencyOptions,
  dropdownLayout,
  state,
  stateCommands,
  stateQueries,
} from "./core/appState.js";
import { createStatementCatalog } from "./core/statementCatalog.js";
import { workspaceTools } from "./workspace/workspaceTools.js";
import { createCustomOutputBuilders } from "./workspace/workspaceOutputBuilders.js";
import { marketplaceOptions } from "./shell/marketplaceLinks.js";
import { createNotepadEditor } from "./components/notepadEditor.js";
import { createDropdownManager } from "./components/dropdownManager.js";
import { createDatePicker } from "./components/datePicker.js";
import { createClockCardCarousel } from "./components/clockCardCarousel.js";
import { createAlarmCountdown } from "./components/alarmCountdown.js";
import { createNameInputController } from "./components/nameInputController.js";
import { createClockSearch } from "./services/clockSearch.js";
import { createAppShell } from "./shell/appShell.js";
import { createWorkspaceManager } from "./workspace/workspaceManager.js";
import { createBellboy } from "./services/bellboy.js";
import { createInactiveBellboy } from "./services/inactiveBellboy.js";
import { formatName, validateName } from "./core/nameUtils.js";

"use strict";

window.name = "statementz";

/* =========================
   DOM REGISTRY
========================= */

const dom = {
  /* WORKSPACE */

  workspace: document.querySelector("#workspace"),

  sidebarScroll: document.querySelector(".sidebar-scroll"),

  /* HEADER */

  headerLeft: document.querySelector(".header-left"),

  dualsButton: document.querySelector("#dualsButton"),

  favicon: document.querySelector("#appFavicon"),

  themeToggle: document.querySelector("#themeToggle"),

  /* BOOT */

  bootScreen: document.querySelector("#bootScreen"),

  bootInputContainer: document.querySelector("#bootInputContainer"),

  /* DROPDOWNS */

  currencyDropdown: document.querySelector("#currencyDropdown"),

  currencyDropdownTrigger: document.querySelector("#currencyDropdownTrigger"),

  marketplaceDropdown: document.querySelector("#marketplaceDropdown"),

  marketplaceDropdownTrigger: document.querySelector("#marketplaceDropdownTrigger"),

  searchDropdown: document.querySelector(".dropdown"),

  /* CLOCK */

  time: document.querySelector(".time"),

  date: document.querySelector(".date"),

  location: document.querySelector(".clock-location"),

  indicator: document.querySelector(".indicator"),

  bellboyClockCard: document.querySelector("#bellboyClockCard"),

  bellboyClockNudge: document.querySelector("#bellboyClockNudge"),

  bellboyClockUpcoming: document.querySelector("#bellboyClockUpcoming"),

  bellboyClockAlarmLabel: document.querySelector("#bellboyClockAlarmLabel"),

  bellboyClockTimer: document.querySelector("#bellboyClockTimer"),

  /* SEARCH */

  searchInput: document.querySelector(".search-input"),
};

const selectors = {
  workspaceOutput: "#workspaceOutput",

  activeTool: ".tool-btn[data-tool].btn-active",

  allToolButtons: ".tool-btn[data-tool]",

  visibilityControls:
    "[data-visible-when-name], [data-visible-when-checkbox], [data-visible-when-not-checkbox], [data-visible-when-statement], [data-visible-when-all], [data-visible-when-any]",
};

const clockSearchWrapper = document.querySelector(".search-wrapper");
const alarmCountdown = createAlarmCountdown();
if (dom.bellboyClockTimer) dom.bellboyClockTimer.replaceChildren(alarmCountdown.element);
const clockCarousel = createClockCardCarousel({
  card: document.querySelector(".clock-card"),
  clockElements: [dom.location, dom.time, dom.date, dom.indicator],
  bellboyCard: dom.bellboyClockCard,
  searchWrapper: clockSearchWrapper,
  showBellboy: !new URL(window.location.href).searchParams.has("duals"),
});

function getWorkspaceOutput() {
  return document.querySelector(selectors.workspaceOutput);
}

function getActiveToolButton() {
  return document.querySelector(selectors.activeTool);
}

function getAgentNameInput() {
  return document.querySelector("#agentNameInput");
}

function getAgentNameWarning() {
  return document.querySelector("#agentNameInputWarning");
}

/* =========================
   STATEMENT DATA
========================= */

const statementCatalog = createStatementCatalog({ state, stateCommands });
// Begin loading the statement catalogue while the agent enters their name.
// initializeApplication awaits this same promise, avoiding a cold-start fetch
// after the Launch Workspace button is clicked.
const statementCatalogReady = statementCatalog.load().then(
  () => ({ error: null }),
  (error) => ({ error }),
);
const getCachedStatement = statementCatalog.getCached;
const getRandomStatement = statementCatalog.getRandom;
const refreshStatement = statementCatalog.refresh;
const interpolate = statementCatalog.interpolate;

const datePickerFormatterCache = new Map();

function getDatePickerFormatter(key, options) {
  if (!datePickerFormatterCache.has(key)) {
    datePickerFormatterCache.set(key, new Intl.DateTimeFormat("en-US", options));
  }

  return datePickerFormatterCache.get(key);
}

/* =========================
   APPLICATION BOOT
========================= */

async function initializeApplication({ initialTool = "opening", preserveState = false } = {}) {
  const catalogueResult = await statementCatalogReady;
  if (catalogueResult.error) {
    throw catalogueResult.error;
  }

  appShell.renderHeaderInputs();
  syncMarketplaceScopedActions();
  renderWorkspaceTool(initialTool, { preserveState });

  clockSearch.initializeDefaultLocation();
}

function getSelectedWorkspaceControls(controls) {
  return controls
    .map((control) =>
      control.querySelector(
        "[data-workspace-select-trigger], [data-statement-button].btn-active",
      ),
    )
    .filter(Boolean);
}

/* =========================
   WORKSPACE HELPERS
========================= */

function isCheckboxChecked(value) {
  return document.querySelector(`input[value="${value}"]`)?.checked;
}

function getSelectedRadioValue(groupName, fallbackValue = "") {
  return stateQueries.selectedRadio(groupName, fallbackValue);
}

function getPlaceholderValue(config) {
  const selectedValue = getSelectedRadioValue(config.radioGroupName);

  return config.mappings?.[selectedValue] || config.fallbackValue;
}

function getActiveWorkspaceContext() {
  const activeToolButton = getActiveToolButton();

  if (!activeToolButton) return null;

  const toolName = activeToolButton.dataset.tool;

  const tool = workspaceTools[toolName];

  if (!tool) return null;

  return {
    toolName,
    tool,
  };
}

function buildConditionalFragment(fragment) {
  if (!isCheckboxChecked(fragment.checkboxValue)) {
    return fragment.fallbackText || "";
  }

  const value =
    state.dynamicInputs[fragment.inputKey] || fragment.statementPlaceholder;

  return getCachedStatement(fragment.statementKey).replaceAll(
    fragment.statementPlaceholder,
    value,
  );
}

function getWorkspaceStatementKey(toolName, tool) {
  const overrideKey = getActiveStatementKey(tool);
  const selectedKey = state.selectedStatementKeys[toolName];

  return overrideKey !== tool.statementKey
    ? overrideKey
    : selectedKey || tool.statementKey;
}

function getAppendFragmentsText(tool) {
  return (tool.appendFragments || [])
    .filter((fragment) => isCheckboxChecked(fragment.checkboxValue))
    .map((fragment) => getCachedStatement(fragment.statementKey))
    .join("");
}

function getConditionalFragmentsText(tool) {
  return (tool.conditionalFragments || [])
    .map(buildConditionalFragment)
    .join("");
}

function appendAssurance(statement, tool) {
  if (!tool.appendAssurance) {
    return statement;
  }

  const normalizedStatement = statement.trim();
  const punctuation = /[.!?]$/.test(normalizedStatement) ? "" : ".";
  const separator = state.activeAssuranceStatement ? " " : "";

  return `${normalizedStatement}${punctuation}${separator}${state.activeAssuranceStatement}`;
}

function applyWorkspacePlaceholder(statement, tool) {
  if (!tool.placeholderSource) {
    return statement;
  }

  return statement.replaceAll(
    `\${${tool.placeholderSource.placeholder}}`,
    getPlaceholderValue(tool.placeholderSource),
  );
}

const isDualsPage = new URL(window.location.href).searchParams.has("duals");

const bellboy = isDualsPage
  ? createInactiveBellboy()
  : createBellboy({
      state,

      onRefreshOutput: () => {
        updateBellboyClockCard();

        if (getCurrentToolName() === "bellboy") {
          refreshWorkspaceOutput();
        }
      },
    });

const customOutputBuilders = Object.freeze({
  ...createCustomOutputBuilders({
  state,

  stateQueries,

  getCachedStatement,

  getDefaultStatement: () => statementCatalog.get("default"),

  getSelectedRadioValue,

  isCheckboxChecked,
  }),

  bellboy: () => bellboy.getWorkspaceOutput(),
});

function buildWorkspaceOutput(toolName) {
  const tool = workspaceTools[toolName];

  const customOutputBuilder = customOutputBuilders[tool.customOutput];

  if (customOutputBuilder) {
    return customOutputBuilder();
  }

  const statementKey = getWorkspaceStatementKey(toolName, tool);

  const statement = [
    getCachedStatement(statementKey),
    getAppendFragmentsText(tool),
    getConditionalFragmentsText(tool),
  ].join("");

  return applyWorkspacePlaceholder(appendAssurance(statement, tool), tool);
}

function getActiveStatementKey(tool) {
  const override = tool.statementOverrides?.find(({ checkboxValue }) =>
    isCheckboxChecked(checkboxValue),
  );

  return override?.statementKey || tool.statementKey;
}

function getWorkspaceStatement(toolName) {
  return interpolate(buildWorkspaceOutput(toolName));
}

function updateWorkspaceTextarea(toolName) {
  const output = getWorkspaceOutput();
  const statement = getWorkspaceStatement(toolName);

  if (output instanceof HTMLTextAreaElement) {
    output.value = statement;
    resizeTextareaToContent(output);
    return;
  }

  if (output?.classList.contains("bellboy-timer-output")) {
    const parts = bellboy.getWorkspaceOutputParts();
    let prefix = output.querySelector(".bellboy-timer-prefix");
    let timer = output.querySelector(".bellboy-timer-value");

    if (parts) {
      if (!prefix || !timer) {
        output.replaceChildren();
        prefix = document.createElement("span");
        prefix.className = "bellboy-timer-prefix";
        timer = document.createElement("span");
        timer.className = "bellboy-timer-value";
        output.append(prefix, timer);
      }

      prefix.textContent = `${parts.prefix} `;
      timer.textContent = bellboy.formatCountdown(parts.seconds);
    } else {
      output.replaceChildren();
      output.textContent = getWorkspaceStatement(toolName);
    }
    return;
  }

  if (output?.classList.contains("date-calculator-output")) {
    const [waitDate, contactDate] = statement.split("\n");
    output.querySelector('[data-date-result="wait"]').textContent = waitDate;
    output.querySelector('[data-date-result="contact"]').textContent = contactDate;
  }

}

function updateBellboyClockCard() {
  const card = dom.bellboyClockCard;
  if (!card || !clockCarousel.getTrack()) return;

  const nextAlarm = bellboy.getNextAlarmParts();
  const isArmed = Boolean(nextAlarm);

  card.dataset.armed = String(isArmed);
  dom.bellboyClockNudge.hidden = isArmed;
  dom.bellboyClockUpcoming.hidden = !isArmed;

  clockCarousel.updateAlarmState(isArmed);

  if (!isArmed) return;

  dom.bellboyClockAlarmLabel.textContent =
    `${nextAlarm.alarmName} ${nextAlarm.verb} in`;
  alarmCountdown.update({
    secondsRemaining: nextAlarm.seconds,
    occurrenceId: nextAlarm.occurrenceId,
  });
}

function refreshWorkspaceOutput() {
  const context = getActiveWorkspaceContext();

  if (!context) return;

  updateWorkspaceTextarea(context.toolName);
}

function prepareWorkspaceStatement(toolName) {
  const tool = workspaceTools[toolName];

  if (!tool?.statementKey) {
    return;
  }

  if (!state.activeFragments[tool.statementKey]) {
    refreshStatement(tool.statementKey);
  }

  if (!state.activeAssuranceStatement) {
    state.activeAssuranceStatement = getRandomStatement("assurance");
  }
}

/* =========================
   WORKSPACE COMPONENTS
========================= */

function resizeTextareaToContent(textarea) {
  textarea.style.height = "auto";

  textarea.style.height = `${textarea.scrollHeight}px`;
}

function getCurrentToolName() {
  return getActiveToolButton()?.dataset.tool || "opening";
}

/* =========================
   TOOL STATE
========================= */

function updateActiveTool(toolName) {
  getAll(selectors.allToolButtons).forEach((button) => {
    button.classList.toggle("btn-active", button.dataset.tool === toolName);
  });

  updateSidebarDropdownActiveStates(toolName);
}

function updateSidebarDropdownActiveStates(toolName) {
  getAll(".sidebar-dropdown").forEach((dropdown) => {
    const trigger = dropdown.previousElementSibling;
    const hasActiveChild = Boolean(
      dropdown.querySelector(`.tool-btn[data-tool="${toolName}"]`),
    );

    trigger?.classList.toggle("btn-active", hasActiveChild);

    if (!hasActiveChild) {
      trigger?.setAttribute("aria-expanded", "false");
    }
  });
}

function syncMarketplaceScopedActions() {
  getAll("[data-visible-marketplace]").forEach((element) => {
    element.classList.toggle(
      "hidden",
      element.dataset.visibleMarketplace !== state.activeMarketplace,
    );
  });
}

const sidebarDropdownTriggers = {
  apologyDropdownTrigger: "apologyDropdown",

  probingDropdownTrigger: "probingDropdown",

  concessionDropdownTrigger: "concessionDropdown",

  returnsDropdownTrigger: "returnsDropdown",
};

const dropdownTriggerMap = {
  currencyDropdownTrigger: "currencyDropdown",

  marketplaceDropdownTrigger: "marketplaceDropdown",

  ...sidebarDropdownTriggers,
};

const clockSearch = createClockSearch({
  clockPeriods,

  createElement,

  elements: {
    date: dom.date,
    indicator: dom.indicator,
    location: dom.location,
    searchDropdown: dom.searchDropdown,
    searchInput: dom.searchInput,
    time: dom.time,
  },

  state,
});

let datePicker;

const workspaceManager = createWorkspaceManager({
  applyDataset,

  createButton,

  createElement,

  createBellboyLocationSearch: () => clockSearch.createBellboyLocationSearch({
    location: bellboy.getLocationPreference(),
    onSelect: bellboy.setLocationPreference,
  }),

  customOutputBuilders,

  getActiveWorkspaceContext,

  getAll,

  getDatePicker: () => datePicker,

  getSelectedRadioValue,

  getSelectedWorkspaceControls,

  getWorkspaceStatement,

  getWorkspaceStatementKey,

  interpolate,

  isCheckboxChecked,

  onActiveToolChange: updateActiveTool,

  onBellboyTimeSelection: bellboy.handleSelect,

  onStateReset: (toolName, tool) => {
    stateCommands.resetWorkspaceToolState(
      toolName,
      tool.statementKey,
      tool.initialSelectedCheckboxes,
    );
  },

  prepareWorkspaceStatement,

  refreshStatement,

  refreshWorkspaceOutput,

  resizeTextareaToContent,

  selectors,

  state,

  stateCommands,

  visibilitySelector: selectors.visibilityControls,

  workspaceElement: dom.workspace,

  workspaceTools,
});

const dropdownManager = createDropdownManager({
  dropdownLayout,

  dropdownTriggerMap,

  getAll,

  onWorkspaceSelection: workspaceManager.handleWorkspaceSelection,

  setSearchDropdownVisible: clockSearch.setSearchDropdownVisible,

  sidebarDropdownTriggers,
});

datePicker = createDatePicker({
  createButton,

  createElement,

  getCachedDateTimeFormatter: getDatePickerFormatter,

  onCloseDropdowns: dropdownManager.closeAll,

  onPositionDropdown: dropdownManager.positionWorkspaceAnchoredDropdown,
});

const notepadEditor = createNotepadEditor({
  createElement,

  createWorkspaceOptionButton: workspaceManager.createWorkspaceOptionButton,

  createWorkspaceSection: workspaceManager.createWorkspaceSection,

  getAll,

  getWorkspaceRoot: () => dom.workspace,

  refreshWorkspaceOutput,

  state,

  stateCommands,
});

const { createInputField } = workspaceManager;

function renderWorkspaceTool(toolName, options = {}) {
  workspaceManager.renderWorkspaceTool(toolName, {
    ...options,
    bellboyControl: bellboy.createControl,
    notepadControl: notepadEditor.createNotepadControl,
  });
}

const nameInputController = createNameInputController({
  state,
  stateCommands,
  refreshWorkspaceOutput,
  renderWorkspaceTool,
  hasStatements: () => statementCatalog.has("firstContact"),
});

const appShell = createAppShell({
  createInputField,

  currencyOptions,

  dropdownManager,

  elements: {
    bootInputContainer: dom.bootInputContainer,
    bootScreen: dom.bootScreen,
    currencyDropdown: dom.currencyDropdown,
    currencyDropdownTrigger: dom.currencyDropdownTrigger,
    dualsButton: dom.dualsButton,
    favicon: dom.favicon,
    headerLeft: dom.headerLeft,
    marketplaceDropdown: dom.marketplaceDropdown,
    marketplaceDropdownTrigger: dom.marketplaceDropdownTrigger,
    themeToggle: dom.themeToggle,
  },

  marketplaceOptions,

  onRefreshWorkspaceOutput: refreshWorkspaceOutput,

  onRenderWorkspaceTool: async (
    toolName,
    { preserveState = false, shouldRenderHeader = false } = {},
  ) => {
    if (shouldRenderHeader) {
      await initializeApplication({
        initialTool: toolName,
        preserveState,
      });

      return;
    }

    renderWorkspaceTool(toolName, { preserveState });
  },

  state,

  stateCommands,

  stateQueries,
});

/* =========================
   EVENT ORCHESTRATION
========================= */

document.addEventListener("click", handleClickEvents);

document.addEventListener("mousedown", handleMouseDownEvents);

document.addEventListener("input", handleInputEvents);

document.addEventListener("change", handleChangeEvents);
document.addEventListener("keydown", handleKeydownEvents);

document.addEventListener("selectionchange", handleSelectionChangeEvents);

function handleInputEvents(event) {
  bellboy.handleInput(event);

  nameInputController.handleInput(event);

  notepadEditor.handleInput(event);

  workspaceManager.handleStatementInput(event);

  clockSearch.handleInput(event);
}

function handleChangeEvents(event) {
  bellboy.handleChange(event);

  appShell.handleThemeChange(event);

  appShell.handleHeaderDropdownChange(event);
  syncMarketplaceScopedActions();

  datePicker.handleChange(event.target);

  workspaceManager.handleConditionalInputChange(event);
}

function handleMouseDownEvents(event) {
  if (event.target.closest("[data-notepad-command]")) {
    event.preventDefault();
  }
}

function handleKeydownEvents(event) {
  dropdownManager.handleWorkspaceSelectKeydown(event);
  clockSearch.handleKeydown?.(event);
}

function handleSelectionChangeEvents() {
  notepadEditor.updateToolbarState();
}

/* =========================
   CLICK HANDLERS
========================= */

async function handleClickEvents(event) {
  bellboy.handleClick(event);

  const button = event.target.closest("button");

  const dropdownItem = event.target.closest(".dropdown-item");

  datePicker.handleClick(event, button);

  dropdownManager.handleTriggerClick(button);

  dropdownManager.handleWorkspaceSelectClick(button);

  workspaceManager.handleStatementButtonClick(button);

  await notepadEditor.handleToolbarClick(button);

  appShell.handleDualsClick(button, getCurrentToolName());

  handleToolNavigation(button);

  await workspaceManager.handleCopyButton(button);

  await handleBootLaunch(button);

  clockSearch.handleDropdownSelection(dropdownItem);
}

function handleToolNavigation(button) {
  if (!button?.matches("[data-tool]")) {
    return;
  }

  if (isDualsPage && button.dataset.tool === "bellboy") {
    return;
  }

  dropdownManager.closeAll();
  renderWorkspaceTool(button.dataset.tool);
}

async function handleBootLaunch(button) {
  if (!button?.matches("#startApplication")) {
    return;
  }

  const input = getAgentNameInput();

  const warning = getAgentNameWarning();

  const rawName = input.value.trim();

  if (!validateName(rawName)) {
    warning.textContent = "Enter valid agent name";

    return;
  }

  state.agentName = formatName(rawName);

  try {
    await initializeApplication();
    dom.bootScreen.classList.add("hidden");
  } catch (error) {
    console.error("StatementZ could not initialize.", error);
    warning.textContent =
      "StatementZ could not load its statement library. Check your connection and reload the page.";
  }
}

/* =========================
   OUTSIDE CLICK
========================= */

document.addEventListener("pointerdown", (event) => {
  const insideSearch = event.target.closest(".search-wrapper");

  const insideDropdownWrapper = event.target.closest(".dropdown-wrapper");

  const insideAppDropdown = event.target.closest(".app-dropdown");

  if (!insideSearch && !insideDropdownWrapper && !insideAppDropdown) {
    dropdownManager.closeAll();
  }
});

window.addEventListener("resize", dropdownManager.scheduleReposition);

document.addEventListener("scroll", dropdownManager.handleScrollReposition, true);

/* =========================
   INIT
========================= */

setInterval(() => {
  clockSearch.updateClock();
  bellboy.tick();
  updateBellboyClockCard();
}, 1000);

if (!isDualsPage) {
  bellboy.tick();
}

updateBellboyClockCard();

appShell.initializeTheme();

const dualsSnapshot = appShell.getDualsSnapshotFromUrl();
document.body.classList.toggle("duals-page", isDualsPage);

appShell.setFavicon(dualsSnapshot ? "dual" : "default");

if (dualsSnapshot) {
  await appShell.initializeHydratedApplication(dualsSnapshot);
} else {
  // The boot form is static HTML; JavaScript only enhances its behavior.
  appShell.renderBootInputs();

  dropdownManager.initializeTriggerAccessibility();
}

clockSearch.updateClock();
