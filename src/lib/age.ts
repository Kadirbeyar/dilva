export const MIN_SIGNUP_AGE = 16;

/** Whole-years age from a birth date, computed as of now. */
export function calculateAge(birthDate: Date | string): number {
  const d = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const monthDiff = today.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) {
    age--;
  }
  return age;
}

/** Latest birth date (inclusive) that satisfies "at least minAge years old". */
export function latestBirthDateForMinAge(minAge: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - minAge);
  return d;
}
