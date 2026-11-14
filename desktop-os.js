// Matrix OS Desktop Window Manager
const APPS = {
    about: {
        id: 'about',
        title: 'About Module',
        tabLabel: 'About',
        icon: '🤖',
        url: 'about.html'
    },
    basics: {
        id: 'basics',
        title: 'Basics Module',
        tabLabel: 'Basics',
        icon: '🛸',
        url: 'basics.html'
    },
    calc: {
        id: 'calc',
        title: 'Calculator Module',
        tabLabel: 'Calc',
        icon: '📱',
        url: 'calc.html'
    },
    contact: {
        id: 'contact',
        title: 'Contact Module',
        tabLabel: 'Contact',
        icon: '📠',
        url: 'contact.html'
    },
    projects: {
        id: 'projects',
        title: 'Projects Module',
        tabLabel: 'Projects',
        icon: '🚀',
        url: 'projects.html'
    },
    software: {
        id: 'software',
        title: 'Software Module',
        tabLabel: 'Software',
        icon: '💻',
        url: 'software.html'
    },
    trades: {
        id: 'trades',
        title: 'Trades Module',
        tabLabel: 'Trades',
        icon: '📈',
        url: 'trades.html'
    },
    vip: {
        id: 'vip',
        title: 'VIP Module',
        tabLabel: 'VIP',
        icon: '💎',
        url: 'vip.html'
    },
    games: {
        id: 'games',
        title: 'Games Module',
        tabLabel: 'Games',
        icon: '🎮',
        url: 'games.html'
    }
};

const openWindows = new Map();
let topZIndex = 40;
let windowOffsetStep = 0;
let currentLanguage = 'EN'; // Default language EN
let publicIpAddress = 'Fetching IP...';


const localizedAppLabels = {
    EN: {
        about: 'About',
        basics: 'Basics',
        calc: 'Calculator',
        contact: 'Contact',
        games: 'Games',
        projects: 'Projects',
        software: 'Software',
        trades: 'Trades',
        vip: 'VIP'
    },
    LT: {
        about: 'Apie mane',
        basics: 'Pagrindai',
        calc: 'Skaičiuotuvas',
        contact: 'Kontaktai',
        games: 'Žaidimai',
        projects: 'Projektai',
        software: 'Programos',
        trades: 'Sandoriai',
        vip: 'VIP'
    },
    RU: {
        about: 'Обо мне',
        basics: 'Основы',
        calc: 'Калькулятор',
        contact: 'Контакты',
        games: 'Игры',
        projects: 'Проекты',
        software: 'Программы',
        trades: 'Сделки',
        vip: 'VIP'
    }
};

function updatePageLanguage(lang) {
    const labels = localizedAppLabels[lang] || localizedAppLabels['EN'];

    // Update desktop icon labels
    document.querySelectorAll('.desktop-icons .icon[data-app]').forEach(icon => {
        const appId = icon.dataset.app;
        const labelEl = icon.querySelector('.icon-label');
        if (labelEl && labels[appId]) {
            labelEl.textContent = labels[appId];
        }
    });

    // Update START menu items while preserving start-icon
    document.querySelectorAll('.start-items .start-item[data-app]').forEach(item => {
        const appId = item.dataset.app;
        const iconSpan = item.querySelector('.start-icon');
        if (labels[appId]) {
            const iconHtml = iconSpan ? iconSpan.outerHTML : '';
            item.innerHTML = iconHtml + labels[appId];
        }
    });

    // Update APPS metadata and open windows/taskbar tabs
    Object.keys(APPS).forEach(appId => {
        if (labels[appId]) {
            APPS[appId].tabLabel = labels[appId];
            APPS[appId].title = labels[appId];
        }
    });

    openWindows.forEach((entry, appId) => {
        const app = APPS[appId];
        if (!app) return;
        const titleEl = entry.winEl.querySelector('.window-title');
        if (titleEl) {
            titleEl.innerHTML = `<span>${app.icon}</span><span>${app.title}</span>`;
        }
        if (entry.tabBtn) {
            entry.tabBtn.innerHTML = `<span>${app.icon}</span><span>${app.tabLabel}</span>`;
        }
    });
}

