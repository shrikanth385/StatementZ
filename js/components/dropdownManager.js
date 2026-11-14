function createDropdownManager({
  dropdownLayout,
  dropdownTriggerMap,
  getAll,
  onWorkspaceSelection,
  setSearchDropdownVisible,
  sidebarDropdownTriggers,
}) {
  let dropdownPositionFrame = 0;

  function remToPixels(value) {
    return (
      value *
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
    );
  }

  function getDropdownMaxHeight() {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue("--dropdown-max-height")
      .trim();

    if (value.endsWith("rem")) {
      return remToPixels(Number.parseFloat(value));
    }

    const parsedValue = Number.parseFloat(value);

    return Number.isFinite(parsedValue) ? parsedValue : Number.POSITIVE_INFINITY;
  }

  function getDropdownVerticalSpace(triggerElement, offset) {
    const rect = triggerElement.getBoundingClientRect();
    const viewportPadding = remToPixels(dropdownLayout.viewportPaddingRem);

    return {
      rect,
      viewportPadding,
      availableBelow: window.innerHeight - rect.bottom - viewportPadding - offset,
      availableAbove: rect.top - viewportPadding - offset,
    };
  }

  function shouldOpenDropdownAbove(dropdownElement, availableBelow, availableAbove) {
    return (
      dropdownElement.scrollHeight > availableBelow &&
      availableAbove > availableBelow
    );
  }

  function getDropdownHeightLimit(availableHeight) {
    const minimumHeight = remToPixels(8);

    return `${Math.max(
      Math.min(getDropdownMaxHeight(), Math.max(availableHeight, 0)),
      minimumHeight,
    )}px`;
  }

  function initializeTriggerAccessibility() {
    Object.entries(dropdownTriggerMap).forEach(([triggerId, dropdownId]) => {
      const trigger = document.querySelector(`#${triggerId}`);

      if (!trigger) return;

      trigger.setAttribute("aria-haspopup", "true");
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-controls", dropdownId);
    });
  }

  function closeAll() {
    getAll(".app-dropdown").forEach((el) => {
      el.classList.remove("active");

      if (isWorkspaceSelectMenu(el)) {
        resetWorkspaceSelectMenu(el);
      }

      if (isWorkspaceDatePickerMenu(el)) {
        resetWorkspaceDatePickerMenu(el);
      }
    });

    getAll("[aria-haspopup='true']").forEach((trigger) => {
      trigger.setAttribute("aria-expanded", "false");
    });

    setSearchDropdownVisible(false);
  }

  function open(dropdownId, positionOptions = {}) {
    const target = document.querySelector(`#${dropdownId}`);

    if (!target) return;

    target.classList.add("active");

    const trigger =
      positionOptions.triggerElement ||
      document.querySelector(`[aria-controls="${dropdownId}"]`);

    trigger?.setAttribute("aria-expanded", "true");

    if (trigger) {
      positionDropdown({
        triggerElement: trigger,
        dropdownElement: target,
        placement: positionOptions.placement || "bottom",
        offset: positionOptions.offset,
      });
    }
  }

  function toggle(dropdownId) {
    const dropdownElement = document.querySelector(`#${dropdownId}`);

    if (!dropdownElement) return;

    const isOpen = dropdownElement.classList.contains("active");

    closeAll();

    if (!isOpen) {
      open(dropdownId);
    }
  }

  function openSidebar(button, dropdownId) {
    const dropdownElement = document.querySelector(`#${dropdownId}`);

    const isOpen = dropdownElement.classList.contains("active");

    closeAll();

    if (!isOpen) {
      open(dropdownId, {
        triggerElement: button,
        dropdownElement,
        placement: "right",
        offset: remToPixels(1),
      });
    }
  }

  function positionDropdown({
    triggerElement,
    dropdownElement,
    placement = "bottom",
    offset = remToPixels(dropdownLayout.offsetRem),
  }) {
    const { rect, viewportPadding, availableBelow, availableAbove } =
      getDropdownVerticalSpace(triggerElement, offset);

    dropdownElement.style.position = "fixed";

    const shouldOpenAbove =
      placement === "bottom" &&
      shouldOpenDropdownAbove(dropdownElement, availableBelow, availableAbove);
    const availableHeight = shouldOpenAbove ? availableAbove : availableBelow;
    const maxHeight =
      placement === "right"
        ? window.innerHeight - viewportPadding * 2
        : availableHeight;

    dropdownElement.style.maxHeight = getDropdownHeightLimit(maxHeight);

    const adjustedRect = dropdownElement.getBoundingClientRect();
    let top =
      placement === "right"
        ? rect.top
        : shouldOpenAbove
          ? rect.top - adjustedRect.height - offset
          : rect.bottom + offset;

    let left = placement === "right" ? rect.right + offset : rect.left;

    top = Math.min(
      Math.max(top, viewportPadding),
      window.innerHeight - adjustedRect.height - viewportPadding,
    );

    left = Math.min(
      Math.max(left, viewportPadding),
      window.innerWidth - adjustedRect.width - viewportPadding,
    );

    dropdownElement.style.top = `${top}px`;
    dropdownElement.style.left = `${left}px`;
  }

  function isWorkspaceSelectMenu(dropdownElement) {
    return dropdownElement.classList.contains("workspace-select-menu");
  }

  function isWorkspaceDatePickerMenu(dropdownElement) {
    return dropdownElement.classList.contains("workspace-date-picker");
  }

  function resetDropdownInlinePosition(dropdownElement) {
    dropdownElement.style.removeProperty("position");
    dropdownElement.style.removeProperty("top");
    dropdownElement.style.removeProperty("left");
    dropdownElement.style.removeProperty("right");
    dropdownElement.style.removeProperty("bottom");
    dropdownElement.style.removeProperty("width");
    dropdownElement.style.removeProperty("max-height");
  }

  function resetWorkspaceSelectMenu(dropdownElement) {
    resetDropdownInlinePosition(dropdownElement);

    dropdownElement
      .closest(".workspace-select-wrapper")
      ?.classList.remove("workspace-select-wrapper-open");

    dropdownElement
      .closest(".workspace-section")
      ?.classList.remove("workspace-section-dropdown-open");
  }

  function resetWorkspaceDatePickerMenu(dropdownElement) {
    resetDropdownInlinePosition(dropdownElement);

    dropdownElement
      .closest(".workspace-section")
      ?.classList.remove("workspace-section-dropdown-open");
  }

  function getWorkspaceDropdownMaxHeight(triggerElement, dropdownElement) {
    const offset = remToPixels(dropdownLayout.offsetRem);
    const { availableBelow, availableAbove } = getDropdownVerticalSpace(
      triggerElement,
      offset,
    );
    const shouldOpenAbove = shouldOpenDropdownAbove(
      dropdownElement,
      availableBelow,
      availableAbove,
    );
    const availableHeight = shouldOpenAbove ? availableAbove : availableBelow;

    return {
      maxHeight: getDropdownHeightLimit(availableHeight),
      shouldOpenAbove,
    };
  }

  function positionWorkspaceAnchoredDropdown(
    triggerElement,
    dropdownElement,
    { matchTriggerWidth = false } = {},
  ) {
    const { maxHeight, shouldOpenAbove } = getWorkspaceDropdownMaxHeight(
      triggerElement,
      dropdownElement,
    );

    if (matchTriggerWidth) {
      dropdownElement.style.width = `${triggerElement.offsetWidth}px`;
    }

    dropdownElement.style.maxHeight = maxHeight;
    dropdownElement.style.left = "0";
    dropdownElement.style.right = "auto";

    if (shouldOpenAbove) {
      dropdownElement.style.top = "auto";
      dropdownElement.style.bottom = `calc(100% + ${dropdownLayout.offsetRem}rem)`;
    } else {
      dropdownElement.style.top = `calc(100% + ${dropdownLayout.offsetRem}rem)`;
      dropdownElement.style.bottom = "auto";
    }
  }

  function positionWorkspaceSelectMenu(triggerElement, dropdownElement) {
    const wrapper = dropdownElement.closest(".workspace-select-wrapper");
    const section = dropdownElement.closest(".workspace-section");

    resetWorkspaceSelectMenu(dropdownElement);
    positionWorkspaceAnchoredDropdown(triggerElement, dropdownElement, {
      matchTriggerWidth: true,
    });

    wrapper?.classList.add("workspace-select-wrapper-open");
    section?.classList.add("workspace-section-dropdown-open");
  }

  function repositionOpenDropdowns() {
    dropdownPositionFrame = 0;

    getAll(".app-dropdown.active:not(.workspace-select-menu):not(.workspace-date-picker)").forEach(
      (dropdownElement) => {
        const trigger = dropdownElement.previousElementSibling;

        if (trigger) {
          positionDropdown({
            triggerElement: trigger,
            dropdownElement,
            placement: dropdownElement.classList.contains("sidebar-dropdown")
              ? "right"
              : "bottom",
          });
        }
      },
    );

    getAll(".workspace-select-menu.active").forEach((dropdownElement) => {
      const trigger = dropdownElement.previousElementSibling;

      if (trigger) {
        positionWorkspaceSelectMenu(trigger, dropdownElement);
      }
    });

    getAll(".workspace-date-picker.active").forEach((dropdownElement) => {
      const trigger = document.querySelector(`#${dropdownElement.dataset.inputId}`);

      if (trigger) {
        positionWorkspaceAnchoredDropdown(trigger, dropdownElement);
      }
    });
  }

  function scheduleReposition() {
    if (dropdownPositionFrame) {
      return;
    }

    dropdownPositionFrame = requestAnimationFrame(repositionOpenDropdowns);
  }

  function handleScrollReposition(event) {
    if (event.target?.closest?.(".app-dropdown")) {
      return;
    }

    scheduleReposition();
  }

  function handleTriggerClick(button) {
    if (!button) return;

    const dropdownId = dropdownTriggerMap[button.id];

    if (!dropdownId) {
      return;
    }

    if (sidebarDropdownTriggers[button.id]) {
      openSidebar(button, dropdownId);

      return;
    }

    toggle(dropdownId);
  }

  function toggleElement(dropdownElement) {
    if (!dropdownElement) return;

    const isOpen = dropdownElement.classList.contains("active");
    const trigger = dropdownElement.previousElementSibling;

    closeAll();

    if (!isOpen) {
      dropdownElement.classList.add("active");

      if (trigger) {
        if (isWorkspaceSelectMenu(dropdownElement)) {
          positionWorkspaceSelectMenu(trigger, dropdownElement);
        } else {
          positionDropdown({
            triggerElement: trigger,
            dropdownElement,
            placement: "bottom",
          });
        }
      }
    }

    trigger?.setAttribute("aria-expanded", String(!isOpen));
  }


  function getWorkspaceSelectParts(trigger) {
    const wrapper = trigger?.closest(".workspace-select-wrapper");
    const menu = wrapper?.querySelector("[data-workspace-select-menu], .workspace-select-menu");
    const options = menu ? [...menu.querySelectorAll("[data-workspace-select-option]")] : [];
    return { wrapper, menu, options };
  }

  function focusWorkspaceOption(options, index) {
    if (!options.length) return;
    const nextIndex = Math.max(0, Math.min(index, options.length - 1));
    options[nextIndex].focus();
    options[nextIndex].scrollIntoView({ block: "nearest" });
  }

  function handleWorkspaceSelectKeydown(event) {
    const target = event.target;
    const trigger = target.closest("[data-workspace-select-trigger]");

    if (trigger) {
      const { menu, options } = getWorkspaceSelectParts(trigger);
      if (!menu || !options.length) return;

      if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        const isOpen = menu.classList.contains("active");
        if (!isOpen) {
          toggleElement(menu);
          const selectedIndex = options.findIndex((option) => option.dataset.value === trigger.dataset.value);
          focusWorkspaceOption(options, event.key === "ArrowUp" ? selectedIndex - 1 : selectedIndex >= 0 ? selectedIndex : 0);
        } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          const currentIndex = options.indexOf(document.activeElement);
          focusWorkspaceOption(options, currentIndex + (event.key === "ArrowDown" ? 1 : -1));
        } else if (event.key === "Home" || event.key === "End") {
          focusWorkspaceOption(options, event.key === "Home" ? 0 : options.length - 1);
        }
        return;
      }

      if (event.key === "Escape" && menu.classList.contains("active")) {
        event.preventDefault();
        closeAll();
        trigger.focus();
      }
      return;
    }

    const option = target.closest("[data-workspace-select-option]");
    if (!option) return;

    const menu = option.closest(".workspace-select-menu");
    const options = menu ? [...menu.querySelectorAll("[data-workspace-select-option]")] : [];
    const optionTrigger = menu?.closest(".workspace-select-wrapper")?.querySelector("[data-workspace-select-trigger]");
    if (!optionTrigger) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      focusWorkspaceOption(options, options.indexOf(option) + (event.key === "ArrowDown" ? 1 : -1));
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      focusWorkspaceOption(options, event.key === "Home" ? 0 : options.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onWorkspaceSelection(option);
      closeAll();
      optionTrigger.focus();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeAll();
      optionTrigger.focus();
    }
  }

  function handleWorkspaceSelectClick(button) {
    if (!button) return;

    if (button.matches("[data-workspace-select-trigger]")) {
      toggleElement(button.nextElementSibling);

      return;
    }

    if (button.matches("[data-workspace-select-option]")) {
      const wrapper = button.closest(".workspace-select-wrapper");
      const trigger = wrapper?.querySelector("[data-workspace-select-trigger]");
      onWorkspaceSelection(button);

      closeAll();
      trigger?.focus();
    }
  }

  return Object.freeze({
    closeAll,
    handleScrollReposition,
    handleTriggerClick,
    handleWorkspaceSelectClick,
    handleWorkspaceSelectKeydown,
    initializeTriggerAccessibility,
    positionWorkspaceAnchoredDropdown,
    scheduleReposition,
  });
}

export { createDropdownManager };
