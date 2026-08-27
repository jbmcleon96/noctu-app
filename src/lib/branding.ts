export const DEFAULT_PRIMARY_COLOR = "#BF00FF";

export function resolvePrimaryColor(primaryColor?: string): string {
  return primaryColor && primaryColor.trim() ? primaryColor : DEFAULT_PRIMARY_COLOR;
}