const localizedCalendarStrings = {
    EN: {
        mondayFirst: false,
        days: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
        weekdaysFull: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        todayLabel: 'Today'
    },
    LT: {
        mondayFirst: true,
        days: ['Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št', 'Sk'],
        weekdaysFull: ['Sekmadienis', 'Pirmadienis', 'Antradienis', 'Trečiadienis', 'Ketvirtadienis', 'Penktadienis', 'Šeštadienis'],
        months: ['Sausis', 'Vasaris', 'Kovas', 'Balandis', 'Gegužė', 'Birželis', 'Liepa', 'Rugpjūtis', 'Rugsėjis', 'Spalis', 'Lapkritis', 'Gruodis'],
        todayLabel: 'Šiandien'
    },
    RU: {
        mondayFirst: true,
        days: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
        weekdaysFull: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
        months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
        todayLabel: 'Сегодня'
    }
};

let isAudioMuted = false;
let connectSoundPlayed = false;

function playSound(soundName) {
    const audioMap = {
        connect: document.getElementById('audioConnect'),
        click: document.getElementById('audioClick'),
        speaker: document.getElementById('audioSpeaker')
    };
    const el = audioMap[soundName];
    if (!el) return;
    if (soundName !== 'speaker' && isAudioMuted) return;

    try {
        el.loop = false;
        el.currentTime = 0;
        const playPromise = el.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Autoplay prevented until user gesture or file not yet placed in media/
            });
        }
    } catch (err) {
        // Ignore if audio file not yet added
    }
}

function initializeAudioSystem() {
    const connectEl = document.getElementById('audioConnect');
    if (!connectEl) return;
    connectEl.loop = false;

    const triggerConnectOnce = () => {
        if (connectSoundPlayed || isAudioMuted) return;
        connectEl.currentTime = 0;
        const p = connectEl.play();
        if (p !== undefined) {
            p.then(() => {
                connectSoundPlayed = true;
                window.removeEventListener('pointerdown', triggerConnectOnce);
                window.removeEventListener('keydown', triggerConnectOnce);
            }).catch(() => {
                // Will retry on first user interaction if browser blocks initial autoplay
            });
        }
    };

    // Attempt immediate one-time playback on site load
    triggerConnectOnce();

    // Fallback for browsers that require a user gesture before playing audio
    window.addEventListener('pointerdown', triggerConnectOnce);
    window.addEventListener('keydown', triggerConnectOnce);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeAudioSystem();
    initializeDynamicBackground();
    initializeCustomCursor();
    initializeTaskbar();
    fetchPublicIp();
    updatePageLanguage(currentLanguage);
    initializeCalendar();
    updateTime();
    setInterval(updateTime, 1000);

    // Bind all desktop icons and START menu items to open inside index.html window containers
    document.querySelectorAll('[data-app]').forEach(trigger => {
        trigger.addEventListener('click', e => {
            e.preventDefault();
            const appId = trigger.dataset.app;
            openAppWindow(appId);
            const startMenu = document.getElementById('startMenu');
            const startButton = document.getElementById('startButton');
            if (startMenu) startMenu.classList.add('hidden');
            if (startButton) startButton.classList.remove('active');
        });
    });

    // Play click sound on non-app links (such as Restart OS)
    document.querySelectorAll('a:not([data-app])').forEach(link => {
        link.addEventListener('click', () => {
            playSound('click');
        });
    });

    // Listen for messages from child iframes
    window.addEventListener('message', e => {
        if (e.data && e.data.type === 'OPEN_APP' && APPS[e.data.appId]) {
            openAppWindow(e.data.appId);
        }
    });
});

function fetchPublicIp() {
    fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => {
            publicIpAddress = data.ip;
        })
        .catch(() => {
            publicIpAddress = '127.0.0.1 (LAN)';
        });
}

