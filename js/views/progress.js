import { loadState } from '../store.js';
import { getBoxCounts } from '../srs.js';
import { renderQuizSession } from '../quiz.js';

export function renderProgress(container, ctx) {
  const s = loadState();
  const counts = getBoxCounts();
  const totalVocab = ctx.pool.vocab.length;
  const mastered = counts[4] + counts[5];

  const tagEntries = Object.entries(s.errors.tagCounts || {}).sort((a, b) => b[1] - a[1]);
  const maxErr = Math.max(1, ...tagEntries.map(([, v]) => v));

  container.innerHTML = `
    <div class="card">
      <strong>Tổng quan tiến độ</strong>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;">
        <div style="background:var(--surface-2);padding:12px;border-radius:12px;">
          <div class="muted">Từ đã học</div>
          <div style="font-size:1.3rem;font-weight:800;">${counts.total} / ${totalVocab}</div>
        </div>
        <div style="background:var(--surface-2);padding:12px;border-radius:12px;">
          <div class="muted">Thuộc chắc (Hộp 4–5)</div>
          <div style="font-size:1.3rem;font-weight:800;color:var(--ok);">${mastered}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <strong>Sổ lỗi cá nhân (17 mã lỗi BJT)</strong>
      <div class="muted" style="margin-bottom:10px;">Chạm vào mã lỗi để luyện lại đúng dạng câu hay sai.</div>
      ${tagEntries.length ? `
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${tagEntries.map(([tag, cnt]) => `
            <button class="bar-row" data-tag="${tag}" style="width:100%;text-align:left;padding:4px 0;">
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${tag}</span>
              <div class="progress-track"><div class="progress-fill" style="width:${Math.round((cnt / maxErr) * 100)}%;background:var(--bad);"></div></div>
              <strong style="text-align:right;">${cnt}</strong>
            </button>
          `).join('')}
        </div>
      ` : '<div class="muted">Chưa có lỗi nào được ghi nhận.</div>'}
    </div>

    <div class="card">
      <strong>Lịch sử điểm Quiz gần đây</strong>
      ${s.quizHistory.length ? `
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
          ${s.quizHistory.slice(0, 12).map((h) => `
            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border);padding-top:6px;">
              <span><strong>${h.lessonId}</strong> <span class="muted">(${h.date})</span></span>
              <span class="pill ${h.passed ? 'done' : ''}">${h.score}/${h.total} ${h.passed ? '✓' : '✗'}</span>
            </div>
          `).join('')}
        </div>
      ` : '<div class="muted" style="margin-top:6px;">Chưa có bài quiz nào.</div>'}
    </div>
  `;

  container.querySelectorAll('[data-tag]').forEach((btn) => {
    btn.onclick = () => {
      const tag = btn.dataset.tag;
      const items = ctx.pool.questions.filter((q) => (q.tags || []).includes(tag)).slice(0, 15);
      if (!items.length) {
        ctx.toast(`Không có câu hỏi cho mã lỗi ${tag}`);
        return;
      }
      renderQuizSession({
        container,
        items,
        title: `Luyện lỗi: ${tag}`,
        immediateFeedback: true,
        shuffleItems: true,
        vocabMap: ctx.vocabMap,
        onOpenVocab: ctx.openVocabModal,
        onComplete: () => {},
        onExit: () => renderProgress(container, ctx)
      });
    };
  });
}
