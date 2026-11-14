/* =========================
   DOM UTILITIES
   Shared, side-effect-free DOM helpers used by the application modules.
========================= */

function getAll(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function applyDataset(element, dataset = {}) {
  Object.entries(dataset).forEach(([key, value]) => {
    element.dataset[key] = value;
  });
}

function applyAttributes(element, attributes = {}) {
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      element.setAttribute(key, value);
    }
  });
}

function createElement(
  tagName,
  { className = "", textContent = "", dataset = {}, attributes = {} } = {},
) {
  const element = document.createElement(tagName);

  if (className) element.className = className;
  if (textContent) element.textContent = textContent;

  applyDataset(element, dataset);
  applyAttributes(element, attributes);

  return element;
}

function createButton({
  className,
  textContent = "",
  type = "button",
  dataset = {},
  attributes = {},
  isActive = false,
}) {
  const button = createElement("button", {
    className,
    textContent,
    dataset,
    attributes: { type, ...attributes },
  });

  button.classList.toggle("btn-active", isActive);

  return button;
}

export {
  applyDataset,
  applyAttributes,
  createElement,
  createButton,
  getAll,
};