function openAppWindow(appId) {
    const app = APPS[appId];
    if (!app) return;
    playSound('click');

    if (openWindows.has(appId)) {
        const entry = openWindows.get(appId);
        entry.winEl.classList.remove('hidden');
        entry.minimized = false;
        focusWindow(appId);
        return;
    }

    const winEl = document.createElement('div');
    winEl.className = 'window focused';
    winEl.dataset.appId = appId;

    const baseLeft = 135 + (windowOffsetStep % 6) * 32;
    const baseTop = 36 + (windowOffsetStep % 6) * 28;
    windowOffsetStep++;

    winEl.style.left = Math.min(baseLeft, Math.max(20, window.innerWidth - 840)) + 'px';
    winEl.style.top = Math.min(baseTop, Math.max(20, window.innerHeight - 600)) + 'px';
    winEl.style.zIndex = ++topZIndex;

    winEl.innerHTML = `
        <div class="window-header">
            <div class="window-title"><span>${app.icon}</span><span>${app.title}</span></div>
            <div class="window-controls">
                <button class="control minimize" title="Minimize" aria-label="Minimize">
                    <svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 5h10v1H0z" fill="currentColor"/></svg>
                </button>
                <button class="control maximize" title="Maximize" aria-label="Maximize">
                    <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1v8h8V1H1zm1 1h6v6H2V2z" fill="currentColor"/></svg>
                </button>
                <button class="control close" title="Close" aria-label="Close">
                    <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.4.7L5 4.3 8.6.7l.7.7L5.7 5l3.6 3.6-.7.7L5 5.7 1.4 9.3l-.7-.7L4.3 5 .7 1.4l.7-.7z" fill="currentColor"/></svg>
                </button>
            </div>
        </div>
        <div class="window-content iframe-mode">
            <iframe class="window-iframe" src="${app.url}" title="${app.title}"></iframe>
        </div>
    `;

    const minBtn = winEl.querySelector('.control.minimize');
    const maxBtn = winEl.querySelector('.control.maximize');
    const closeBtn = winEl.querySelector('.control.close');

    minBtn.addEventListener('click', e => {
        e.stopPropagation();
        minimizeAppWindow(appId);
    });

    maxBtn.addEventListener('click', e => {
        e.stopPropagation();
        const isMax = winEl.classList.toggle('maximized');
        maxBtn.title = isMax ? 'Restore Down' : 'Maximize';
        maxBtn.innerHTML = isMax
            ? '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M3 1v2H1v6h6V7h2V1H3zm1 1h4v4H7V3H4V2zM2 4h4v4H2V4z" fill="currentColor"/></svg>'
            : '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1v8h8V1H1zm1 1h6v6H2V2z" fill="currentColor"/></svg>';
        focusWindow(appId);
    });

    closeBtn.addEventListener('click', e => {
        e.stopPropagation();
        closeAppWindow(appId);
    });

    winEl.addEventListener('mousedown', () => focusWindow(appId));

    setupWindowDrag(winEl, appId);
    setupWindowResize(winEl, appId);

    document.getElementById('windowsContainer').appendChild(winEl);

    const tabBtn = document.createElement('button');
    tabBtn.className = 'taskbar-item active-tab';
    tabBtn.dataset.appId = appId;
    tabBtn.innerHTML = `<span>${app.icon}</span><span>${app.tabLabel}</span>`;
    tabBtn.addEventListener('click', () => handleTaskbarClick(appId));

    document.getElementById('taskbarItems').appendChild(tabBtn);

    openWindows.set(appId, { winEl, tabBtn, minimized: false });
    updateDesktopIconIndicators();
    focusWindow(appId);
}

function focusWindow(appId) {
    openWindows.forEach((entry, id) => {
        if (id === appId && !entry.minimized) {
            entry.winEl.style.zIndex = ++topZIndex;
            entry.winEl.classList.add('focused');
            entry.tabBtn.classList.add('active-tab');
            entry.tabBtn.classList.remove('minimized-tab');
        } else {
            entry.winEl.classList.remove('focused');
            entry.tabBtn.classList.remove('active-tab');
            if (entry.minimized) entry.tabBtn.classList.add('minimized-tab');
        }
    });
}

