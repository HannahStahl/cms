export function hasProhibitedCharacter(e) {
  return e.target.value.includes('_') || e.target.value.includes('?');
}
