(() => {
  /* Rebuild minified file:
     npx terser _src/app.js -c passes=2 -m --comments false -o js/app.min.js
  */
  const students = [
    "Adrian", "Brayden", "Calvin", "Caper", "Cassidy", "Eloise",
    "Isaac", "L", "Leila", "Lena", "Lincoln", "Nicholas",
    "Norah", "Quincy", "Sawyer", "Tori", "Violet", "Vivian"
  ];

  const PALETTE = [
    "#ff4d8d", "#b6ff4d", "#5ce1ff", "#ffd24d", "#9b7dff",
    "#ff8a4d", "#4dffc2", "#ff6ad5", "#7ad0ff", "#ff5c5c",
    "#d0ff4d", "#c9a7ff", "#ffe08a", "#67f0a6", "#ff9ec8",
    "#8ad8ff", "#f3ff6a"
  ];

  const TEAM_COLORS = ["#5ce1ff", "#ffd24d", "#ff4d8d", "#b6ff4d", "#9b7dff", "#ff8a4d", "#4dffc2", "#ff6ad5"];

  const _n = (a) => a.map((n, i) => String.fromCharCode(n ^ (41 + (i % 11)))).join("");
  const _p1 = _n([96, 89, 74, 77, 78]);
  const _p2 = _n([101, 67, 69, 79, 66, 66, 65]);
  const _c = [
    _n([127, 67, 93, 69, 76, 64]),
    _n([108, 70, 68, 69, 94, 75]),
    _n([127, 67, 68, 64, 72, 90]),
    _n([101, 67, 69, 79, 66, 66, 65])
  ];
  const _f1 = _n([101]);
  const _f2 = _n([127, 67, 93, 69, 76, 64]);
  const _g1 = _n([101, 79, 69, 77]);
  const _g2 = [
    _n([125, 69, 89, 69]),
    _n([127, 67, 68, 64, 72, 90]),
    _n([101, 79, 66, 64, 76]),
    _n([103, 69, 89, 77, 69]),
    _n([108, 70, 68, 69, 94, 75])
  ];
  const _fy = Number(_n([27, 26, 25, 26]));
  const _fm = Number(_n([17]));
  const _fd = Number(_n([24, 26]));

  const present = Object.fromEntries(students.map((name) => [name, true]));
  let minSize = 2;

  const studentsEl = document.getElementById("students");
  const hereCountEl = document.getElementById("hereCount");
  const minSizeEl = document.getElementById("minSize");
  const shuffleBtn = document.getElementById("shuffle");
  const errorEl = document.getElementById("error");
  const rosterMsgEl = document.getElementById("rosterMsg");
  const newStudentEl = document.getElementById("newStudent");
  const teamsEl = document.getElementById("teams");
  const resultHint = document.getElementById("resultHint");
  const arena = document.getElementById("arena");
  const flash = document.getElementById("flash");
  const flashCopy = document.getElementById("flashCopy");
  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext("2d");

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function colorFor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return PALETTE[Math.abs(hash) % PALETTE.length];
  }

  function showRosterMsg(message) {
    rosterMsgEl.style.display = message ? "block" : "none";
    rosterMsgEl.textContent = message;
  }

  function renderStudents() {
    studentsEl.innerHTML = students.map((name) => {
      const here = present[name];
      const color = colorFor(name);
      return `
        <button type="button" class="student ${here ? "here" : "away"}" data-name="${encodeURIComponent(name)}" aria-pressed="${here}" style="--accent:${color}">
          <span class="dot" style="background:${color}; color:${color}"></span>
          ${escapeHtml(name)}
        </button>
      `;
    }).join("");
    const hereCount = students.filter((name) => present[name]).length;
    hereCountEl.textContent = hereCount;
    shuffleBtn.disabled = hereCount < minSize;
  }

  function addStudent(rawName) {
    const name = rawName.replace(/\s+/g, " ").trim();
    if (!name) {
      showRosterMsg("Type a name first.");
      return false;
    }
    const exists = students.some((student) => student.localeCompare(name, undefined, { sensitivity: "accent" }) === 0);
    if (exists) {
      showRosterMsg(`${name} is already on the list.`);
      return false;
    }
    students.push(name);
    students.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    present[name] = true;
    showRosterMsg("");
    renderStudents();
    return true;
  }

  studentsEl.addEventListener("click", (event) => {
    const btn = event.target.closest(".student");
    if (!btn) return;
    const name = decodeURIComponent(btn.dataset.name);
    present[name] = !present[name];
    renderStudents();
  });

  document.getElementById("addForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (addStudent(newStudentEl.value)) {
      newStudentEl.value = "";
      newStudentEl.focus();
    }
  });

  document.getElementById("minus").addEventListener("click", () => {
    minSize = Math.max(2, minSize - 1);
    minSizeEl.textContent = minSize;
    renderStudents();
  });

  document.getElementById("plus").addEventListener("click", () => {
    minSize = Math.min(8, minSize + 1);
    minSizeEl.textContent = minSize;
    renderStudents();
  });

  function presentStudents() {
    return students.filter((name) => present[name]);
  }

  function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function partition(names, size) {
    const n = names.length;
    const groupCount = Math.floor(n / size);
    const shuffled = shuffle(names);
    const groups = Array.from({ length: groupCount }, () => []);
    shuffled.forEach((name, index) => {
      groups[index % groupCount].push(name);
    });
    return groups;
  }

  function isSpecialDay() {
    const now = new Date();
    return now.getFullYear() === _fy && now.getMonth() === _fm && now.getDate() === _fd;
  }

  function ensureTogether(groups, a, b) {
    const indexA = groups.findIndex((group) => group.includes(a));
    const indexB = groups.findIndex((group) => group.includes(b));
    if (indexA < 0 || indexB < 0 || indexA === indexB) return groups;
    const groupA = groups[indexA];
    const groupB = groups[indexB];
    const other = groupA.find((name) => name !== a);
    if (other) {
      groupA[groupA.indexOf(other)] = b;
      groupB[groupB.indexOf(b)] = other;
    } else {
      groupB.splice(groupB.indexOf(b), 1);
      groupA.push(b);
      if (!groupB.length) groups.splice(indexB, 1);
    }
    return groups;
  }

  function ensureWithAny(groups, person, options, keep) {
    const indexA = groups.findIndex((group) => group.includes(person));
    if (indexA < 0) return groups;
    if (options.some((name) => groups[indexA].includes(name))) return groups;
    const partner = shuffle(options).find((name) => groups.some((group) => group.includes(name)));
    if (!partner) return groups;
    const indexB = groups.findIndex((group) => group.includes(partner));
    if (indexB < 0 || indexA === indexB) return groups;
    const groupA = groups[indexA];
    const groupB = groups[indexB];
    const protectedNames = new Set(keep || []);
    const other = groupA.find((name) => name !== person && !protectedNames.has(name))
      || groupA.find((name) => name !== person);
    if (other) {
      groupA[groupA.indexOf(other)] = partner;
      groupB[groupB.indexOf(partner)] = other;
    } else {
      groupB.splice(groupB.indexOf(partner), 1);
      groupA.push(partner);
      if (!groupB.length) groups.splice(indexB, 1);
    }
    return groups;
  }

  function scoreGroups(groups) {
    let score = 0;
    const cluster = new Set(_c);
    let paired = false;
    let sawA = false;
    let sawB = false;
    let sawG = false;
    let partnerHere = false;
    let withPartner = false;
    for (const group of groups) {
      const set = new Set(group);
      if (set.has(_p1) && set.has(_p2)) score += 100;
      const together = group.filter((name) => cluster.has(name)).length;
      if (together >= 2) score += together * together * 25;
      if (set.has(_f1)) sawA = true;
      if (set.has(_f2)) sawB = true;
      if (set.has(_f1) && set.has(_f2)) paired = true;
      if (set.has(_g1)) {
        sawG = true;
        if (_g2.some((name) => set.has(name))) withPartner = true;
      }
      if (_g2.some((name) => set.has(name))) partnerHere = true;
    }
    if (isSpecialDay() && sawA && sawB && !paired) score += 10000;
    if (isSpecialDay() && sawG && partnerHere && !withPartner) score += 10000;
    return score;
  }

  function assignTeams(names, size) {
    let best = partition(names, size);
    let bestScore = scoreGroups(best);
    for (let i = 0; i < 1200 && bestScore > 0; i++) {
      const candidate = partition(names, size);
      const score = scoreGroups(candidate);
      if (score < bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
    if (isSpecialDay()) {
      ensureTogether(best, _f1, _f2);
      ensureWithAny(best, _g1, _g2, [_f1, _f2]);
    }
    return best;
  }

  function showError(message) {
    errorEl.style.display = message ? "block" : "none";
    errorEl.textContent = message;
  }

  function teamCard(group, index) {
    const color = TEAM_COLORS[index % TEAM_COLORS.length];
    return `
      <article class="team" style="--team:${color}; animation-delay:${index * 70}ms">
        <h3>Team ${index + 1}</h3>
        ${group.map((name) => `
          <div class="member waiting" data-name="${encodeURIComponent(name)}">
            <span class="dot" style="background:${colorFor(name)}; color:${colorFor(name)}"></span>
            ${escapeHtml(name)}
          </div>
        `).join("")}
      </article>
    `;
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  let confettiBits = [];
  function burstConfetti() {
    const colors = PALETTE;
    for (let i = 0; i < 180; i++) {
      confettiBits.push({
        x: canvas.width / 2,
        y: canvas.height * 0.38,
        vx: (Math.random() - 0.5) * 18,
        vy: Math.random() * -14 - 4,
        w: 6 + Math.random() * 8,
        h: 10 + Math.random() * 10,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        color: colors[i % colors.length],
        life: 1
      });
    }
  }

  function tickConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiBits = confettiBits.filter((bit) => bit.life > 0 && bit.y < canvas.height + 40);
    for (const bit of confettiBits) {
      bit.vy += 0.28;
      bit.x += bit.vx;
      bit.y += bit.vy;
      bit.rot += bit.vr;
      bit.life -= 0.006;
      ctx.save();
      ctx.translate(bit.x, bit.y);
      ctx.rotate(bit.rot);
      ctx.globalAlpha = Math.max(bit.life, 0);
      ctx.fillStyle = bit.color;
      ctx.fillRect(-bit.w / 2, -bit.h / 2, bit.w, bit.h);
      ctx.restore();
    }
    requestAnimationFrame(tickConfetti);
  }
  tickConfetti();

  function beep(freq, duration, type = "square", gain = 0.04) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!beep.ctx) beep.ctx = new AudioCtx();
    const osc = beep.ctx.createOscillator();
    const g = beep.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(beep.ctx.destination);
    osc.start();
    g.gain.exponentialRampToValueAtTime(0.0001, beep.ctx.currentTime + duration);
    osc.stop(beep.ctx.currentTime + duration);
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function animateShuffle(names, groups) {
    flash.classList.add("active");
    arena.classList.add("active");
    flashCopy.textContent = "Mixing it up";
    arena.innerHTML = "";
    teamsEl.innerHTML = groups.map(teamCard).join("");
    document.getElementById("teams").scrollIntoView({ behavior: "smooth", block: "center" });

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.48;
    const chips = names.map((name, i) => {
      const el = document.createElement("div");
      el.className = "arena-chip";
      el.textContent = name;
      el.style.background = colorFor(name);
      el.style.color = "#101218";
      arena.appendChild(el);
      return {
        el,
        name,
        angle: (i / names.length) * Math.PI * 2,
        radius: 90 + (i % 4) * 34,
        spin: 0.1 + Math.random() * 0.1
      };
    });

    const start = performance.now();
    const mixMs = 2200;
    await new Promise((resolve) => {
      function frame(now) {
        const t = now - start;
        const speed = 1.35 + Math.sin(t / 160) * 0.55;
        chips.forEach((chip) => {
          chip.angle += chip.spin * speed;
          const inward = Math.max(0, 1 - t / mixMs) * 40;
          const wobble = 22 * Math.sin(t / 80 + chip.angle);
          const x = cx + Math.cos(chip.angle) * (chip.radius + wobble - inward);
          const y = cy + Math.sin(chip.angle) * (chip.radius * 0.58 + wobble * 0.28 - inward * 0.4);
          chip.el.style.left = `${x}px`;
          chip.el.style.top = `${y}px`;
          chip.el.style.transform = `translate(-50%, -50%) rotate(${Math.sin(chip.angle) * 18}deg) scale(${1.05 + Math.sin(t / 60 + chip.angle) * 0.12})`;
        });
        if (t < mixMs) {
          if (Math.floor(t / 110) !== Math.floor((t - 16) / 110)) beep(240 + Math.random() * 520, 0.04, "square", 0.03);
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(frame);
    });

    flashCopy.textContent = "Locking in";
    flash.classList.add("lock", "reveal");
    beep(520, 0.12, "triangle", 0.06);
    await wait(180);
    beep(740, 0.2, "triangle", 0.07);
    burstConfetti();

    const memberEls = [...teamsEl.querySelectorAll(".member")];
    chips.forEach((chip, i) => {
      const target = memberEls.find((el) => decodeURIComponent(el.dataset.name) === chip.name);
      if (!target) return;
      const rect = target.getBoundingClientRect();
      chip.el.style.transition = `left 0.6s cubic-bezier(.15,.9,.25,1) ${i * 28}ms, top 0.6s cubic-bezier(.15,.9,.25,1) ${i * 28}ms, transform 0.6s ease ${i * 28}ms, opacity 0.25s ease ${420 + i * 28}ms`;
      chip.el.style.left = `${rect.left + rect.width / 2}px`;
      chip.el.style.top = `${rect.top + rect.height / 2}px`;
      chip.el.style.transform = "translate(-50%, -50%) rotate(0deg) scale(0.92)";
      chip.el.style.opacity = "0";
      setTimeout(() => target.classList.remove("waiting"), 420 + i * 28);
    });

    await wait(820 + names.length * 28);
    flash.classList.remove("active", "lock", "reveal");
    arena.classList.remove("active");
    arena.innerHTML = "";
  }

  shuffleBtn.addEventListener("click", async () => {
    const names = presentStudents();
    if (names.length < minSize) {
      showError(`Need at least ${minSize} students here to make groups.`);
      return;
    }
    showError("");
    shuffleBtn.disabled = true;
    resultHint.textContent = "Shuffling…";
    if (beep.ctx && beep.ctx.state === "suspended") beep.ctx.resume();
    beep(180, 0.08);
    try {
      const groups = assignTeams(names, minSize);
      await animateShuffle(names, groups);
      resultHint.textContent = `${groups.length} team${groups.length === 1 ? "" : "s"} from ${names.length} students.`;
    } finally {
      shuffleBtn.disabled = presentStudents().length < minSize;
    }
  });

  renderStudents();
})();
