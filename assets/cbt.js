// CBT 모의고사: 한 문제씩 풀이, 제한 시간, 답안 표기란, 제출 후 채점·해설.
// 문제 데이터는 페이지의 <script id="exam-data" type="application/json">에 있다.
(function () {
  const exam = JSON.parse(document.getElementById('exam-data').textContent);
  const qs = exam.questions;
  const N = qs.length;
  const marks = ['①', '②', '③', '④'];
  const KEY = 'com2-cbt-' + exam.id;
  const $ = id => document.getElementById(id);

  let answers, current, remaining, timer = null;

  const store = {
    load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } },
    save() { try { localStorage.setItem(KEY, JSON.stringify({ answers, current, remaining })); } catch (e) {} },
    clear() { try { localStorage.removeItem(KEY); } catch (e) {} },
  };

  // ---------- 시작 화면 ----------
  const saved = store.load();
  if (saved && Array.isArray(saved.answers) && saved.remaining > 0) {
    $('resume').hidden = false;
    $('resume-info').textContent = `푼 문제 ${saved.answers.filter(a => a !== null).length}/${N} · 남은 시간 ${fmt(saved.remaining)}`;
  }
  $('start').addEventListener('click', () => begin(null));
  $('resume-btn').addEventListener('click', () => begin(saved));

  function begin(state) {
    answers = state ? state.answers : Array(N).fill(null);
    current = state ? state.current : 0;
    remaining = state ? state.remaining : exam.minutes * 60;
    $('intro').hidden = true;
    $('result').hidden = true;
    $('exam').hidden = false;
    document.body.classList.add('cbt-running');
    buildSheet();
    show(current);
    tick();
    clearInterval(timer);
    timer = setInterval(tick, 1000);
    window.scrollTo(0, 0);
  }

  // ---------- 타이머 ----------
  function fmt(s) { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
  function tick() {
    $('timer').textContent = fmt(remaining);
    $('timer').classList.toggle('low', remaining <= 60);
    if (remaining <= 0) {
      clearInterval(timer);
      alert('시험 시간이 끝났습니다. 지금까지 표기한 답안으로 채점합니다.');
      grade();
      return;
    }
    remaining--;
    if (remaining % 5 === 0) store.save();
  }

  // ---------- 문제 화면 ----------
  function show(i) {
    current = i;
    const q = qs[i];
    $('q-num').textContent = `${i + 1}`;
    $('q-text').textContent = q.q;
    $('q-opts').innerHTML = q.o.map((opt, j) => `
      <button type="button" class="cbt-opt${answers[i] === j ? ' on' : ''}" data-j="${j}" aria-pressed="${answers[i] === j}">
        <span class="mark">${marks[j]}</span><span class="txt"></span>
      </button>`).join('');
    $('q-opts').querySelectorAll('.txt').forEach((el, j) => { el.textContent = q.o[j]; });
    $('prev').disabled = i === 0;
    $('next').textContent = i === N - 1 ? '답안 제출' : '다음 ›';
    $('progress').textContent = `${i + 1} / ${N}`;
    updateSheet();
    store.save();
  }

  $('q-opts').addEventListener('click', e => {
    const btn = e.target.closest('.cbt-opt');
    if (!btn) return;
    pick(Number(btn.dataset.j));
  });

  function pick(j) {
    answers[current] = answers[current] === j ? null : j; // 같은 답을 다시 누르면 선택 취소
    show(current);
  }

  $('prev').addEventListener('click', () => { if (current > 0) show(current - 1); });
  $('next').addEventListener('click', () => { if (current < N - 1) show(current + 1); else openConfirm(); });

  document.addEventListener('keydown', e => {
    if ($('exam').hidden || $('confirm').open) return;
    if (['1', '2', '3', '4'].includes(e.key)) pick(Number(e.key) - 1);
    else if (e.key === 'ArrowRight' && current < N - 1) show(current + 1);
    else if (e.key === 'ArrowLeft' && current > 0) show(current - 1);
  });

  // ---------- 답안 표기란 ----------
  function buildSheet() {
    $('sheet-grid').innerHTML = qs.map((_, i) => `
      <button type="button" class="cell" data-i="${i}">
        <span class="n">${i + 1}</span><span class="a"></span>
      </button>`).join('');
  }
  function updateSheet() {
    $('sheet-grid').querySelectorAll('.cell').forEach((cell, i) => {
      cell.classList.toggle('done', answers[i] !== null);
      cell.classList.toggle('cur', i === current);
      cell.querySelector('.a').textContent = answers[i] === null ? '' : marks[answers[i]];
    });
    const left = answers.filter(a => a === null).length;
    $('left').textContent = left;
    $('left-wrap').classList.toggle('zero', left === 0);
  }
  $('sheet-grid').addEventListener('click', e => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    show(Number(cell.dataset.i));
    document.body.classList.remove('sheet-open');
  });
  $('sheet-toggle').addEventListener('click', () => document.body.classList.toggle('sheet-open'));
  $('sheet-close').addEventListener('click', () => document.body.classList.remove('sheet-open'));

  // ---------- 글자 크기 ----------
  let fontStep = Number((() => { try { return localStorage.getItem('com2-cbt-font'); } catch (e) { return 0; } })()) || 0;
  function applyFont() {
    document.documentElement.style.setProperty('--cbt-font', `${17 + fontStep * 2}px`);
    try { localStorage.setItem('com2-cbt-font', String(fontStep)); } catch (e) {}
  }
  $('font-down').addEventListener('click', () => { fontStep = Math.max(-1, fontStep - 1); applyFont(); });
  $('font-up').addEventListener('click', () => { fontStep = Math.min(3, fontStep + 1); applyFont(); });
  applyFont();

  // ---------- 제출 ----------
  function openConfirm() {
    const left = answers.filter(a => a === null).length;
    $('confirm-msg').textContent = left
      ? `안 푼 문제가 ${left}개 있습니다. 그래도 답안을 제출할까요?`
      : `${N}문제를 모두 풀었습니다. 답안을 제출할까요?`;
    $('confirm').showModal();
  }
  $('submit').addEventListener('click', openConfirm);
  $('confirm-no').addEventListener('click', () => $('confirm').close());
  $('confirm-yes').addEventListener('click', () => { $('confirm').close(); grade(); });

  // ---------- 채점 ----------
  function grade() {
    clearInterval(timer);
    store.clear();
    document.body.classList.remove('cbt-running', 'sheet-open');
    const score = qs.filter((q, i) => answers[i] === q.a).length;
    const pct = Math.round(score / N * 100);
    const pass = pct >= 60;
    $('exam').hidden = true;
    $('result').hidden = false;
    $('score').innerHTML = `<strong>${pct}점</strong><span>${score} / ${N}문제 정답 · 소요 ${fmt(exam.minutes * 60 - Math.max(remaining, 0))}</span>
      <em class="${pass ? 'pass' : 'fail'}">${pass ? '과목 기준 통과 (60점 이상)' : '과목 기준 미달 (60점 미만)'}</em>`;
    $('result-grid').innerHTML = qs.map((q, i) => {
      const ok = answers[i] === q.a;
      return `<a href="#r${i + 1}" class="cell ${ok ? 'ok' : 'ng'}"><span class="n">${i + 1}</span><span class="a">${ok ? 'O' : 'X'}</span></a>`;
    }).join('');
    const list = $('review');
    list.innerHTML = '';
    qs.forEach((q, i) => {
      const ok = answers[i] === q.a;
      const li = document.createElement('li');
      li.id = `r${i + 1}`;
      li.className = `q ${ok ? 'right' : 'wrong'}`;
      li.innerHTML = `<p class="q-text"><b>${i + 1}.</b> <span></span></p><div class="opts"></div><div class="explain"></div>`;
      li.querySelector('.q-text span').textContent = q.q;
      const opts = li.querySelector('.opts');
      q.o.forEach((opt, j) => {
        const d = document.createElement('div');
        d.className = 'opt' + (j === q.a ? ' answer' : answers[i] === j ? ' picked-wrong' : '');
        d.innerHTML = `<span class="mark">${marks[j]}</span><span></span>`;
        d.lastChild.textContent = opt;
        opts.appendChild(d);
      });
      const ex = li.querySelector('.explain');
      ex.innerHTML = `<b>${ok ? '정답' : answers[i] === null ? '미응답' : '오답'}</b> · 정답 ${marks[q.a]}${answers[i] !== null && !ok ? ` (내 답 ${marks[answers[i]]})` : ''} — <span></span>`;
      ex.querySelector('span').textContent = q.e;
      list.appendChild(li);
    });
    $('wrong-only').checked = false;
    list.classList.remove('only-wrong');
    window.scrollTo(0, 0);
  }

  $('wrong-only').addEventListener('change', e => $('review').classList.toggle('only-wrong', e.target.checked));
  $('retry').addEventListener('click', () => begin(null));
})();
