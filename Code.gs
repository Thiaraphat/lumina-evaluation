/**
 * Lumina Electric Air — Evaluation System backend
 * ------------------------------------------------
 * Deploy this as a Web App (see README.md in the project root for exact
 * step-by-step instructions). This script is the ONLY thing that touches
 * the Google Sheet; the frontend never talks to Sheets directly.
 *
 * Sheet expected: a tab named exactly "Responses" with header row:
 * timestamp | evaluator_type | gender | age_range | lumina_experience |
 * customer_channel | technician_experience | q1 | q2 | q3 | q4 | q5 |
 * q6 | q7 | q8 | q9 | q10 | total_score
 *
 * Access control: the results dashboard is gated by a passcode that is
 * NEVER stored in the frontend. Set it once via:
 *   Apps Script editor -> Project Settings -> Script properties
 *     TEACHER_PASSCODE   = <choose a code for "สำหรับอาจารย์">
 *     OWNER_PASSCODE      = <choose a code for "สำหรับเจ้าของโครงงาน">
 * Both passcodes unlock the same dashboard; they exist as two distinct
 * labeled entry points because the brief asked for two separate links.
 *
 * LIMITATION (documented per project requirement #18): this is a shared
 * static passcode, not a real per-user login system. Anyone who is told
 * the passcode (or who intercepts network traffic) can view aggregate
 * statistics. There are no names, emails, or personal identifiers in the
 * data, so the exposure is limited to anonymous aggregate numbers. This
 * is an appropriate level of protection for a school project; it is not
 * meant to defend against a determined attacker.
 */

var SHEET_NAME = 'Responses';
var QUESTION_COUNT = 10;

var HEADERS = [
  'timestamp', 'evaluator_type', 'gender', 'age_range', 'lumina_experience',
  'customer_channel', 'technician_experience',
  'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'total_score'
];

// ---------- entry points ----------
//
// Both submission and stats-reading go through doPost, sent from the
// frontend with Content-Type: text/plain;charset=utf-8. This is a
// deliberate choice, not an oversight: Apps Script Web Apps cannot
// respond to the CORS "preflight" OPTIONS request that browsers send
// before a JSON POST, so a plain JSON POST from a different origin
// fails. Sending the body as text/plain makes the browser treat it as
// a "simple request" (no preflight), which is the standard, documented
// workaround for this Apps Script limitation. doGet is kept only for a
// human visiting the URL directly in a browser tab to confirm the
// deployment is alive — that is a normal page load, not a cross-origin
// fetch, so it is not affected by the same restriction.

function doGet(e) {
  return jsonOut({ ok: true, message: 'Lumina Apps Script is running. Use POST for the frontend.' });
}

function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return jsonOut({ ok: false, error: 'missing_body' });
    }
    var data = JSON.parse(e.postData.contents);
    var action = data.action || 'submit';

    if (action === 'stats') {
      return handleStatsRequest(data);
    }
    return handleSubmission(data);
  } catch (err) {
    return jsonOut({ ok: false, error: 'server_error', detail: String(err) });
  }
}

function handleStatsRequest(data) {
  var passcode = data.passcode || '';
  var role = checkPasscode(passcode);
  if (!role) {
    return jsonOut({ ok: false, error: 'invalid_passcode' });
  }
  var filter = data.filter || 'all';
  if (['all', 'customer', 'technician'].indexOf(filter) === -1) {
    filter = 'all';
  }
  var rows = readAllRows();
  var stats = calculateStatistics(rows, filter);
  return jsonOut({ ok: true, role: role, stats: stats });
}

function handleSubmission(data) {
  var validation = validateSubmission(data);
  if (!validation.valid) {
    return jsonOut({ ok: false, error: 'validation_failed', fields: validation.missing });
  }

  var totalScore = 0;
  for (var qi = 1; qi <= QUESTION_COUNT; qi++) {
    totalScore += Number(data['q' + qi]);
  }

  var row = [
    new Date(),
    data.evaluator_type,
    data.gender,
    data.age_range,
    data.lumina_experience,
    data.evaluator_type === 'customer' ? (data.customer_channel || '') : '',
    data.evaluator_type === 'technician' ? (data.technician_experience || '') : ''
  ];
  for (var q = 1; q <= QUESTION_COUNT; q++) {
    row.push(Number(data['q' + q]));
  }
  row.push(totalScore);

  var sheet = getResponsesSheet();
  sheet.appendRow(row);
  SpreadsheetApp.flush();

  return jsonOut({ ok: true, message: 'saved', total_score: totalScore });
}

// ---------- validation ----------

