function createDatePicker({
  createButton,
  createElement,
  getCachedDateTimeFormatter,
  onCloseDropdowns,
  onPositionDropdown,
}) {
  function createMenu(inputId) {
    return createElement("div", {
      className: "app-dropdown workspace-date-picker",
      dataset: {
        datePickerMenu: "",
        inputId,
      },
    });
  }

  function padDatePart(value) {
    return String(value).padStart(2, "0");
  }

  function getLocalIsoDate(date) {
    return [
      date.getFullYear(),
      padDatePart(date.getMonth() + 1),
      padDatePart(date.getDate()),
    ].join("-");
  }

  function parseIsoDate(value) {
    const [year, month, day] = value.split("-").map(Number);

    if (!year || !month || !day) {
      return null;
    }

    return new Date(year, month - 1, day);
  }

  function getViewDate(input, menu) {
    return (
      parseIsoDate(menu.dataset.viewDate || "") ||
      parseIsoDate(input.value || "") ||
      new Date()
    );
  }

  function getMonthStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function createNavButton(label, offset) {
    return createButton({
      className: "workspace-date-picker-nav",
      textContent: label,
      dataset: {
        datePickerNav: String(offset),
      },
      attributes: {
        "aria-label": offset < 0 ? "Previous month" : "Next month",
      },
    });
  }

  function createSelect({ className, value, options, dataset }) {
    const select = createElement("select", {
      className,
      dataset,
    });

    options.forEach((option) => {
      const optionElement = document.createElement("option");

      optionElement.value = option.value;
      optionElement.textContent = option.label;
      optionElement.selected = option.value === value;

      select.appendChild(optionElement);
    });

    return select;
  }

  function getMonthOptions() {
    const formatter = getCachedDateTimeFormatter("date-picker-month-option", {
      month: "short",
    });

    return Array.from({ length: 12 }, (_, month) => ({
      value: String(month),
      label: formatter.format(new Date(2000, month, 1)),
    }));
  }

  function getYearOptions(selectedYear) {
    const currentYear = new Date().getFullYear();
    const startYear = Math.min(1970, selectedYear);
    const endYear = Math.max(currentYear + 10, selectedYear);

    return Array.from(
      { length: endYear - startYear + 1 },
      (_, index) => startYear + index,
    ).map((year) => ({
      value: String(year),
      label: String(year),
    }));
  }

  function createTitle(monthStart) {
    const title = createElement("div", {
      className: "workspace-date-picker-title",
    });

    title.append(
      createSelect({
        className: "workspace-date-picker-select",
        value: String(monthStart.getMonth()),
        options: getMonthOptions(),
        dataset: {
          datePickerMonth: "",
        },
      }),
      createSelect({
        className: "workspace-date-picker-select",
        value: String(monthStart.getFullYear()),
        options: getYearOptions(monthStart.getFullYear()),
        dataset: {
          datePickerYear: "",
        },
      }),
    );

    return title;
  }

  function render(input, menu, viewDate = getViewDate(input, menu)) {
    const monthStart = getMonthStart(viewDate);
    const selectedDate = parseIsoDate(input.value || "");
    const todayIso = getLocalIsoDate(new Date());
    const selectedIso = selectedDate ? getLocalIsoDate(selectedDate) : "";
    const daysInMonth = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0,
    ).getDate();

    menu.dataset.viewDate = getLocalIsoDate(monthStart);
    menu.textContent = "";

    const header = createElement("div", {
      className: "workspace-date-picker-header",
    });
    const grid = createElement("div", {
      className: "workspace-date-picker-grid",
    });

    header.append(
      createNavButton("‹", -1),
      createTitle(monthStart),
      createNavButton("›", 1),
    );

    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((day) => {
      grid.appendChild(
        createElement("span", {
          className: "workspace-date-picker-weekday",
          textContent: day,
        }),
      );
    });

    Array.from({ length: monthStart.getDay() }).forEach(() => {
      grid.appendChild(
        createElement("span", {
          className: "workspace-date-picker-empty",
        }),
      );
    });

    Array.from({ length: daysInMonth }, (_, index) => index + 1).forEach((day) => {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
      const isoDate = getLocalIsoDate(date);
      const button = createButton({
        className: "workspace-date-picker-day",
        textContent: String(day),
        dataset: {
          datePickerDay: isoDate,
        },
        attributes: {
          "aria-label": date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          "aria-current": isoDate === todayIso ? "date" : undefined,
          "aria-pressed": String(isoDate === selectedIso),
        },
        isActive: isoDate === selectedIso,
      });

      button.classList.toggle("is-today", isoDate === todayIso);
      grid.appendChild(button);
    });

    menu.append(header, grid);
  }

  function show(input) {
    const menu = input
      .closest(".workspace-date-picker-wrapper")
      ?.querySelector("[data-date-picker-menu]");

    if (!menu) return;

    onCloseDropdowns();
    render(input, menu);
    menu.classList.add("active");
    onPositionDropdown(input, menu);
    menu
      .closest(".workspace-section")
      ?.classList.add("workspace-section-dropdown-open");
  }

  function handleNavigation(button) {
    if (!button?.matches("[data-date-picker-nav]")) {
      return;
    }

    const menu = button.closest("[data-date-picker-menu]");
    const input = document.querySelector(`#${menu?.dataset.inputId}`);

    if (!menu || !input) return;

    const viewDate = getViewDate(input, menu);

    viewDate.setMonth(viewDate.getMonth() + Number(button.dataset.datePickerNav));
    render(input, menu, viewDate);
  }

  function handleSelection(button) {
    if (!button?.matches("[data-date-picker-day]")) {
      return;
    }

    const menu = button.closest("[data-date-picker-menu]");
    const input = document.querySelector(`#${menu?.dataset.inputId}`);

    if (!input) return;

    input.value = button.dataset.datePickerDay;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    onCloseDropdowns();
  }

  function handleChange(target) {
    const monthSelect = target.closest("[data-date-picker-month]");
    const yearSelect = target.closest("[data-date-picker-year]");

    if (!monthSelect && !yearSelect) {
      return;
    }

    const menu = target.closest("[data-date-picker-menu]");
    const input = document.querySelector(`#${menu?.dataset.inputId}`);

    if (!menu || !input) return;

    const viewDate = getViewDate(input, menu);
    const month = Number(monthSelect ? monthSelect.value : viewDate.getMonth());
    const year = Number(yearSelect ? yearSelect.value : viewDate.getFullYear());

    render(input, menu, new Date(year, month, 1));
  }

  function handleClick(event, button) {
    const input = event.target.closest("[data-date-picker-input]");

    if (input) {
      show(input);

      return;
    }

    handleNavigation(button);
    handleSelection(button);
  }

  return Object.freeze({
    createMenu,
    handleChange,
    handleClick,
  });
}

export { createDatePicker };
