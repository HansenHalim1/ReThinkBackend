// A bounded parser for the MVP's linear expressions. Never evaluates JavaScript.
// Represents ax + b. Supports decimals, fractions, parentheses, implicit multiplication.
export type Linear = { a: number; b: number };
export function parseLinear(raw: string): Linear | null {
  if (!raw || raw.length > 160) return null;
  const text = raw.toLowerCase().replace(/\s+/g, '').replace(/×|·/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '.');
  if (/[^0-9x.+\-*/()]/.test(text)) return null;
  const tokens = text.match(/(?:\d+(?:\.\d*)?|\.\d+)|[x+\-*/()]/g) ?? [];
  if (tokens.join('') !== text || tokens.length > 100) return null;
  let pos = 0;
  const add = (l: Linear, r: Linear, sign = 1): Linear => ({ a: l.a + sign * r.a, b: l.b + sign * r.b });
  function atom(): Linear {
    const t = tokens[pos++];
    if (t === '+' || t === '-') {
      const v = atom(); return { a: t === '-' ? -v.a : v.a, b: t === '-' ? -v.b : v.b };
    }
    if (t === '(') { const v = sum(); if (tokens[pos++] !== ')') throw Error('Unclosed group'); return v; }
    if (t === 'x') return { a: 1, b: 0 };
    if (t && /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(t)) return { a: 0, b: Number(t) };
    throw Error('Invalid atom');
  }
  function product(): Linear {
    let l = atom();
    while (pos < tokens.length) {
      const t = tokens[pos];
      const implicit = t === '(' || t === 'x' || /^\d|^\./.test(t);
      if (t !== '*' && t !== '/' && !implicit) break;
      if (!implicit) pos++;
      const r = atom();
      if (t === '/') {
        if (r.a !== 0 || r.b === 0) throw Error('Nonlinear division');
        l = { a: l.a / r.b, b: l.b / r.b };
      } else {
        if (l.a !== 0 && r.a !== 0) throw Error('Nonlinear multiplication');
        l = { a: l.a * r.b + r.a * l.b, b: l.b * r.b };
      }
    }
    return l;
  }
  function sum(): Linear {
    let l = product();
    while (tokens[pos] === '+' || tokens[pos] === '-') { const op = tokens[pos++]; l = add(l, product(), op === '+' ? 1 : -1); }
    return l;
  }
  try {
    const v = sum();
    return pos === tokens.length && Number.isFinite(v.a) && Number.isFinite(v.b) && Math.max(Math.abs(v.a), Math.abs(v.b)) < 1e12 ? v : null;
  } catch { return null; }
}
export function equivalent(answer: string, expected: string, kind: 'expression' | 'number'): boolean | null {
  const normalized = kind === 'number' ? answer.trim().replace(/^x\s*=\s*/i, '') : answer;
  const a = parseLinear(normalized), b = parseLinear(expected);
  if (!a || !b || (kind === 'number' && a.a !== 0)) return null;
  return Math.abs(a.a - b.a) < 1e-9 && Math.abs(a.b - b.b) < 1e-9;
}
