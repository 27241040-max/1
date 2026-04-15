export function parsePositiveIntParam(rawValue: string) {
  const value = Number.parseInt(rawValue, 10);
  return Number.isInteger(value) && value > 0 ? value : null;
}
