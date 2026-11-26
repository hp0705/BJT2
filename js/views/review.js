import { playSingle } from '../audio.js';
import { getBoxCounts, getDueCards, gradeCard } from '../srs.js';
import { touchStreak } from '../store.js';

export function renderReview(container, ctx) {
  const counts = getBoxCounts();
  const dueList = getDueCards(ctx.pool.vocab);
  let mode = null; // null | 'card' | 'mc'
  let idx = 0;
  let flipped = false;

  function renderOverview() {
    const maxBox = Math.max(1, counts[1], counts[2], counts[3], counts[4], counts[5]);
    container.innerHTML = `
      <div class="card card-accent">
        <div class="muted">Ôn tập Leitner 5 hộp</div>
        <div style="font-size:1.4rem;font-weight:800;margin:4px 0;">${dueList.length} từ cần ôn hôm nay</div>
        <div class="muted">Tổng đã học: ${counts.total} từ · Từ khó: ${counts.hard}</div>
      </div>

      <div class="card">
        <strong style="display:block;margin-bottom:10px;">Phân bố 5 hộp Leitner</strong>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${[1, 2, 3, 4, 5].map((b) => {
            const days = { 1: '1 ngày', 2: '3 ngày', 3: '7 ngày', 4: '14 ngày', 5: '30 ngày' }[b];
            const pct = Math.round((counts[b] / maxBox) * 100);
            return `
              <div class="bar-row">
                <span>Hộp ${b} (${days})</span>
                <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
                <strong style="text-align:right;">${counts[b]}</strong>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      ${dueList.length ? `
        <div class="btn-row">
          <button class="btn-primary" id="start-card">Ôn thẻ (${dueList.length})</button>
          <button class="btn-secondary" id="start-mc" style="min-height:56px;">Trắc nghiệm</button>
        </div>
      ` : `
        <div class="card muted" style="text-align:center;">
          Chưa có từ đến hạn hôm nay. Hãy học thêm từ mới ở tab <strong>Học</strong>!
        </div>
      `}
    `;

    container.querySelector('#start-card')?.addEventListener('click', () => { mode = 'card'; idx = 0; flipped = false; renderSession(); });
    container.querySelector('#start-mc')?.addEventListener('click', () => { mode = 'mc'; idx = 0; renderSession(); });
  }

  function renderSession() {
    if (idx >= dueList.length) {
      ctx.toast('Đã hoàn thành phiên ôn tập!');
      mode = null;
      renderOverview();
      return;
    }

    const { card, vocab } = dueList[idx];
    if (mode === 'card') {
      container.innerHTML = `
        <div class="muted">${idx + 1} / ${dueList.length} · Hộp ${card.box} ${card.hard ? '· ⚠ Từ khó' : ''}</div>
        <div class="card flashcard" id="srs-card">
          <div class="word-jp">${vocab.word}</div>
          <button class="btn-audio" id="srs-audio" aria-label="Nghe">🔊</button>
          ${flipped ? `
            <div class="reading-jp">${vocab.reading}</div>
            <div class="meaning-vi">${vocab.meaning}</div>
            ${vocab.exJp ? `<div class="muted">${vocab.exJp}<br>${vocab.exVi}</div>` : ''}
          ` : `<div class="muted">(Chạm thẻ để xem đáp án)</div>`}
        </div>
        <div class="btn-row">
          <button class="btn-bad" id="srs-miss">✗ Quên (về Hộp 1)</button>
          <button class="btn-ok" id="srs-hit">✓ Nhớ (lên Hộp ${Math.min(5, card.box + 1)})</button>
        </div>
      `;
      container.querySelector('#srs-card').onclick = (e) => {
        if (e.target.closest('button')) return;
        flipped = !flipped;
        renderSession();
      };
      container.querySelector('#srs-audio').onclick = (e) => {
        e.stopPropagation();
        playSingle(`audio/words/${vocab.id}.mp3`, vocab.reading || vocab.word);
      };
      container.querySelector('#srs-miss').onclick = () => {
        touchStreak();
        gradeCard(vocab.id, false);
        idx += 1; flipped = false; renderSession();
      };
      container.querySelector('#srs-hit').onclick = () => {
        touchStreak();
        gradeCard(vocab.id, true);
        idx += 1; flipped = false; renderSession();
      };
    } else {
      // Multiple-choice auto-generated from pool
      const others = ctx.pool.vocab
        .filter((x) => x.id !== vocab.id && x.meaning !== vocab.meaning)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const choices = [vocab, ...others].sort(() => Math.random() - 0.5);

      container.innerHTML = `
        <div class="muted">${idx + 1} / ${dueList.length} · Trắc nghiệm Hộp ${card.box}</div>
        <div class="card" style="text-align:center;">
          <div class="word-jp">${vocab.word}</div>
          <div class="reading-jp">${vocab.reading}</div>
          <button class="btn-audio-sm" id="mc-audio" style="margin-top:8px;">🔊</button>
        </div>
        <div class="option-list">
          ${choices.map((c, i) => `
            <button class="option-btn" data-cid="${c.id}">
              <span class="option-letter">${'ABCD'[i]}</span>
              <span>${c.meaning}</span>
            </button>
          `).join('')}
        </div>
      `;
      container.querySelector('#mc-audio').onclick = () => playSingle(`audio/words/${vocab.id}.mp3`, vocab.reading || vocab.word);
      container.querySelectorAll('.option-btn').forEach((btn) => {
        btn.onclick = () => {
          const ok = btn.dataset.cid === vocab.id;
          touchStreak();
          gradeCard(vocab.id, ok);
          btn.classList.add(ok ? 'correct' : 'wrong');
          if (!ok) {
            container.querySelector(`[data-cid="${vocab.id}"]`)?.classList.add('correct');
          }
          setTimeout(() => { idx += 1; renderSession(); }, 700);
        };
      });
    }
  }

  renderOverview();
}
