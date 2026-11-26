// Local-timezone date helpers (avoids UTC drift in +07/+09 and DST issues)

export function localDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseLocalDate(str) {
  const [y, m, d] = String(str).split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function addDaysLocal(str, n) {
  const dt = parseLocalDate(str);
  dt.setDate(dt.getDate() + n);
  return localDateStr(dt);
}

export function diffDays(aStr, bStr) {
  const [ay, am, ad] = String(aStr).split('-').map(Number);
  const [by, bm, bd] = String(bStr).split('-').map(Number);
  const utcA = Date.UTC(ay, am - 1, ad);
  const utcB = Date.UTC(by, bm - 1, bd);
  return Math.round((utcB - utcA) / 86400000);
}
