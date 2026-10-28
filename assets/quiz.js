// 모의고사: 페이지의 <script id="quiz-data">에 담긴 문제를 그려 주고 채점한다.
(function () {
  const data = JSON.parse(document.getElementById('quiz-data').textContent);
  const list = document.getElementById('quiz');
  const result = document.getElementById('result');
  const submitBtn = document.getElementById('submit');
  const retryBtn = document.getElementById('retry');
  const wrongOnly = document.getElementById('wrong-only');
  const progress = document.getElementById('progress');
  const marks = ['①', '②', '③', '④'];

  function render() {
    list.innerHTML = data.map((item, i) => `
      <li class="q" id="q${i + 1}">
        <p class="q-text"><b>${i + 1}.</b> ${item.q}</p>
        <div class="opts">
          ${item.o.map((opt, j) => `
            <label class="opt">
              <input type="radio" name="q${i}" value="${j}">
              <span class="mark">${marks[j]}</span><span>${opt}</span>
            </label>`).join('')}
        </div>
        <div class="explain" hidden></div>
      </li>`).join('');
    updateProgress();
  }

  function answered() {
    return data.filter((_, i) => list.querySelector(`input[name="q${i}"]:checked`)).length;
  }

  function updateProgress() {
    progress.textContent = `${answered()} / ${data.length} 문항 선택`;
  }

  list.addEventListener('change', updateProgress);

  submitBtn.addEventListener('click', () => {
    const left = data.length - answered();
    if (left > 0 && !confirm(`아직 ${left}문항을 풀지 않았습니다. 채점할까요?`)) return;
    let score = 0;
    data.forEach((item, i) => {
      const li = list.children[i];
      const picked = li.querySelector('input:checked');
      const correct = picked && Number(picked.value) === item.a;
      if (correct) score++;
      li.classList.add(correct ? 'right' : 'wrong');
      li.querySelectorAll('.opt').forEach((label, j) => {
        if (j === item.a) label.classList.add('answer');
        else if (picked && Number(picked.value) === j) label.classList.add('picked-wrong');
      });
      li.querySelectorAll('input').forEach(input => { input.disabled = true; });
      const ex = li.querySelector('.explain');
      ex.innerHTML = `<b>${correct ? '정답' : picked ? '오답' : '미응답'}</b> · 정답 ${marks[item.a]} — ${item.e}`;
      ex.hidden = false;
    });
    const pct = Math.round(score / data.length * 100);
    result.innerHTML = `<strong>${score} / ${data.length}</strong> <span>${pct}점 · ${pct >= 60 ? '합격선(60점) 통과!' : '합격선(60점)까지 조금 더!'}</span>`;
    result.hidden = false;
    submitBtn.hidden = true;
    retryBtn.hidden = false;
    wrongOnly.parentElement.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  retryBtn.addEventListener('click', () => {
    result.hidden = true;
    submitBtn.hidden = false;
    retryBtn.hidden = true;
    wrongOnly.checked = false;
    wrongOnly.parentElement.hidden = true;
    list.classList.remove('only-wrong');
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  wrongOnly.addEventListener('change', () => {
    list.classList.toggle('only-wrong', wrongOnly.checked);
  });

  render();
})();
