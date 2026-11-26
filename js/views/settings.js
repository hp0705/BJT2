import { exportJson, importJson, loadState, resetAllData, saveState } from '../store.js';
import { prefetchPartAudio } from '../audio.js';
import { t } from '../i18n.js';

export function renderSettings(container, ctx) {
  const s = loadState();
  const st = s.settings;

  container.innerHTML = `
    <div class="card">
      <strong>${t('set_ui')}</strong>
      <div style="display:flex;flex-direction:column;gap:12px;margin-top:12px;">
        <label style="display:flex;justify-content:space-between;align-items:center;">
          <span>${t('set_lang')}</span>
          <select id="set-lang" class="btn-secondary">
            <option value="vi" ${st.lang !== 'ja' ? 'selected' : ''}>Tiếng Việt</option>
            <option value="ja" ${st.lang === 'ja' ? 'selected' : ''}>日本語</option>
          </select>
        </label>

        <label style="display:flex;justify-content:space-between;align-items:center;">
          <span>${t('set_theme')}</span>
          <select id="set-theme" class="btn-secondary">
            <option value="auto" ${st.theme === 'auto' ? 'selected' : ''}>${t('theme_auto')}</option>
            <option value="light" ${st.theme === 'light' ? 'selected' : ''}>${t('theme_light')}</option>
            <option value="dark" ${st.theme === 'dark' ? 'selected' : ''}>${t('theme_dark')}</option>
          </select>
        </label>

        <label style="display:flex;justify-content:space-between;align-items:center;">
          <span>${t('set_font')}</span>
          <select id="set-font" class="btn-secondary">
            <option value="0.9" ${st.fontScale === 0.9 ? 'selected' : ''}>${t('font_sm')}</option>
            <option value="1" ${st.fontScale === 1 ? 'selected' : ''}>${t('font_md')}</option>
            <option value="1.15" ${st.fontScale === 1.15 ? 'selected' : ''}>${t('font_lg')}</option>
          </select>
        </label>

        <label style="display:flex;justify-content:space-between;align-items:center;">
          <span>${t('set_rate')}</span>
          <select id="set-rate" class="btn-secondary">
            <option value="0.85" ${st.audioRate === 0.85 ? 'selected' : ''}>0.85×</option>
            <option value="1" ${st.audioRate === 1 ? 'selected' : ''}>1.0×</option>
            <option value="1.15" ${st.audioRate === 1.15 ? 'selected' : ''}>1.15×</option>
          </select>
        </label>

        <label style="display:flex;justify-content:space-between;align-items:center;">
          <span>${t('set_autoplay')}</span>
          <input type="checkbox" id="set-autoplay" ${st.autoPlayAfterAnswer ? 'checked' : ''} style="width:22px;height:22px;" />
        </label>

        <label style="display:flex;justify-content:space-between;align-items:center;">
          <span>${t('set_reading')}</span>
          <input type="checkbox" id="set-reading" ${st.showReadingOnCard ? 'checked' : ''} style="width:22px;height:22px;" />
        </label>

        <label style="display:flex;justify-content:space-between;align-items:center;">
          <span>${t('set_unlock')}</span>
          <input type="checkbox" id="set-unlock" ${st.unlockAll ? 'checked' : ''} style="width:22px;height:22px;" />
        </label>
      </div>
    </div>

    <div class="card">
      <strong>${t('offline_title')}</strong>
      <div class="muted" style="margin:4px 0 10px;">${t('offline_desc')}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${(ctx.index.parts || []).map((p) => `
          <button class="btn-secondary" data-prefetch="${p.id}">⬇ ${p.id}</button>
        `).join('')}
      </div>
      <div id="prefetch-status" class="muted" style="margin-top:8px;"></div>
    </div>

    <div class="card">
      <strong>${t('backup_title')}</strong>
      <div class="btn-row" style="margin-top:10px;">
        <button class="btn-secondary" id="btn-export">${t('export_btn')}</button>
        <label class="btn-secondary" style="cursor:pointer;">
          ${t('import_btn')}
          <input type="file" id="btn-import" accept=".json,application/json" hidden />
        </label>
      </div>
      <button class="btn-bad" id="btn-reset" style="width:100%;margin-top:12px;">${t('reset_btn')}</button>
    </div>

    <div class="muted" style="text-align:center;">
      BJT J2 App · v${ctx.index.version || '2.2'}
    </div>
  `;

  container.querySelector('#set-lang').onchange = (e) => {
    st.lang = e.target.value; saveState();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };
  container.querySelector('#set-theme').onchange = (e) => {
    st.theme = e.target.value; saveState(); ctx.applyTheme();
  };
  container.querySelector('#set-font').onchange = (e) => {
    st.fontScale = Number(e.target.value); saveState(); ctx.applyTheme();
  };
  container.querySelector('#set-rate').onchange = (e) => {
    st.audioRate = Number(e.target.value); saveState();
  };
  container.querySelector('#set-autoplay').onchange = (e) => {
    st.autoPlayAfterAnswer = e.target.checked; saveState();
  };
  container.querySelector('#set-reading').onchange = (e) => {
    st.showReadingOnCard = e.target.checked; saveState();
  };
  container.querySelector('#set-unlock').onchange = (e) => {
    st.unlockAll = e.target.checked; saveState();
  };

  container.querySelectorAll('[data-prefetch]').forEach((btn) => {
    btn.onclick = async () => {
      const partId = btn.dataset.prefetch;
      const part = (ctx.index.parts || []).find((p) => p.id === partId);
      if (!part) return;
      const status = container.querySelector('#prefetch-status');
      status.textContent = `Đang tải dữ liệu ${partId}…`;
      try {
        const lessons = await Promise.all(part.lessons.map((l) => ctx.loadLesson(l.id)));
        const total = await prefetchPartAudio(partId, lessons, (d, t) => {
          status.textContent = `Đang tải ${partId}: ${d}/${t} file (${Math.round((d / Math.max(1, t)) * 100)}%)`;
        });
        status.textContent = `✓ Đã lưu offline ${total} file âm thanh cho ${partId}.`;
      } catch (err) {
        status.textContent = `Lỗi: ${err.message}`;
      }
    };
  });

  container.querySelector('#btn-export').onclick = () => {
    const data = exportJson();
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bjt-j2-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    ctx.toast('Đã xuất file sao lưu JSON!');
  };

  container.querySelector('#btn-import').onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      importJson(text);
      ctx.applyTheme();
      ctx.toast('Đã khôi phục dữ liệu thành công!');
      renderSettings(container, ctx);
    } catch (err) {
      ctx.toast('Lỗi nhập JSON: ' + err.message);
    }
  };

  container.querySelector('#btn-reset').onclick = () => {
    if (!confirm('Xóa toàn bộ tiến độ học tập và Sổ lỗi?')) return;
    if (!confirm('Xác nhận lần 2: Hành động này không thể hoàn tác!')) return;
    resetAllData();
    ctx.applyTheme();
    ctx.toast('Đã đặt lại dữ liệu về ban đầu.');
    renderSettings(container, ctx);
  };
}
