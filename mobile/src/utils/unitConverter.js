export function kgToLbs(kg) {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs) {
  return Math.round(lbs / 2.20462 * 10) / 10;
}

export function cmToFtIn(cm) {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

export function ftInToCm(feet, inches) {
  return Math.round((feet * 12 + inches) * 2.54 * 10) / 10;
}

export function formatHeight(cm, unit = 'cm') {
  if (unit === 'ft') {
    const { feet, inches } = cmToFtIn(cm);
    return `${feet}'${inches}"`;
  }
  return `${Math.round(cm)} cm`;
}

export function formatWeight(kg, unit = 'kg') {
  if (unit === 'lbs') {
    return `${kgToLbs(kg)} lbs`;
  }
  return `${Math.round(kg * 10) / 10} kg`;
}
