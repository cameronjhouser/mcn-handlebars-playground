/**
 * MCN Handlebars Helpers
 *
 * Implements all Marketing Cloud Next custom Handlebars helpers as documented at:
 * https://developer.salesforce.com/docs/marketing/handlebars-for-marketing-cloud-next/
 *
 * Based on Handlebars.Net behavior. Known deviations from .NET are marked ⚠️
 */

// ─────────────────────────────────────────────
// Truthiness (matches MCN/Handlebars.Net rules)
// ─────────────────────────────────────────────
function isTruthy(val) {
  if (val === null || val === undefined) return false;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') return val.length > 0;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'object') return Object.keys(val).length > 0;
  return Boolean(val);
}

function toStr(v) {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.map(toStr).join('');
  return String(v);
}

function toNum(v) {
  const n = Number(v);
  if (isNaN(n)) throw new Error(`Cannot convert "${v}" to a number`);
  return n;
}

// ─────────────────────────────────────────────
// Compare helper (used by compare, filter, equals)
// ─────────────────────────────────────────────
function compareValues(left, op, right) {
  // null rules
  if (left === null || left === undefined) {
    if (op === '==' || op === 'EQUALS') return (right === null || right === undefined);
    if (op === '!=' || op === 'NOT_EQUALS') return !(right === null || right === undefined);
    return false;
  }
  if (right === null || right === undefined) {
    if (op === '!=' || op === 'NOT_EQUALS') return true;
    return false;
  }
  // boolean coercion for == / !=
  if (typeof left === 'boolean' || typeof right === 'boolean') {
    const lb = Boolean(left); const rb = Boolean(right);
    if (op === '==' || op === 'EQUALS') return lb === rb;
    if (op === '!=' || op === 'NOT_EQUALS') return lb !== rb;
  }
  // date detection
  const dateRe = /^\d{4}-\d{2}-\d{2}|^\d{1,2}\/\d{1,2}\/\d{4}/;
  const lStr = String(left); const rStr = String(right);
  const lIsDate = dateRe.test(lStr) && !isNaN(Date.parse(lStr));
  const rIsDate = dateRe.test(rStr) && !isNaN(Date.parse(rStr));
  if (lIsDate && rIsDate) {
    const ld = Date.parse(lStr); const rd = Date.parse(rStr);
    return numCompare(ld, op, rd);
  }
  // numeric
  const ln = Number(left); const rn = Number(right);
  if (!isNaN(ln) && !isNaN(rn)) return numCompare(ln, op, rn);
  // string fallback (case-sensitive)
  return strCompare(lStr, op, rStr);
}

function numCompare(l, op, r) {
  switch (op) {
    case '>': case 'GREATER_THAN': return l > r;
    case '<': case 'LESS_THAN': return l < r;
    case '>=': case 'GREATER_THAN_EQUALS': return l >= r;
    case '<=': case 'LESS_THAN_EQUALS': return l <= r;
    case '==': case 'EQUALS': return l === r;
    case '!=': case 'NOT_EQUALS': return l !== r;
    default: throw new Error(`Unknown operator: ${op}`);
  }
}

function strCompare(l, op, r) {
  switch (op) {
    case '>': case 'GREATER_THAN': return l > r;
    case '<': case 'LESS_THAN': return l < r;
    case '>=': case 'GREATER_THAN_EQUALS': return l >= r;
    case '<=': case 'LESS_THAN_EQUALS': return l <= r;
    case '==': case 'EQUALS': return l === r;
    case '!=': case 'NOT_EQUALS': return l !== r;
    case 'CONTAINS': return l.includes(r);
    case 'IS_NULL': return l === null || l === undefined || l === '';
    case 'IS_NOT_NULL': return l !== null && l !== undefined && l !== '';
    default: throw new Error(`Unknown operator: ${op}`);
  }
}

