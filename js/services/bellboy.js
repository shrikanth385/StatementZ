import { createWorkspaceSelect, setWorkspaceSelectValue } from "../workspace/workspaceSelect.js";
import { formatCountdown } from "../core/timeFormat.js";

const storageKey = "statementz-bellboy-settings";

const alarmDefinitions = Object.freeze([
  { id: "break2", label: "Break-2", className: "break-2", endLeadMinutes: 2 },
  { id: "lunch", label: "Lunch", className: "lunch", endLeadMinutes: 2 },
  { id: "break3", label: "Break-3", className: "break-3", endLeadMinutes: 2 },
]);

const alarmDefaults = Object.freeze({ start: "", end: "" });
const locationDefaults = Object.freeze({ label: "", timezone: "" });
const maximumAlarmDurationMinutes = 12 * 60;
const timeInputModes = Object.freeze({ twelveHour: "12-hour", twentyFourHour: "24-hour" });
const hourPattern = /^\d{1,2}$/;
const minutePattern = /^\d{2}$/;
const meridiemOptions = Object.freeze([
  Object.freeze({ label: "AM", value: "AM" }),
  Object.freeze({ label: "PM", value: "PM" }),
]);
const timePartDefinitions = Object.freeze([
  Object.freeze({ id: "hour", label: "Hour", placeholder: "hh", maxLength: 2 }),
  Object.freeze({ id: "minute", label: "Minute", placeholder: "mm", maxLength: 2 }),
]);

