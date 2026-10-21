/**
 * Shorten glued PDF strings in predictor results (institute / branch).
 */
export function sanitizePredictorLine(text, maxLen = 220) {
  if (text == null || text === '') return '';
  let s = String(text);

  while (true) {
    const j = s.indexOf(' Indian Institute of Technology ', 1);
    if (j <= 0) break;
    s = s.slice(0, j).trim();
  }

  const gn = s.indexOf(' Gender-Neutral ');
  const gnPw = s.indexOf(' Gender-Neutral (PwD) ');
  const fe = s.indexOf(' Female-only ');
  let cut = -1;
  if (gnPw >= 0) cut = gnPw;
  else if (gn >= 0) cut = gn;
  if (fe >= 0 && (cut < 0 || fe < cut)) cut = fe;
  if (cut > 0) s = s.slice(0, cut).trim();

  if (s.length > maxLen) {
    s = s.slice(0, maxLen - 1).trimEnd();
    const sp = s.lastIndexOf(' ');
    if (sp > maxLen * 0.55) s = s.slice(0, sp);
    s += '…';
  }
  return s;
}
