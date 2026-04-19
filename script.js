/* =====================================================
   Grigio — script.js
   ===================================================== */

(function () {
    'use strict';

    // ── ナビゲーション：スクロールで背景追加 ──────────────
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });

    // ── モバイルハンバーガー ──────────────────────────────
    const hamburger = document.getElementById('hamburger');
    const navLinks  = document.getElementById('navLinks');

    hamburger.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('is-open');
        hamburger.classList.toggle('is-active', isOpen);
        hamburger.setAttribute('aria-expanded', isOpen);
    });
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('is-open');
            hamburger.classList.remove('is-active');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });

    // =====================================================
    // モーダル共通ユーティリティ
    // =====================================================
    function openOverlay(overlay) {
        overlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }
    function closeOverlay(overlay) {
        overlay.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    // 背景クリックで閉じる
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeOverlay(overlay);
        });
    });

    // Esc キーで開いているモーダルを閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        document.querySelectorAll('.modal-overlay.is-open').forEach(closeOverlay);
    });

    // =====================================================
    // 電話モーダル
    // =====================================================
    const phoneModal      = document.getElementById('phoneModal');
    const reserveBtn      = document.getElementById('reserveBtn');
    const phoneModalX     = document.getElementById('phoneModalX');
    const phoneModalClose = document.getElementById('phoneModalClose');

    reserveBtn.addEventListener('click', () => openOverlay(phoneModal));
    phoneModalX.addEventListener('click', () => closeOverlay(phoneModal));
    phoneModalClose.addEventListener('click', () => closeOverlay(phoneModal));

    // =====================================================
    // オンライン予約モーダル（3ステップ）
    // =====================================================
    const bookingModal    = document.getElementById('bookingModal');
    const bookingBtn      = document.getElementById('bookingBtn');
    const bookingClose    = document.getElementById('bookingClose');
    const timeClose       = document.getElementById('timeClose');
    const timeBack        = document.getElementById('timeBack');
    const bookingDoneClose = document.getElementById('bookingDoneClose');

    const stepCalendar    = document.getElementById('stepCalendar');
    const stepTime        = document.getElementById('stepTime');
    const stepDone        = document.getElementById('stepDone');

    let selectedDate = null; // { year, month, day }

    // ---- ステップ切り替えヘルパー ----
    function showStep(step) {
        [stepCalendar, stepTime, stepDone].forEach(s => s.hidden = true);
        step.hidden = false;
    }

    // ---- モーダルを開く（カレンダーステップへ） ----
    bookingBtn.addEventListener('click', () => {
        showStep(stepCalendar);
        renderCalendar(currentYear, currentMonth);
        openOverlay(bookingModal);
    });

    // ---- 閉じるボタン ----
    bookingClose.addEventListener('click',     () => closeOverlay(bookingModal));
    timeClose.addEventListener('click',        () => closeOverlay(bookingModal));
    bookingDoneClose.addEventListener('click', () => closeOverlay(bookingModal));

    // ---- 戻るボタン（時間 → カレンダー）----
    timeBack.addEventListener('click', () => showStep(stepCalendar));

    // =====================================================
    // カレンダー生成
    // =====================================================
    const MONTHS_JA = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentYear  = today.getFullYear();
    let currentMonth = today.getMonth(); // 0-indexed

    document.getElementById('calPrev').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar(currentYear, currentMonth);
    });
    document.getElementById('calNext').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar(currentYear, currentMonth);
    });

    function renderCalendar(year, month) {
        document.getElementById('calMonthLabel').textContent =
            year + '年 ' + MONTHS_JA[month];

        const grid       = document.getElementById('calGrid');
        const firstDay   = new Date(year, month, 1).getDay(); // 0=Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        grid.innerHTML = '';

        // 月初の空白セル
        for (let i = 0; i < firstDay; i++) {
            const blank = document.createElement('div');
            blank.className = 'cal-date cal-date--empty';
            grid.appendChild(blank);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date    = new Date(year, month, d);
            const weekday = date.getDay(); // 0=Sun, 1=Mon
            const isPast  = date < today;
            const isMon   = weekday === 1; // 月曜定休
            const isToday = date.getTime() === today.getTime();

            const btn = document.createElement('button');
            btn.className = 'cal-date';
            btn.textContent = d;

            if (weekday === 0) btn.classList.add('cal-date--sunday');
            if (weekday === 6) btn.classList.add('cal-date--saturday');
            if (isToday)       btn.classList.add('cal-date--today');
            if (isPast || isMon) {
                btn.classList.add('cal-date--disabled');
                btn.setAttribute('aria-disabled', 'true');
            } else {
                btn.addEventListener('click', () => onDateSelect(year, month, d, weekday));
            }

            grid.appendChild(btn);
        }
    }

    // =====================================================
    // 日付選択 → 時間ステップへ
    // =====================================================
    const WEEKDAYS_JA = ['日','月','火','水','木','金','土'];
    const LUNCH_TIMES  = ['11:30','12:00','12:30','13:00','13:30','14:00'];
    const DINNER_TIMES = ['17:30','18:00','18:30','19:00','19:30','20:00','20:30','21:00'];

    function onDateSelect(year, month, day, weekday) {
        selectedDate = { year, month, day, weekday };

        // 選択日ラベル
        document.getElementById('selectedDateLabel').textContent =
            year + '年' + MONTHS_JA[month] + day + '日（' + WEEKDAYS_JA[weekday] + '）';

        // 時間スロットを生成
        renderTimeSlots('lunchSlots',  LUNCH_TIMES);
        renderTimeSlots('dinnerSlots', DINNER_TIMES);

        showStep(stepTime);
    }

    function renderTimeSlots(containerId, times) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        times.forEach(t => {
            const btn = document.createElement('button');
            btn.className = 'time-slot';
            btn.textContent = t;
            btn.addEventListener('click', () => onTimeSelect(t));
            container.appendChild(btn);
        });
    }

    // =====================================================
    // 時間選択 → 完了ステップへ
    // =====================================================
    function onTimeSelect(time) {
        const { year, month, day, weekday } = selectedDate;
        document.getElementById('bookingSummary').textContent =
            year + '年' + MONTHS_JA[month] + day + '日（' + WEEKDAYS_JA[weekday] + '）' + time + '〜';
        showStep(stepDone);
    }

    // =====================================================
    // スクロールリビール（IntersectionObserver）
    // =====================================================
    const revealItems = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

        revealItems.forEach(el => observer.observe(el));
    } else {
        revealItems.forEach(el => el.classList.add('is-visible'));
    }

})();
