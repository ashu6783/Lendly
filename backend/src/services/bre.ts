import {
  EmploymentMode,
  MIN_AGE,
  MAX_AGE,
  MIN_SALARY,
  PAN_REGEX,
} from '../types';

export interface BreInput {
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

export interface BreResult {
  passed: boolean;
  failures: string[]; // human-readable reasons
}

// Computes an age in whole years from a date of birth.
export function computeAge(dob: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

/**
 * The Business Rule Engine runs on the SERVER (this file) because client-side
 * checks can be bypassed by anyone calling the API directly. The client may
 * mirror these rules for instant feedback, but the server is the source of
 * truth and the only place the decision is actually enforced.
 */
export function runBRE(input: BreInput): BreResult {
  const failures: string[] = [];

  const age = computeAge(new Date(input.dateOfBirth));
  if (age < MIN_AGE || age > MAX_AGE) {
    failures.push(
      `Age must be between ${MIN_AGE} and ${MAX_AGE}. Applicant age is ${age}.`
    );
  }

  if (input.monthlySalary < MIN_SALARY) {
    failures.push(
      `Monthly salary must be at least ₹${MIN_SALARY.toLocaleString('en-IN')}.`
    );
  }

  if (!PAN_REGEX.test((input.pan || '').toUpperCase())) {
    failures.push('PAN does not match a valid format (e.g. ABCDE1234F).');
  }

  if (input.employmentMode === EmploymentMode.Unemployed) {
    failures.push('Unemployed applicants are not eligible for a loan.');
  }

  return { passed: failures.length === 0, failures };
}
