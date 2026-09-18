(function () {
  'use strict';

  // ---------------- state ----------------
  const state = {
    evaluatorType: null,       // 'customer' | 'technician'
    general: {},                // { gender, age_range, lumina_experience, customer_channel|technician_experience }
    answers: {},                // { 1: 5, 2: 4, ... }
    currentQuestionIndex: 0,    // 0-based
    submitting: false
  };

  // ---------------- ambient sparkle field ----------------
  function buildSparkleField() {
    const field = document.getElementById('sparkleField');
    const count = window.innerWidth < 600 ? 10 : 18;
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('span');
      dot.style.left = Math.random() * 100 + 'vw';
      dot.style.top = Math.random() * 100 + 'vh';
      dot.style.animationDelay = (Math.random() * 4).toFixed(2) + 's';
      dot.style.width = dot.style.height = (3 + Math.random() * 4).toFixed(1) + 'px';
      field.appendChild(dot);
    }
  }

  // ---------------- click sparkle burst ----------------
  function sparkleBurst(x, y) {
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'click-spark';
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.4;
      const distance = 30 + Math.random() * 30;
      p.style.setProperty('--dx', (Math.cos(angle) * distance).toFixed(1) + 'px');
      p.style.setProperty('--dy', (Math.sin(angle) * distance).toFixed(1) + 'px');
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      document.body.appendChild(p);
      p.addEventListener('animationend', () => p.remove());
      // safety cleanup in case animationend doesn't fire
      setTimeout(() => p.remove(), 700);
    }
  }

  // ---------------- screen navigation ----------------
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------------- general info screen ----------------
  function renderGeneralFields() {
    const container = document.getElementById('generalFieldsContainer');
    container.innerHTML = '';

    const fields = GENERAL_COMMON_FIELDS.concat([getExtraFieldFor(state.evaluatorType)]);

    fields.forEach(field => {
      const group = document.createElement('div');
      group.className = 'field-group';
      group.dataset.fieldKey = field.key;

      const label = document.createElement('label');
      label.className = 'field-label';
      label.innerHTML = field.label + '<span class="required-star">*</span>';
      group.appendChild(label);

      const optionList = document.createElement('div');
      optionList.className = 'option-list';

      field.options.forEach(optionValue => {
        const pillId = field.key + '-' + optionValue.replace(/\s+/g, '');
        const pill = document.createElement('label');
        pill.className = 'option-pill';
        pill.setAttribute('for', pillId);

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = field.key;
        input.id = pillId;
        input.value = optionValue;
        if (state.general[field.key] === optionValue) {
          input.checked = true;
          pill.classList.add('selected');
        }

        input.addEventListener('change', () => {
          state.general[field.key] = optionValue;
          group.classList.remove('has-error');
          optionList.querySelectorAll('.option-pill').forEach(p => p.classList.remove('selected'));
          pill.classList.add('selected');
        });

        const textSpan = document.createElement('span');
        textSpan.textContent = optionValue;

        pill.appendChild(input);
        pill.appendChild(textSpan);
        optionList.appendChild(pill);
      });

      const error = document.createElement('div');
      error.className = 'field-error';
      error.textContent = 'กรุณาเลือกคำตอบข้อนี้';
      group.appendChild(optionList);
      group.appendChild(error);

      container.appendChild(group);
    });
  }

  function validateGeneralFields() {
    const fields = GENERAL_COMMON_FIELDS.concat([getExtraFieldFor(state.evaluatorType)]);
    let allValid = true;
    fields.forEach(field => {
      const group = document.querySelector('[data-field-key="' + field.key + '"]');
      if (!state.general[field.key]) {
        group.classList.add('has-error');
        allValid = false;
      } else {
        group.classList.remove('has-error');
      }
    });
    if (!allValid) {
      document.querySelector('.field-group.has-error').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return allValid;
  }

  // ---------------- question screen ----------------
  function renderCurrentQuestion() {
    const questions = getQuestionsFor(state.evaluatorType);
    const q = questions[state.currentQuestionIndex];

    document.getElementById('questionDimension').textContent = q.title;
    document.getElementById('questionText').textContent = q.text;
    document.getElementById('questionBanner').classList.remove('show');

    const total = questions.length;
    const current = state.currentQuestionIndex + 1;
    document.getElementById('progressLabel').textContent = 'ข้อ ' + current + ' จาก ' + total;
    document.getElementById('progressFill').style.width = ((current - 1) / total * 100) + '%';

    const grid = document.getElementById('likertGrid');
    grid.innerHTML = '';

    LIKERT_OPTIONS.forEach(opt => {
      const el = document.createElement('div');
      el.className = 'likert-option';
      if (state.answers[q.id] === opt.value) el.classList.add('selected');

      const badge = document.createElement('span');
      badge.className = 'score-badge';
      badge.textContent = opt.value;

      const label = document.createElement('span');
      label.textContent = opt.label;
      label.style.flex = '1';
      label.style.textAlign = 'right';

      el.appendChild(label);
      el.appendChild(badge);

      el.addEventListener('click', (evt) => {
        state.answers[q.id] = opt.value;
        grid.querySelectorAll('.likert-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        document.getElementById('questionBanner').classList.remove('show');
        sparkleBurst(evt.clientX, evt.clientY);
      });

      grid.appendChild(el);
    });

    document.getElementById('btnPrevQuestion').disabled = state.currentQuestionIndex === 0;
  }

  function goToNextQuestion() {
    const questions = getQuestionsFor(state.evaluatorType);
    const q = questions[state.currentQuestionIndex];

    if (!state.answers[q.id]) {
      document.getElementById('questionBanner').classList.add('show');
      return;
    }

    if (state.currentQuestionIndex < questions.length - 1) {
      state.currentQuestionIndex += 1;
      renderCurrentQuestion();
    } else {
      // last question answered -> go to review
      document.getElementById('progressFill').style.width = '100%';
      showScreen('screen-review');
    }
  }

  function goToPrevQuestion() {
    if (state.currentQuestionIndex > 0) {
      state.currentQuestionIndex -= 1;
      renderCurrentQuestion();
    }
  }

  // ---------------- submission ----------------
  function buildPayload() {
    const questions = getQuestionsFor(state.evaluatorType);
    const payload = {
      action: 'submit',
      evaluator_type: state.evaluatorType,
      gender: state.general.gender,
      age_range: state.general.age_range,
      lumina_experience: state.general.lumina_experience,
      customer_channel: state.evaluatorType === 'customer' ? state.general.customer_channel : '',
      technician_experience: state.evaluatorType === 'technician' ? state.general.technician_experience : ''
    };
    questions.forEach(q => { payload['q' + q.id] = state.answers[q.id]; });
    return payload;
  }

  function allQuestionsAnswered() {
    const questions = getQuestionsFor(state.evaluatorType);
    return questions.every(q => !!state.answers[q.id]);
  }

  async function submitEvaluation() {
    if (state.submitting) return;

    if (!allQuestionsAnswered()) {
      // safety net: send the user back to the first unanswered question
      const questions = getQuestionsFor(state.evaluatorType);
      const missingIndex = questions.findIndex(q => !state.answers[q.id]);
      state.currentQuestionIndex = missingIndex;
      renderCurrentQuestion();
      showScreen('screen-questions');
      document.getElementById('questionBanner').classList.add('show');
      return;
    }

    if (!LUMINA_CONFIG.APPS_SCRIPT_URL || LUMINA_CONFIG.APPS_SCRIPT_URL.indexOf('PASTE_YOUR') === 0) {
      showSubmitError('ยังไม่ได้ตั้งค่า URL ของระบบหลังบ้าน (Apps Script) กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }

    state.submitting = true;
    const btn = document.getElementById('btnSubmit');
    const originalLabel = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>กำลังส่งข้อมูล...';
    hideSubmitError();

    const payload = buildPayload();

    try {
      const response = await fetch(LUMINA_CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // avoids CORS preflight against Apps Script
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'unknown_error');
      }

      showScreen('screen-success');
    } catch (err) {
      console.error('Submission failed:', err);
      showSubmitError('ไม่สามารถส่งแบบประเมินได้ในขณะนี้ อาจเกิดจากการเชื่อมต่ออินเทอร์เน็ตหรือระบบหลังบ้านขัดข้อง กรุณาลองใหม่อีกครั้ง คำตอบของท่านยังคงอยู่ครบถ้วน');
    } finally {
      state.submitting = false;
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  }

  function showSubmitError(msg) {
    const banner = document.getElementById('submitErrorBanner');
    banner.textContent = msg;
    banner.classList.add('show');
  }
  function hideSubmitError() {
    document.getElementById('submitErrorBanner').classList.remove('show');
  }

  // ---------------- reset ----------------
  function resetAll() {
    state.evaluatorType = null;
    state.general = {};
    state.answers = {};
    state.currentQuestionIndex = 0;
    showScreen('screen-intro');
  }

  // ---------------- wire up events ----------------
  document.addEventListener('DOMContentLoaded', () => {
    buildSparkleField();

    document.querySelectorAll('.choice-tile').forEach(tile => {
      tile.addEventListener('click', (evt) => {
        state.evaluatorType = tile.dataset.type;
        sparkleBurst(evt.clientX, evt.clientY);
        renderGeneralFields();
        showScreen('screen-general');
      });
    });

    document.getElementById('btnBackToIntro').addEventListener('click', () => {
      showScreen('screen-intro');
    });

    document.getElementById('btnToQuestions').addEventListener('click', () => {
      if (!validateGeneralFields()) return;
      state.currentQuestionIndex = 0;
      renderCurrentQuestion();
      showScreen('screen-questions');
    });

    document.getElementById('btnNextQuestion').addEventListener('click', goToNextQuestion);
    document.getElementById('btnPrevQuestion').addEventListener('click', goToPrevQuestion);

    document.getElementById('btnBackToQuestionsFromReview').addEventListener('click', () => {
      const questions = getQuestionsFor(state.evaluatorType);
      state.currentQuestionIndex = questions.length - 1;
      renderCurrentQuestion();
      showScreen('screen-questions');
    });

    document.getElementById('btnSubmit').addEventListener('click', submitEvaluation);
    document.getElementById('btnRestart').addEventListener('click', resetAll);
  });
})();
