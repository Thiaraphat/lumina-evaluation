(function () {
  'use strict';

  let currentPasscode = null;
  let currentFilter = 'all';

  function buildSparkleField() {
    const field = document.getElementById('sparkleField');
    if (!field) return;
    const count = window.innerWidth < 600 ? 8 : 14;
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('span');
      dot.style.left = Math.random() * 100 + 'vw';
      dot.style.top = Math.random() * 100 + 'vh';
      dot.style.animationDelay = (Math.random() * 4).toFixed(2) + 's';
      field.appendChild(dot);
    }
  }

  function getRoleFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    return role === 'owner' ? 'owner' : 'teacher';
  }

  function roleLabel(role) {
    return role === 'owner' ? 'สำหรับเจ้าของโครงงาน' : 'สำหรับอาจารย์';
  }

  function fmtNumber(n, digits) {
    if (typeof n !== 'number' || isNaN(n)) return '-';
    return n.toLocaleString('th-TH', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  async function fetchStats(passcode, filter) {
    // POST with text/plain avoids the CORS preflight that Apps Script Web
    // Apps cannot answer (see Code.gs comment on doPost for details).
    const response = await fetch(LUMINA_CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'stats', passcode: passcode, filter: filter })
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return response.json();
  }

  function renderStats(stats) {
    document.getElementById('statN').textContent = stats.n;
    document.getElementById('statTotal').textContent = fmtNumber(stats.totalScore, 0);
    document.getElementById('statFull').textContent = fmtNumber(stats.fullScore, 0);
    document.getElementById('statPercent').textContent = fmtNumber(stats.percentOfFullScore, 2) + '%';
    document.getElementById('statMean').textContent = fmtNumber(stats.overallMean, 2);
    document.getElementById('statSD').textContent = fmtNumber(stats.overallSD, 2);
    document.getElementById('statInterpretation').textContent = stats.interpretation;

    // "customer" and "technician" filters show that group's real question
    // wording; "all" shows neutral dimension labels only, since neither
    // group's actual wording correctly represents the other group's
    // responses (see questions.js: getLabelSetFor / NEUTRAL_QUESTIONS).
    const labelSet = getLabelSetFor(currentFilter);

    const container = document.getElementById('questionStatsContainer');
    container.innerHTML = '';

    stats.perQuestion.forEach(qStat => {
      const meta = labelSet[qStat.question - 1];
      const card = document.createElement('div');
      card.className = 'question-stat-card';

      const subText = meta.text
        ? '<div style="font-size:13px;color:var(--ink-soft);margin-top:2px;">' + meta.text + '</div>'
        : '';

      const head = document.createElement('div');
      head.className = 'question-stat-head';
      head.innerHTML =
        '<div><strong>ข้อ ' + qStat.question + ': ' + meta.title + '</strong>' + subText + '</div>' +
        '<div class="qs-mean">Mean ' + fmtNumber(qStat.mean, 2) + ' | S.D. ' + fmtNumber(qStat.sd, 2) + '</div>';
      card.appendChild(head);

      [5, 4, 3, 2, 1].forEach(level => {
        const row = document.createElement('div');
        row.className = 'freq-bar-row';
        const pct = qStat.percent[level] || 0;
        row.innerHTML =
          '<span>คะแนน ' + level + '</span>' +
          '<span class="freq-bar-track"><span class="freq-bar-fill" style="width:' + pct.toFixed(1) + '%"></span></span>' +
          '<span>' + pct.toFixed(1) + '%</span>';
        card.appendChild(row);
      });

      container.appendChild(card);
    });
  }

  async function loadAndRender() {
    document.getElementById('dashboardError').classList.remove('show');
    document.getElementById('dashboardLoading').classList.add('show');
    document.getElementById('dashboardContent').style.display = 'none';

    try {
      const result = await fetchStats(currentPasscode, currentFilter);
      if (!result.ok) throw new Error(result.error || 'unknown_error');
      renderStats(result.stats);
      document.getElementById('dashboardContent').style.display = 'block';
    } catch (err) {
      console.error(err);
      const banner = document.getElementById('dashboardError');
      banner.textContent = 'ไม่สามารถโหลดข้อมูลสถิติได้ในขณะนี้ กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง';
      banner.classList.add('show');
    } finally {
      document.getElementById('dashboardLoading').classList.remove('show');
    }
  }

  async function attemptUnlock() {
    const input = document.getElementById('passcodeInput');
    const errorEl = document.getElementById('passcodeError');
    const btn = document.getElementById('btnUnlock');
    const passcode = input.value.trim();

    if (!passcode) {
      errorEl.textContent = 'กรุณากรอกรหัสผ่าน';
      errorEl.style.display = 'block';
      return;
    }

    if (!LUMINA_CONFIG.APPS_SCRIPT_URL || LUMINA_CONFIG.APPS_SCRIPT_URL.indexOf('PASTE_YOUR') === 0) {
      errorEl.textContent = 'ยังไม่ได้ตั้งค่า URL ของระบบหลังบ้าน (Apps Script)';
      errorEl.style.display = 'block';
      return;
    }

    btn.disabled = true;
    const originalLabel = btn.textContent;
    btn.innerHTML = '<span class="spinner"></span>กำลังตรวจสอบ...';

    try {
      const result = await fetchStats(passcode, 'all');
      if (!result.ok) {
        errorEl.textContent = 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง';
        errorEl.style.display = 'block';
        return;
      }
      currentPasscode = passcode;
      document.getElementById('roleBadge').textContent = roleLabel(result.role);
      document.getElementById('gateStage').style.display = 'none';
      document.getElementById('dashboardStage').style.display = 'block';
      renderStats(result.stats);
      document.getElementById('dashboardContent').style.display = 'block';
    } catch (err) {
      console.error(err);
      errorEl.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง';
      errorEl.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    buildSparkleField();
    document.getElementById('gateTitle').textContent = 'เข้าสู่หน้าผลการประเมิน (' + roleLabel(getRoleFromUrl()) + ')';

    document.getElementById('btnUnlock').addEventListener('click', attemptUnlock);
    document.getElementById('passcodeInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') attemptUnlock();
    });

    document.getElementById('filterTabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.filter-tab');
      if (!tab) return;
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      loadAndRender();
    });
  });
})();