function validateSubmission(data) {
  var missing = [];
  var required = ['evaluator_type', 'gender', 'age_range', 'lumina_experience'];
  required.forEach(function (f) {
    if (!data[f]) missing.push(f);
  });

  if (data.evaluator_type === 'customer' && !data.customer_channel) {
    missing.push('customer_channel');
  }
  if (data.evaluator_type === 'technician' && !data.technician_experience) {
    missing.push('technician_experience');
  }
  if (['customer', 'technician'].indexOf(data.evaluator_type) === -1) {
    missing.push('evaluator_type(invalid)');
  }

  for (var qi = 1; qi <= QUESTION_COUNT; qi++) {
    var v = Number(data['q' + qi]);
    if (isNaN(v) || v < 1 || v > 5) {
      missing.push('q' + qi);
    }
  }

  return { valid: missing.length === 0, missing: missing };
}

// ---------- sheet access ----------

function getResponsesSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readAllRows() {
  var sheet = getResponsesSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var lastCol = HEADERS.length;
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  return values
    .filter(function (r) { return r[1] === 'customer' || r[1] === 'technician'; })
    .map(function (r) {
      var obj = {};
      HEADERS.forEach(function (h, i) { obj[h] = r[i]; });
      return obj;
    });
}

// ---------- access control ----------

function checkPasscode(passcode) {
  if (!passcode) return null;
  var props = PropertiesService.getScriptProperties();
  var teacher = props.getProperty('TEACHER_PASSCODE');
  var owner = props.getProperty('OWNER_PASSCODE');
  if (teacher && passcode === teacher) return 'teacher';
  if (owner && passcode === owner) return 'owner';
  return null;
}

// ---------- statistics engine (pure function, unit-tested outside GAS) ----------

function calculateStatistics(rows, filter) {
  var MAX_PER_QUESTION = 5;

  var filtered = rows.filter(function (r) {
    return filter === 'all' || r.evaluator_type === filter;
  });

  var n = filtered.length;
  var fullScore = QUESTION_COUNT * MAX_PER_QUESTION * n;

  function sampleSD(values) {
    var len = values.length;
    if (len < 2) return 0;
    var mean = values.reduce(function (a, b) { return a + b; }, 0) / len;
    var sumSq = values.reduce(function (acc, v) { return acc + Math.pow(v - mean, 2); }, 0);
    return Math.sqrt(sumSq / (len - 1));
  }

  var perQuestion = [];
  var totalScore = 0;

  for (var qi = 1; qi <= QUESTION_COUNT; qi++) {
    var key = 'q' + qi;
    var values = filtered
      .map(function (r) { return Number(r[key]); })
      .filter(function (v) { return !isNaN(v) && v >= 1 && v <= 5; });

    var sum = values.reduce(function (a, b) { return a + b; }, 0);
    var mean = values.length ? sum / values.length : 0;
    var sd = sampleSD(values); // question-level S.D. is unchanged: across that question's own responses

    var freq = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    values.forEach(function (v) { freq[v] += 1; });

    var percent = {};
    [5, 4, 3, 2, 1].forEach(function (level) {
      percent[level] = values.length ? (freq[level] / values.length) * 100 : 0;
    });

    perQuestion.push({
      question: qi,
      n: values.length,
      sum: sum,
      mean: mean,
      sd: sd,
      freq: freq,
      percent: percent
    });

    totalScore += sum;
  }

  // Overall S.D. is calculated from each respondent's TOTAL score across all
  // 10 questions (one number per respondent, range 10-50) — not from the
  // pooled individual item responses. A respondent only contributes a total
  // if all 10 of their answers are valid (1-5), so a partially-invalid row
  // can't skew this without also being excluded from every per-question
  // calculation above for the missing item.
  var respondentTotals = filtered
    .map(function (r) {
      var sum = 0;
      var validCount = 0;
      for (var i = 1; i <= QUESTION_COUNT; i++) {
        var v = Number(r['q' + i]);
        if (!isNaN(v) && v >= 1 && v <= 5) {
          sum += v;
          validCount += 1;
        }
      }
      return validCount === QUESTION_COUNT ? sum : null;
    })
    .filter(function (v) { return v !== null; });

  var overallMean = n > 0 ? totalScore / (n * QUESTION_COUNT) : 0;
  var overallSD = sampleSD(respondentTotals);
  var percentOfFullScore = fullScore > 0 ? (totalScore / fullScore) * 100 : 0;

  var interpretation;
  if (overallMean >= 4.21) interpretation = 'มากที่สุด';
  else if (overallMean >= 3.41) interpretation = 'มาก';
  else if (overallMean >= 2.61) interpretation = 'ปานกลาง';
  else if (overallMean >= 1.81) interpretation = 'น้อย';
  else if (overallMean > 0) interpretation = 'น้อยที่สุด';
  else interpretation = '-';

  return {
    filter: filter,
    n: n,
    totalScore: totalScore,
    fullScore: fullScore,
    percentOfFullScore: percentOfFullScore,
    overallMean: overallMean,
    overallSD: overallSD,
    interpretation: interpretation,
    perQuestion: perQuestion
  };
}

// ---------- output helper ----------

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
