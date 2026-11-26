import { loadState, needsBackupReminder, saveState } from '../store.js';
import { getDueCards } from '../srs.js';
import { navigate } from '../router.js';
import { t } from '../i18n.js';

export function renderHome(container, ctx) {
  const s = loadState();
  const dueCount = getDueCards(ctx.pool.vocab).length;
  const parts = ctx.index.parts || [];

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  container.innerHTML = `
    ${isIos && !isStandalone && !s.iosHintDismissed ? `
      <div class="card card-accent" id="ios-hint">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div>${t('ios_hint')}</div>
          <button class="btn-secondary" id="dismiss-ios" style="min-height:36px;padding:0 10px;">${t('close')}</button>
        </div>
      </div>
    ` : ''}

    ${needsBackupReminder() ? `
      <div class="card" style="border-color:var(--warn);">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <div>${t('backup_remind')}</div>
          <button class="btn-secondary" id="go-backup">${t('backup_now')}</button>
        </div>
      </div>
    ` : ''}

    <div class="card card-accent">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
        <div>
          <div class="muted">${t('today')}</div>
          <div style="font-size:1.15rem;font-weight:700;">
            ${dueCount > 0 ? t('due_today', { n: dueCount }) : t('no_due_today')}
          </div>
        </div>
        <button class="btn-primary" id="btn-today" style="width:auto;min-height:48px;">
          ${dueCount > 0 ? t('start') : t('learn_p01')}
        </button>
      </div>
    </div>

    ${parts.map((p) => {
      const doneCount = p.lessons.filter((l) => {
        const lp = s.lessonProgress[l.id];
        return lp && (l.isTest ? lp.quizPassed : lp.quizPassed);
      }).length;
      const pct = Math.round((doneCount / p.lessons.length) * 100);
      return `
        <div class="card" data-part="${p.id}" style="cursor:pointer;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <strong>${p.id} — ${p.title}</strong>
            <span class="muted">${doneCount}/${p.lessons.length}</span>
          </div>
          <div class="progress-track" style="margin-bottom:10px;">
            <div class="progress-fill" style="width:${pct}%"></div>
          </div>
          <div class="pill-row">
            ${p.lessons.map((l) => {
              const lp = s.lessonProgress[l.id];
              const ok = lp && lp.quizPassed;
              return `<span class="pill ${ok ? 'done' : ''}">${l.id.slice(-3)} ${ok ? '✓' : ''}</span>`;
            }).join('')}
          </div>
        </div>
      `;
    }).join('')}

    <div class="card muted" style="text-align:center;">
      ${t('coming_soon')}
    </div>
  `;

  const dismissBtn = container.querySelector('#dismiss-ios');
  if (dismissBtn) {
    dismissBtn.onclick = () => {
      s.iosHintDismissed = true;
      saveState();
      container.querySelector('#ios-hint').remove();
    };
  }

  const backupBtn = container.querySelector('#go-backup');
  if (backupBtn) backupBtn.onclick = () => navigate('#/settings');

  container.querySelector('#btn-today').onclick = () => {
    if (dueCount > 0) navigate('#/review');
    else navigate(`#/part/${parts[0]?.id || 'P01'}`);
  };

  container.querySelectorAll('[data-part]').forEach((el) => {
    el.onclick = () => navigate(`#/part/${el.dataset.part}`);
  });
}
