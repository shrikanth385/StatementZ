function parseDateInput(value) {
  const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");

  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch.map(Number);
    return new Date(year, month - 1, day);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function addHours(date, hours) {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addBusinessDays(date, days) {
  const result = new Date(date);
  const direction = Math.sign(days);
  let remainingDays = Math.abs(days);

  while (remainingDays > 0) {
    result.setDate(result.getDate() + direction);
    const weekday = result.getDay();
    if (weekday !== 0 && weekday !== 6) remainingDays -= 1;
  }

  return result;
}

const dateOffsetHandlers = Object.freeze({
  days: addDays,
  businessDays: addBusinessDays,
  hours: addHours,
});

function calculateDateAfterOffset({ dateValue, offsetValue, unit }) {
  const date = parseDateInput(dateValue);
  const offset = Number(offsetValue);
  const addOffset = dateOffsetHandlers[unit];

  if (!date || !Number.isFinite(offset) || !addOffset) return null;
  return addOffset(date, offset);
}

function getDateAfterOffset({
  dateValue,
  offsetValue,
  unit,
  placeholderName,
}) {
  const result = calculateDateAfterOffset({ dateValue, offsetValue, unit });
  return result ? formatDate(result) : `[Enter ${placeholderName}]`;
}

function getSignedOffset(value, operation) {
  const offset = Number(value);
  if (!Number.isFinite(offset)) return value;
  return operation === "subtract" ? -offset : offset;
}

export {
  calculateDateAfterOffset,
  dateOffsetHandlers,
  formatDate,
  getDateAfterOffset,
  getSignedOffset,
};