function minimizeAppWindow(appId) {
    const entry = openWindows.get(appId);
    if (!entry) return;
    entry.winEl.classList.add('hidden');
    entry.winEl.classList.remove('focused');
    entry.minimized = true;
    entry.tabBtn.classList.remove('active-tab');
    entry.tabBtn.classList.add('minimized-tab');

    let nextTopId = null;
    let maxZ = -1;
    openWindows.forEach((item, id) => {
        if (!item.minimized) {
            const z = parseInt(item.winEl.style.zIndex || '0', 10);
            if (z > maxZ) {
                maxZ = z;
                nextTopId = id;
            }
        }
    });
    if (nextTopId) focusWindow(nextTopId);
}

function handleTaskbarClick(appId) {
    const entry = openWindows.get(appId);
    if (!entry) return;

    if (entry.minimized) {
        entry.winEl.classList.remove('hidden');
        entry.minimized = false;
        focusWindow(appId);
    } else if (entry.winEl.classList.contains('focused')) {
        minimizeAppWindow(appId);
    } else {
        focusWindow(appId);
    }
}

function closeAppWindow(appId) {
    const entry = openWindows.get(appId);
    if (!entry) return;
    playSound('click');
    entry.winEl.remove();
    entry.tabBtn.remove();
    openWindows.delete(appId);
    updateDesktopIconIndicators();

    let nextTopId = null;
    let maxZ = -1;
    openWindows.forEach((item, id) => {
        if (!item.minimized) {
            const z = parseInt(item.winEl.style.zIndex || '0', 10);
            if (z > maxZ) {
                maxZ = z;
                nextTopId = id;
            }
        }
    });
    if (nextTopId) focusWindow(nextTopId);
}

function updateDesktopIconIndicators() {
    document.querySelectorAll('.desktop-icons .icon[data-app]').forEach(iconEl => {
        iconEl.classList.toggle('is-open', openWindows.has(iconEl.dataset.app));
    });
}

function setupWindowDrag(winEl, appId) {
    const hdr = winEl.querySelector('.window-header');
    let dragging = false;
    let offset = { x: 0, y: 0 };

    hdr.addEventListener('mousedown', e => {
        if (e.target.closest('.window-controls') || winEl.classList.contains('maximized')) return;
        focusWindow(appId);
        dragging = true;
        const rect = winEl.getBoundingClientRect();
        offset.x = e.clientX - rect.left;
        offset.y = e.clientY - rect.top;
        document.querySelectorAll('.window-iframe').forEach(ifr => ifr.style.pointerEvents = 'none');
        e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        const x = Math.max(0, Math.min(window.innerWidth - winEl.offsetWidth, e.clientX - offset.x));
        const y = Math.max(0, Math.min(window.innerHeight - winEl.offsetHeight - 40, e.clientY - offset.y));
        winEl.style.left = x + 'px';
        winEl.style.top = y + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (dragging) {
            dragging = false;
            document.querySelectorAll('.window-iframe').forEach(ifr => ifr.style.pointerEvents = 'auto');
        }
    });
}

