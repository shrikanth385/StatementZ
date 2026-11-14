import { formatCountdown } from "../core/timeFormat.js";

function createInactiveBellboy() {
  return Object.freeze({
    createControl: () => null,
    getLocationPreference: () => ({ label: "", timezone: "" }),
    getWorkspaceOutput: () => "",
    getWorkspaceOutputParts: () => [],
    getNextAlarmParts: () => null,
    formatCountdown,
    handleClick: () => {},
    handleChange: () => {},
    handleInput: () => {},
    handleSelect: () => {},
    setLocationPreference: () => {},
    tick: () => {},
    unlockAudio: () => Promise.resolve(false),
  });
}

export { createInactiveBellboy };
