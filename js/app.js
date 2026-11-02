// ============================================================
// 1) Карточки глав на главной + прогресс-бар
// ============================================================
const grid = document.getElementById('chapter-grid');

function getRead() {
  try { return JSON.parse(localStorage.getItem('outlap:read') || '[]'); }
  catch (e) { return []; }
}

function getLast() {
  try {
    const raw = localStorage.getItem('outlap:last');
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

if (grid && typeof CHAPTERS !== 'undefined') {
  const read = getRead();
  const readCount = read.filter(n => n > 0 && n < 99).length;

  CHAPTERS.forEach(ch => {
    const isRead = read.includes(ch.n);
    const isSpecial = ch.n === 0 || ch.n === 99;

    const a = document.createElement('a');
    a.className = 'chapter-card'
      + (isRead ? ' is-read' : '')
      + (isSpecial ? ' chapter-card--special' : '');
    a.href = `chapter.html?ch=${ch.n}`;

    let numLabel;
    if (ch.n === 0) numLabel = 'ВСТУПЛЕНИЕ';
    else if (ch.n === 99) numLabel = 'ЭПИЛОГ';
    else numLabel = 'ГЛАВА ' + String(ch.n).padStart(2, '0');

    a.innerHTML = `
      <div class="chapter-card__status">${isRead ? '✓' : ''}</div>
      <div class="chapter-card__num">${numLabel}</div>
      <div class="chapter-card__title">${ch.title}</div>
      <div class="chapter-card__loc">${ch.loc}</div>
    `;
    grid.appendChild(a);
  });

  const fill = document.getElementById('progress-fill');
  const label = document.getElementById('progress-label');
  if (fill && label) {
    const pct = (readCount / TOTAL_CHAPTERS) * 100;
    fill.style.width = pct + '%';
    label.textContent = `Круг ${readCount} / ${TOTAL_CHAPTERS}`;
  }
}

// ============================================================
// 2) Кнопка «Продолжить с последней главы»
// ============================================================
(function initContinue() {
  const btnStart    = document.getElementById('btn-start');
  const btnContinue = document.getElementById('btn-continue');
  const btnNum      = document.getElementById('btn-continue-num');
  if (!btnStart || !btnContinue) return;

  const last = getLast();
  if (!last || !last.n) return;

  // Какая глава будет «следующей» после последней прочитанной?
  const read = getRead();
  let target = last.n;

  // Если последняя глава уже отмечена как прочитанная и есть следующая —
  // предлагаем сразу следующую непрочитанную.
  if (read.includes(last.n)) {
    const nextUnread = CHAPTERS.find(c =>
      c.n > last.n && c.n < 99 && !read.includes(c.n)
    );
    if (nextUnread) target = nextUnread.n;
  }

  const targetCh = CHAPTERS.find(c => c.n === target);
  if (!targetCh) return;

  // Меняем кнопку «Продолжить»
  btnContinue.href = `chapter.html?ch=${targetCh.n}`;
  if (btnNum) {
    btnNum.textContent = (targetCh.n === 99)
      ? '· эпилог'
      : targetCh.n;
  }

  // Скрываем «Начать читать» — чтобы не было дублирования
  btnStart.style.display = 'none';
  btnContinue.style.display = '';
})();