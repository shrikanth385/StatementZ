/**
 * Clock/BellBoy carousel component.
 * Owns slide construction, navigation state, auto-rotation, and interaction pauses.
 * The caller remains responsible for clock and alarm data.
 */
export function createClockCardCarousel({
  card,
  clockElements,
  bellboyCard,
  searchWrapper,
  showBellboy = true,
  rotationInterval = 8000,
  resumeDelay = 10000,
}) {
  if (!card || !bellboyCard) {
    return {
      setSlide() {},
      updateAlarmState() {},
      getTrack: () => null,
    };
  }

  const bottomPanel = card.closest(".bottom");
  if (!showBellboy) {
    card.classList.add("clock-card-clock");
    card.replaceChildren(...clockElements.filter(Boolean));
    bottomPanel?.removeAttribute("data-clock-card-slide");
    return {
      setSlide() {},
      updateAlarmState() {},
      getTrack: () => null,
    };
  }

  const carousel = document.createElement("div");
  const track = document.createElement("div");
  const clockSlide = document.createElement("section");
  const bellboySlide = document.createElement("section");
  const dots = document.createElement("nav");
  let rotationTimer;
  let resumeTimer;
  let paused = false;
  let alarmActive = false;

  carousel.className = "clock-card-carousel";
  carousel.id = "clockCardCarousel";
  carousel.setAttribute("aria-label", "Clock and BellBoy cards");
  track.className = "clock-card-track";
  track.id = "clockCardTrack";
  track.dataset.activeSlide = "1";
  clockSlide.className = "clock-card-slide clock-card-clock";
  bellboySlide.className = "clock-card-slide clock-card-bellboy-slide";
  dots.className = "clock-card-dots";
  dots.setAttribute("aria-label", "Carousel navigation");

  for (const element of clockElements) {
    if (element) clockSlide.append(element);
  }

  const slideLabels = ["Clock", "BellBoy"];
  slideLabels.forEach((label, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "clock-card-dot";
    dot.dataset.clockCardSlide = String(index);
    dot.setAttribute("aria-label", `Show ${label} card`);
    dot.setAttribute("aria-pressed", String(index === 1));
    dot.addEventListener("click", () => setSlide(index));
    dots.append(dot);
  });

  bellboySlide.append(bellboyCard);
  track.append(clockSlide, bellboySlide);
  carousel.append(track);
  card.replaceChildren(carousel);
  // Dock navigation to the stable outer panel so slide-specific layout changes
  // cannot move it vertically.
  (bottomPanel || card).append(dots);

  function setSlide(index) {
    const activeSlide = index === 1 ? "1" : "0";
    track.dataset.activeSlide = activeSlide;
    bottomPanel?.setAttribute("data-clock-card-slide", activeSlide === "1" ? "bellboy" : "clock");
    searchWrapper?.toggleAttribute("hidden", activeSlide === "1");
    dots.querySelectorAll(".clock-card-dot").forEach((dot) => {
      dot.setAttribute("aria-pressed", String(dot.dataset.clockCardSlide === activeSlide));
    });
  }

  function interactionIsActive() {
    return [searchWrapper, carousel].some((element) =>
      element && (element.matches(":hover") || element.contains(document.activeElement)),
    );
  }

  function stopRotation() {
    window.clearInterval(rotationTimer);
    rotationTimer = undefined;
  }

  function startRotation() {
    stopRotation();
    if (paused || !alarmActive) return;
    rotationTimer = window.setInterval(() => {
      setSlide(track.dataset.activeSlide === "0" ? 1 : 0);
    }, rotationInterval);
  }

  function pauseRotation() {
    paused = true;
    stopRotation();
    window.clearTimeout(resumeTimer);
    resumeTimer = undefined;
  }

  function scheduleResume() {
    window.clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(() => {
      resumeTimer = undefined;
      if (interactionIsActive()) return;
      paused = false;
      startRotation();
    }, resumeDelay);
  }

  function bindInteractionEvents(element) {
    if (!element) return;
    element.addEventListener("pointerenter", pauseRotation);
    element.addEventListener("focusin", pauseRotation);
    element.addEventListener("pointerleave", scheduleResume);
    element.addEventListener("focusout", scheduleResume);
  }

  bindInteractionEvents(searchWrapper);
  bindInteractionEvents(carousel);
  setSlide(1);

  function updateAlarmState(isActive) {
    if (alarmActive === isActive) return;
    alarmActive = isActive;
    if (!alarmActive) {
      stopRotation();
      window.clearTimeout(resumeTimer);
      resumeTimer = undefined;
      paused = false;
      setSlide(1);
      return;
    }
    setSlide(0);
    startRotation();
  }

  return { setSlide, updateAlarmState, getTrack: () => track };
}