function setupWindowResize(winEl, appId) {
    const wrap = document.createElement('div');
    wrap.className = 'resizer-wrapper';
    ['bottom-right', 'bottom-left', 'top-right', 'top-left'].forEach(dir => {
        const r = document.createElement('div');
        r.className = `resizer ${dir}`;
        r.dataset.direction = dir;
        wrap.appendChild(r);
    });
    winEl.appendChild(wrap);

    let resizing = null;
    wrap.addEventListener('mousedown', e => {
        const handle = e.target;
        if (!handle.classList.contains('resizer') || winEl.classList.contains('maximized')) return;
        focusWindow(appId);
        resizing = {
            dir: handle.dataset.direction,
            sx: e.clientX,
            sy: e.clientY,
            sw: winEl.offsetWidth,
            sh: winEl.offsetHeight,
            sl: winEl.offsetLeft,
            st: winEl.offsetTop
        };
        document.querySelectorAll('.window-iframe').forEach(ifr => ifr.style.pointerEvents = 'none');
        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener('mousemove', e => {
        if (!resizing) return;
        const { dir, sx, sy, sw, sh, sl, st } = resizing;
        let nw = sw, nh = sh, nl = sl, nt = st;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (dir.includes('right')) nw = Math.max(360, sw + dx);
        if (dir.includes('left')) { nw = Math.max(360, sw - dx); nl = sl + dx; }
        if (dir.includes('bottom')) nh = Math.max(280, sh + dy);
        if (dir.includes('top')) { nh = Math.max(280, sh - dy); nt = st + dy; }
        winEl.style.width = nw + 'px';
        winEl.style.height = nh + 'px';
        winEl.style.left = nl + 'px';
        winEl.style.top = nt + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (resizing) {
            resizing = null;
            document.querySelectorAll('.window-iframe').forEach(ifr => ifr.style.pointerEvents = 'auto');
        }
    });
}

// Dynamic Node-Network Canvas Background
function initializeDynamicBackground() {
    const cv = document.getElementById('bg-canvas');
    if (!cv) return;
    const cx = cv.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W, H, N = [], P = [], M = { x: -999, y: -999 }, D = 135;

    function rs() {
        const r = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        cv.width = W * r;
        cv.height = H * r;
        cv.style.width = W + 'px';
        cv.style.height = H + 'px';
        cx.setTransform(r, 0, 0, r, 0, 0);
        const n = Math.max(28, Math.min(100, Math.floor(W * H / 15000)));
        N = [];
        for (let i = 0; i < n; i++) {
            const h = Math.random() * 6, x = 255 * (1 - Math.abs(h % 2 - 1)) | 0;
            const [rCol, gCol, bCol] = h < 1 ? [255, x, 0] : h < 2 ? [x, 255, 0] : h < 3 ? [0, 255, x] : h < 4 ? [0, x, 255] : h < 5 ? [x, 0, 255] : [255, 0, x];
            N.push({
                x: Math.random() * W,
                y: Math.random() * H,
                vx: (Math.random() - 0.5) * 0.55,
                vy: (Math.random() - 0.5) * 0.55,
                c: rCol + ',' + gCol + ',' + bCol
            });
        }
    }

    window.addEventListener('resize', rs);
    window.addEventListener('mousemove', e => { M.x = e.clientX; M.y = e.clientY; });
    window.addEventListener('touchmove', e => {
        if (e.touches.length > 0) { M.x = e.touches[0].clientX; M.y = e.touches[0].clientY; }
    }, { passive: true });

    function f(still) {
        still = still === true;
        cx.clearRect(0, 0, W, H);
        const L = [];
        let i, j, a, b, d;

        for (i = 0; i < N.length; i++) {
            a = N[i];
            if (!still) {
                a.x += a.vx;
                a.y += a.vy;
                if (a.x < 0 || a.x > W) a.vx *= -1;
                if (a.y < 0 || a.y > H) a.vy *= -1;
                const dx = a.x - M.x, dy = a.y - M.y;
                d = Math.hypot(dx, dy);
                if (d < 150 && d > 0) {
                    a.x += dx / d * (150 - d) / 150 * 0.9;
                    a.y += dy / d * (150 - d) / 150 * 0.9;
                }
            }
        }

        for (i = 0; i < N.length; i++) {
            for (j = i + 1; j < N.length; j++) {
                a = N[i]; b = N[j];
                d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d < D) {
                    L.push([a, b]);
                    cx.strokeStyle = 'rgba(' + a.c + ',' + (1 - d / D) * 0.55 + ')';
                    cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
                }
            }
        }

        for (i = 0; i < N.length; i++) {
            a = N[i];
            d = Math.hypot(a.x - M.x, a.y - M.y);
            if (d < 170) {
                cx.strokeStyle = 'rgba(252,238,10,' + (1 - d / 170) * 0.7 + ')';
                cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(M.x, M.y); cx.stroke();
            }
        }

        cx.shadowBlur = 10;
        for (i = 0; i < N.length; i++) {
            a = N[i];
            cx.fillStyle = cx.shadowColor = 'rgb(' + a.c + ')';
            cx.beginPath(); cx.arc(a.x, a.y, 1.8, 0, 6.283); cx.fill();
        }

        if (!still) {
            if (L.length && Math.random() < 0.12 && P.length < 26) {
                const l = L[Math.random() * L.length | 0];
                P.push({ a: l[0], b: l[1], t: 0 });
            }
            for (i = P.length - 1; i >= 0; i--) {
                const p = P[i]; p.t += 0.02;
                if (p.t >= 1) { P.splice(i, 1); continue; }
                cx.fillStyle = '#fff'; cx.shadowColor = '#00f0ff'; cx.shadowBlur = 16;
                cx.beginPath(); cx.arc(p.a.x + (p.b.x - p.a.x) * p.t, p.a.y + (p.b.y - p.a.y) * p.t, 2.4, 0, 6.283); cx.fill();
            }
        }

        cx.shadowBlur = 0;
        if (!still) requestAnimationFrame(f);
    }

    rs();
    reduce ? f(true) : requestAnimationFrame(f);
}

// Custom Cursor
function initializeCustomCursor() {
    const cursor = document.getElementById('customCursor');
    if (!cursor) return;
    document.addEventListener('mousemove', e => {
        cursor.style.left = (e.clientX - 2) + 'px';
        cursor.style.top = (e.clientY - 2) + 'px';
    });
}

// Taskbar Controls
function initializeTaskbar() {
    const startButton = document.getElementById('startButton');
    const startMenu = document.getElementById('startMenu');
    if (startButton && startMenu) {
        startButton.addEventListener('click', e => {
            e.stopPropagation();
            startMenu.classList.toggle('hidden');
            startButton.classList.toggle('active');
        });
        document.addEventListener('click', e => {
            if (!startButton.contains(e.target) && !startMenu.contains(e.target)) {
                startMenu.classList.add('hidden');
                startButton.classList.remove('active');
            }
        });
    }

    const langBtn = document.getElementById('langBtn');
    const langDropdown = document.getElementById('langDropdown');
    if (langBtn && langDropdown) {
        langBtn.addEventListener('click', e => {
            e.stopPropagation();
            langDropdown.classList.toggle('hidden');
        });
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.addEventListener('click', () => {
                currentLanguage = opt.dataset.lang;
                document.getElementById('currentLangDisplay').textContent = currentLanguage;
                document.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                langDropdown.classList.add('hidden');
                updatePageLanguage(currentLanguage);
    initializeCalendar(); // Re-render calendar in selected language
                updateTime(); // Update clock immediately
                showNotification(`Switched language to ${currentLanguage}`);
            });
        });
        document.addEventListener('click', e => {
            if (!langBtn.contains(e.target) && !langDropdown.contains(e.target)) {
                langDropdown.classList.add('hidden');
            }
        });
    }

    const networkToggle = document.getElementById('networkToggle');
    if (networkToggle) {
        networkToggle.addEventListener('click', () => {
            showNotification(`Public IP: ${publicIpAddress}`);
        });
    }

    const audioToggle = document.getElementById('audioToggle');
    if (audioToggle) {
        audioToggle.addEventListener('click', () => {
            isAudioMuted = !isAudioMuted;
            audioToggle.textContent = isAudioMuted ? '🔇' : '🔊';
            playSound('speaker');
            showNotification(isAudioMuted ? 'Audio muted' : 'Audio enabled');
        });
    }

    const taskbarTimeContainer = document.getElementById('taskbarTimeContainer');
    const calendarDropdown = document.getElementById('calendarDropdown');
    if (taskbarTimeContainer && calendarDropdown) {
        taskbarTimeContainer.addEventListener('click', e => {
            e.stopPropagation();
            playSound('click');
            updatePageLanguage(currentLanguage);
    initializeCalendar();
            calendarDropdown.classList.toggle('hidden');
        });
        document.addEventListener('click', e => {
            if (!taskbarTimeContainer.contains(e.target) && !calendarDropdown.contains(e.target)) {
                calendarDropdown.classList.add('hidden');
            }
        });
    }
}

