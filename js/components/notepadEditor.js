const notepadCaretBoundary = "\u200B";
const notepadHighlightSelector = "[data-notepad-format='highlight']";

const notepadToolbarButtons = Object.freeze([
  { label: "B", command: "bold", title: "Bold", toggle: true },
  { label: "I", command: "italic", title: "Italic", toggle: true },
  { label: "U", command: "underline", title: "Underline", toggle: true },
  { label: "Highlight", command: "highlight", title: "Highlight", toggle: true },
  { label: "Bullets", command: "unorderedList", title: "Bullet list", toggle: true },
  { label: "Numbers", command: "orderedList", title: "Numbered list", toggle: true },
  { label: "Clear", command: "clear", title: "Clear notepad" },
]);

function createNotepadEditor({
  createElement,
  createWorkspaceOptionButton,
  createWorkspaceSection,
  getAll,
  getWorkspaceRoot,
  refreshWorkspaceOutput,
  state,
  stateCommands,
}) {
  function getNotepadEditor() {
    return getWorkspaceRoot().querySelector("[data-notepad-editor]");
  }

  const notepadToggleStates = Object.freeze({
    bold: () => document.queryCommandState("bold"),
    italic: () => document.queryCommandState("italic"),
    underline: () => document.queryCommandState("underline"),
    highlight: () => isNotepadHighlightActive(),
    unorderedList: () => document.queryCommandState("insertUnorderedList"),
    orderedList: () => document.queryCommandState("insertOrderedList"),
  });

  function createNotepadToolbarButton({ label, command, title, toggle = false }) {
    const attributes = {
      title,
    };

    if (toggle) {
      attributes["aria-pressed"] = "false";
    }

    return createWorkspaceOptionButton({
      className: "workspace-action-button notepad-toolbar-button",
      textContent: label,
      dataset: {
        notepadCommand: command,
        notepadToggle: toggle ? "true" : "",
      },
      attributes,
    });
  }

  function createNotepadControl() {
    const { wrapper } = createWorkspaceSection({
      title: "",
      controlType: "notepad",
      className: "notepad-section",
    });

    const toolbar = createElement("div", {
      className: "notepad-toolbar",
      attributes: {
        "aria-label": "Notepad tools",
      },
    });

    toolbar.append(
      ...notepadToolbarButtons.map((buttonConfig) =>
        createNotepadToolbarButton(buttonConfig),
      ),
    );

    const editor = createElement("div", {
      className: "notepad-editor",
      dataset: {
        notepadEditor: "",
      },
      attributes: {
        contenteditable: "true",
        spellcheck: "true",
        role: "textbox",
        "aria-multiline": "true",
        "data-placeholder": "Type notes here. Browser spellcheck is enabled.",
      },
    });

    editor.innerHTML = state.dynamicInputs.notepadHtml || "";

    wrapper.append(toolbar, editor);

    return wrapper;
  }

  function syncNotepadEditor(editor = getNotepadEditor()) {
    if (!editor) {
      return;
    }

    stateCommands.setDynamicInput(
      "notepadContent",
      editor.innerText.replaceAll(notepadCaretBoundary, "").trim(),
    );

    stateCommands.setDynamicInput("notepadHtml", getSanitizedNotepadHtml(editor));

    updateNotepadToolbarState(editor);

    refreshWorkspaceOutput();
  }

  function getSanitizedNotepadHtml(editor) {
    const clone = editor.cloneNode(true);
    const textWalker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);

    while (textWalker.nextNode()) {
      textWalker.currentNode.nodeValue = textWalker.currentNode.nodeValue.replaceAll(
        notepadCaretBoundary,
        "",
      );
    }

    return clone.innerHTML;
  }

  function updateNotepadToolbarState(editor = getNotepadEditor()) {
    const toolbarRoot = editor?.closest(".notepad-section");

    if (!toolbarRoot) {
      return;
    }

    const selection = document.getSelection();
    const activeNode = selection?.anchorNode;
    const isSelectionInEditor = Boolean(
      editor &&
        activeNode &&
        editor.contains(
          activeNode.nodeType === Node.ELEMENT_NODE
            ? activeNode
            : activeNode.parentNode,
        ),
    );

    getAll("[data-notepad-toggle='true']", toolbarRoot).forEach((button) => {
      const isActive =
        isSelectionInEditor &&
        Boolean(notepadToggleStates[button.dataset.notepadCommand]?.());

      button.classList.toggle("btn-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function getSelectionElement(node) {
    return node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
  }

  function getClosestNotepadHighlight(node, editor) {
    return getSelectionElement(node)?.closest(notepadHighlightSelector) &&
      editor.contains(getSelectionElement(node).closest(notepadHighlightSelector))
      ? getSelectionElement(node).closest(notepadHighlightSelector)
      : null;
  }

  function isNotepadHighlightActive(editor = getNotepadEditor()) {
    const selection = document.getSelection();

    return Boolean(editor && getClosestNotepadHighlight(selection?.anchorNode, editor));
  }

  function isRangeInsideElement(range, element) {
    return (
      element.contains(getSelectionElement(range.startContainer)) &&
      element.contains(getSelectionElement(range.endContainer))
    );
  }

  function unwrapElement(element) {
    element.replaceWith(...element.childNodes);
  }

  function removeHighlights(root) {
    root.querySelectorAll?.(notepadHighlightSelector).forEach(unwrapElement);
  }

  function createHighlightWrapper(content) {
    const highlight = createElement("span", {
      className: "notepad-highlight",
      dataset: {
        notepadFormat: "highlight",
      },
    });

    highlight.appendChild(content);

    return highlight;
  }

  function placeCaretAfterNode(node) {
    const selection = document.getSelection();
    const range = document.createRange();
    const boundary = document.createTextNode(notepadCaretBoundary);

    node.after(boundary);
    range.setStart(boundary, boundary.length);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);
  }

  function rangeHasHighlight(range, editor) {
    const fragment = range.cloneContents();

    return Boolean(
      getClosestNotepadHighlight(range.startContainer, editor) ||
        getClosestNotepadHighlight(range.endContainer, editor) ||
        fragment.querySelector?.(notepadHighlightSelector),
    );
  }

  function toggleNotepadHighlight(editor) {
    const selection = document.getSelection();

    if (!selection?.rangeCount) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (!isRangeInsideElement(range, editor)) {
      return;
    }

    if (selection.isCollapsed) {
      const activeHighlight = getClosestNotepadHighlight(selection.anchorNode, editor);

      if (activeHighlight) {
        placeCaretAfterNode(activeHighlight);
      }

      return;
    }

    const shouldRemoveHighlight = rangeHasHighlight(range, editor);
    const content = range.extractContents();
    const insertedNode = shouldRemoveHighlight ? content : createHighlightWrapper(content);

    if (shouldRemoveHighlight) {
      removeHighlights(insertedNode);
    }

    const caretAnchor = shouldRemoveHighlight ? insertedNode.lastChild : insertedNode;

    range.insertNode(insertedNode);

    if (caretAnchor) {
      placeCaretAfterNode(caretAnchor);
    }
  }

  const notepadCommands = Object.freeze({
    bold: () => document.execCommand("bold"),
    italic: () => document.execCommand("italic"),
    underline: () => document.execCommand("underline"),
    highlight: toggleNotepadHighlight,
    unorderedList: () => document.execCommand("insertUnorderedList"),
    orderedList: () => document.execCommand("insertOrderedList"),
    clear: (editor) => {
      editor.textContent = "";
    },
  });

  async function handleToolbarClick(button) {
    const command = button?.dataset.notepadCommand;

    if (!command) {
      return;
    }

    const editor = getNotepadEditor();
    const handler = notepadCommands[command];

    if (!editor || !handler) {
      return;
    }

    editor.focus();

    await handler(editor, button);

    syncNotepadEditor(editor);
    updateNotepadToolbarState(editor);
  }

  function handleInput(event) {
    const editor = event.target.closest("[data-notepad-editor]");

    if (!editor) return;

    syncNotepadEditor(editor);
  }

  return Object.freeze({
    createNotepadControl,
    handleInput,
    handleToolbarClick,
    updateToolbarState: updateNotepadToolbarState,
  });
}

export { createNotepadEditor };
