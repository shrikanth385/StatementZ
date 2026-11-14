function createClockSearch({
  clockPeriods,
  createElement,
  elements,
  state,
}) {
  const formatterCache = new Map();
  const placeSearchControllers = new WeakMap();

  function debounce(fn, delay = 400) {
    let timer;

    return (...args) => {
      clearTimeout(timer);

      timer = setTimeout(() => fn(...args), delay);
    };
  }

  async function fetchJsonWithTimeout(url, timeout = 1500) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function initializeDefaultLocation() {
    try {
      const data = await fetchJsonWithTimeout("https://ipapi.co/json/");

      state.currentLocationLabel = data.city || "Unknown Location";
    } catch {
      state.currentLocationLabel = "Unknown Location";
    }

    updateClock();
  }

  function getCachedDateTimeFormatter(key, options) {
    if (!formatterCache.has(key)) {
      formatterCache.set(key, new Intl.DateTimeFormat("en-US", options));
    }

    return formatterCache.get(key);
  }

  function getFormattedTimeParts(date, timeZone) {
    const formatter = getCachedDateTimeFormatter(`time:${timeZone}`, {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(date);

    return Object.fromEntries(parts.map((part) => [part.type, part.value]));
  }

  function getFormattedDate(date, timeZone) {
    return getCachedDateTimeFormatter(`date:${timeZone}`, {
      timeZone,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  function getClockPeriodLabel(hour) {
    return (
      clockPeriods.find(({ start, end }) => hour >= start && hour < end)?.label ||
      "?? Night"
    );
  }

  function updateClock() {
    const now = new Date();
    const timeParts = getFormattedTimeParts(now, state.currentTimezone);
    const hour = Number(timeParts.hour || "0");

    elements.time.textContent = `${timeParts.hour}:${timeParts.minute}:${timeParts.second}`;
    elements.date.textContent = getFormattedDate(now, state.currentTimezone);
    const timezone =
      state.currentTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    elements.location.textContent =
      `Location: ${state.currentLocationLabel} (${timezone})`;
    elements.indicator.textContent = getClockPeriodLabel(hour);
  }

  async function fetchPlaces(query, signal) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query,
        )}&format=json&addressdetails=1&limit=10`,
        {
          signal,
        },
      );

      return await response.json();
    } catch {
      return [];
    }
  }

  function buildDataset(places) {
    return places.map((place) => ({
      name: place.display_name,
      lat: place.lat,
      lon: place.lon,
    }));
  }

  function setSearchDropdownVisible(isVisible, dropdown = elements.searchDropdown) {
    dropdown.style.display = isVisible ? "block" : "none";
  }

  function createSearchDropdownItem(result, index) {
    return createElement("div", {
      className: "dropdown-item",
      textContent: result.item.name,
      dataset: { index },
      attributes: { role: "option", "aria-selected": "false" },
    });
  }

  function getSearchResults(places, query) {
    const dataset = buildDataset(places);
    const normalizedQuery = query.toLowerCase();

    return dataset
      .map((place) => ({
        item: place,
        score: getSearchScore(place.name, normalizedQuery),
      }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  function getSearchScore(name, query) {
    const normalizedName = name.toLowerCase();

    if (normalizedName.startsWith(query)) {
      return 3;
    }

    if (normalizedName.includes(query)) {
      return 2;
    }

    return query
      .split(/\s+/)
      .every((part) => normalizedName.includes(part))
      ? 1
      : 0;
  }

  function renderDropdown(results, dropdown = elements.searchDropdown) {
    dropdown.textContent = "";

    if (!results.length) {
      setSearchDropdownVisible(false, dropdown);

      return;
    }

    setSearchDropdownVisible(true, dropdown);

    results.forEach((result, index) => {
      dropdown.appendChild(createSearchDropdownItem(result, index));
    });
  }

  async function getTimezone(lat, lon, signal) {
    try {
      const response = await fetch(
        `https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`,
        { signal },
      );

      const data = await response.json();

      return data.timeZone;
    } catch {
      return null;
    }
  }

  async function selectPlace(place, input, dropdown, onSelect, { signal, isCurrent = () => true } = {}) {
    setSearchDropdownVisible(false, dropdown);
    input.value = place.timezone ? place.timezone : place.name;

    const timezone = place.timezone || await getTimezone(place.lat, place.lon, signal);

    if (!timezone || !isCurrent()) return;

    onSelect({
      label: place.timezone ? place.timezone : place.name.split(",")[0],
      timezone,
    });
  }

  function resolveTimezone(value) {
    try {
      return new Intl.DateTimeFormat("en-US", { timeZone: value })
        .resolvedOptions().timeZone;
    } catch {
      return "";
    }
  }

  function createPlaceSearchController(input, dropdown, onSelect, { clearOnEmpty = false } = {}) {
    let currentResults = [];
    let activeIndex = -1;
    let abortController;
    let requestId = 0;
    let selectionId = 0;

    const search = debounce(async (query) => {
      const normalizedQuery = query.trim();
      const currentRequestId = ++requestId;

      if (!normalizedQuery) {
        currentResults = [];
        activeIndex = -1;
        renderDropdown(currentResults, dropdown);
        return;
      }

      const timezone = resolveTimezone(normalizedQuery);
      if (timezone) {
        currentResults = [{
          item: { name: `Use timezone: ${timezone}`, timezone },
          score: 4,
        }];
        activeIndex = -1;
        renderDropdown(currentResults, dropdown);
        return;
      }

      abortController?.abort();
      abortController = new AbortController();
      const places = await fetchPlaces(normalizedQuery, abortController.signal);
      if (currentRequestId !== requestId) return;

      currentResults = getSearchResults(places, normalizedQuery);
      renderDropdown(currentResults, dropdown);
    });

    const controller = {
      handleInput(event) {
        if (event.target !== input) return;
        if (!input.value.trim() && clearOnEmpty) {
          requestId += 1;
          abortController?.abort();
          currentResults = [];
          renderDropdown(currentResults, dropdown);
          onSelect(null);
          return;
        }
        search(input.value);
      },
      handleKeydown(event) {
        if (event.target !== input || !currentResults.length) return;

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          activeIndex = Math.max(0, Math.min(
            currentResults.length - 1,
            activeIndex + (event.key === "ArrowDown" ? 1 : -1),
          ));
          const items = [...dropdown.querySelectorAll(".dropdown-item")];
          items.forEach((item, index) => {
            item.classList.toggle("active", index === activeIndex);
            item.setAttribute("aria-selected", String(index === activeIndex));
          });
          items[activeIndex]?.scrollIntoView({ block: "nearest" });
          return;
        }

        if ((event.key === "Enter" || event.key === " ") && activeIndex >= 0) {
          event.preventDefault();
          const result = currentResults[activeIndex];
          if (result) {
            const currentSelectionId = ++selectionId;
            const selectionController = new AbortController();
            void selectPlace(result.item, input, dropdown, onSelect, {
              signal: selectionController.signal,
              isCurrent: () => currentSelectionId === selectionId,
            });
          }
          return;
        }

        if (event.key === "Escape") {
          event.preventDefault();
          currentResults = [];
          activeIndex = -1;
          renderDropdown(currentResults, dropdown);
        }
      },
      handleDropdownSelection(dropdownItem) {
        if (!dropdown.contains(dropdownItem)) return;
        const result = currentResults[Number(dropdownItem.dataset.index)];
        if (result) {
          const currentSelectionId = ++selectionId;
          const selectionController = new AbortController();
          void selectPlace(result.item, input, dropdown, onSelect, {
            signal: selectionController.signal,
            isCurrent: () => currentSelectionId === selectionId,
          });
        }
      },
    };

    placeSearchControllers.set(input, controller);
    placeSearchControllers.set(dropdown, controller);
    return controller;
  }

  createPlaceSearchController(
    elements.searchInput,
    elements.searchDropdown,
    ({ label, timezone }) => {
      state.currentTimezone = timezone;
      state.currentLocationLabel = label;
      updateClock();
    },
  );

  function createBellboyLocationSearch({ location, onSelect }) {
    const wrapper = document.createElement("div");
    const searchField = document.createElement("div");
    const input = document.createElement("input");
    const dropdown = document.createElement("div");

    wrapper.className = "bellboy-location-search";
    searchField.className = "bellboy-location-search-field";
    input.type = "search";
    input.className = "workspace-input bellboy-location-search-input";
    input.dataset.bellboyLocationInput = "";
    input.placeholder = `Uses clock: ${state.currentLocationLabel || "device timezone"}`;
    input.value = location?.label || "";
    input.setAttribute("aria-label", "Search a location or timezone for Bellboy alarms");
    input.autocomplete = "off";
    dropdown.className = "dropdown bellboy-location-search-results";
    dropdown.setAttribute("role", "listbox");
    searchField.append(input, dropdown);
    wrapper.appendChild(searchField);
    createPlaceSearchController(input, dropdown, onSelect, { clearOnEmpty: true });
    return wrapper;
  }

  function handleInput(event) {
    placeSearchControllers.get(event.target)?.handleInput(event);
  }

  function handleDropdownSelection(dropdownItem) {
    if (!dropdownItem) return;
    placeSearchControllers.get(dropdownItem.closest(".dropdown"))
      ?.handleDropdownSelection(dropdownItem);
  }

  function handleKeydown(event) {
    const controller = placeSearchControllers.get(event.target);
    controller?.handleKeydown(event);
  }

  return Object.freeze({
    handleDropdownSelection,
    handleInput,
    handleKeydown,
    initializeDefaultLocation,
    createBellboyLocationSearch,
    setSearchDropdownVisible,
    updateClock,
  });
}

export { createClockSearch };
