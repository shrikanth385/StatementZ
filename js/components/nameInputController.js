import { formatName, validateName } from "../core/nameUtils.js";

function createNameInputController({
  state,
  stateCommands,
  refreshWorkspaceOutput,
  renderWorkspaceTool,
  hasStatements,
}) {
  const stateUpdaters = Object.freeze({
    agent: (value) => {
      state.agentName = value;
    },
    customer: (value) => {
      state.customerName = value;
    },
  });

  function updateNameState(type, value) {
    const previousValue =
      type === "customer" ? state.customerName : state.agentName;
    stateUpdaters[type]?.(value);
    return previousValue !== value;
  }

  function resetCustomerWorkspace() {
    stateCommands.resetCustomerState();
    if (hasStatements()) renderWorkspaceTool("opening");
  }

  function refreshAfterNameInput(type, valueChanged = false) {
    if (type === "customer" && valueChanged) resetCustomerWorkspace();
    refreshWorkspaceOutput();
  }

  function handleInput(event) {
    const input = event.target.closest("[data-name-input]");
    if (!input) return;

    const type = input.dataset.nameInput;
    const warning = document.querySelector(`#${input.id}Warning`);
    const rawName = input.value;

    if (!rawName.trim()) {
      const valueChanged = type === "customer" && state.customerName !== "";
      warning.textContent = "";
      updateNameState(type, "");
      refreshAfterNameInput(type, valueChanged);
      return;
    }

    if (!validateName(rawName)) {
      warning.textContent = `Enter valid ${type} name`;
      return;
    }

    warning.textContent = "";
    const formattedName = formatName(rawName);
    input.value = formattedName;
    const valueChanged = updateNameState(type, formattedName);
    refreshAfterNameInput(type, valueChanged);
  }

  return Object.freeze({ handleInput });
}

export { createNameInputController };
