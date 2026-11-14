function createWorkspaceSelect({
  name,
  options,
  selectedValue = "",
  placeholder = "Select",
  id = "",
  wrapperClass = "",
  triggerClass = "",
  menuClass = "",
  wrapperDataset = {},
  triggerDataset = {},
  getOptionDataset = () => ({}),
}) {
  const wrapper = document.createElement("div");
  const trigger = document.createElement("button");
  const triggerLabel = document.createElement("span");
  const menu = document.createElement("div");
  const selectedOption = options.find(({ value }) => value === selectedValue);

  wrapper.className = `dropdown-wrapper workspace-select-wrapper ${wrapperClass}`.trim();
  Object.assign(wrapper.dataset, wrapperDataset);
  trigger.type = "button";
  trigger.className = `workspace-control-btn workspace-select-trigger ${triggerClass}`.trim();
  trigger.dataset.workspaceSelectTrigger = "";
  trigger.dataset.name = name;
  trigger.dataset.value = selectedOption?.value || "";
  Object.assign(trigger.dataset, triggerDataset);
  trigger.setAttribute("aria-haspopup", "true");
  trigger.setAttribute("aria-expanded", "false");
  if (id) trigger.id = id;
  trigger.classList.toggle("btn-active", Boolean(selectedOption?.value));

  triggerLabel.className = "workspace-select-label";
  triggerLabel.textContent = selectedOption?.label || placeholder;
  trigger.appendChild(triggerLabel);

  menu.className = `app-dropdown workspace-select-menu ${menuClass}`.trim();
  const menuId = `${name.replace(/[^a-zA-Z0-9_-]+/g, "-")}-menu`;
  menu.id = menuId;
  menu.setAttribute("role", "listbox");
  trigger.setAttribute("aria-controls", menuId);
  options.forEach((option) => {
    const optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = `workspace-control-btn workspace-select-option${option.value === selectedValue ? " btn-active" : ""}`;
    optionButton.dataset.workspaceSelectOption = "";
    optionButton.dataset.name = name;
    optionButton.dataset.value = option.value;
    optionButton.setAttribute("role", "option");
    optionButton.setAttribute("aria-selected", String(option.value === selectedValue));
    Object.assign(optionButton.dataset, getOptionDataset(option));
    optionButton.textContent = option.label;
    menu.appendChild(optionButton);
  });

  wrapper.append(trigger, menu);
  return { wrapper, trigger, menu };
}

function setWorkspaceSelectValue(wrapper, value) {
  const trigger = wrapper?.querySelector("[data-workspace-select-trigger]");
  const triggerLabel = trigger?.querySelector(".workspace-select-label");
  if (!trigger || !triggerLabel) return;

  const selectedOption = [...wrapper.querySelectorAll("[data-workspace-select-option]")]
    .find((option) => option.dataset.value === value);
  if (!selectedOption) return;

  trigger.dataset.value = value;
  trigger.classList.toggle("btn-active", Boolean(value));
  triggerLabel.textContent = selectedOption.textContent;
  wrapper.querySelectorAll("[data-workspace-select-option]").forEach((option) => {
    option.classList.toggle("btn-active", option === selectedOption);
    option.setAttribute("aria-selected", String(option === selectedOption));
  });
}

export { createWorkspaceSelect, setWorkspaceSelectValue };