// ─────────────────────────────────────────────
// Registration
// ─────────────────────────────────────────────
export function registerMCNHelpers(Handlebars) {

  // ── Object/List Functions ──────────────────

  // filter(list, fieldName, operator, targetValue, filterAs)
  Handlebars.registerHelper('filter', function(list, fieldName, operator, targetValue, filterAs) {
    if (!Array.isArray(list)) throw new Error('filter: first argument must be an array');
    const op = String(operator).toUpperCase().replace(/ /g, '_');
    return list.filter(item => {
      const fieldVal = item[fieldName];
      // special string-only operators
      if (op === 'IS_NULL') return fieldVal === null || fieldVal === undefined || fieldVal === '';
      if (op === 'IS_NOT_NULL') return fieldVal !== null && fieldVal !== undefined && fieldVal !== '';
      if (op === 'CONTAINS') return toStr(fieldVal).includes(toStr(targetValue));

      let left = fieldVal, right = targetValue;
      const fas = String(filterAs).toLowerCase();
      if (fas === 'number') { left = Number(left); right = Number(right); }
      else if (fas === 'date') { left = Date.parse(String(left)); right = Date.parse(String(right)); }
      else { left = toStr(left); right = toStr(right); }

      return numCompare(
        fas === 'string' ? 0 : left,
        op === '>' ? '>' : op === '<' ? '<' : op === '>=' ? '>=' : op === '<=' ? '<=' : op === '==' || op === 'EQUALS' ? '==' : op === '!=' || op === 'NOT_EQUALS' ? '!=' : op,
        fas === 'string' ? 0 : right
      ) || (fas === 'string' && strCompare(left, op.replace('GREATER_THAN', '>').replace('LESS_THAN', '<').replace('_EQUALS','=').replace('NOT_EQUALS','!=').replace('EQUALS','=='), right));
    });
  });

  // Better filter implementation
  Handlebars.registerHelper('filter', function(list, fieldName, operator, targetValue, filterAs) {
    if (!Array.isArray(list)) throw new Error('filter: first argument must be an array');
    const op = String(operator).trim();
    const opNorm = op.toUpperCase().replace(/ /g, '_');
    const fas = filterAs ? String(filterAs).toLowerCase() : 'string';

    return list.filter(item => {
      const fieldVal = item != null ? item[fieldName] : undefined;
      if (opNorm === 'IS_NULL') return fieldVal === null || fieldVal === undefined || fieldVal === '';
      if (opNorm === 'IS_NOT_NULL') return fieldVal !== null && fieldVal !== undefined && fieldVal !== '';
      if (opNorm === 'CONTAINS') return toStr(fieldVal).includes(toStr(targetValue));

      let l = fieldVal, r = targetValue;
      if (fas === 'number') { l = Number(l); r = Number(r); return numCompare(l, op, r); }
      if (fas === 'date')   { l = Date.parse(toStr(l)); r = Date.parse(toStr(r)); return numCompare(l, op, r); }
      // string
      return strCompare(toStr(l), op, toStr(r));
    });
  });

  // flatten(nestedList)
  Handlebars.registerHelper('flatten', function(nestedList) {
    if (!Array.isArray(nestedList)) throw new Error('flatten: argument must be an array');
    return nestedList.flat(1);
  });

  // get(collection, indexOrKey)
  Handlebars.registerHelper('get', function(collection, indexOrKey) {
    if (Array.isArray(collection)) {
      const idx = Number(indexOrKey);
      if (isNaN(idx)) throw new Error('get: index must be a number for arrays');
      if (idx < 0 || idx >= collection.length) throw new Error(`get: index ${idx} out of bounds`);
      return collection[idx];
    }
    if (collection !== null && typeof collection === 'object') {
      const key = String(indexOrKey);
      if (!(key in collection)) throw new Error(`get: key "${key}" not found`);
      return collection[key];
    }
    throw new Error('get: collection must be an array or object');
  });

  // map(list, fieldName)
  Handlebars.registerHelper('map', function(list, fieldName) {
    if (!Array.isArray(list)) throw new Error('map: first argument must be an array');
    const field = String(fieldName);
    return list.filter(item => item != null && field in item).map(item => item[field]);
  });

  // slice(list, startIndex, endIndex?)
  Handlebars.registerHelper('slice', function(list, startIndex, endIndex, options) {
    if (!Array.isArray(list)) throw new Error('slice: first argument must be an array');
    const start = Number(startIndex);
    if (isNaN(start)) throw new Error('slice: startIndex must be a number');
    // endIndex may be the Handlebars options hash if only 2 positional args given
    if (endIndex && typeof endIndex === 'object' && endIndex.hash !== undefined) {
      return list.slice(start);
    }
    if (endIndex === null || endIndex === undefined) return list.slice(start);
    const end = Number(endIndex);
    if (isNaN(end)) throw new Error('slice: endIndex must be a number');
    return list.slice(start, end);
  });

  // ── String Functions ───────────────────────

  // char(code, repeated?)
  Handlebars.registerHelper('char', function(code, repeated, options) {
    const c = Number(code) % 65536;
    if (isNaN(c)) throw new Error('char: code must be a number');
    // repeated may be the options hash
    let rep = 1;
    if (repeated !== null && repeated !== undefined && typeof repeated !== 'object') {
      rep = Number(repeated);
      if (isNaN(rep)) throw new Error('char: repeated must be a number');
      if (rep < 0) throw new Error('char: repeated must not be negative');
    }
    return String.fromCharCode(((c % 65536) + 65536) % 65536).repeat(rep);
  });

  // concat(...values)
  Handlebars.registerHelper('concat', function(...args) {
    const opts = args.pop(); // Handlebars options object
    return args
      .filter(v => v !== null && v !== undefined)
      .map(v => Array.isArray(v) ? v.map(toStr).join('') : toStr(v))
      .join('');
  });

  // indexOf(subject, search)
  Handlebars.registerHelper('indexOf', function(subject, search) {
    if (subject === null || subject === undefined) return -1;
    return toStr(subject).indexOf(toStr(search));
  });

  // lowercase(subject, culture?)
  Handlebars.registerHelper('lowercase', function(subject, culture, options) {
    if (subject === null || subject === undefined) return '';
    const s = toStr(subject);
    const cult = (culture && typeof culture !== 'object') ? String(culture).replace('_', '-') : undefined;
    // ⚠️ JS toLocaleLowerCase accepts locale, .NET CultureInfo may differ for Turkic languages
    try { return cult ? s.toLocaleLowerCase(cult) : s.toLowerCase(); }
    catch (_) { return s.toLowerCase(); }
  });

  // propercase(subject, culture?)
  Handlebars.registerHelper('propercase', function(subject, culture, options) {
    if (subject === null || subject === undefined) return '';
    const s = toStr(subject);
    const cult = (culture && typeof culture !== 'object') ? String(culture).replace('_', '-') : undefined;
    // Capitalize first letter of each word, respecting locale if provided
    return s.replace(/\b\w/g, c => {
      try { return cult ? c.toLocaleUpperCase(cult) : c.toUpperCase(); }
      catch (_) { return c.toUpperCase(); }
    });
  });

  // replace(subject, search, replacement, culture?)
  Handlebars.registerHelper('replace', function(subject, search, replacement, culture, options) {
    if (subject === null || subject === undefined) return '';
    const s = toStr(subject);
    const sr = toStr(search);
    const rp = (replacement !== null && replacement !== undefined && typeof replacement !== 'object') ? toStr(replacement) : '';
    if (sr === '') return s;
    // case-sensitive, all occurrences
    return s.split(sr).join(rp);
  });

  // substring(subject, start, length?)  — 1-BASED start index
  Handlebars.registerHelper('substring', function(subject, start, length, options) {
    if (subject === null || subject === undefined) return '';
    const s = toStr(subject);
    const st = Number(start);
    if (isNaN(st) || st < 1) throw new Error('substring: start must be >= 1');
    const jsStart = st - 1; // convert 1-based to 0-based
    if (jsStart >= s.length) return '';
    if (length !== null && length !== undefined && typeof length !== 'object') {
      const len = Number(length);
      if (isNaN(len)) throw new Error('substring: length must be a number');
      if (len <= 0) return s.slice(jsStart); // docs say negative length → return rest
      return s.slice(jsStart, jsStart + len);
    }
    return s.slice(jsStart);
  });

  // trim(subject)
  Handlebars.registerHelper('trim', function(subject) {
    if (subject === null || subject === undefined) return '';
    return toStr(subject).trim();
  });

  // uppercase(subject, culture?)
  Handlebars.registerHelper('uppercase', function(subject, culture, options) {
    if (subject === null || subject === undefined) return '';
    const s = toStr(subject);
    const cult = (culture && typeof culture !== 'object') ? String(culture).replace('_', '-') : undefined;
    // ⚠️ JS toLocaleUpperCase accepts locale, .NET CultureInfo may differ for Turkic languages
    try { return cult ? s.toLocaleUpperCase(cult) : s.toUpperCase(); }
    catch (_) { return s.toUpperCase(); }
  });

  // ── Date/Time Functions ────────────────────

  // now  — ⚠️ Returns system time adjusted to CST offset (-06:00); MCN uses fixed server CST
  Handlebars.registerHelper('now', function() {
    const d = new Date();
    // Shift to CST (UTC-6)
    const cstOffset = -6 * 60;
    const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
    const cst = new Date(utcMs + cstOffset * 60000);
    const mo = cst.getMonth() + 1, dy = cst.getDate(), yr = cst.getFullYear();
    let hr = cst.getHours(); const mi = cst.getMinutes(), se = cst.getSeconds();
    const ampm = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12 || 12;
    const pad = n => String(n).padStart(2, '0');
    return `${mo}/${dy}/${yr} ${hr}:${pad(mi)}:${pad(se)} ${ampm} -06:00`;
  });

  // ── Comparison Functions ───────────────────

  // and(...values) — per MCN docs: inline only, returns boolean
  Handlebars.registerHelper('and', function(...args) {
    const options = args.pop(); // Remove options hash if present
    return args.every(isTruthy);
  });

  // compare(left, operator, right)
  // compare(left, operator, right) — per MCN docs: inline only, returns boolean
  Handlebars.registerHelper('compare', function(left, operator, right) {
    return compareValues(left, String(operator).trim(), right);
  });

  // equals(v1, v2, compareAs?) — per MCN docs: inline only, returns boolean
  Handlebars.registerHelper('equals', function(v1, v2, compareAs) {
    if (v1 === null || v1 === undefined) return (v2 === null || v2 === undefined);
    if (v2 === null || v2 === undefined) return false;

    const cas = (compareAs && typeof compareAs !== 'object') ? String(compareAs).toLowerCase() : 'string';
    if (cas === 'number') {
      return Number(v1) === Number(v2);
    } else if (cas === 'date' || cas === 'datetime') {
      return Date.parse(toStr(v1)) === Date.parse(toStr(v2));
    } else {
      return toStr(v1) === toStr(v2);
    }
  });

  // if — override built-in to support {{else if}} (Handlebars.js already does this natively)
  // Handlebars.js already supports {{else if}}, so no override needed.

  // iif(expression, leftResult, rightResult) — ⚠️ Both branches always evaluated per MCN docs
  Handlebars.registerHelper('iif', function(expression, leftResult, rightResult) {
    return isTruthy(expression) ? leftResult : rightResult;
  });

  // isempty(input) — per MCN docs: inline only, returns boolean
  Handlebars.registerHelper('isempty', function(value) {
    return value === null || value === undefined || value === '' ||
      (Array.isArray(value) && value.length === 0);
  });

  // isnull(expression) — per MCN docs: inline only, returns boolean
  Handlebars.registerHelper('isnull', function(value) {
    return value === null || value === undefined;
  });

  // not(value) — per MCN docs: inline only, returns boolean
  Handlebars.registerHelper('not', function(value) {
    return !isTruthy(value);
  });

  // or(...values) — per MCN docs: inline only, returns boolean
  Handlebars.registerHelper('or', function(...args) {
    const options = args.pop(); // Remove options hash if present
    return args.some(isTruthy);
  });

  // ── Utility Functions ──────────────────────

  // fallback(value, fallbackValue)
  Handlebars.registerHelper('fallback', function(value, fallbackValue) {
    if (value === null || value === undefined || value === '') return fallbackValue;
    return value;
  });

  // format(subject, formatString, type?, culture?)
  // ⚠️ Uses Intl APIs; .NET format strings differ (e.g. yyyy vs YYYY). Supports "date" and "numeric" types.
  Handlebars.registerHelper('format', function(subject, formatString, type, culture, options) {
    const fmt = toStr(formatString);
    const typ = (type && typeof type !== 'object') ? String(type).toLowerCase() : '';
    const cult = (culture && typeof culture !== 'object') ? String(culture).replace('_', '-') : 'en-US';

    if (typ === 'date') {
      const d = (subject instanceof Date) ? subject : new Date(subject);
      if (isNaN(d)) return toStr(subject);
      // Convert common .NET date format tokens to Intl-compatible display
      return formatDate(d, fmt, cult);
    }
    if (typ === 'numeric') {
      const n = Number(subject);
      if (isNaN(n)) return toStr(subject);
      return formatNumeric(n, fmt, cult);
    }
    // string formatting: basic sprintf-like {0} substitution
    return toStr(subject);
  });

  // formatCurrency(number, cultureCode) — per MCN docs: format as currency using culture code
  // The currency symbol is derived from the culture code (e.g. en-US → USD, en-GB → GBP)
  Handlebars.registerHelper('formatCurrency', function(value, cultureCode, options) {
    const n = Number(value);
    if (isNaN(n)) return toStr(value);
    const cult = (cultureCode && typeof cultureCode !== 'object') ? String(cultureCode).replace('_', '-') : 'en-US';
    // Derive currency from culture code (best-effort lookup; defaults to USD)
    const currencyFromCulture = {
      'en-US':'USD','en-CA':'CAD','en-GB':'GBP','en-AU':'AUD','en-NZ':'NZD',
      'en-IN':'INR','en-SG':'SGD','en-ZA':'ZAR','en-HK':'HKD',
      'fr-FR':'EUR','de-DE':'EUR','es-ES':'EUR','it-IT':'EUR','pt-PT':'EUR',
      'nl-NL':'EUR','fi-FI':'EUR','el-GR':'EUR','sk-SK':'EUR','sl-SI':'EUR',
      'fr-BE':'EUR','de-AT':'EUR','de-LU':'EUR','es-IE':'EUR','hr-HR':'EUR',
      'ja-JP':'JPY','zh-CN':'CNY','zh-TW':'TWD','zh-HK':'HKD',
      'ko-KR':'KRW','pt-BR':'BRL','ru-RU':'RUB','ar-SA':'SAR',
      'tr-TR':'TRY','pl-PL':'PLN','sv-SE':'SEK','da-DK':'DKK','nb-NO':'NOK',
      'cs-CZ':'CZK','hu-HU':'HUF','ro-RO':'RON','bg-BG':'BGN',
      'fr-CH':'CHF','de-CH':'CHF','it-CH':'CHF',
    };
    const curr = currencyFromCulture[cult] || 'USD';
    try {
      return new Intl.NumberFormat(cult, { style: 'currency', currency: curr }).format(n);
    } catch (_) {
      return n.toFixed(2);
    }
  });

  // formatNumber(value, formatString?, culture?)  ⚠️ Not in official docs (404), using Intl.NumberFormat
  Handlebars.registerHelper('formatNumber', function(value, formatString, culture, options) {
    const n = Number(value);
    if (isNaN(n)) return toStr(value);
    const fmt = (formatString && typeof formatString !== 'object') ? String(formatString) : '';
    const cult = (culture && typeof culture !== 'object') ? String(culture).replace('_', '-') : 'en-US';
    return formatNumeric(n, fmt, cult);
  });

  // length(subject)
  Handlebars.registerHelper('length', function(subject) {
    if (subject === null || subject === undefined) return 0;
    if (Array.isArray(subject)) return subject.length;
    return toStr(subject).length;
  });

  // repeat(count) — block helper, exposes @index, @first, @last
  Handlebars.registerHelper('repeat', function(count, options) {
    const n = Math.floor(Number(count));
    if (isNaN(n) || n < 0) throw new Error('repeat: count must be a non-negative number');
    let result = '';
    for (let i = 0; i < n; i++) {
      const data = Handlebars.createFrame(options.data || {});
      data.index = i;
      data.first = i === 0;
      data.last  = i === n - 1;
      result += options.fn(this, { data });
    }
    return result;
  });

  // set(hash) — block helper; injects key-value pairs into child context
  Handlebars.registerHelper('set', function(options) {
    const ctx = Object.assign(Object.create(null), this, options.hash);
    return options.fn(ctx);
  });

  // sort(list, fieldName, sortOrder, sortAs)
  Handlebars.registerHelper('sort', function(list, fieldName, sortOrder, sortAs) {
    if (!Array.isArray(list)) throw new Error('sort: first argument must be an array');
    const field = String(fieldName);
    const dir = String(sortOrder).toLowerCase() === 'desc' ? -1 : 1;
    const fas = String(sortAs).toLowerCase();

    const copy = [...list].filter(item => item != null && field in item && item[field] !== null && item[field] !== undefined);

    copy.sort((a, b) => {
      let av = a[field], bv = b[field];
      if (fas === 'number')  { av = Number(av); bv = Number(bv); return (av - bv) * dir; }
      if (fas === 'date')    { av = Date.parse(toStr(av)); bv = Date.parse(toStr(bv)); return (av - bv) * dir; }
      if (fas === 'boolean') { av = Boolean(av); bv = Boolean(bv); return ((av === bv) ? 0 : av ? 1 : -1) * dir; }
      // string
      av = toStr(av); bv = toStr(bv);
      return av < bv ? -dir : av > bv ? dir : 0;
    });

    return copy;
  });

  // with is built-in — no override needed

  // ── Math Functions ─────────────────────────────
  // Source: https://developer.salesforce.com/docs/marketing/handlebars-for-marketing-cloud-next/references/mcn-handlebars-math-references/

  // Helper: round to 2 decimal places (all arithmetic ops)
  function r2(n) { return Math.round(n * 100) / 100; }

  // add(value1, value2) → sum rounded to 2dp
  Handlebars.registerHelper('add', function(value1, value2) {
    const v1 = Number(value1), v2 = Number(value2);
    if (isNaN(v1)) throw new Error('add: value1 cannot be converted to a number');
    if (isNaN(v2)) throw new Error('add: value2 cannot be converted to a number');
    return r2(v1 + v2);
  });

  // subtract(value1, value2) → difference rounded to 2dp
  Handlebars.registerHelper('subtract', function(value1, value2) {
    const v1 = Number(value1), v2 = Number(value2);
    if (isNaN(v1)) throw new Error('subtract: value1 cannot be converted to a number');
    if (isNaN(v2)) throw new Error('subtract: value2 cannot be converted to a number');
    return r2(v1 - v2);
  });

  // multiply(value1, value2) → product rounded to 2dp
  Handlebars.registerHelper('multiply', function(value1, value2) {
    const v1 = Number(value1), v2 = Number(value2);
    if (isNaN(v1)) throw new Error('multiply: value1 cannot be converted to a number');
    if (isNaN(v2)) throw new Error('multiply: value2 cannot be converted to a number');
    return r2(v1 * v2);
  });

  // divide(dividend, divisor) → quotient rounded to 2dp; throws on /0
  Handlebars.registerHelper('divide', function(dividend, divisor) {
    const v1 = Number(dividend), v2 = Number(divisor);
    if (isNaN(v1)) throw new Error('divide: dividend cannot be converted to a number');
    if (isNaN(v2)) throw new Error('divide: divisor cannot be converted to a number');
    if (v2 === 0) throw new Error('divide: divisor cannot be 0');
    return r2(v1 / v2);
  });

  // modulo(value1, value2) → remainder rounded to 2dp; throws on /0
  Handlebars.registerHelper('modulo', function(value1, value2) {
    const v1 = Number(value1), v2 = Number(value2);
    if (isNaN(v1)) throw new Error('modulo: value1 cannot be converted to a number');
    if (isNaN(v2)) throw new Error('modulo: value2 cannot be converted to a number');
    if (v2 === 0) throw new Error('modulo: divisor cannot be 0');
    return r2(v1 % v2);
  });

  // random(first, second) → random integer in [first, second] (inclusive)
  // ⚠️ Uses Math.random(); MCN uses server-side RNG so values will differ
  Handlebars.registerHelper('random', function(first, second) {
    const min = Number(first), max = Number(second);
    if (isNaN(min)) throw new Error('random: first cannot be converted to a number');
    if (isNaN(max)) throw new Error('random: second cannot be converted to a number');
    if (max < min) throw new Error('random: second must be >= first');
    const lo = Math.ceil(min), hi = Math.floor(max);
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  });
}

