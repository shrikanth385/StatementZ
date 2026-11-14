import { createWorkspaceSelect, setWorkspaceSelectValue } from "./workspaceSelect.js";

const workspaceControlRenderOrder = Object.freeze({
  button: 0,
  select: 0,
  checkbox: 1,
  input: 2,
  inputRow: 2,
  link: 3,
  notepad: 4,
});

function createWorkspaceManager({
  applyDataset,
  createButton,
  createBellboyLocationSearch = () => null,
  createElement,
  customOutputBuilders,
  getActiveWorkspaceContext,
  getAll,
  getDatePicker,
  getSelectedRadioValue,
  getSelectedWorkspaceControls,
  getWorkspaceStatement,
  getWorkspaceStatementKey,
  interpolate,
  isCheckboxChecked,
  onActiveToolChange,
  onBellboyTimeSelection = () => {},
  onStateReset,
  prepareWorkspaceStatement,
  refreshStatement,
  refreshWorkspaceOutput,
  resizeTextareaToContent,
  selectors,
  state,
  stateCommands,
  visibilitySelector,
  workspaceElement,
  workspaceTools,
}) {
  const visibilityTimers = new WeakMap();

  function createCopyButton(
    selector,
    {
      label = "Copy",
      dataset = {},
      className = "",
      isWorkspaceCopyButton = true,
    } = {},
  ) {
    const copyDataset = {
      copyTarget: selector,
      ...dataset,
    };

    if (isWorkspaceCopyButton) {
      copyDataset.workspaceCopyButton = "";
    }

    return createButton({
      className: `workspace-copy-btn ${className}`.trim(),
      textContent: label,
      dataset: copyDataset,
    });
  }

  function getCopyText(button) {
    const builderName = button.dataset.copyBuilder;

    if (builderName) {
      return interpolate(customOutputBuilders[builderName]?.() || "");
    }

    const element = document.querySelector(button.dataset.copyTarget);

    return element ? element.value || element.innerText || element.textContent : "";
  }

  async function handleCopyButton(button) {
    if (!button?.matches("[data-copy-target]")) {
      return;
    }

    const text = getCopyText(button);

    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);

      const originalText = button.textContent;

      button.textContent = "Copied!";

      setTimeout(() => {
        button.textContent = originalText;
      }, 1500);
    } catch (error) {
      console.error(error);
    }
  }

  function createWorkspaceSection({ title, controlType, className = "" }) {
    const wrapper = document.createElement("div");
    const heading = document.createElement("h3");

    wrapper.className = `workspace-section ${className}`.trim();
    wrapper.dataset.controlType = controlType;
    heading.textContent = title;

    return { wrapper, heading };
  }

  function createWorkspaceOptionButton({
    className = "",
    textContent,
    dataset,
    attributes = {},
    isActive,
  }) {
    return createButton({
      className: `workspace-control-btn ${className}`.trim(),
      textContent,
      dataset,
      attributes,
      isActive,
    });
  }

  function createOptionGroup({
    type,
    name = "",
    options,
    selectedValue = "",
    className = "",
    wrapperDataset = {},
  }) {
    const { wrapper } = createWorkspaceSection({
      title: "",
      controlType: type,
      className,
    });
    const optionsWrapper = document.createElement("div");

    applyDataset(wrapper, wrapperDataset);
    optionsWrapper.className = `workspace-${type}-group`;

    options.forEach((option) => {
      const label = document.createElement("label");
      const input = document.createElement("input");

      label.className = `workspace-control-btn workspace-${type}-option`;
      input.type = type;
      input.value = option.value;

      if (type === "radio") {
        input.name = name;
        input.checked =
          option.value === (state.selectedRadios[name] ?? selectedValue);
      }

      if (type === "checkbox") {
        input.checked = Boolean(state.selectedCheckboxes[option.value]);
        if (option.resetStatementInputs?.length) {
          input.dataset.resetStatementInputs = JSON.stringify(
            option.resetStatementInputs,
          );
        }
      }

      label.append(input, option.label);
      optionsWrapper.appendChild(label);
    });

    wrapper.appendChild(optionsWrapper);

    return wrapper;
  }

  function createSelectGroup({
    title,
    id = "",
    name,
    options,
    selectedValue = "",
    wrapperDataset = {},
  }) {
    const activeValue = state.selectedRadios[name] ?? selectedValue;
    const selectedOption = options.find(
      (option) => option.value === activeValue,
    );
    const { wrapper, heading } = createWorkspaceSection({
      title,
      controlType: "select",
    });
    applyDataset(wrapper, wrapperDataset);
    const select = createWorkspaceSelect({
      id,
      name,
      options,
      selectedValue: selectedOption?.value || "",
    });
    wrapper.append(heading, select.wrapper);

    return wrapper;
  }

  function createCheckboxGroup(config) {
    return createOptionGroup({
      ...config,
      type: "checkbox",
    });
  }

  function appendInputField(wrapper, config) {
    const heading = document.createElement("label");
    const hasDatePicker = config.type === "date";
    const input = document.createElement(config.multiline ? "textarea" : "input");
    const warning = document.createElement("small");

    heading.textContent = config.label;
    heading.setAttribute("for", config.id);

    input.className = `workspace-input ${
      config.multiline ? "workspace-textarea-input" : ""
    }`.trim();

    if (!config.multiline) {
      input.type = hasDatePicker ? "text" : config.type || "text";
    }

    input.placeholder = config.placeholder || (hasDatePicker ? "Select date" : "");
    input.value =
      state.dynamicInputs[config.dataset?.statementInput] ?? config.value ?? "";
    input.id = config.id;

    if (hasDatePicker) {
      input.readOnly = true;
      input.dataset.datePickerInput = "";
    }

    if (config.multiline) {
      input.rows = config.rows || 3;
    }

    applyDataset(input, config.dataset);

    warning.className = "input-warning";
    warning.id = `${config.id}Warning`;

    if (hasDatePicker) {
      const datePickerWrapper = createElement("div", {
        className: "workspace-date-picker-wrapper",
      });

      datePickerWrapper.append(input, getDatePicker().createMenu(config.id));
      wrapper.append(heading, datePickerWrapper, warning);

      return;
    }

    wrapper.append(heading, input, warning);
  }

  function createInputField({
    label,
    type = "text",
    multiline = false,
    rows = 3,
    placeholder = "",
    value = "",
    id = "",
    className = "",
    dataset = {},
    wrapperDataset = {},
  }) {
    const { wrapper } = createWorkspaceSection({
      title: "",
      controlType: "input",
      className,
    });

    applyDataset(wrapper, wrapperDataset);
    appendInputField(wrapper, {
      label,
      type,
      multiline,
      rows,
      placeholder,
      value,
      id,
      dataset,
    });

    return wrapper;
  }

  function createInputRow({ fields, className = "", wrapperDataset = {} }) {
    const { wrapper } = createWorkspaceSection({
      title: "",
      controlType: "inputRow",
      className: `workspace-input-row ${className}`.trim(),
    });

    applyDataset(wrapper, wrapperDataset);

    fields.forEach((field) => {
      const fieldWrapper = document.createElement("div");

      fieldWrapper.className = "workspace-input-row-item";
      appendInputField(fieldWrapper, field);
      wrapper.appendChild(fieldWrapper);
    });

    return wrapper;
  }

  function createStatementButtonGroup({
    options,
    selectedValue = "",
    name = "",
    wrapperDataset = {},
  }) {
    const { wrapper } = createWorkspaceSection({
      title: "",
      controlType: "button",
    });

    applyDataset(wrapper, wrapperDataset);
    const group = document.createElement("div");
    const context = getActiveWorkspaceContext();
    const activeValue =
      (name ? state.selectedRadios[name] : state.selectedStatementKeys[context?.toolName]) ??
      selectedValue;

    group.className = "workspace-statement-button-group";

    options.forEach((option) => {
      group.appendChild(
        createWorkspaceOptionButton({
          className: "workspace-statement-button",
          textContent: option.label,
          dataset: {
            statementButton: "",
            value: option.value,
            ...(name ? { name } : {}),
          },
          isActive: option.value === activeValue,
        }),
      );
    });

    wrapper.appendChild(group);

    return wrapper;
  }

  function createLinkButton({ label, href, className = "", wrapperDataset = {} }) {
    const { wrapper } = createWorkspaceSection({
      title: "",
      controlType: "link",
      className,
    });
    const link = createElement("a", {
      className: "workspace-control-btn workspace-action-button",
      textContent: label,
      attributes: {
        href,
        target: "_blank",
        rel: "noopener noreferrer",
      },
    });

    applyDataset(wrapper, wrapperDataset);
    wrapper.appendChild(link);

    return wrapper;
  }

  function createWorkspaceControlRenderer({ notepadControl, bellboyControl }) {
    const workspaceControlRenderers = Object.freeze({
      checkbox: createCheckboxGroup,
      bellboy: bellboyControl,
      input: createInputField,
      inputRow: createInputRow,
      link: createLinkButton,
      notepad: notepadControl,
      select: createSelectGroup,
      statementButton: createStatementButtonGroup,
    });

    return function createWorkspaceControl(controlConfig) {
      const renderer = workspaceControlRenderers[controlConfig.type];

      if (!renderer) {
        throw new Error(`Unsupported workspace control: ${controlConfig.type}`);
      }

      return renderer(controlConfig.config);
    };
  }

  const visibilityMatchers = Object.freeze({
    visibleWhenCheckbox: (value) => isCheckboxChecked(value),
    visibleWhenName: (value, condition) =>
      getSelectedRadioValue(value) === condition.visibleWhenValue,
    visibleWhenNotCheckbox: (value) => !isCheckboxChecked(value),
    visibleWhenStatement: (value) => {
      const context = getActiveWorkspaceContext();

      return context
        ? state.selectedStatementKeys[context.toolName] === value
        : false;
    },
  });

  function matchesVisibilityCondition(condition) {
    return Object.entries(visibilityMatchers).every(([key, matcher]) => {
      const value = condition[key];

      return value ? matcher(value, condition) : true;
    });
  }

  function shouldShowConditionalControl(control) {
    const { visibleWhenAny, visibleWhenAll } = control.dataset;

    if (visibleWhenAny) {
      return JSON.parse(visibleWhenAny).some((condition) =>
        matchesVisibilityCondition(condition),
      );
    }

    if (visibleWhenAll) {
      return JSON.parse(visibleWhenAll).every((condition) =>
        matchesVisibilityCondition(condition),
      );
    }

    return matchesVisibilityCondition(control.dataset);
  }

  function finishControlExit(control) {
    control.classList.add("hidden");
    control.classList.remove("workspace-control-exiting");
    control.style.removeProperty("--workspace-control-height");
    visibilityTimers.delete(control);
  }

  function clearControlVisibilityTimer(control) {
    const timer = visibilityTimers.get(control);

    if (timer) {
      clearTimeout(timer);
      visibilityTimers.delete(control);
    }
  }

  function setConditionalControlVisibility(control, shouldShow) {
    clearControlVisibilityTimer(control);

    if (shouldShow) {
      control.classList.remove("hidden", "workspace-control-exiting");
      control.style.removeProperty("--workspace-control-height");

      return;
    }

    if (control.classList.contains("hidden")) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishControlExit(control);

      return;
    }

    control.style.setProperty(
      "--workspace-control-height",
      `${control.scrollHeight}px`,
    );
    void control.offsetHeight;
    control.classList.add("workspace-control-exiting");
    visibilityTimers.set(
      control,
      setTimeout(() => finishControlExit(control), 280),
    );
  }

  function updateConditionalControlVisibility(root = document) {
    getAll(visibilitySelector, root).forEach((control) => {
      setConditionalControlVisibility(
        control,
        shouldShowConditionalControl(control),
      );
    });
  }

  function setSelectedStatementFromControl(context, control) {
    if (control.dataset.name) {
      stateCommands.setSelectedRadio(control.dataset.name, control.dataset.value);
    }

    const isPlaceholderOnlyRadio =
      control.dataset.name &&
      (context.tool.placeholderSource || context.tool.customOutput) &&
      control.dataset.name !== context.tool.statementRadioGroupName;

    if (!isPlaceholderOnlyRadio) {
      stateCommands.setSelectedStatementKey(
        context.toolName,
        control.dataset.value,
      );
    }
  }

  function resetWorkspaceCopyTarget() {
    const container = workspaceElement.querySelector(".workspace-container");
    const copyButton = container?.querySelector("[data-workspace-copy-button]");

    if (copyButton) {
      copyButton.dataset.copyTarget = selectors.workspaceOutput;
    }
  }

  function refreshSelectedWorkspaceStatement(context) {
    refreshStatement(getWorkspaceStatementKey(context.toolName, context.tool));
  }

  function syncWorkspaceSelectUi(optionButton) {
    const wrapper = optionButton.closest(".workspace-select-wrapper");
    setWorkspaceSelectValue(wrapper, optionButton.dataset.value);
  }

  function handleWorkspaceSelection(optionButton) {
    if (!optionButton) return;

    if (optionButton.matches("[data-bellboy-time-option]")) {
      syncWorkspaceSelectUi(optionButton);
      onBellboyTimeSelection(optionButton);
      return;
    }

    const context = getActiveWorkspaceContext();

    if (!context) return;

    syncWorkspaceSelectUi(optionButton);
    setSelectedStatementFromControl(context, optionButton);
    resetWorkspaceCopyTarget();
    refreshSelectedWorkspaceStatement(context);
    updateConditionalControlVisibility(workspaceElement);
    refreshWorkspaceOutput();
  }

  function handleStatementButtonClick(button) {
    if (!button?.matches("[data-statement-button]")) {
      return;
    }

    const context = getActiveWorkspaceContext();

    if (!context) return;

    setSelectedStatementFromControl(context, button);

    const buttonSelector = button.dataset.name
      ? `[data-statement-button][data-name="${button.dataset.name}"]`
      : "[data-statement-button]";

    getAll(buttonSelector, workspaceElement).forEach((statementButton) => {
      statementButton.classList.toggle(
        "btn-active",
        statementButton === button,
      );
    });

    updateConditionalControlVisibility(workspaceElement);
    refreshSelectedWorkspaceStatement(context);
    refreshWorkspaceOutput();
  }

  function handleStatementInput(event) {
    const statementInput = event.target.closest("[data-statement-input]");

    if (!statementInput) return;

    stateCommands.setDynamicInput(
      statementInput.dataset.statementInput,
      statementInput.value.trim(),
    );
    resetWorkspaceCopyTarget();
    refreshWorkspaceOutput();
  }

  function getConditionalFragmentByCheckbox(value) {
    const context = getActiveWorkspaceContext();

    return context?.tool.conditionalFragments?.find(
      (fragment) => fragment.checkboxValue === value,
    );
  }

  const mutuallyExclusiveCheckboxes = {
    issuingPromoCredits: ["promoGuide"],
    promoGuide: ["issuingPromoCredits"],
  };

  function handleConditionalInputChange(event) {
    const checkbox = event.target;

    if (checkbox.type !== "checkbox" || !checkbox.value) {
      return;
    }

    stateCommands.setSelectedCheckbox(checkbox.value, checkbox.checked);

    if (checkbox.checked && checkbox.dataset.resetStatementInputs) {
      const inputKeys = JSON.parse(checkbox.dataset.resetStatementInputs);
      const statementInputs = workspaceElement.querySelectorAll(
        "[data-statement-input]",
      );

      inputKeys.forEach((inputKey) => {
        stateCommands.setDynamicInput(inputKey, "");
        statementInputs.forEach((input) => {
          if (input.dataset.statementInput === inputKey) {
            input.value = "";
          }
        });
      });
    }

    if (checkbox.checked) {
      (mutuallyExclusiveCheckboxes[checkbox.value] || []).forEach((value) => {
        stateCommands.setSelectedCheckbox(value, false);

        const otherCheckbox = workspaceElement.querySelector(
          `input[type="checkbox"][value="${value}"]`,
        );

        if (otherCheckbox) {
          otherCheckbox.checked = false;
        }
      });
    }

    if (!checkbox.checked) {
      const fragment = getConditionalFragmentByCheckbox(checkbox.value);

      delete state.activeFragments[fragment?.statementKey];
    }

    updateConditionalControlVisibility(workspaceElement);
    resetWorkspaceCopyTarget();

    const context = getActiveWorkspaceContext();

    if (context) {
      refreshSelectedWorkspaceStatement(context);
    }

    refreshWorkspaceOutput();
  }

  function createWorkspaceHeaderAction(action) {
    if (action.type === "bellboy-location-search") {
      return createBellboyLocationSearch();
    }

    if (action.type === "button") {
      return createButton({
        className: "workspace-copy-btn",
        textContent: action.label,
        dataset: action.dataset || {},
      });
    }

    if (action.type !== "copy") {
      return null;
    }

    return createCopyButton(action.target || "", {
      label: action.label || "Copy",
      className: action.className || "",
      isWorkspaceCopyButton: action.workspaceCopyButton !== false,
      dataset: {
        ...(action.builder && { copyBuilder: action.builder }),
        ...(action.visibleWhenCheckbox && {
          visibleWhenCheckbox: action.visibleWhenCheckbox,
        }),
      },
    });
  }

  function createWorkspaceHeader(tool) {
    const header = document.createElement("div");
    const title = document.createElement("h2");
    const headerActions = tool.headerActions || [];

    header.className = "workspace-header";
    title.className = "workspace-title";
    title.textContent = tool.title;
    header.append(title);

    if (headerActions.length) {
      const actions = document.createElement("div");

      actions.className = "workspace-actions";

      actions.append(
        ...headerActions.map(createWorkspaceHeaderAction).filter(Boolean),
      );
      header.appendChild(actions);
    }

    return header;
  }

  function createWorkspaceTextarea({
    id,
    className,
    value = "",
    hidden = false,
    placeholder = "",
  }) {
    const textarea = document.createElement("textarea");

    textarea.id = id;
    textarea.className = className;
    textarea.readOnly = true;
    textarea.value = value;

    if (hidden) {
      textarea.tabIndex = -1;
      textarea.setAttribute("aria-hidden", "true");
    }

    if (placeholder) {
      textarea.placeholder = placeholder;
    }

    return textarea;
  }

  function createWorkspaceOutput(toolName, tool) {
    if (tool.richOutput) {
      const output = createElement("div", {
        className: "workspace-output workspace-rich-output",
        attributes: {
          id: "workspaceOutput",
        },
      });
      const link = createElement("a", {
        textContent: tool.richOutput.linkText,
        attributes: {
          href: tool.richOutput.href,
          target: "_blank",
          rel: "noopener noreferrer",
        },
      });

      output.append(tool.richOutput.textBefore, link);

      return output;
    }

    if (tool.customOutput === "dateCalculator") {
      const output = createElement("div", {
        className: "workspace-output date-calculator-output",
        attributes: {
          id: "workspaceOutput",
          role: "group",
          "aria-label": "Calculated wait and contact dates",
        },
      });
      const [waitDate, contactDate] = getWorkspaceStatement(toolName).split("\n");
      const results = [
        {
          title: "Wait Date",
          description: "Customer needs to wait until",
          date: waitDate,
          dateResult: "wait",
          outputId: "waitDateOutput",
        },
        {
          title: "Contact Date",
          description: "Customer should contact us",
          date: contactDate,
          dateResult: "contact",
          outputId: "contactDateOutput",
        },
      ];

      output.append(
        ...results.map(({ title, description, date, dateResult, outputId }) => {
          const result = createElement("section", {
            className: "date-calculator-result",
          });
          const dateOutput = createElement("div", {
            className: "date-calculator-result-date",
            textContent: date,
            dataset: { dateResult },
            attributes: { id: outputId },
          });

          result.append(
            createElement("h3", { textContent: title }),
            createElement("p", { textContent: description }),
            dateOutput,
            createCopyButton(`#${outputId}`, {
              label: `Copy ${title}`,
              isWorkspaceCopyButton: false,
            }),
          );
          return result;
        }),
      );

      return output;
    }

    const hidden = Boolean(tool.hideOutput);

    if (tool.customOutput === "bellboy" && !hidden) {
      return createElement("div", {
        className: `workspace-output ${tool.outputClass || ""} bellboy-timer-output`.trim(),
        attributes: {
          id: "workspaceOutput",
          role: "status",
          "aria-live": "polite",
          "aria-atomic": "true",
        },
      });
    }

    const textarea = createWorkspaceTextarea({
      id: "workspaceOutput",
      className: hidden
        ? "workspace-hidden-copy-target"
        : `workspace-output ${tool.outputClass || ""}`.trim(),
      hidden,
      placeholder: hidden ? "" : "Generated statement will appear here...",
    });

    prepareWorkspaceStatement(toolName);
    textarea.value = getWorkspaceStatement(toolName);
    requestAnimationFrame(() => resizeTextareaToContent(textarea));

    return textarea;
  }

  function getWorkspaceControlRenderRank(control, tool) {
    const controlType = control.dataset.controlType;
    const overrideRank = tool.controlRenderOrder?.[controlType];

    return overrideRank ?? workspaceControlRenderOrder[controlType] ?? 99;
  }

  function distributeWorkspaceControls(controls, tool) {
    const controlsLayout = document.createElement("div");

    controlsLayout.className = `workspace-controls-layout ${
      tool.controlsLayoutClass || ""
    }`.trim();

    controlsLayout.append(
      ...controls
        .map((control, index) => ({ control, index }))
        .sort(
          (left, right) =>
            getWorkspaceControlRenderRank(left.control, tool) -
              getWorkspaceControlRenderRank(right.control, tool) ||
            left.index - right.index,
        )
        .map(({ control }) => control),
    );

    return controlsLayout;
  }

  function createConditionalFragmentControlConfigs(fragment) {
    return [
      {
        type: "checkbox",
        config: {
          className: "workspace-inline-checkbox",
          options: [
            {
              label: fragment.checkboxLabel,
              value: fragment.checkboxValue,
            },
          ],
        },
      },
      ...(fragment.inputKey
        ? [
            {
              type: "input",
              config: {
                label: fragment.inputLabel,
                placeholder: fragment.inputPlaceholder,
                id: fragment.inputKey,
                className: "hidden",
                dataset: {
                  statementInput: fragment.inputKey,
                },
                wrapperDataset: {
                  visibleWhenCheckbox: fragment.checkboxValue,
                },
              },
            },
          ]
        : []),
    ];
  }

  function getWorkspaceControlConfigs(tool) {
    return [
      ...tool.controls(),
      ...(tool.conditionalFragments || []).flatMap(
        createConditionalFragmentControlConfigs,
      ),
    ];
  }

  function createWorkspaceControls(tool, createWorkspaceControl) {
    return getWorkspaceControlConfigs(tool).map(createWorkspaceControl);
  }

  function createWorkspaceContainer(toolName, tool, controls) {
    const container = document.createElement("div");

    container.className = `workspace-container ${tool.workspaceClass || ""}`.trim();
    container.append(
      createWorkspaceHeader(tool),
      createWorkspaceOutput(toolName, tool),
    );
    container.appendChild(distributeWorkspaceControls(controls, tool));

    return container;
  }

  function renderWorkspaceTool(
    toolName,
    { preserveState = false, notepadControl, bellboyControl } = {},
  ) {
    const tool = workspaceTools[toolName];

    if (!tool) {
      return;
    }

    const createWorkspaceControl = createWorkspaceControlRenderer({
      notepadControl,
      bellboyControl,
    });

    workspaceElement.textContent = "";
    onActiveToolChange(toolName);

    if (!preserveState) {
      onStateReset(toolName, tool);
    }

    const controls = createWorkspaceControls(tool, createWorkspaceControl);

    if (!preserveState) {
      const context = { toolName, tool };

      getSelectedWorkspaceControls(controls).forEach((control) => {
        setSelectedStatementFromControl(context, control);
      });
    }

    workspaceElement.replaceChildren(
      createWorkspaceContainer(toolName, tool, controls),
    );

    onActiveToolChange(toolName);
    updateConditionalControlVisibility(workspaceElement);
  }

  return Object.freeze({
    createInputField,
    createWorkspaceOptionButton,
    createWorkspaceSection,
    handleCopyButton,
    handleConditionalInputChange,
    handleStatementButtonClick,
    handleStatementInput,
    handleWorkspaceSelection,
    renderWorkspaceTool,
    setSelectedStatementFromControl,
    updateConditionalControlVisibility,
  });
}

export { createWorkspaceManager };
