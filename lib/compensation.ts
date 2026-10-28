// Whether a money word ("pay", "invoice", "fees") is about Mike's own pay, which
// the assistant never discusses, or about money moving through a system he built
// ("Does ZDI pay suppliers?"), which the knowledge base answers. Money is the
// system's only when a named system handles it for someone other than Mike, and
// nothing in the question turns it into what a job or role pays.

import { namedProjects } from "./intent";

// Mike as the one paid or charging: "Mike gets paid", "pay him", "his fees".
const MIKE_PAYEE_RE =
  /\b(?:mike|he|him)\b(?:\s+\w+){0,2}?\s+(?:paid|pays?|earn\w*|charg\w*|bill\w*|invoic\w*|fees?)\b|\b(?:pay|paying|paid|invoic\w*|bill\w*)\s+(?:mike|him)\b|\b(?:mike['’]?s|his)\s+(?:pay|fees?|rates?|invoices?|billing|salary)\b/i;

// What a job, role or team pays, or pay for building something.
const JOB_PAY_RE =
  /\b(?:roles?|jobs?|positions?|teams?|developers?|engineers?|staff|employees?|salar\w*|wages?|well|hourly|daily|monthly|annual\w*|per\s+(?:hour|day|week|month|year|annum)|remunerat\w*|contract(?:or|s)?|freelanc\w*|build(?:ing)?|built)\b/i;

// The payee or payment a system can handle for others.
const SYSTEM_PAYMENT_RE =
  /\b(?:suppliers?|vendors?|invoices?|claimants?|beneficiar\w*|families|members|policyholders?|payouts?|payments?|bank\s+files?|benefits|claims|refunds?|disburse\w*|settle\w*|requisitions?|quotations?|anyone|anything)\b/i;

// True unless a named system handles the money for someone other than Mike.
export function moneyIsMikes(question: string): boolean {
  if (namedProjects(question).length === 0) return true;
  if (MIKE_PAYEE_RE.test(question) || JOB_PAY_RE.test(question)) return true;
  return !SYSTEM_PAYMENT_RE.test(question);
}