let notificationTimer = null;
function showNotification(msg) {
    const note = document.getElementById('notification');
    if (!note) return;
    document.getElementById('notificationMessage').textContent = msg;
    note.classList.remove('hidden');
    
    if (notificationTimer) clearTimeout(notificationTimer);
    // Automatic disappear after 7 seconds (7000ms)
    notificationTimer = setTimeout(() => {
        note.classList.add('hidden');
    }, 7000);
}

function hideNotification() {
    const note = document.getElementById('notification');
    if (note) {
        note.classList.add('hidden');
        if (notificationTimer) clearTimeout(notificationTimer);
    }
}

function updateTime() {
    const now = new Date();
    const tEl = document.getElementById('currentTime');
    const dEl = document.getElementById('currentDate');
    if (!tEl || !dEl) return;

    if (currentLanguage === 'LT') {
        // LIT format: 2026-11-12 time 14:57 (24h)
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        dEl.textContent = `${yyyy}-${mm}-${dd}`;
        tEl.textContent = `${timeStr}`;
    } else if (currentLanguage === 'RU') {
        // RUS format: DD.MM.YYYY, HH:MM:SS
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        dEl.textContent = `${dd}.${mm}.${yyyy}`;
        tEl.textContent = `${timeStr}`;
    } else {
        // EN format: MM/DD/YYYY, hh:mm AM/PM
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const yyyy = now.getFullYear();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        dEl.textContent = `${mm}/${dd}/${yyyy}`;
        tEl.textContent = `${timeStr}`;
    }
}

