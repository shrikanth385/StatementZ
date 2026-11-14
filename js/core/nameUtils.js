const nameSeparatorChars = String.raw`\s.'’‘ʼ\-\u2010-\u2015`;
const nameValidationPattern = new RegExp(
  String.raw`^[\p{L}\p{M}](?:[\p{L}\p{M}${nameSeparatorChars}]*[\p{L}\p{M}])?$`,
  "u",
);
const nameCapitalizationPattern = new RegExp(
  String.raw`(^|[${nameSeparatorChars}])(\p{L})`,
  "gu",
);

function normalizeNameInput(name) {
  return name.normalize("NFC").replace(/\s+/g, " ").trim();
}

function formatName(name) {
  return normalizeNameInput(name)
    .toLocaleLowerCase()
    .replace(nameCapitalizationPattern, (match, separator, character) =>
      `${separator}${character.toLocaleUpperCase()}`,
    );
}

function validateName(name) {
  const normalizedName = normalizeNameInput(name);
  return (
    /\p{L}/u.test(normalizedName) &&
    nameValidationPattern.test(normalizedName)
  );
}

export { formatName, normalizeNameInput, validateName };
