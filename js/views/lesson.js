import { getLessonState, loadState } from '../store.js';
import { navigate } from '../router.js';

export function renderLessonMenu(container, ctx, lessonId, lesson) {
  const s = loadState();
  const lp = getLessonState(lessonId);

  if (lesson.isTest) {
    const totalTest =
      (lesson.grammar?.length || 0) +
      lesson.reading.reduce((a, r) => a + r.questions.length, 0) +
      lesson.listening.reduce((a, l) => a + l.questions.length, 0);

    container.innerHTML = `
      <div class="card">
        <div class="muted">${lesson.part} · Bài kiểm tra</div>
        <h2 style="margin:4px 0 8px;font-size:1.2rem;">${lesson.title}</h2>
        <div class="muted">Gồm ${totalTest} câu liền mạch (Ngữ pháp/Từ vựng · Đọc · Nghe). Không hiện đáp án giữa chừng. Ngưỡng đạt ≥ 70%.</div>
      </div>

      ${lesson.grammar?.length ? `
        <button class="step-item" id="test-grammar">
          <span>① Phần 1 — Văn pháp & Từ vựng (${lesson.grammar.length} câu)</span>
          <span class="pill ${lp.practiceDone?.grammar ? 'done' : ''}">${lp.practiceDone?.grammar ? '✓' : '▶'}</span>
        </button>
      ` : ''}

      ${lesson.reading?.length ? `
        <button class="step-item" id="test-reading">
          <span>② Phần 2 — Đọc hiểu (${lesson.reading.reduce((a, r) => a + r.questions.length, 0)} câu)</span>
          <span class="pill ${lp.practiceDone?.reading ? 'done' : ''}">${lp.practiceDone?.reading ? '✓' : '▶'}</span>
        </button>
      ` : ''}

      ${lesson.listening?.length ? `
        <button class="step-item" id="test-listening">
          <span>③ Phần 3 — Nghe hiểu (${lesson.listening.reduce((a, l) => a + l.questions.length, 0)} câu)</span>
          <span class="pill ${lp.practiceDone?.listening ? 'done' : ''}">${lp.practiceDone?.listening ? '✓' : '▶'}</span>
        </button>
      ` : ''}
    `;

    container.querySelector('#test-grammar')?.addEventListener('click', () => navigate(`#/practice/${lessonId}/grammar`));
    container.querySelector('#test-reading')?.addEventListener('click', () => navigate(`#/practice/${lessonId}/reading`));
    container.querySelector('#test-listening')?.addEventListener('click', () => navigate(`#/listening/${lessonId}/0`));
    return;
  }

  const unlocked = lp.quizPassed || s.settings.unlockAll;

  container.innerHTML = `
    <div class="card">
      <div class="muted">${lesson.part} · ${lesson.id}</div>
      <h2 style="margin:4px 0 0;font-size:1.2rem;">${lesson.title}</h2>
    </div>

    <button class="step-item" id="step-vocab">
      <span>① Học từ vựng (${lesson.vocab.length} từ)</span>
      <span class="pill ${lp.vocabDone ? 'done' : ''}">${lp.vocabDone ? '✓' : '▶'}</span>
    </button>

    <button class="step-item" id="step-quiz">
      <span>② Quiz từ vựng (đạt ≥ ${lesson.vocabQuiz.passAt}/${lesson.vocabQuiz.total})</span>
      <span class="pill ${lp.quizPassed ? 'done' : ''}">
        ${lp.quizBest ? `${lp.quizBest}/${lesson.vocabQuiz.total}` : '▶'}
      </span>
    </button>

    <button class="step-item" id="step-review">
      <span>③ Ôn từ sai (Hộp Leitner)</span>
      <span class="pill">▶</span>
    </button>

    <div class="muted" style="padding:4px 4px 0;">
      — Bài thực chiến ${unlocked ? '' : '(🔒 đạt quiz từ vựng để mở)'} —
    </div>

    ${lesson.notes?.length ? `
      <button class="step-item ${unlocked ? '' : 'locked'}" id="step-notes" ${unlocked ? '' : 'disabled'}>
        <span>④ Điểm cần nhớ nhanh (${lesson.notes.length} ý)</span>
        <span class="pill">${unlocked ? '▶' : '🔒'}</span>
      </button>
    ` : ''}

    ${lesson.listening.map((lr, idx) => `
      <button class="step-item ${unlocked ? '' : 'locked'}" data-lr="${idx}" ${unlocked ? '' : 'disabled'}>
        <span>🎧 ${lr.title} (${lr.questions.length} câu)</span>
        <span class="pill ${lp.practiceDone?.[`lr_${idx}`] ? 'done' : ''}">${unlocked ? (lp.practiceDone?.[`lr_${idx}`] ? '✓' : '▶') : '🔒'}</span>
      </button>
    `).join('')}

    ${lesson.reading?.length ? `
      <button class="step-item ${unlocked ? '' : 'locked'}" id="step-reading" ${unlocked ? '' : 'disabled'}>
        <span>📄 Đọc hiểu (${lesson.reading.reduce((a, r) => a + r.questions.length, 0)} câu)</span>
        <span class="pill ${lp.practiceDone?.reading ? 'done' : ''}">${unlocked ? (lp.practiceDone?.reading ? '✓' : '▶') : '🔒'}</span>
      </button>
    ` : ''}

    ${lesson.expression?.length ? `
      <button class="step-item ${unlocked ? '' : 'locked'}" id="step-expr" ${unlocked ? '' : 'disabled'}>
        <span>💬 表現力 (${lesson.expression.length} câu)</span>
        <span class="pill ${lp.practiceDone?.expr ? 'done' : ''}">${unlocked ? (lp.practiceDone?.expr ? '✓' : '▶') : '🔒'}</span>
      </button>
    ` : ''}

    ${lesson.grammar?.length ? `
      <button class="step-item ${unlocked ? '' : 'locked'}" id="step-grammar" ${unlocked ? '' : 'disabled'}>
        <span>📝 文法語彙 (${lesson.grammar.length} câu)</span>
        <span class="pill ${lp.practiceDone?.grammar ? 'done' : ''}">${unlocked ? (lp.practiceDone?.grammar ? '✓' : '▶') : '🔒'}</span>
      </button>
    ` : ''}

    ${lesson.depiction?.length ? `
      <button class="step-item ${unlocked ? '' : 'locked'}" id="step-depict" ${unlocked ? '' : 'disabled'}>
        <span>🖼 描写 (${lesson.depiction.length} câu)</span>
        <span class="pill ${lp.practiceDone?.depict ? 'done' : ''}">${unlocked ? (lp.practiceDone?.depict ? '✓' : '▶') : '🔒'}</span>
      </button>
    ` : ''}
  `;

  container.querySelector('#step-vocab').onclick = () => navigate(`#/vocab/${lessonId}`);
  container.querySelector('#step-quiz').onclick = () => navigate(`#/quiz/${lessonId}`);
  container.querySelector('#step-review').onclick = () => navigate('#/review');
  container.querySelector('#step-notes')?.addEventListener('click', () => navigate(`#/practice/${lessonId}/notes`));
  container.querySelectorAll('[data-lr]').forEach((b) => {
    b.onclick = () => navigate(`#/listening/${lessonId}/${b.dataset.lr}`);
  });
  container.querySelector('#step-reading')?.addEventListener('click', () => navigate(`#/practice/${lessonId}/reading`));
  container.querySelector('#step-expr')?.addEventListener('click', () => navigate(`#/practice/${lessonId}/expr`));
  container.querySelector('#step-grammar')?.addEventListener('click', () => navigate(`#/practice/${lessonId}/grammar`));
  container.querySelector('#step-depict')?.addEventListener('click', () => navigate(`#/practice/${lessonId}/depict`));
}
