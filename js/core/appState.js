const state = {
  currentLocationLabel: "",

  currentTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

  agentName: "",

  customerName: "",

  dynamicInputs: {},

  activeFragments: {},

  selectedRadios: {},

  selectedCheckboxes: {},

  selectedStatementKeys: {},

  activeCurrency: "$",

  activeMarketplace: "US",

  activeAssuranceStatement: "",

};

const workspaceToolStateKeys = Object.freeze([
  "activeFragments",
  "dynamicInputs",
  "selectedRadios",
  "selectedCheckboxes",
]);

const serializableStateKeys = Object.freeze([
  "agentName",
  "customerName",
  "dynamicInputs",
  "activeFragments",
  "selectedRadios",
  "selectedCheckboxes",
  "selectedStatementKeys",
  "activeCurrency",
  "activeMarketplace",
  "activeAssuranceStatement",
  "currentLocationLabel",
  "currentTimezone",
]);

const recordStateKeys = new Set([
  ...workspaceToolStateKeys,
  "selectedStatementKeys",
]);

const customerResetPreservedDynamicInputs = Object.freeze([
  "notepadContent",
  "notepadHtml",
]);

function cloneStateValue(key, value) {
  return recordStateKeys.has(key) ? { ...value } : value;
}

const currencyOptions = Object.freeze([
  { label: "USD $", value: "$" },
  { label: "CAD CA$", value: "CA$" },
  { label: "EUR \u20ac", value: "\u20ac" },
  { label: "GBP \u20a4", value: "\u20a4" },
  { label: "JPY \u00a5", value: "\u00a5" },
  { label: "INR \u20b9", value: "\u20b9" },
]);

const refundMethodDetails = Object.freeze({
  originalPaymentMethod: {
    label: "original payment method",

    timeline: "5-7 business days",
  },

  amazonGiftCard: {
    label: "Amazon Gift Card balance",

    timeline: "2-3 hours",
  },
});

const clockPeriods = Object.freeze([
  { start: 6, end: 12, label: "🌅 Morning" },
  { start: 12, end: 17, label: "☀️ Afternoon" },
  { start: 17, end: 21, label: "🌆 Evening" },
  { start: 21, end: 24, label: "🌙 Night" },
  { start: 0, end: 6, label: "🌙 Night" },
]);

const dropdownLayout = Object.freeze({
  offsetRem: 0.625,

  viewportPaddingRem: 0.75,
});

const stateQueries = Object.freeze({
  selectedRadio(groupName, fallbackValue = "") {
    return state.selectedRadios[groupName] ?? fallbackValue;
  },

  refundDetails() {
    return (
      refundMethodDetails[stateQueries.selectedRadio("refundMethod")] ||
      refundMethodDetails.originalPaymentMethod
    );
  },

  serializableSnapshot() {
    return Object.fromEntries(
      serializableStateKeys.map((key) => [key, cloneStateValue(key, state[key])]),
    );
  },
});

const stateCommands = Object.freeze({
  resetWorkspaceToolState(
    toolName,
    statementKey = "",
    initialSelectedCheckboxes = [],
  ) {
    workspaceToolStateKeys.forEach((key) => {
      if (key !== "dynamicInputs") {
        state[key] = {};
      }
    });

    state.selectedCheckboxes = Object.fromEntries(
      initialSelectedCheckboxes.map((value) => [value, true]),
    );

    state.selectedStatementKeys[toolName] = statementKey;
  },

  resetCustomerState() {
    const preservedDynamicInputs = Object.fromEntries(
      customerResetPreservedDynamicInputs
        .filter((key) => Object.hasOwn(state.dynamicInputs, key))
        .map((key) => [key, state.dynamicInputs[key]]),
    );

    workspaceToolStateKeys.forEach((key) => {
      state[key] = {};
    });

    state.dynamicInputs = preservedDynamicInputs;
    state.selectedStatementKeys = {};
    state.activeAssuranceStatement = "";
  },

  hydrate(snapshot) {
    if (!snapshot) {
      return;
    }

    Object.assign(
      state,
      Object.fromEntries(
        serializableStateKeys
          .filter((key) => Object.hasOwn(snapshot, key))
          .map((key) => [key, cloneStateValue(key, snapshot[key])]),
      ),
    );
  },

  setActiveFragment(key, value) {
    state.activeFragments[key] = value;
  },

  setDynamicInput(key, value) {
    state.dynamicInputs[key] = value;
  },

  setSelectedRadio(groupName, value) {
    state.selectedRadios[groupName] = value;
  },

  setSelectedCheckbox(value, checked) {
    if (checked) {
      state.selectedCheckboxes[value] = true;

      return;
    }

    delete state.selectedCheckboxes[value];
  },

  setSelectedStatementKey(toolName, value) {
    state.selectedStatementKeys[toolName] = value;
  },
});

export {
  clockPeriods,
  currencyOptions,
  dropdownLayout,
  state,
  stateCommands,
  stateQueries,
};