function isStoredTime(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isValidTimezone(value) {
  if (typeof value !== "string" || !value) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function parseTwelveHourTime(hour, minute, meridiem) {
  const numericHour = Number(hour);
  if (!Number.isInteger(numericHour) || numericHour < 1 || numericHour > 12) return "";
  if (!/^\d{2}$/.test(String(minute)) || Number(minute) > 59) return "";
  if (!meridiemOptions.some(({ value }) => value === meridiem)) return "";

  const hour24 = numericHour % 12 + (meridiem === "PM" ? 12 : 0);
  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getTwelveHourParts(value) {
  if (!isStoredTime(value)) return null;

  const [hourValue, minute] = value.split(":").map(Number);
  return {
    hour: String(hourValue % 12 || 12),
    minute: String(minute).padStart(2, "0"),
    meridiem: hourValue >= 12 ? "PM" : "AM",
  };
}

function formatTwelveHourTime(value) {
  const parts = getTwelveHourParts(value);
  return parts ? `${parts.hour}:${parts.minute} ${parts.meridiem}` : "";
}

function resolveTimeInput({ inputMode, hourText, minuteText, meridiem, force12Hour = false, source = "" }) {
  const hour = Number(hourText);
  if (!hourPattern.test(hourText) || !minutePattern.test(minuteText)) return null;
  if (hour < 0 || hour > 23 || Number(minuteText) > 59) return null;

  const explicit24HourEntry = source === "hour" && /^\d{2}$/.test(hourText) && hour > 12;
  const mode = force12Hour
    ? timeInputModes.twelveHour
    : explicit24HourEntry || inputMode === timeInputModes.twentyFourHour
      ? timeInputModes.twentyFourHour
      : timeInputModes.twelveHour;

  if (mode === timeInputModes.twentyFourHour) {
    const stored = `${String(hour).padStart(2, "0")}:${minuteText}`;
    const parts = getTwelveHourParts(stored);
    return parts ? { stored, ...parts, mode: timeInputModes.twelveHour } : null;
  }

  if (hour < 1 || hour > 12 || !meridiem) return null;
  const stored = parseTwelveHourTime(hour, minuteText, meridiem);
  if (!stored) return null;
  return {
    stored,
    hour: String(hour),
    minute: String(minuteText).padStart(2, "0"),
    meridiem,
    mode: timeInputModes.twelveHour,
  };
}

function getAlarmInterval(startValue, endValue) {
  if (!isStoredTime(startValue) || !isStoredTime(endValue)) return null;

  const [startHour, startMinute] = startValue.split(":").map(Number);
  const [endHour, endMinute] = endValue.split(":").map(Number);
  const startMinutes = startHour * 60 + startMinute;
  let endMinutes = endHour * 60 + endMinute;

  if (endMinutes === startMinutes) return null;
  if (endMinutes < startMinutes) endMinutes += 24 * 60;

  const durationMinutes = endMinutes - startMinutes;
  if (durationMinutes > maximumAlarmDurationMinutes) return null;

  return {
    startMinutes,
    endMinutes,
    durationMinutes,
  };
}

function createTimePartInput({ id, label, placeholder, maxLength, value, alarmName, endpoint }) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = `workspace-input bellboy-time-input bellboy-time-${id}`;
  input.value = value;
  input.dataset.bellboyInputMode = timeInputModes.twentyFourHour;
  input.placeholder = placeholder;
  input.maxLength = maxLength;
  input.title = id === "hour"
    ? "Enter an hour from 00 to 23, or 1 to 12"
    : "Enter minutes from 00 to 59";
  input.dataset.validationTitle = input.title;
  input.autocomplete = "off";
  input.inputMode = "numeric";
  input.dataset.bellboyTimeValue = "";
  input.dataset.bellboyTimePart = id;
  input.setAttribute("aria-label", `${label} for ${alarmName} ${endpoint} time`);
  return input;
}

function createAlarmId() {
  return globalThis.crypto?.randomUUID?.() ||
    `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultCustomAlarm(name = "NPT") {
  return { id: createAlarmId(), name, ...alarmDefaults };
}

function getNextCustomAlarmName(customAlarms) {
  const usedNames = new Set(customAlarms.map(({ name }) => name));
  let number = 1;
  let name = "NPT";

  while (usedNames.has(name)) {
    number += 1;
    name = `NPT ${number}`;
  }

  return name;
}

function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    const hasCustomAlarmList = Array.isArray(saved.customAlarms);
    const oldCustom = saved.alarms?.custom;
    const savedCustomAlarms = Array.isArray(saved.customAlarms)
      ? saved.customAlarms
      : oldCustom && (oldCustom.start || oldCustom.end)
        ? [{
            id: createAlarmId(),
            name: saved.name || "NPT",
            ...oldCustom,
          }]
        : [];
    const customAlarms = savedCustomAlarms
      .filter((alarm) => alarm && typeof alarm === "object")
      .map((alarm) => ({
        id: typeof alarm.id === "string" ? alarm.id : createAlarmId(),
        name: typeof alarm.name === "string" && alarm.name.trim()
          ? alarm.name.trim()
          : "NPT",
        start: isStoredTime(alarm.start) ? alarm.start : "",
        end: isStoredTime(alarm.end) ? alarm.end : "",
      }));

    return {
      location: {
        label: typeof saved.location?.label === "string" ? saved.location.label : "",
        timezone: isValidTimezone(saved.location?.timezone) ? saved.location.timezone : "",
      },
      alarms: Object.fromEntries(
        alarmDefinitions.map(({ id }) => {
          const alarm = saved.alarms?.[id] || {};

          return [
            id,
            {
              start: isStoredTime(alarm.start) ? alarm.start : alarmDefaults.start,
              end: isStoredTime(alarm.end) ? alarm.end : alarmDefaults.end,
            },
          ];
        }),
      ),
      customAlarms: hasCustomAlarmList || customAlarms.length
        ? customAlarms
        : [createDefaultCustomAlarm(saved.name || "NPT")],
    };
  } catch {
    return {
      location: { ...locationDefaults },
      alarms: Object.fromEntries(
        alarmDefinitions.map(({ id }) => [id, { ...alarmDefaults }]),
      ),
      customAlarms: [createDefaultCustomAlarm()],
    };
  }
}

function createAudioController() {
  let context;
  let activeSources = [];
  let activeSound = "";
  let sequenceTimer;
  let playbackGeneration = 0;

  function getContext() {
    try {
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextConstructor) return null;
      context ||= new AudioContextConstructor();
      return context;
    } catch {
      return null;
    }
  }

  async function unlock() {
    const audioContext = getContext();

    if (!audioContext) return false;

    if (audioContext.state === "running") return true;
    try {
      await audioContext.resume();
      return audioContext.state === "running";
    } catch {
      return false;
    }
  }

  function stop() {
    playbackGeneration += 1;
    clearInterval(sequenceTimer);
    sequenceTimer = undefined;
    activeSources.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Sources that already ended need no further cleanup.
      }
      try {
        source.disconnect();
      } catch {
        // A disconnected node needs no further cleanup.
      }
    });
    activeSources = [];
    activeSound = "";
  }

  function playSequence({ sound, notes, phraseGap, createVoices, scheduleNote }) {
    const audioContext = getContext();
    if (!audioContext || audioContext.state !== "running") return false;
    const phraseDuration = notes.reduce((total, note) => total + note.duration, 0);
    let voices;
    try {
      voices = createVoices(audioContext);
      voices.outputNodes.forEach((node) => node.connect(audioContext.destination));
      const sources = voices.nodes.filter((node) => typeof node.start === "function");
      sources.forEach((source) => source.start());

      const schedulePhrase = (startAt) => {
        let noteStart = startAt;
        notes.forEach((note) => {
          scheduleNote(voices, note, noteStart, audioContext);
          noteStart += note.duration;
        });
      };

      schedulePhrase(audioContext.currentTime + 0.04);
      let nextPhraseAt = audioContext.currentTime + phraseDuration + 0.04;
      sequenceTimer = window.setInterval(() => {
        const startAt = Math.max(audioContext.currentTime + 0.04, nextPhraseAt);
        schedulePhrase(startAt);
        nextPhraseAt = startAt + phraseDuration;
      }, Math.max(250, (phraseDuration - phraseGap) * 1000));
      activeSources = voices.nodes;
      activeSound = sound;
      return true;
    } catch {
      voices?.nodes.forEach((node) => {
        try { node.stop?.(); } catch { /* Ignore partially started nodes. */ }
        try { node.disconnect(); } catch { /* Ignore nodes already disconnected. */ }
      });
      return false;
    }
  }

  function playSpringReminder() {
    const notes = [
      // Opening phrase of Vivaldi's public-domain Spring, I. Allegro (E major).
      { frequency: 659.25, duration: 0.25, accent: 0.88 }, // E5 pickup
      { frequency: 830.61, duration: 0.25, accent: 1 }, // G#5
      { frequency: 830.61, duration: 0.25, accent: 0.86 },
      { frequency: 830.61, duration: 0.25, accent: 0.86 },
      { frequency: 739.99, duration: 0.125, accent: 0.82 }, // F#5
      { frequency: 659.25, duration: 0.125, accent: 0.9 }, // E5
      { frequency: 987.77, duration: 0.75, accent: 1 }, // B5
      { frequency: 987.77, duration: 0.125, accent: 0.85 },
      { frequency: 880, duration: 0.125, accent: 0.9 }, // A5
      { frequency: 830.61, duration: 0.25, accent: 1 },
      { frequency: 830.61, duration: 0.25, accent: 0.86 },
      { frequency: 830.61, duration: 0.25, accent: 0.86 },
      { frequency: 739.99, duration: 0.125, accent: 0.82 },
      { frequency: 659.25, duration: 0.125, accent: 0.9 },
      { frequency: 987.77, duration: 0.75, accent: 1 },
      { frequency: 987.77, duration: 0.125, accent: 0.85 },
      { frequency: 880, duration: 0.125, accent: 0.9 },
      { frequency: 830.61, duration: 0.25, accent: 1 },
      { frequency: 880, duration: 0.125, accent: 0.86 },
      { frequency: 987.77, duration: 0.25, accent: 0.95 },
      { frequency: 880, duration: 0.25, accent: 0.9 },
      { frequency: 830.61, duration: 0.25, accent: 0.9 },
      { frequency: 739.99, duration: 0.25, accent: 0.9 },
      { frequency: 622.25, duration: 0.25, accent: 0.85 }, // D#5
      { frequency: 493.88, duration: 0.5, accent: 0.95 }, // B4
    ];
    return playSequence({
      sound: "reminder",
      notes,
      phraseGap: 0.08,
      createVoices: (audioContext) => {
        const lead = audioContext.createOscillator();
        const leadGain = audioContext.createGain();
        const bass = audioContext.createOscillator();
        const bassGain = audioContext.createGain();
        const drone = audioContext.createOscillator();
        const droneGain = audioContext.createGain();
        lead.type = "sawtooth";
        leadGain.gain.value = 0.0001;
        bass.type = "triangle";
        bassGain.gain.value = 0.0001;
        drone.type = "sine";
        drone.frequency.value = 82.41;
        droneGain.gain.value = 0.025;
        lead.connect(leadGain);
        bass.connect(bassGain);
        drone.connect(droneGain);
        return {
          nodes: [lead, leadGain, bass, bassGain, drone, droneGain],
          outputNodes: [leadGain, bassGain, droneGain],
          lead,
          leadGain,
          bass,
          bassGain,
        };
      },
      scheduleNote: (voices, note, startAt) => {
        const endAt = startAt + note.duration * 0.82;
        voices.lead.frequency.setValueAtTime(note.frequency, startAt);
        voices.bass.frequency.setValueAtTime(note.frequency / 2, startAt);
        voices.leadGain.gain.setValueAtTime(0.0001, startAt);
        voices.leadGain.gain.linearRampToValueAtTime(0.16 * note.accent, startAt + 0.025);
        voices.leadGain.gain.setTargetAtTime(0.0001, endAt, 0.07);
        voices.bassGain.gain.setValueAtTime(0.0001, startAt);
        voices.bassGain.gain.linearRampToValueAtTime(0.07 * note.accent, startAt + 0.04);
        voices.bassGain.gain.setTargetAtTime(0.0001, endAt, 0.09);
      },
    });
  }

  function playEineKleineNachtmusik() {
    const audioContext = getContext();
    if (!audioContext || audioContext.state !== "running") return false;

    const eighth = 0.24;
    const quarter = eighth * 2;
    const notes = [
      { frequency: 783.99, duration: quarter }, { duration: eighth },
      { frequency: 587.33, duration: eighth }, { frequency: 783.99, duration: quarter },
      { duration: eighth }, { frequency: 587.33, duration: eighth },
      { frequency: 783.99, duration: eighth }, { frequency: 587.33, duration: eighth },
      { frequency: 783.99, duration: eighth }, { frequency: 987.77, duration: eighth },
      { frequency: 1174.66, duration: quarter }, { duration: quarter },
      { frequency: 1046.5, duration: quarter }, { duration: eighth },
      { frequency: 880, duration: eighth }, { frequency: 1046.5, duration: quarter },
      { duration: eighth }, { frequency: 880, duration: eighth },
      { frequency: 1046.5, duration: eighth }, { frequency: 880, duration: eighth },
      { frequency: 739.99, duration: eighth }, { frequency: 880, duration: eighth },
      { frequency: 587.33, duration: quarter }, { duration: quarter },
    ];
    return playSequence({
      sound: "alarm",
      notes,
      phraseGap: 0.2,
      createVoices: (context) => {
        const tone = context.createOscillator();
        const volume = context.createGain();
        const harmony = context.createOscillator();
        const harmonyVolume = context.createGain();
        tone.type = "triangle";
        volume.gain.value = 0.0001;
        harmony.type = "triangle";
        harmonyVolume.gain.value = 0.0001;
        tone.connect(volume);
        harmony.connect(harmonyVolume);
        return {
          nodes: [tone, volume, harmony, harmonyVolume],
          outputNodes: [volume, harmonyVolume],
          tone,
          volume,
          harmony,
          harmonyVolume,
        };
      },
      scheduleNote: (voices, note, start) => {
        const { frequency, duration } = note;
        const end = start + duration * 0.86;
        if (frequency) {
          voices.tone.frequency.setValueAtTime(frequency, start);
          voices.harmony.frequency.setValueAtTime(frequency / 2, start);
          voices.volume.gain.setValueAtTime(0.0001, start);
          voices.volume.gain.linearRampToValueAtTime(0.075, start + 0.025);
          voices.volume.gain.setTargetAtTime(0.0001, end, 0.035);
          voices.harmonyVolume.gain.setValueAtTime(0.0001, start);
          voices.harmonyVolume.gain.linearRampToValueAtTime(0.022, start + 0.035);
          voices.harmonyVolume.gain.setTargetAtTime(0.0001, end, 0.04);
        } else {
          voices.volume.gain.setValueAtTime(0.0001, start);
          voices.harmonyVolume.gain.setValueAtTime(0.0001, start);
        }
      },
    });
  }

  async function play(sound) {
    if (sound === activeSound && context?.state === "running") return true;

    stop();
    const generation = playbackGeneration;
    const unlocked = await unlock();

    if (generation !== playbackGeneration || !unlocked) return false;

    const started = sound === "reminder"
      ? playSpringReminder()
      : sound === "alarm"
        ? playEineKleineNachtmusik()
        : false;
    if (!started) activeSound = "";
    return started;
  }

  return Object.freeze({ unlock, play, stop });
}

function createBellboy({ state, onRefreshOutput = () => {} }) {
  const settings = readSettings();
  const dismissed = new Set();
  const audio = createAudioController();
  let activeNotification = null;
  let control;

  const overlay = document.querySelector("#bellboyNotification");
  const notificationTitle = document.querySelector("#bellboyNotificationTitle");
  const notificationTimezone = document.querySelector("#bellboyNotificationTimezone");
  const notificationAudioStatus = document.querySelector("#bellboyNotificationAudioStatus");
  const notificationMessage = document.querySelector("#bellboyNotificationMessage");
  const dismissButton = document.querySelector("#bellboyNotificationDismiss");

  const unlockAudioFromGesture = () => { void audio.unlock(); };
  document.addEventListener("pointerdown", unlockAudioFromGesture);
  document.addEventListener("keydown", unlockAudioFromGesture);

  function persistSettings() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch {
      // Bellboy remains usable for this session when storage is unavailable.
    }
    onRefreshOutput();
  }

  function persistSettingsBeforePageExit() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch {
      // Ignore storage failures during page teardown.
    }
  }

  function getAlarmEntries() {
    return [
      ...alarmDefinitions.map((definition) => ({
        ...definition,
        ...settings.alarms[definition.id],
        alarm: settings.alarms[definition.id],
        alarmId: definition.id,
        name: definition.label,
        kind: "fixed",
      })),
      ...settings.customAlarms.map((alarm) => ({
        ...alarm,
        id: alarm.id,
        alarmId: alarm.id,
        alarm,
        className: "custom",
        endLeadMinutes: 2,
        kind: "custom",
        name: alarm.name,
      })),
    ];
  }

  function getBellboyTimezone() {
    return settings.location.timezone || state.currentTimezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  function getBellboyLocationLabel() {
    return settings.location.timezone
      ? settings.location.label
      : state.currentLocationLabel || "your device location";
  }

  function createTimeField(labelText, alarm, endpoint) {
    const label = document.createElement("div");
    label.className = "bellboy-time-field";
    const title = document.createElement("span");
    const selectors = document.createElement("div");
    title.textContent = labelText;
    selectors.className = "bellboy-time-selects";
    selectors.dataset.bellboyTimeField = "";
    selectors.dataset.bellboyAlarmId = alarm.alarmId;
    selectors.dataset.bellboyEndpoint = endpoint;
    const timeParts = getTwelveHourParts(alarm[endpoint]);
    selectors.dataset.bellboyInputMode = timeParts ? timeInputModes.twelveHour : timeInputModes.twentyFourHour;
    selectors.dataset.bellboyCanonicalTime = isStoredTime(alarm[endpoint]) ? alarm[endpoint] : "";
    const hour = timeParts?.hour || "";
    const minute = timeParts?.minute || "";
    const meridiem = timeParts?.meridiem || "";
    const timeInputs = document.createElement("div");
    timeInputs.className = "bellboy-time-parts";
    timePartDefinitions.forEach((part) => {
      timeInputs.appendChild(createTimePartInput({
        ...part,
        value: part.id === "hour" ? hour : minute,
        alarmName: alarm.name,
        endpoint: labelText.toLowerCase(),
      }));
    });

    const select = createWorkspaceSelect({
      name: `bellboy:${alarm.alarmId}:${endpoint}:meridiem`,
      placeholder: "AM/PM",
      selectedValue: meridiem,
      options: meridiemOptions,
      wrapperClass: "bellboy-meridiem-select",
      wrapperDataset: {
        bellboyTimeSelect: "",
        bellboyAlarmId: alarm.alarmId,
        bellboyEndpoint: endpoint,
        bellboyComponent: "meridiem",
      },
      triggerDataset: { bellboyTimeTrigger: "" },
      getOptionDataset: () => ({ bellboyTimeOption: "" }),
    });
    select.trigger.setAttribute("aria-label", `${labelText} AM or PM for ${alarm.name}`);
    select.menu.setAttribute("role", "listbox");
    selectors.append(timeInputs, select.wrapper);
    label.append(title, selectors);
    return label;
  }

  function createAlarmCard(alarm) {
    const card = document.createElement("section");
    const header = document.createElement("div");
    const title = document.createElement("h3");
    const times = document.createElement("div");
    const deleteAlarm = alarm.kind === "custom"
      ? document.createElement("button")
      : null;

    card.className = `bellboy-alarm-card bellboy-${alarm.className}`;
    if (alarm.kind === "custom") {
      card.dataset.bellboyCustomId = alarm.alarmId;
    }
    header.className = "bellboy-alarm-header";
    title.className = "bellboy-alarm-title";
    title.textContent = alarm.name;
    header.appendChild(title);

    if (alarm.kind === "custom") {
      const nameRow = document.createElement("div");
      const nameInput = document.createElement("input");
      const saveName = document.createElement("button");

      nameRow.className = "bellboy-custom-name-row";
      nameInput.type = "text";
      nameInput.className = "workspace-input";
      nameInput.maxLength = 32;
      nameInput.value = alarm.name;
      nameInput.placeholder = "Alarm name";
      nameInput.setAttribute("aria-label", `Name for ${alarm.name}`);
      nameInput.dataset.bellboyAlarmName = alarm.alarmId;
      saveName.type = "button";
      saveName.className = "btn btn-secondary bellboy-save-name";
      saveName.textContent = "Save Name";
      saveName.dataset.bellboySaveName = "";
      deleteAlarm.type = "button";
      deleteAlarm.className = "bellboy-delete-alarm";
      deleteAlarm.textContent = "×";
      deleteAlarm.title = `Delete ${alarm.name}`;
      deleteAlarm.setAttribute("aria-label", `Delete ${alarm.name}`);
      deleteAlarm.dataset.bellboyDeleteAlarm = alarm.alarmId;
      header.appendChild(deleteAlarm);
      nameRow.append(nameInput, saveName);
      card.append(header, nameRow);
    } else {
      card.appendChild(header);
    }

    times.className = "bellboy-time-fields";
    times.append(
      createTimeField("Start time", alarm, "start"),
      createTimeField("End time", alarm, "end"),
    );
    card.appendChild(times);
    setIntervalValidation(card, alarm.start, alarm.end);

    return card;
  }

  function createControl() {
    const timezoneNote = document.createElement("p");
    const fixedAlarms = document.createElement("div");
    const customAlarms = document.createElement("div");

    control = document.createElement("div");
    control.className = "bellboy-control";
    timezoneNote.className = "bellboy-timezone-note";
    timezoneNote.dataset.bellboyTimezoneNote = "";
    timezoneNote.textContent = getTimezoneNote();

    fixedAlarms.className = "bellboy-fixed-alarms";
    fixedAlarms.append(...getAlarmEntries()
      .filter((alarm) => alarm.kind === "fixed")
      .map(createAlarmCard));

    customAlarms.className = "bellboy-custom-alarms";
    const customEntries = getAlarmEntries().filter((alarm) => alarm.kind === "custom");
    if (customEntries.length) {
      customAlarms.append(...customEntries.map(createAlarmCard));
    } else {
      customAlarms.textContent = "No custom alarms. Add an NPT alarm to get started.";
      customAlarms.classList.add("bellboy-empty-custom-alarms");
    }

    control.append(timezoneNote, fixedAlarms, customAlarms);
    return control;
  }

  function getZonedTimeParts(now = new Date()) {
    const timeZone = getBellboyTimezone();
    try {
      return Object.fromEntries(
        new Intl.DateTimeFormat("en-CA", {
          timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23",
        })
          .formatToParts(now)
          .map(({ type, value }) => [type, value]),
      );
    } catch {
      return Object.fromEntries(
        new Intl.DateTimeFormat("en-CA", {
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23",
        })
          .formatToParts(now)
          .map(({ type, value }) => [type, value]),
      );
    }
  }

  function getOccurrenceDate(dateParts, dayOffset) {
    const day = new Date(
      Date.UTC(Number(dateParts.year), Number(dateParts.month) - 1, Number(dateParts.day) + dayOffset),
    );

    return [
      day.getUTCFullYear(),
      String(day.getUTCMonth() + 1).padStart(2, "0"),
      String(day.getUTCDate()).padStart(2, "0"),
    ].join("-");
  }

  function getSecondsUntil(timeValue, dateParts) {
    const [targetHour, targetMinute] = timeValue.split(":").map(Number);
    const nowSeconds =
      Number(dateParts.hour) * 3600 +
      Number(dateParts.minute) * 60 +
      Number(dateParts.second);
    let secondsUntil = targetHour * 3600 + targetMinute * 60 - nowSeconds;
    let dayOffset = 0;

    if (secondsUntil < 0) {
      secondsUntil += 86400;
      dayOffset = 1;
    }

    return {
      secondsUntil,
      occurrenceDate: getOccurrenceDate(dateParts, dayOffset),
    };
  }

  function createCandidates(now = new Date()) {
    const dateParts = getZonedTimeParts(now);
    const candidates = [];

    getAlarmEntries().forEach((definition) => {
      const { alarm } = definition;
      if (!getAlarmInterval(alarm.start, alarm.end)) return;

      [
        { endpoint: "start", time: alarm.start, leadMinutes: 5, verb: "starts" },
        { endpoint: "end", time: alarm.end, leadMinutes: definition.endLeadMinutes, verb: "ends" },
      ].forEach(({ endpoint, time, leadMinutes, verb }) => {
        const { secondsUntil, occurrenceDate } = getSecondsUntil(time, dateParts);
        const occurrenceId = `${definition.id}:${endpoint}:${time}:${occurrenceDate}`;

        candidates.push({
          alarmName: definition.name,
          definition,
          endpoint,
          leadMinutes,
          occurrenceId,
          secondsUntil,
          verb,
        });
      });
    });

    return candidates;
  }

  function getNextAlarmParts() {
    const next = createCandidates().sort(
      (left, right) => left.secondsUntil - right.secondsUntil,
    )[0];

    return next
      ? {
          alarmName: next.alarmName,
          verb: next.verb,
          seconds: next.secondsUntil,
          occurrenceId: next.occurrenceId,
        }
      : null;
  }

  function getTriggeredNotification(candidate) {
    if (candidate.secondsUntil === 0) {
      return {
        ...candidate,
        phase: "ringing",
        stageKey: `${candidate.occurrenceId}:ringing`,
      };
    }

    if (candidate.secondsUntil <= candidate.leadMinutes * 60) {
      return {
        ...candidate,
        phase: "reminder",
        stageKey: `${candidate.occurrenceId}:reminder`,
      };
    }

    return null;
  }

  function formatNotificationTitle(notification) {
    const eventLabel = `${notification.alarmName} ${notification.verb}`;

    return notification.phase === "ringing"
      ? `${eventLabel} now`
      : `${eventLabel} in ${Math.ceil(notification.secondsUntil / 60)} minutes`;
  }

  function getTimezoneNote() {
    const location = getBellboyLocationLabel();
    const timezone = getBellboyTimezone();
    return settings.location.timezone
      ? `BellBoy alarms use ${location} time (${timezone}). Clear the BellBoy search to follow the clock card instead.`
      : `BellBoy follows the clock card: ${location} (${timezone}). Set a BellBoy location above to override it.`;
  }

  function updateTimezoneNotes() {
    const note = getTimezoneNote();
    document.querySelectorAll("[data-bellboy-timezone-note]").forEach((element) => {
      element.textContent = note;
    });
    if (activeNotification && notificationTimezone) {
      notificationTimezone.textContent = note;
    }
    document.querySelectorAll("[data-bellboy-location-input]").forEach((input) => {
      if (!settings.location.timezone) {
        input.placeholder = `Uses clock: ${state.currentLocationLabel || "device timezone"}`;
      }
    });
  }

  function setLocationPreference(location) {
    if (!location) {
      if (!settings.location.timezone) return;
      settings.location = { ...locationDefaults };
      persistSettings();
      tick();
      return;
    }
    if (!isValidTimezone(location.timezone)) return;
    settings.location = {
      label: location.label || location.timezone,
      timezone: location.timezone,
    };
    persistSettings();
    tick();
  }

  function playNotificationSound(notification) {
    const sound = notification.phase === "ringing" ? "alarm" : "reminder";
    void audio.play(sound).then((isPlaying) => {
      if (activeNotification?.stageKey !== notification.stageKey) return;
      notificationAudioStatus.textContent = isPlaying
        ? (sound === "reminder" ? "Spring reminder music is playing" : "Alarm music is playing")
        : "Sound is waiting for a browser interaction. Click or press a key to enable it.";
    });
  }

  function showNotification(notification) {
    const { alarm } = notification.definition;
    activeNotification = notification;
    notificationTitle.textContent = formatNotificationTitle(notification);
    notificationTimezone.textContent = getTimezoneNote();
    const endpointTime = alarm[notification.endpoint];
    notificationMessage.textContent = notification.phase === "ringing"
      ? notification.alarmName + (notification.endpoint === "start" ? " aux starts" : " aux ends") +
        " now. Scheduled " + (notification.endpoint === "start" ? "until " : "from ") +
        formatTwelveHourTime(alarm[notification.endpoint === "start" ? "end" : "start"]) + "."
      : "Your scheduled " + notification.alarmName +
        (notification.endpoint === "start" ? " aux starts" : " aux ends") +
        " soon. The alarm is set for " + formatTwelveHourTime(endpointTime) + ".";
    dismissButton.textContent = notification.phase === "ringing"
      ? "Done Changed Aux"
      : "I understood";
    overlay.hidden = false;
    overlay.dataset.phase = notification.phase;
    dismissButton.focus();
    notificationAudioStatus.textContent = "Starting sound…";
    playNotificationSound(notification);
  }

  function hideNotification() {
    activeNotification = null;
    overlay.hidden = true;
    delete overlay.dataset.phase;
    audio.stop();
  }

  function getActiveAlarm() {
    const dateParts = getZonedTimeParts();
    const currentMinute = Number(dateParts.hour) * 60 +
      Number(dateParts.minute) + Number(dateParts.second) / 60;

    return getAlarmEntries()
      .filter(({ alarm }) => alarm.start && alarm.end)
      .map((definition) => {
        const interval = getAlarmInterval(
          definition.alarm.start,
          definition.alarm.end,
        );
        if (!interval) return null;
        const duration = interval.durationMinutes;
        const elapsed = (currentMinute - interval.startMinutes + 1440) % 1440;

        return elapsed < duration
          ? {
              name: definition.name,
              secondsRemaining: Math.max(0, duration * 60 - elapsed * 60),
            }
          : null;
      })
      .filter(Boolean)
      .sort((left, right) => left.secondsRemaining - right.secondsRemaining)[0];
  }

  function getWorkspaceOutputParts() {
    const activeAlarm = getActiveAlarm();
    if (activeAlarm) {
      return {
        prefix: `On ${activeAlarm.name}. Be back in`,
        seconds: activeAlarm.secondsRemaining,
      };
    }

    if (activeNotification) {
      return {
        prefix: `${activeNotification.alarmName} in`,
        seconds: activeNotification.phase === "ringing"
          ? 0
          : activeNotification.secondsUntil,
      };
    }

    const next = createCandidates()
      .sort((left, right) => left.secondsUntil - right.secondsUntil)[0];

    if (!next) return null;

    return {
      prefix: `${next.alarmName} in`,
      seconds: next.secondsUntil,
    };
  }

  function getWorkspaceOutput() {
    const parts = getWorkspaceOutputParts();
    if (parts) return `${parts.prefix} ${formatCountdown(parts.seconds)}`;

    const invalidAlarm = getAlarmEntries().find(({ alarm }) =>
      alarm.start && alarm.end && !getAlarmInterval(alarm.start, alarm.end),
    );
    return invalidAlarm
      ? `${invalidAlarm.name}: check the start and end times. The duration must be 12 hours or less; an earlier end time is the next day.`
      : "Set start and end times to arm BellBoy.";
  }

  function tick() {
    updateTimezoneNotes();
    const candidates = createCandidates();

    if (activeNotification) {
      // A ringing alarm is an acknowledged notification state, not a one-second
      // condition. Keep it visible until the user explicitly dismisses it.
      if (activeNotification.phase === "ringing") {
        notificationTitle.textContent = formatNotificationTitle(activeNotification);
        notificationTimezone.textContent = getTimezoneNote();
      } else {
        const current = candidates
          .map(getTriggeredNotification)
          .find((notification) => notification?.occurrenceId === activeNotification.occurrenceId);

        if (current && current.phase !== activeNotification.phase) {
          showNotification(current);
        } else if (current) {
          activeNotification = current;
          notificationTitle.textContent = formatNotificationTitle(current);
          notificationTimezone.textContent = getTimezoneNote();
        } else {
          hideNotification();
        }
      }
    }

    if (!activeNotification) {
      const next = candidates
        .map(getTriggeredNotification)
        .filter((notification) => notification && !dismissed.has(notification.stageKey))
        .sort((left, right) => left.secondsUntil - right.secondsUntil)[0];

      if (next) showNotification(next);
    }

    onRefreshOutput();
  }

  function handleInput(event) {
    const input = event.target;

    if (input.matches("[data-bellboy-time-part]")) {
      const field = input.closest("[data-bellboy-time-field]");
      if (!field) return;

      const hour = field.querySelector('[data-bellboy-time-part="hour"]')?.value.trim() || "";
      const minute = field.querySelector('[data-bellboy-time-part="minute"]')?.value.trim() || "";
      if (/^\d{2}$/.test(hour) && /^\d{2}$/.test(minute)) {
        saveTimeField(field, {
          live: true,
          source: input.dataset.bellboyTimePart,
        });
      } else {
        validateTimeField(field);
      }
      return;
    }

    if (input.matches("[data-bellboy-location-input]")) {
      if (!input.value.trim() && settings.location.timezone) {
        settings.location = { ...locationDefaults };
        persistSettings();
      }
      return;
    }

    if (input.matches("[data-bellboy-alarm-name]")) {
      const alarm = settings.customAlarms.find(({ id }) => id === input.dataset.bellboyAlarmName);
      if (!alarm) return;
      alarm.name = input.value.trim() || "NPT";
      persistSettings();
    }
  }

  function resolveTimeEdit({ field, hourText, minuteText, meridiem, force12Hour = false, source = "" }) {
    return resolveTimeInput({
      inputMode: field.dataset.bellboyInputMode || timeInputModes.twelveHour,
      hourText,
      minuteText,
      meridiem,
      force12Hour,
      source,
    });
  }

  function validateTimeField(field) {
    if (!field) return false;

    const hourInput = field.querySelector('[data-bellboy-time-part="hour"]');
    const minuteInput = field.querySelector('[data-bellboy-time-part="minute"]');
    if (!hourInput || !minuteInput) return false;

    const hourText = hourInput.value.trim();
    const minuteText = minuteInput.value.trim();
    const hasInput = Boolean(hourText || minuteText);
    const hourValid = hourPattern.test(hourText) && Number(hourText) <= 23;
    const minuteValid = minutePattern.test(minuteText) && Number(minuteText) <= 59;

    hourInput.setAttribute("aria-invalid", String(hasInput && !hourValid));
    minuteInput.setAttribute("aria-invalid", String(hasInput && !minuteValid));
    return hourValid && minuteValid;
  }

  function commitTimeField(field, { force12Hour = false, source = "" } = {}) {
    if (!field) return false;

    const hourInput = field.querySelector('[data-bellboy-time-part="hour"]');
    const minuteInput = field.querySelector('[data-bellboy-time-part="minute"]');
    const meridiemTrigger = field.querySelector("[data-bellboy-time-trigger]");
    if (!hourInput || !minuteInput) return false;

    const hourText = hourInput.value.trim();
    const minuteText = minuteInput.value.trim();
    const meridiem = meridiemTrigger?.dataset.value || "";
    const hasInput = Boolean(hourText || minuteText);
    const hourValid = hourPattern.test(hourText) && Number(hourText) <= 23;
    const minuteValid = minutePattern.test(minuteText) && Number(minuteText) <= 59;

    hourInput.setAttribute("aria-invalid", String(hasInput && !hourValid));
    minuteInput.setAttribute("aria-invalid", String(hasInput && !minuteValid));
    if (!hourValid || !minuteValid) return false;

    const resolved = resolveTimeEdit({
      field,
      hourText,
      minuteText,
      meridiem,
      force12Hour,
      source,
    });
    if (!resolved) return false;

    field.dataset.bellboyInputMode = resolved.mode;
    field.dataset.bellboyCanonicalTime = resolved.stored;
    hourInput.value = resolved.hour;
    minuteInput.value = resolved.minute;
    hourInput.setAttribute("aria-invalid", "false");
    minuteInput.setAttribute("aria-invalid", "false");

    if (meridiemTrigger?.dataset.value !== resolved.meridiem) {
      setWorkspaceSelectValue(meridiemTrigger.closest(".workspace-select-wrapper"), resolved.meridiem);
    }

    const alarm = getAlarmEntries().find(({ alarmId }) =>
      alarmId === field.dataset.bellboyAlarmId,
    )?.alarm;
    if (!alarm) return false;

    const endpoint = field.dataset.bellboyEndpoint;
    const proposedStart = endpoint === "start" ? resolved.stored : alarm.start;
    const proposedEnd = endpoint === "end" ? resolved.stored : alarm.end;
    const hasBothTimes = Boolean(proposedStart && proposedEnd);
    const hasInvalidInterval = hasBothTimes && !getAlarmInterval(proposedStart, proposedEnd);
    setIntervalValidation(field.closest(".bellboy-alarm-card"), proposedStart, proposedEnd);
    if (hasInvalidInterval) return false;

    if (alarm[endpoint] !== resolved.stored) {
      clearNotificationState(field.dataset.bellboyAlarmId, endpoint);
      alarm[endpoint] = resolved.stored;
      persistSettings();
    }
    return true;
  }

  function saveTimeField(field, { live = false, force12Hour = false, source = "" } = {}) {
    const committed = commitTimeField(field, { force12Hour, source });
    if (committed && live) tick();
    return committed;
  }

  function setIntervalValidation(card, start, end) {
    if (!card) return;

    const isInvalid = Boolean(start && end && !getAlarmInterval(start, end));
    card.querySelectorAll("[data-bellboy-time-value]").forEach((input) => {
      input.setAttribute("aria-invalid", String(isInvalid));
      input.title = isInvalid
        ? "Start and end times must differ, and the interval cannot exceed 12 hours. An earlier end time is on the next day."
        : input.dataset.validationTitle;
    });
  }

  function clearNotificationState(alarmId, endpoint) {
    const keyPrefix = `${alarmId}:${endpoint}:`;
    [...dismissed].forEach((key) => {
      if (key.startsWith(keyPrefix)) dismissed.delete(key);
    });

    if (
      activeNotification?.definition.alarmId === alarmId &&
      activeNotification.endpoint === endpoint
    ) {
      hideNotification();
    }
  }

  function handleSelect(option) {
    if (!option?.matches("[data-bellboy-time-option]")) return;

    const field = option.closest("[data-bellboy-time-field]");
    if (!field) return;

    const trigger = option.closest(".workspace-select-wrapper")?.querySelector("[data-bellboy-time-trigger]");
    const meridiem = option.dataset.value || trigger?.dataset.value || "";
    const selectedWrapper = option.closest(".workspace-select-wrapper");
    if (selectedWrapper) setWorkspaceSelectValue(selectedWrapper, meridiem);

    saveTimeField(field, {
      live: true,
      force12Hour: true,
      source: "meridiem",
    });
  }

  function completeAlarm(notification) {
    if (!notification?.definition) return;

    const { definition } = notification;
    if (definition.kind === "custom") {
      settings.customAlarms = settings.customAlarms.filter(({ id }) =>
        id !== definition.alarmId,
      );
    } else if (settings.alarms[definition.alarmId]) {
      settings.alarms[definition.alarmId] = { ...alarmDefaults };
    }

    const keyPrefix = `${definition.alarmId}:`;
    [...dismissed].forEach((key) => {
      if (key.startsWith(keyPrefix)) dismissed.delete(key);
    });

    hideNotification();
    persistSettings();
    refreshControl();
    tick();
  }

  function handleClick(event) {
    if (event.target.closest("[data-tool='bellboy']")) {
      void audio.unlock();
    }

    if (event.target.closest("[data-bellboy-save-name]")) {
      const card = event.target.closest(".bellboy-alarm-card");
      const nameInput = card?.querySelector("[data-bellboy-alarm-name]");
      const alarm = settings.customAlarms.find(({ id }) =>
        id === nameInput?.dataset.bellboyAlarmName,
      );
      if (alarm && nameInput) {
        alarm.name = nameInput.value.trim() || "NPT";
        nameInput.value = alarm.name;
        const title = card.querySelector(".bellboy-alarm-title");
        if (title) title.textContent = alarm.name;
        persistSettings();
      }
    }

    if (event.target.closest("[data-bellboy-add-alarm]")) {
      settings.customAlarms.push(createDefaultCustomAlarm(
        getNextCustomAlarmName(settings.customAlarms),
      ));
      persistSettings();
      refreshControl();
    }

    const deleteButton = event.target.closest("[data-bellboy-delete-alarm]");
    if (deleteButton) {
      settings.customAlarms = settings.customAlarms.filter(({ id }) =>
        id !== deleteButton.dataset.bellboyDeleteAlarm,
      );
      persistSettings();
      refreshControl();
    }

    if (event.target.closest("[data-bellboy-reset]")) {
      if (!window.confirm("Reset all BellBoy alarms and custom alarm names?")) return;
      settings.alarms = Object.fromEntries(
        alarmDefinitions.map(({ id }) => [id, { ...alarmDefaults }]),
      );
      settings.customAlarms = [createDefaultCustomAlarm()];
      dismissed.clear();
      audio.stop();
      persistSettings();
      refreshControl();
      tick();
    }

    if (event.target === dismissButton && activeNotification) {
      const notification = activeNotification;
      if (notification.phase === "ringing") {
        if (notification.endpoint === "end") {
          completeAlarm(notification);
        } else {
          dismissed.add(notification.stageKey);
          hideNotification();
          onRefreshOutput();
          tick();
        }
        return;
      }

      dismissed.add(notification.stageKey);
      hideNotification();
      onRefreshOutput();
      tick();
    }
  }

  function refreshControl() {
    if (control?.isConnected) {
      control.replaceWith(createControl());
    }
    onRefreshOutput();
  }

  function handleChange(event) {
    const input = event.target;
    if (input.matches("[data-bellboy-time-part]")) {
      saveTimeField(input.closest("[data-bellboy-time-field]"), {
        source: input.dataset.bellboyTimePart,
      });
      return;
    }
    handleInput(event);
  }

  window.addEventListener("pagehide", persistSettingsBeforePageExit);
  window.addEventListener("beforeunload", persistSettingsBeforePageExit);

  window.addEventListener("storage", (event) => {
    if (event.key !== storageKey || !event.newValue) return;
    const updated = readSettings();
    settings.location = updated.location;
    settings.alarms = updated.alarms;
    settings.customAlarms = updated.customAlarms;
    const locationInput = document.querySelector("[data-bellboy-location-input]");
    if (locationInput) locationInput.value = settings.location.label;
    refreshControl();
    tick();
  });

  return Object.freeze({
    createControl,
    getLocationPreference: () => ({ ...settings.location }),
    getWorkspaceOutput,
    getWorkspaceOutputParts,
    getNextAlarmParts,
    formatCountdown,
    handleClick,
    handleChange,
    handleInput,
    handleSelect,
    setLocationPreference,
    tick,
    unlockAudio: audio.unlock,
  });
}

export { createBellboy };
