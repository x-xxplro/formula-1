const params = new URLSearchParams(location.search);
const num = parseInt(params.get('ch') || '1', 10);
const ch = CHAPTERS.find(c => c.n === num) || CHAPTERS.find(c => c.n === 1);

// ===== Заголовки =====
const numLabel = ch.n === 0  ? 'ВСТУПЛЕНИЕ'
               : ch.n === 99 ? 'ЭПИЛОГ'
               : 'ГЛАВА ' + String(ch.n).padStart(2, '0');

document.getElementById('ch-num').textContent   = numLabel;
document.getElementById('ch-title').textContent = ch.title;
document.getElementById('ch-loc').textContent   = ch.loc;

// ===== Навигация prev / next / exit =====
const idx  = CHAPTERS.findIndex(c => c.n === ch.n);
const prev = document.getElementById('prev-link');
const next = document.getElementById('next-link');
const exit = document.getElementById('exit-link');

if (idx > 0) prev.href = `chapter.html?ch=${CHAPTERS[idx - 1].n}`;
else { prev.style.opacity = .3; prev.style.pointerEvents = 'none'; }

if (idx < CHAPTERS.length - 1) next.href = `chapter.html?ch=${CHAPTERS[idx + 1].n}`;
else { next.style.opacity = .3; next.style.pointerEvents = 'none'; }

exit.href = 'index.html';

// ===== Кэш: запоминаем последнюю главу =====
// Игнорируем вступление (0) и эпилог (99) — они не «последняя прочитанная глава»
function saveLastChapter() {
  if (ch.n <= 0 || ch.n >= 99) return;
  try {
    localStorage.setItem('outlap:last', JSON.stringify({
      n: ch.n,
      title: ch.title,
      loc: ch.loc,
      at: Date.now()
    }));
  } catch (e) {
    // localStorage недоступен (private mode) — молча игнорируем
  }
}

// ===== Кэш: отметка «прочитано» =====
function markRead() {
  if (ch.n <= 0) return;
  try {
    const read = JSON.parse(localStorage.getItem('outlap:read') || '[]');
    if (!read.includes(ch.n)) {
      read.push(ch.n);
      localStorage.setItem('outlap:read', JSON.stringify(read));
    }
  } catch (e) {}
}

// ===== Загрузка главы =====
const body = document.getElementById('ch-body');
const end  = document.getElementById('chapter-end');

fetch(`chapters/${ch.file}.html`)
  .then(r => r.ok ? r.text() : Promise.reject())
  .then(html => {
    body.innerHTML = html;
    postProcess();
    saveLastChapter();   // <— запоминаем ДО отметки «прочитано»
    markRead();
    renderEnd();
  })
  .catch(() => {
    body.innerHTML = `<p style="color:var(--muted)">Текст главы ещё не подключён: <code>chapters/${ch.file}.html</code></p>`;
    saveLastChapter();
    renderEnd();
  });

// ===== Плавное появление параграфов =====
function postProcess() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: .08, rootMargin: '0px 0px -40px 0px' });

  body.querySelectorAll(':scope > p').forEach((p, i) => {
    if (i === 0) p.classList.add('is-visible'); // первый — сразу видно
    observer.observe(p);
  });
}

// ===== Финал главы =====
function renderEnd() {
  if (ch.n === 99) {
    end.innerHTML = `
      <p style="color:var(--muted); font-family:var(--mono); font-size:.8rem; letter-spacing:.3em;">КОНЕЦ</p>
      <a href="index.html" class="btn btn--primary">← К началу</a>
    `;
    return;
  }

  const nextCh = CHAPTERS[idx + 1];
  const nextUrl = nextCh ? `chapter.html?ch=${nextCh.n}` : 'index.html';
  const nextLabel = nextCh
    ? (nextCh.n === 99 ? 'К эпилогу' : 'Следующая глава')
    : 'К началу →';

  const summary = ch.summary || '';
  const teaser  = ch.teaser  || '';

  end.innerHTML = `
    ${summary ? `
      <div class="chapter-summary">
        <p>${summary}</p>
      </div>
    ` : ''}
    ${teaser ? `
      <p class="chapter-next-teaser">Далее: <b>${teaser}</b></p>
    ` : ''}
    <div class="chapter-end__actions">
      <a href="index.html" class="btn btn--ghost">Выйти</a>
      <a href="${nextUrl}" class="btn btn--primary">${nextLabel}</a>
    </div>
  `;
}

// ===== Прогресс-бар чтения =====
const readBar = document.getElementById('read-progress');
window.addEventListener('scroll', () => {
  const h = document.documentElement;
  const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
  readBar.style.width = Math.min(100, Math.max(0, scrolled * 100)) + '%';
}, { passive: true });