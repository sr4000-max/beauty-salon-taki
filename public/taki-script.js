/* ============================================
   初期化エントリポイント
   Next.js <Script strategy="afterInteractive"> は DOMContentLoaded 発火後に
   読み込まれることがあるので、readyState を確認して即時 init するパターンに変更。
============================================ */
function __takiInit() {
  const hamburger = document.getElementById('hamburger');
  const navSp = document.getElementById('navSp');

  if (hamburger && navSp) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navSp.classList.toggle('open');
    });
    navSp.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navSp.classList.remove('open');
      });
    });
  }

  /* ============================================
     スクロール時のフェードイン
  ============================================ */
  const fadeTargets = document.querySelectorAll(
    '.section-head, .concept-grid, .feature-card, .menu-preview-item, ' +
    '.access-grid, .menu-block, .notes-box'
  );
  fadeTargets.forEach(el => el.classList.add('fade-in'));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  fadeTargets.forEach(el => observer.observe(el));

  /* ============================================
     ヘッダーのスクロール挙動
  ============================================ */
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 100) {
        header.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
      } else {
        header.style.boxShadow = 'none';
      }
    });
  }

  /* ============================================
     予約システム (reservation.html)
  ============================================ */
  if (!document.getElementById('step1')) return;

  // ===== 設定 =====
  // 予約送信先メールアドレス。FormSubmitを使用しています（無料・サーバー不要）。
  // 初回送信時にFormSubmitから「Confirm Email」という確認メールが届くので、
  // メール内のリンクをクリックして有効化してください。
  // 別のアドレスに変更する場合は、下記のメールアドレスを書き換えるだけでOKです。
  // =====================================================================
  // 【方式 B: Google フォームに切り替えたい場合】
  // 1. Google フォームを作成（同じ項目: 名前/カナ/電話/メール/来店歴/メニュー/日時/要望）
  // 2. 各フィールドの「事前入力URL」を取得し、entry.XXXXXXXX のIDをメモ
  // 3. submitReservation() 関数内でGoogleフォーム用のPOSTに置き換え
  //    submitURL = 'https://docs.google.com/forms/d/e/{FORM_ID}/formResponse'
  //    body は FormData で entry.XXXXX をkeyに送信
  // =====================================================================
  const FORMSUBMIT_EMAIL = 'sr4000@gmail.com';
  const FORMSUBMIT_URL = 'https://formsubmit.co/ajax/' + FORMSUBMIT_EMAIL;

  const BUSINESS = {
    openH: 9, openM: 30,    // 営業開始 9:30
    closeH: 19, closeM: 0,  // 営業終了 19:00
    interval: 30            // 30分刻み
  };

  // 予約データ
  const reserveData = {
    menus: [],          // [{name, price, duration}]
    totalPrice: 0,
    totalDuration: 0,
    date: null,
    time: null,
    name: '', kana: '', tel: '', email: '',
    visit: '初めて', note: ''
  };

  // 定休日: 月曜日(1) / 第3日曜日
  function isClosedDay(date) {
    const dow = date.getDay();
    if (dow === 1) return true;
    if (dow === 0 && Math.ceil(date.getDate() / 7) === 3) return true;
    return false;
  }

  // ===== ステップ移動 =====
  function goToStep(step) {
    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
    const panel = (step === 'done') ? document.getElementById('stepDone')
                                    : document.getElementById('step' + step);
    if (panel) panel.classList.add('active');

    if (step !== 'done') {
      document.querySelectorAll('.step-dot').forEach((dot, idx) => {
        dot.classList.remove('active', 'done');
        if (idx + 1 === step) dot.classList.add('active');
        else if (idx + 1 < step) dot.classList.add('done');
      });
    } else {
      document.querySelectorAll('.step-dot').forEach(dot => {
        dot.classList.remove('active');
        dot.classList.add('done');
      });
    }
    window.scrollTo({ top: document.querySelector('.step-indicator').offsetTop - 80, behavior: 'smooth' });
  }

  document.querySelectorAll('.btn-prev').forEach(btn => {
    btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.prev)));
  });
  document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = parseInt(btn.dataset.next);
      if (next === 2) {
        if (reserveData.menus.length === 0) {
          alert('ご希望のメニューを1つ以上選択してください。');
          return;
        }
        goToStep(2);
        renderCalendar();
      } else if (next === 4) {
        const name = document.getElementById('cName').value.trim();
        const tel = document.getElementById('cTel').value.trim();
        if (!name) { alert('お名前を入力してください。'); document.getElementById('cName').focus(); return; }
        if (!tel) { alert('お電話番号を入力してください。'); document.getElementById('cTel').focus(); return; }
        reserveData.name = name;
        reserveData.kana = document.getElementById('cKana').value.trim();
        reserveData.tel = tel;
        reserveData.email = document.getElementById('cEmail').value.trim();
        reserveData.visit = document.querySelector('input[name="cVisit"]:checked').value;
        reserveData.note = document.getElementById('cNote').value.trim();

        if (!reserveData.date || !reserveData.time) {
          alert('日時が選択されていません。STEP 2に戻って日時を選んでください。');
          return;
        }
        renderConfirm();
        goToStep(4);
      }
    });
  });

  // ===== STEP 1: メニュー =====
  const menuChips = document.querySelectorAll('input[name="menu"]');
  const selectedCountEl = document.getElementById('selectedCount');
  const selectedTotalEl = document.getElementById('selectedTotal');
  const selectedDurationEl = document.getElementById('selectedDuration');

  function fmtDuration(min) {
    if (min === 0) return '0分';
    if (min < 60) return min + '分';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h}時間` : `${h}時間${m}分`;
  }

  function updateMenuSummary() {
    reserveData.menus = [];
    reserveData.totalPrice = 0;
    reserveData.totalDuration = 0;
    menuChips.forEach(chip => {
      if (chip.checked) {
        const price = parseInt(chip.dataset.price || 0);
        const duration = parseInt(chip.dataset.duration || 0);
        reserveData.menus.push({ name: chip.value, price, duration });
        reserveData.totalPrice += price;
        reserveData.totalDuration += duration;
      }
    });
    selectedCountEl.textContent = reserveData.menus.length;
    selectedTotalEl.textContent = '¥' + reserveData.totalPrice.toLocaleString();
    selectedDurationEl.textContent = fmtDuration(reserveData.totalDuration);
  }

  menuChips.forEach(chip => chip.addEventListener('change', updateMenuSummary));

  // ===== STEP 2: カレンダー =====
  let calendarMonth = new Date();
  calendarMonth.setDate(1);

  const monthLabel = document.getElementById('monthLabel');
  const calendarGrid = document.getElementById('calendarGrid');
  const prevBtn = document.getElementById('prevMonth');
  const nextBtn = document.getElementById('nextMonth');
  const timeslotWrap = document.getElementById('timeslotWrap');
  const timeslotDate = document.getElementById('timeslotDate');
  const timeslotInfo = document.getElementById('timeslotInfo');
  const timeslotGrid = document.getElementById('timeslotGrid');

  function renderCalendar() {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    monthLabel.textContent = `${year}年 ${month + 1}月`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    prevBtn.disabled = (year < today.getFullYear()) ||
      (year === today.getFullYear() && month <= today.getMonth());

    const maxMonth = new Date(today.getFullYear(), today.getMonth() + 3, 1);
    nextBtn.disabled = (year === maxMonth.getFullYear() && month >= maxMonth.getMonth());

    calendarGrid.innerHTML = '';
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDow; i++) {
      const empty = document.createElement('div');
      empty.className = 'cal-cell empty';
      calendarGrid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dow = date.getDay();
      const cell = document.createElement('div');
      cell.className = 'cal-cell';
      if (dow === 0) cell.classList.add('sun');
      if (dow === 6) cell.classList.add('sat');

      const dateEl = document.createElement('span');
      dateEl.className = 'cal-date';
      dateEl.textContent = d;
      cell.appendChild(dateEl);

      const markEl = document.createElement('span');
      markEl.className = 'cal-mark';

      if (date < today) {
        cell.classList.add('past');
        markEl.textContent = '–';
      } else if (isClosedDay(date)) {
        cell.classList.add('closed');
        markEl.textContent = '休';
      } else {
        cell.classList.add('available');
        if (dow === 0 || dow === 6) {
          markEl.textContent = '△';
          markEl.style.color = '#d49b4d';
        } else {
          markEl.textContent = '○';
        }
        cell.addEventListener('click', () => selectDate(date, cell));
      }

      if (date.getTime() === today.getTime()) cell.classList.add('today');
      if (reserveData.date && date.getTime() === reserveData.date.getTime()) {
        cell.classList.add('selected');
      }

      cell.appendChild(markEl);
      calendarGrid.appendChild(cell);
    }
  }

  prevBtn.addEventListener('click', () => {
    calendarMonth.setMonth(calendarMonth.getMonth() - 1);
    renderCalendar();
  });
  nextBtn.addEventListener('click', () => {
    calendarMonth.setMonth(calendarMonth.getMonth() + 1);
    renderCalendar();
  });

  function selectDate(date, cellEl) {
    reserveData.date = date;
    reserveData.time = null;
    document.querySelectorAll('.cal-cell.selected').forEach(c => c.classList.remove('selected'));
    cellEl.classList.add('selected');
    renderTimeSlots(date);
  }

  function renderTimeSlots(date) {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    timeslotDate.textContent =
      `${date.getMonth() + 1}月${date.getDate()}日（${weekdays[date.getDay()]}）の空き時間`;

    // 所要時間情報を表示
    if (reserveData.totalDuration > 0) {
      timeslotInfo.textContent = `所要時間 約${fmtDuration(reserveData.totalDuration)} ／ ご希望の開始時間をクリック`;
    }

    timeslotGrid.innerHTML = '';

    const closeMinutes = BUSINESS.closeH * 60 + BUSINESS.closeM; // 19:00 = 1140
    const startMinutes = BUSINESS.openH * 60 + BUSINESS.openM;   // 9:30 = 570
    const duration = Math.max(reserveData.totalDuration, 30);    // 最低30分扱い

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const slots = [];
    for (let m = startMinutes; m + duration <= closeMinutes; m += BUSINESS.interval) {
      const h = Math.floor(m / 60);
      const mm = m % 60;
      slots.push({
        label: `${h}:${mm === 0 ? '00' : mm < 10 ? '0' + mm : mm}`,
        minutes: m
      });
    }

    if (slots.length === 0) {
      timeslotGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#c75450;padding:20px;">選択メニューの所要時間が長く、この日は受付可能な時間がありません。<br>STEP 1でメニューを見直すか、別の日をお選びください。</p>';
      timeslotWrap.style.display = 'block';
      return;
    }

    slots.forEach(slot => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'time-btn';
      btn.textContent = slot.label;

      if (isToday && slot.minutes <= currentMinutes + 60) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.addEventListener('click', () => selectTime(slot.label, btn));
      }

      if (reserveData.time === slot.label) btn.classList.add('selected');
      timeslotGrid.appendChild(btn);
    });

    timeslotWrap.style.display = 'block';
    setTimeout(() => {
      timeslotWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }

  function selectTime(slot, btnEl) {
    reserveData.time = slot;
    document.querySelectorAll('.time-btn.selected').forEach(b => b.classList.remove('selected'));
    btnEl.classList.add('selected');
    setTimeout(() => goToStep(3), 400);
  }

  // ===== STEP 4: 確認 =====
  function formatDateJP() {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const d = reserveData.date;
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）`;
  }

  function renderConfirm() {
    const dateStr = formatDateJP();
    const confirmBox = document.getElementById('confirmBox');
    confirmBox.innerHTML = `
      <dl>
        <div class="confirm-row">
          <dt>ご希望日時</dt>
          <dd><span class="confirm-datetime">${dateStr} ${reserveData.time}〜</span>
              <p style="margin-top:4px;font-size:13px;color:var(--color-text-light);">所要時間 約${fmtDuration(reserveData.totalDuration)}</p></dd>
        </div>
        <div class="confirm-row">
          <dt>ご希望メニュー</dt>
          <dd><ul>${reserveData.menus.map(m => `<li>${m.name}</li>`).join('')}</ul>
              <p style="margin-top:8px;font-size:13px;color:var(--color-text-light);">料金目安：¥${reserveData.totalPrice.toLocaleString()}（税込）</p></dd>
        </div>
        <div class="confirm-row">
          <dt>お名前</dt>
          <dd>${escapeHtml(reserveData.name)}${reserveData.kana ? `（${escapeHtml(reserveData.kana)}）` : ''}</dd>
        </div>
        <div class="confirm-row">
          <dt>お電話番号</dt>
          <dd>${escapeHtml(reserveData.tel)}</dd>
        </div>
        ${reserveData.email ? `
        <div class="confirm-row">
          <dt>メール</dt>
          <dd>${escapeHtml(reserveData.email)}</dd>
        </div>` : ''}
        <div class="confirm-row">
          <dt>ご来店歴</dt>
          <dd>${reserveData.visit}</dd>
        </div>
        ${reserveData.note ? `
        <div class="confirm-row">
          <dt>ご要望</dt>
          <dd>${escapeHtml(reserveData.note).replace(/\n/g, '<br>')}</dd>
        </div>` : ''}
      </dl>
    `;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]
    ));
  }

  // ===== 送信 =====
  const submitBtn = document.getElementById('submitBtn');
  const submitStatus = document.getElementById('submitStatus');
  const notesBox = document.getElementById('notesBox');

  // 予約内容を整形した本文を作成（メール本文・mailtoフォールバック共通）
  function buildReservationText() {
    const dateStr = formatDateJP();
    return `【ご予約のお願い】Beauty Salon TAKI 様

下記の通りご予約をお願いいたします。

■お名前
${reserveData.name}${reserveData.kana ? `（${reserveData.kana}）` : ''}

■お電話番号
${reserveData.tel}

■メールアドレス
${reserveData.email || '（未入力）'}

■ご来店歴
${reserveData.visit}

■ご希望日時
${dateStr} ${reserveData.time}〜
（所要時間目安：${fmtDuration(reserveData.totalDuration)}）

■ご希望メニュー
${reserveData.menus.map(m => `・${m.name}`).join('\n')}
（料金目安：¥${reserveData.totalPrice.toLocaleString()}）
${reserveData.note ? `\n■ご要望\n${reserveData.note}\n` : ''}
よろしくお願いいたします。`;
  }

  // mailtoフォールバックURLを生成
  function buildMailtoUrl() {
    const dateStr = formatDateJP();
    const subject = encodeURIComponent(`【予約】${dateStr} ${reserveData.time} ${reserveData.name}`);
    const body = encodeURIComponent(buildReservationText());
    return `mailto:${FORMSUBMIT_EMAIL}?subject=${subject}&body=${body}`;
  }

  submitBtn.addEventListener('click', async () => {
    submitBtn.disabled = true;
    submitStatus.textContent = '送信中…';
    submitStatus.className = 'submit-status loading';

    const dateStr = formatDateJP();
    const payload = {
      _subject: `【予約】${dateStr} ${reserveData.time} ${reserveData.name} 様`,
      _template: 'table',
      _captcha: 'false',
      'お名前': reserveData.name + (reserveData.kana ? `（${reserveData.kana}）` : ''),
      'お電話番号': reserveData.tel,
      'メールアドレス': reserveData.email || '（未入力）',
      'ご来店歴': reserveData.visit,
      'ご希望日時': `${dateStr} ${reserveData.time}〜`,
      'ご希望メニュー': reserveData.menus.map(m => m.name).join(' / '),
      '所要時間目安': fmtDuration(reserveData.totalDuration),
      '料金目安': '¥' + reserveData.totalPrice.toLocaleString(),
      'ご要望': reserveData.note || '（なし）'
    };

    try {
      const res = await fetch(FORMSUBMIT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));

      // FormSubmitは初回のみactivation requiredを返すが、その場合もデータは到達しているケースが多い
      const success = data.success === 'true' || data.success === true || res.ok;

      if (success) {
        submitStatus.textContent = '';
        submitStatus.className = 'submit-status';
        if (notesBox) notesBox.style.display = 'none';
        goToStep('done');
      } else {
        throw new Error(data.message || '送信に失敗しました');
      }
    } catch (err) {
      console.error('Submit error:', err);
      // フォールバック：mailtoでメーラーを開いてもらう
      const mailtoUrl = buildMailtoUrl();
      submitStatus.innerHTML =
        '⚠ 自動送信に失敗しました。下記いずれかの方法でご予約ください：' +
        '<br><br><a href="' + mailtoUrl + '" class="btn-primary" style="display:inline-block;margin:6px;">📧 メーラーを開いて送信</a>' +
        '<a href="tel:0996-22-4342" class="btn-secondary" style="display:inline-block;margin:6px;">📞 電話で予約 (0996-22-4342)</a>' +
        '<br><br><small>※「メーラーを開いて送信」を押すと、ご予約内容が自動入力されたメール画面が立ち上がります。そのまま送信してください。</small>';
      submitStatus.className = 'submit-status error';
      submitBtn.disabled = false;
    }
  });

  // 初期化
  updateMenuSummary();
}

// DOM が既に出来上がっていれば即時実行、まだなら DOMContentLoaded を待つ。
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', __takiInit);
} else {
  __takiInit();
}