// ─────────────────────────────────────────────
// Format helpers
// ─────────────────────────────────────────────

/**
 * Date formatting — converts common .NET-style tokens to formatted output via Intl
 * ⚠️ .NET uses yyyy/MM/dd etc; we support both .NET and common patterns
 */
function formatDate(d, fmt, locale) {
  // Map .NET tokens to values
  const map = {
    'yyyy': d.getFullYear(),
    'yy':   String(d.getFullYear()).slice(-2),
    'MMMM': d.toLocaleString(locale, { month: 'long' }),
    'MMM':  d.toLocaleString(locale, { month: 'short' }),
    'MM':   String(d.getMonth() + 1).padStart(2, '0'),
    'M':    d.getMonth() + 1,
    'dddd': d.toLocaleString(locale, { weekday: 'long' }),
    'ddd':  d.toLocaleString(locale, { weekday: 'short' }),
    'dd':   String(d.getDate()).padStart(2, '0'),
    'd':    d.getDate(),
    'HH':   String(d.getHours()).padStart(2, '0'),
    'H':    d.getHours(),
    'hh':   String((d.getHours() % 12) || 12).padStart(2, '0'),
    'h':    (d.getHours() % 12) || 12,
    'mm':   String(d.getMinutes()).padStart(2, '0'),
    'ss':   String(d.getSeconds()).padStart(2, '0'),
    'tt':   d.getHours() >= 12 ? 'PM' : 'AM',
    't':    d.getHours() >= 12 ? 'P' : 'A',
  };
  // Replace longest tokens first
  const tokens = Object.keys(map).sort((a, b) => b.length - a.length);
  let result = fmt;
  for (const tok of tokens) {
    result = result.split(tok).join(String(map[tok]));
  }
  return result;
}