function initializeCalendar() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const rawFirst = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    
    const datesEl = document.querySelector('.calendar-dates');
    const daysHeaderEl = document.getElementById('calendarDaysHeader');
    const myEl = document.querySelector('.month-year');
    const dropdownEl = document.getElementById('calendarDropdown');
    if (!datesEl || !daysHeaderEl || !myEl) return;

    // Load localized calendar strings
    const langData = localizedCalendarStrings[currentLanguage] || localizedCalendarStrings['EN'];
    
    // Render days of week header
    daysHeaderEl.innerHTML = langData.days.map(d => `<span>${d}</span>`).join('');
    
    // Render month and year
    myEl.textContent = `${langData.months[month]} ${year}`;

    // Calculate leading empty cells (Monday-first for LIT/RUS, Sunday-first for EN)
    const offset = langData.mondayFirst ? (rawFirst === 0 ? 6 : rawFirst - 1) : rawFirst;

    datesEl.innerHTML = '';
    for (let i = 0; i < offset; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.style.visibility = 'hidden';
        datesEl.appendChild(emptyCell);
    }
    for (let d = 1; d <= days; d++) {
        const div = document.createElement('div');
        div.textContent = d;
        if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            div.classList.add('today');
            div.title = `${langData.todayLabel}: ${langData.weekdaysFull[today.getDay()]}`;
        }
        datesEl.appendChild(div);
    }

    // Add or update localized footer info inside calendar dropdown
    if (dropdownEl) {
        let footerEl = dropdownEl.querySelector('.calendar-footer-info');
        if (!footerEl) {
            footerEl = document.createElement('div');
            footerEl.className = 'calendar-footer-info';
            footerEl.style.cssText = 'margin-top:0.75rem;padding-top:0.5rem;border-top:1px solid rgba(255,255,255,0.12);font-family:"JetBrains Mono",monospace;font-size:0.74rem;color:#06b6d4;text-align:center;';
            dropdownEl.appendChild(footerEl);
        }
        const weekdayName = langData.weekdaysFull[today.getDay()];
        footerEl.textContent = `${langData.todayLabel}: ${weekdayName}, ${year}-${String(month + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
}
