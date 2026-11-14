/**
 * Circular presentation for BellBoy's existing next-alarm countdown.
 * This component owns no alarm scheduling: it renders the seconds and stable
 * occurrence identity supplied by the BellBoy service.
 */
export function createAlarmCountdown() {
  const root = document.createElement("div");
  root.className = "bellboy-alarm-countdown";
  root.setAttribute("role", "group");
  root.setAttribute(
    "aria-label",
    "Time remaining until the next BellBoy alarm",
  );

  const ns = "http://www.w3.org/2000/svg";
  const size = 100;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const ring = document.createElementNS(ns, "svg");
  ring.classList.add("bellboy-alarm-countdown-ring");
  ring.setAttribute("viewBox", `0 0 ${size} ${size}`);
  ring.setAttribute("aria-hidden", "true");

  const circle = (className) => {
    const node = document.createElementNS(ns, "circle");
    node.classList.add(className);
    node.setAttribute("cx", "50");
    node.setAttribute("cy", "50");
    node.setAttribute("r", String(radius));
    return node;
  };

  const track = circle("bellboy-alarm-countdown-track");
  const progress = circle("bellboy-alarm-countdown-progress");

  // Dot follows the leading edge of the progress arc.
  const dot = circle("bellboy-alarm-countdown-dot");
  dot.setAttribute("r", "3.5");

  progress.style.strokeDasharray = String(circumference);
  progress.style.strokeDashoffset = "0";

  ring.append(track, progress, dot);

  const center = document.createElement("div");
  center.className = "bellboy-alarm-countdown-center";
  const output = document.createElement("output");
  output.className = "bellboy-alarm-countdown-time";
  output.setAttribute("aria-live", "off");
  const caption = document.createElement("span");
  caption.className = "bellboy-alarm-countdown-caption";
  caption.textContent = "until alarm";
  center.append(output, caption);
  root.append(ring, center);

  let currentOccurrence = null;
  let initialDuration = 1;
  let lastSeconds = null;

  function format(seconds) {
    const safe = Math.max(0, Math.ceil(Number(seconds) || 0));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    return hours > 0
      ? [hours, minutes, secs].map((n) => String(n).padStart(2, "0")).join(":")
      : [minutes, secs].map((n) => String(n).padStart(2, "0")).join(":");
  }

  function update({ secondsRemaining, occurrenceId }) {
    const seconds = Math.max(0, Math.ceil(Number(secondsRemaining) || 0));
    if (occurrenceId !== currentOccurrence) {
      currentOccurrence = occurrenceId;
      initialDuration = Math.max(1, seconds);
    }
    const fraction = Math.max(0, Math.min(1, seconds / initialDuration));

    const angle = 2 * Math.PI * fraction;
    const dotX = 50 + radius * Math.cos(angle);
    const dotY = 50 + radius * Math.sin(angle);

    dot.setAttribute("cx", String(dotX));
    dot.setAttribute("cy", String(dotY));

    progress.style.strokeDashoffset = String(circumference * (1 - fraction));
    root.dataset.timerState =
      seconds <= 0
        ? "complete"
        : fraction <= 0.1
          ? "critical"
          : fraction <= 0.25
            ? "warning"
            : fraction <= 0.6
              ? "midway"
              : "start";
    if (seconds !== lastSeconds) {
      output.value = format(seconds);
      output.textContent = format(seconds);
      root.setAttribute("aria-label", `Next alarm in ${format(seconds)}`);
      lastSeconds = seconds;
    }
  }

  return { element: root, update };
}
