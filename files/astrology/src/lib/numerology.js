// src/lib/numerology.js
// Simple Pythagorean numerology engine (example implementation)

const PYTHAGOREAN = {
    A: 1, J: 1, S: 1,
    B: 2, K: 2, T: 2,
    C: 3, L: 3, U: 3,
    D: 4, M: 4, V: 4,
    E: 5, N: 5, W: 5,
    F: 6, O: 6, X: 6,
    G: 7, P: 7, Y: 7,
    H: 8, Q: 8, Z: 8,
    I: 9, R: 9,
  };
  
  const VOWELS = new Set(["A", "E", "I", "O", "U", "Y"]); // Many systems treat Y as vowel sometimes
  
  function normalizeName(name = "") {
    return name
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // strip accents
      .replace(/[^A-Z\s]/g, " ")       // keep letters/spaces only
      .replace(/\s+/g, " ")
      .trim();
  }
  
  function digitsOnly(str = "") {
    return String(str).replace(/\D/g, "");
  }
  
  function sumDigits(n) {
    return String(n)
      .split("")
      .reduce((acc, ch) => acc + (ch >= "0" && ch <= "9" ? Number(ch) : 0), 0);
  }
  
  /**
   * Reduce a number to a single digit, optionally keeping master numbers.
   * Default masters: 11, 22, 33
   */
  export function reduceNumber(n, { keepMasters = true, masters = [11, 22, 33] } = {}) {
    let x = Math.abs(Number(n) || 0);
  
    while (x > 9) {
      if (keepMasters && masters.includes(x)) return x;
      x = sumDigits(x);
    }
    return x;
  }
  
  function lettersToSum(name, predicate) {
    const cleaned = normalizeName(name);
    let sum = 0;
  
    for (const ch of cleaned) {
      if (ch === " ") continue;
      const val = PYTHAGOREAN[ch] || 0;
      if (!val) continue;
      if (predicate(ch)) sum += val;
    }
    return sum;
  }
  
  // Parse DOB from either "MM/DD/YYYY" or "YYYY-MM-DD"
  function parseDob(dob) {
    const raw = String(dob || "").trim();
    if (!raw) return null;
  
    // YYYY-MM-DD (from <input type="date" />)
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      const year = Number(iso[1]);
      const month = Number(iso[2]);
      const day = Number(iso[3]);
      return { year, month, day };
    }
  
    // MM/DD/YYYY
    const us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (us) {
      const month = Number(us[1]);
      const day = Number(us[2]);
      const year = Number(us[3]);
      return { year, month, day };
    }
  
    // last resort: digits-only guess (MMDDYYYY)
    const d = digitsOnly(raw);
    if (d.length === 8) {
      const month = Number(d.slice(0, 2));
      const day = Number(d.slice(2, 4));
      const year = Number(d.slice(4));
      return { year, month, day };
    }
  
    return null;
  }
  
  function parseCalcDate(calcDate) {
    // same formats as DOB
    return parseDob(calcDate);
  }
  
  export function calculateNumerology({
    birthName,
    currentName,
    dob,
    calcDate,
    keepMasters = true,
    masters = [11, 22, 33],
    treatYAsVowel = true,
  } = {}) {
    const nameForNameNumbers = (currentName && currentName.trim()) ? currentName : birthName;
  
    // Optionally treat Y as vowel or consonant
    const vowelsSet = treatYAsVowel ? new Set(["A", "E", "I", "O", "U", "Y"]) : new Set(["A", "E", "I", "O", "U"]);
  
    const dobParts = parseDob(dob);
    const calcParts = parseCalcDate(calcDate);
  
    // --- Core name numbers ---
    const expressionSum = lettersToSum(nameForNameNumbers, () => true);
    const soulUrgeSum  = lettersToSum(nameForNameNumbers, (ch) => vowelsSet.has(ch));
    const personalitySum = lettersToSum(nameForNameNumbers, (ch) => !vowelsSet.has(ch));
  
    const Expression = reduceNumber(expressionSum, { keepMasters, masters });
    const SoulUrge = reduceNumber(soulUrgeSum, { keepMasters, masters });
    const Personality = reduceNumber(personalitySum, { keepMasters, masters });
  
    // --- DOB numbers ---
    let LifePath = null;
    let Birthday = null;
  
    if (dobParts) {
      const { year, month, day } = dobParts;
  
      // Life Path: reduce (month + day + year) after reducing each component is common.
      const lp = reduceNumber(month, { keepMasters, masters })
        + reduceNumber(day, { keepMasters, masters })
        + reduceNumber(year, { keepMasters, masters });
  
      LifePath = reduceNumber(lp, { keepMasters, masters });
  
      // Birthday number: reduce day (often keep masters)
      Birthday = reduceNumber(day, { keepMasters, masters });
    }
  
    // Maturity: Life Path + Expression
    const Maturity =
      LifePath != null && Expression != null
        ? reduceNumber(LifePath + Expression, { keepMasters, masters })
        : null;
  
    // --- Personal year/month/day (simple example) ---
    // Personal Year: reduce (birth month + birth day + calc year)
    let PersonalYear = null;
    let PersonalMonth = null;
    let PersonalDay = null;
  
    if (dobParts && calcParts) {
      const { month: bm, day: bd } = dobParts;
      const { year: cy, month: cm, day: cd } = calcParts;
  
      PersonalYear = reduceNumber(
        reduceNumber(bm, { keepMasters, masters }) +
          reduceNumber(bd, { keepMasters, masters }) +
          reduceNumber(cy, { keepMasters, masters }),
        { keepMasters, masters }
      );
  
      // Personal Month: personal year + calc month
      PersonalMonth = reduceNumber(
        reduceNumber(PersonalYear, { keepMasters, masters }) +
          reduceNumber(cm, { keepMasters, masters }),
        { keepMasters, masters }
      );
  
      // Personal Day: personal month + calc day
      PersonalDay = reduceNumber(
        reduceNumber(PersonalMonth, { keepMasters, masters }) +
          reduceNumber(cd, { keepMasters, masters }),
        { keepMasters, masters }
      );
    }
  
    return {
      "Life Path": LifePath,
      Expression,
      "Soul Urge": SoulUrge,
      Personality,
      Birthday,
      Maturity,
      "Personal Year": PersonalYear,
      "Personal Month": PersonalMonth,
      "Personal Day": PersonalDay,
    };
  }
  //hello