/**
 * Numeric formatting — supports basic .NET numeric format strings
 * ⚠️ Full .NET format string support not available; common patterns handled
 */
function formatNumeric(n, fmt, locale) {
  if (!fmt) {
    return new Intl.NumberFormat(locale).format(n);
  }
  // Standard .NET format specifiers: N, F, C, P, D, E, G
  const match = fmt.match(/^([NFCPDEG])(\d*)$/i);
  if (match) {
    const spec = match[1].toUpperCase();
    const digits = match[2] !== '' ? parseInt(match[2]) : undefined;
    switch (spec) {
      case 'N': return new Intl.NumberFormat(locale, { minimumFractionDigits: digits ?? 2, maximumFractionDigits: digits ?? 2 }).format(n);
      case 'F': return new Intl.NumberFormat(locale, { minimumFractionDigits: digits ?? 2, maximumFractionDigits: digits ?? 2, useGrouping: false }).format(n);
      case 'C': return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', minimumFractionDigits: digits ?? 2 }).format(n);
      case 'P': return new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: digits ?? 2 }).format(n / 100);
      case 'D': return Math.round(n).toString().padStart(digits ?? 0, '0');
      case 'E': return n.toExponential(digits ?? 6).toUpperCase();
      case 'G': return n.toPrecision(digits || undefined);
    }
  }
  // Custom pattern with # and 0
  if (fmt.includes('#') || fmt.includes('0')) {
    const parts = fmt.split('.');
    const intPart = parts[0];
    const decPart = parts[1] || '';
    const minDec = (decPart.match(/0/g) || []).length;
    const maxDec = decPart.length;
    const useGroup = intPart.includes(',');
    return new Intl.NumberFormat(locale, {
      useGrouping: useGroup,
      minimumFractionDigits: minDec,
      maximumFractionDigits: maxDec,
    }).format(n);
  }
  return new Intl.NumberFormat(locale).format(n);
}
