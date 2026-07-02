export function stripControlCharacters(
  value: string,
  preserveLineBreaks = false,
): string {
  let output = "";
  for (const character of value) {
    const code = character.charCodeAt(0);
    const isControl = code < 32 || code === 127;
    if (!isControl) {
      output += character;
      continue;
    }
    if (preserveLineBreaks && (character === "\n" || character === "\r")) {
      output += "\n";
    } else {
      output += " ";
    }
  }
  return output;
}

export function cleanSingleLine(value: string): string {
  return stripControlCharacters(value).replace(/\s+/g, " ").trim();
}
