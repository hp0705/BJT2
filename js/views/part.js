import { loadState } from '../store.js';
import { navigate } from '../router.js';

export function renderPart(container, ctx, partId) {
  const part = (ctx.index.parts || []).find((p) => p.id === partId);
  if (!part) {
    container.innerHTML = `<div class="card">Không tìm thấy ${partId}.</div>`;
    return;
  }
  const s = loadState();
  const l123Done = part.lessons
    .filter((l) => !l.isTest)
    .every((l) => s.lessonProgress[l.id]?.quizPassed);

  container.innerHTML = `
    <div class="card">
      <div class="muted">${part.id}</div>
      <h2 style="margin:4px 0 0;font-size:1.2rem;">${part.title}</h2>
    </div>

    ${part.lessons.map((l) => {
      const lp = s.lessonProgress[l.id] || {};
      const locked = l.isTest && !l123Done && !s.settings.unlockAll;
      return `
        <button class="step-item ${locked ? 'locked' : ''}" data-lid="${l.id}" ${locked ? 'disabled' : ''}>
          <div>
            <div style="font-weight:700;">${l.id} — ${l.title}</div>
            <div class="muted">
              ${l.isTest
                ? `Kiểm tra tổng hợp (${l.practiceCount} câu · đạt ≥70%)`
                : `${l.vocabCount} từ · Quiz ${l.quizCount} câu · ${l.practiceCount} bài thực chiến`}
            </div>
          </div>
          <span class="pill ${lp.quizPassed ? 'done' : ''}">
            ${locked ? '🔒' : (lp.quizPassed ? '✓ Đạt' : '▶')}
          </span>
        </button>
      `;
    }).join('')}
  `;

  container.querySelectorAll('[data-lid]').forEach((btn) => {
    btn.onclick = () => navigate(`#/lesson/${btn.dataset.lid}`);
  });
}
