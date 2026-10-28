// 사이트 페이지 생성기: node build/build.mjs
// days.json을 바탕으로 메인 페이지(index.html)와 일차별 메뉴 페이지(dayN/index.html)를 만든다.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const days = JSON.parse(fs.readFileSync(path.join(root, 'build', 'days.json'), 'utf8'));

const SUBJECTS = {
  pc: { name: '1과목 컴퓨터 일반' },
  xl: { name: '2과목 스프레드시트 일반' },
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function page({ title, base, crumbs, body }) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<link rel="stylesheet" href="${base}assets/style.css">
</head>
<body>
<header class="site-head"><div class="wrap">
  <a class="brand" href="${base}index.html">컴활2급</a>
  ${crumbs ? `<span class="crumbs">${crumbs}</span>` : ''}
</div></header>
<main class="wrap">
${body}
</main>
<footer class="site-foot"><div class="wrap">컴퓨터활용능력 2급 필기 10일 합격 챌린지 강의를 바탕으로 정리한 개인 학습 자료입니다. 시험 범위와 세부 내용은 교재와 기출문제로 함께 확인하세요.</div></footer>
</body>
</html>
`;
}

function write(rel, html) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html, 'utf8');
  console.log('wrote', rel);
}

// 메인 페이지
let sections = '';
for (const [key, s] of Object.entries(SUBJECTS)) {
  const list = days.filter(d => d.subject === key);
  if (!list.length) continue;
  sections += `<div class="subject"><h2>${s.name}</h2><span>${list.length}일</span></div>
<div class="days">
${list.map(d => `  <a class="day-card ${key}" href="day${d.day}/index.html">
    <span class="num">${d.day}일차</span>
    <h3>${esc(d.title)}</h3>
    <p>${esc(d.topics)}</p>
  </a>`).join('\n')}
</div>
`;
}

write('index.html', page({
  title: '컴활2급',
  base: '',
  body: `<section class="hero">
  <h1>컴퓨터활용능력 2급 필기</h1>
  <p>일차별 핵심정리 · 모의고사 · 음성 듣기</p>
</section>
${sections}`,
}));

// 핵심정리 페이지: build/summaries/dayN.html 원본에서 출처 문단과 본문을 꺼내 사이트 틀에 넣는다.
// 같은 일차의 PDF(ITQ 폴더)가 있으면 dayN/summary.pdf로 복사해 내려받기 링크를 단다.
const pdfDir = path.resolve(root, '..');
days.forEach(d => {
  const src = fs.readFileSync(path.join(root, 'build', 'summaries', `day${d.day}.html`), 'utf8');
  const note = (src.match(/<p class="src">([\s\S]*?)<\/p>/) || [, ''])[1];
  const start = src.indexOf('</p>', src.indexOf('<p class="src">')) + 4;
  const end = src.search(/<p class="foot"/);
  const content = src.slice(start, end).replace(/<!--[\s\S]*?-->/g, '').trim();
  const pdf = path.join(pdfDir, `컴활2급_${d.day}일차_핵심정리.pdf`);
  const hasPdf = fs.existsSync(pdf);
  if (hasPdf) fs.copyFileSync(pdf, path.join(root, `day${d.day}`, 'summary.pdf'));
  write(`day${d.day}/summary.html`, page({
    title: `${d.day}일차 핵심정리 | 컴활2급`,
    base: '../',
    crumbs: `<a href="../index.html">전체</a> › <a href="index.html">${d.day}일차</a> › 핵심정리`,
    body: `<section class="hero">
  <h1>${d.day}일차 핵심정리</h1>
  <p>${esc(d.title)} — ${esc(d.topics)}</p>
</section>
<div class="doc-tools">
  <span>${note}</span>
  ${hasPdf ? '<a class="btn" href="summary.pdf" download>PDF 내려받기</a>' : ''}
</div>
<article class="doc">
${content}
</article>
<div class="pager">
  <a href="index.html">← ${d.day}일차 메뉴</a>
  <a href="quiz.html">모의고사 풀기 →</a>
</div>`,
  }));
});

// 모의고사 페이지: build/quizzes/dayN.json(q 문제, o 보기 4개, a 정답 번호 0~3, e 해설)을 넣고 assets/quiz.js가 채점한다.
days.forEach(d => {
  const file = path.join(root, 'build', 'quizzes', `day${d.day}.json`);
  if (!fs.existsSync(file)) return;
  const quiz = JSON.parse(fs.readFileSync(file, 'utf8'));
  const json = JSON.stringify(quiz.map(q => ({ q: esc(q.q), o: q.o.map(esc), a: q.a, e: esc(q.e) }))).replace(/</g, '\\u003c');
  write(`day${d.day}/quiz.html`, page({
    title: `${d.day}일차 모의고사 | 컴활2급`,
    base: '../',
    crumbs: `<a href="../index.html">전체</a> › <a href="index.html">${d.day}일차</a> › 모의고사`,
    body: `<section class="hero">
  <h1>${d.day}일차 모의고사</h1>
  <p>${esc(d.title)} — ${quiz.length}문제 · 4지선다 · 답을 고른 뒤 아래 [채점하기]를 누르세요.</p>
</section>
<div class="quiz-bar"><span id="progress"></span><a href="summary.html">핵심정리 보기</a></div>
<ol class="quiz-list" id="quiz"></ol>
<div class="result" id="result" hidden></div>
<div class="quiz-actions">
  <button class="btn" id="submit" type="button">채점하기</button>
  <button class="btn ghost" id="retry" type="button" hidden>다시 풀기</button>
  <label hidden><input type="checkbox" id="wrong-only"> 틀린 문제만 보기</label>
</div>
<div class="pager">
  <a href="summary.html">← 핵심정리</a>
  <a href="audio.html">음성 듣기 →</a>
</div>
<script id="quiz-data" type="application/json">${json}</script>
<script src="../assets/quiz.js"></script>`,
  }));
});

// 음성 듣기 페이지: '새 폴더'의 보통 속도 MP3를 dayN/audio.mp3로 복사하고, 음성 원고를 함께 보여 준다.
// 빠르게 듣기는 별도 파일 대신 플레이어의 재생 속도 버튼으로 처리한다.
const voiceDir = path.join(pdfDir, '새 폴더');
const scriptFile = n => [path.join(voiceDir, `컴활2급_${n}일차_읽을글.txt`), path.join(voiceDir, `comp2_day${n}_narration.txt`)].find(f => fs.existsSync(f));
days.forEach(d => {
  const mp3 = path.join(voiceDir, `컴활2급_${d.day}일차_SunHi_보통속도.mp3`);
  if (!fs.existsSync(mp3)) return;
  const dest = path.join(root, `day${d.day}`, 'audio.mp3');
  if (!fs.existsSync(dest) || fs.statSync(dest).size !== fs.statSync(mp3).size) fs.copyFileSync(mp3, dest);
  const sf = scriptFile(d.day);
  const paras = sf ? fs.readFileSync(sf, 'utf8').replace(/^﻿/, '').split(/\n\s*\n/).map(s => s.trim()).filter(Boolean) : [];
  const minutes = Math.round(fs.statSync(mp3).size / 12000 / 60); // 96kbps MP3 기준 대략 길이
  write(`day${d.day}/audio.html`, page({
    title: `${d.day}일차 음성 듣기 | 컴활2급`,
    base: '../',
    crumbs: `<a href="../index.html">전체</a> › <a href="index.html">${d.day}일차</a> › 음성 듣기`,
    body: `<section class="hero">
  <h1>${d.day}일차 음성 듣기</h1>
  <p>${esc(d.title)} — 약 ${minutes}분 · 이동하면서 귀로 복습하세요.</p>
</section>
<div class="player-card">
  <audio id="player" data-day="${d.day}" controls preload="metadata" src="audio.mp3"></audio>
  <div class="controls">
    <span class="label">속도</span>
    <button class="chip" type="button" data-rate="0.8">0.8×</button>
    <button class="chip on" type="button" data-rate="1">1×</button>
    <button class="chip" type="button" data-rate="1.2">1.2×</button>
    <button class="chip" type="button" data-rate="1.5">1.5×</button>
    <span class="gap"></span>
    <button class="chip" type="button" data-skip="-10">↺ 10초</button>
    <button class="chip" type="button" data-skip="10">10초 ↻</button>
  </div>
  <p class="resume" id="resume" hidden></p>
</div>
${paras.length ? `<details class="script">
  <summary>음성 원고 보기</summary>
  ${paras.map(p => `<p>${esc(p)}</p>`).join('\n  ')}
</details>` : ''}
<div class="pager">
  <a href="quiz.html">← 모의고사</a>
  <a href="index.html">${d.day}일차 메뉴 →</a>
</div>
<script src="../assets/audio.js"></script>`,
  }));
});

// 일차별 메뉴 페이지
days.forEach((d, i) => {
  const prev = days[i - 1], next = days[i + 1];
  write(`day${d.day}/index.html`, page({
    title: `${d.day}일차 ${d.title} | 컴활2급`,
    base: '../',
    crumbs: `<a href="../index.html">전체</a> › ${d.day}일차`,
    body: `<section class="hero">
  <h1>${d.day}일차 · ${esc(d.title)}</h1>
  <p>${SUBJECTS[d.subject].name} — ${esc(d.topics)}</p>
</section>
<nav class="menu">
  <a href="summary.html"><span class="icon">📘</span><strong>핵심정리</strong><span>강의 내용과 시험 함정 정리</span></a>
  <a href="quiz.html"><span class="icon">📝</span><strong>모의고사</strong><span>20문제 · 자동 채점과 해설</span></a>
  <a href="audio.html"><span class="icon">🎧</span><strong>음성 듣기</strong><span>핵심정리를 귀로 복습</span></a>
</nav>
<div class="pager">
  <span>${prev ? `<a href="../day${prev.day}/index.html">← ${prev.day}일차</a>` : ''}</span>
  <span>${next ? `<a href="../day${next.day}/index.html">${next.day}일차 →</a>` : ''}</span>
</div>`,
  }));
});
