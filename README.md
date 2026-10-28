# 컴활2급

컴퓨터활용능력 2급 필기 일차별 학습 사이트입니다. 일차마다 핵심정리, 모의고사(20문제, 자동 채점), 음성 듣기 페이지가 있습니다.

## 구성

- `index.html` — 메인 페이지 (일차별 링크)
- `dayN/` — N일차 메뉴(`index.html`), 핵심정리(`summary.html`, `summary.pdf`), 모의고사(`quiz.html`), 음성 듣기(`audio.html`, `audio.mp3`)
- `assets/` — 공통 스타일과 스크립트
- `build/` — 페이지 생성 원본
  - `days.json` — 일차 목록 (제목, 주제)
  - `summaries/dayN.html` — 핵심정리 원본
  - `quizzes/dayN.json` — 모의고사 문제 (`q` 문제, `o` 보기 4개, `a` 정답 번호 0~3, `e` 해설)
  - `build.mjs` — 생성 스크립트

## 새 일차 추가하기

1. `build/days.json`에 일차 정보를 한 줄 추가합니다.
2. `build/summaries/dayN.html`과 `build/quizzes/dayN.json`을 만듭니다.
3. 상위 폴더(ITQ)에 `컴활2급_N일차_핵심정리.pdf`, `새 폴더`에 음성 MP3와 원고가 있으면 자동으로 복사됩니다.
4. `node build/build.mjs`를 실행한 뒤 커밋하고 푸시합니다.

강의 내용을 바탕으로 정리한 개인 학습 자료이며, 시험 범위와 세부 내용은 교재와 기출문제로 함께 확인하세요.
