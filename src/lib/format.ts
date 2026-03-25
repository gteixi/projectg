export function truncUnit(unit: string): string {
  return unit.length > 4 ? unit.slice(0, 3) + '.' : unit
}
