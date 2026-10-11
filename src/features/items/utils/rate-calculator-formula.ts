/**
 * Safe arithmetic evaluator for rate calculator formulas.
 * Only field identifiers + + - * / ( ) — no JS eval of arbitrary code.
 */

export type FormulaEvalResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

function tokenize(expr: string): string[] | null {
  const tokens: string[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if ("+-*/()".includes(ch)) {
      tokens.push(ch);
      i += 1;
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i + 1;
      while (j < expr.length && /[a-zA-Z0-9_]/.test(expr[j])) j += 1;
      tokens.push(expr.slice(i, j));
      i = j;
      continue;
    }
    if (/[\d.]/.test(ch)) {
      let j = i + 1;
      while (j < expr.length && /[\d.]/.test(expr[j])) j += 1;
      tokens.push(expr.slice(i, j));
      i = j;
      continue;
    }
    return null;
  }
  return tokens;
}

function evaluateArithmetic(expr: string): number | null {
  type Tok =
    | { type: "num"; value: number }
    | { type: "op"; value: "+" | "-" | "*" | "/" }
    | { type: "lp" }
    | { type: "rp" };

  const raw = tokenize(expr);
  if (!raw) return null;

  const tokens: Tok[] = [];
  for (const t of raw) {
    if (t === "+" || t === "-" || t === "*" || t === "/") {
      tokens.push({ type: "op", value: t });
      continue;
    }
    if (t === "(") {
      tokens.push({ type: "lp" });
      continue;
    }
    if (t === ")") {
      tokens.push({ type: "rp" });
      continue;
    }
    if (/^[a-zA-Z_]/.test(t)) return null;
    const n = Number(t);
    if (!Number.isFinite(n)) return null;
    tokens.push({ type: "num", value: n });
  }

  let pos = 0;
  function parseExpression(): number | null {
    let value = parseTerm();
    if (value == null) return null;
    let tok = tokens[pos];
    while (tok && tok.type === "op" && (tok.value === "+" || tok.value === "-")) {
      const op = tok.value;
      pos += 1;
      const rhs = parseTerm();
      if (rhs == null) return null;
      value = op === "+" ? value + rhs : value - rhs;
      tok = tokens[pos];
    }
    return value;
  }

  function parseTerm(): number | null {
    let value = parseFactor();
    if (value == null) return null;
    let tok = tokens[pos];
    while (tok && tok.type === "op" && (tok.value === "*" || tok.value === "/")) {
      const op = tok.value;
      pos += 1;
      const rhs = parseFactor();
      if (rhs == null) return null;
      if (op === "*") value *= rhs;
      else {
        if (rhs === 0) return null;
        value /= rhs;
      }
      tok = tokens[pos];
    }
    return value;
  }

  function parseFactor(): number | null {
    const tok = tokens[pos];
    if (!tok) return null;
    if (tok.type === "num") {
      pos += 1;
      return tok.value;
    }
    if (tok.type === "op" && tok.value === "-") {
      pos += 1;
      const inner = parseFactor();
      return inner == null ? null : -inner;
    }
    if (tok.type === "lp") {
      pos += 1;
      const inner = parseExpression();
      if (inner == null || tokens[pos]?.type !== "rp") return null;
      pos += 1;
      return inner;
    }
    return null;
  }

  const result = parseExpression();
  if (result == null || pos !== tokens.length) return null;
  return result;
}

/** Slugify a label into a field key (letters/numbers/underscore). */
export function slugifyFieldKey(label: string, used: Set<string>): string {
  let base = label
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  if (!base || !/^[a-zA-Z]/.test(base)) {
    base = `field_${base || "1"}`.replace(/[^a-zA-Z0-9_]/g, "");
    if (!/^[a-zA-Z]/.test(base)) base = `f_${base}`;
  }
  let key = base.slice(0, 40);
  let n = 2;
  while (used.has(key)) {
    const suffix = `_${n}`;
    key = `${base.slice(0, Math.max(1, 40 - suffix.length))}${suffix}`;
    n += 1;
  }
  return key;
}

export function validateFormulaAgainstFields(
  formula: string,
  fieldKeys: string[],
): string | null {
  const trimmed = formula.trim();
  if (!trimmed) return "Formula is required";
  if (!/^[a-zA-Z0-9_\s+\-*/().]+$/.test(trimmed)) {
    return "Formula may only use field keys and + - * / ( )";
  }
  const allowed = new Set(fieldKeys);
  const identifiers = trimmed.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) ?? [];
  for (const id of identifiers) {
    if (!allowed.has(id)) return `Unknown field in formula: ${id}`;
  }
  return null;
}

export function evaluateRateFormula(
  formula: string,
  values: Record<string, string | number>,
  fieldKeys: string[],
): FormulaEvalResult {
  const syntaxError = validateFormulaAgainstFields(formula, fieldKeys);
  if (syntaxError) return { ok: false, error: syntaxError };

  for (const key of fieldKeys) {
    const raw = values[key];
    if (raw === undefined || raw === null || String(raw).trim() === "") {
      return { ok: false, error: `Enter a value for ${key}` };
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      return { ok: false, error: `Invalid number for ${key}` };
    }
  }

  let replaced = formula.trim();
  // Replace longer keys first to avoid partial overlaps
  const sortedKeys = [...fieldKeys].sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    const n = Number(values[key]);
    const re = new RegExp(`\\b${key}\\b`, "g");
    replaced = replaced.replace(re, String(n));
  }

  if (!/^[\d\s+\-*/().]+$/.test(replaced)) {
    return { ok: false, error: "Could not evaluate formula" };
  }

  const value = evaluateArithmetic(replaced);
  if (value == null || !Number.isFinite(value)) {
    return { ok: false, error: "Invalid calculation (check divide by zero or formula)" };
  }
  return { ok: true, value };
}

export function formatCalculatedRate(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}
