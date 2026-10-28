// 음성 듣기: 재생 속도 버튼, 10초 앞뒤 이동, 들은 위치 기억(이 브라우저에만 저장).
(function () {
  const audio = document.getElementById('player');
  const key = 'com2-audio-' + audio.dataset.day;

  function store(fn) { try { return fn(); } catch (e) { return null; } }

  const saved = Number(store(() => localStorage.getItem(key)));
  if (saved > 5) {
    audio.addEventListener('loadedmetadata', () => {
      if (saved < audio.duration - 5) {
        audio.currentTime = saved;
        const note = document.getElementById('resume');
        note.textContent = `지난번 들은 위치(${Math.floor(saved / 60)}분 ${Math.floor(saved % 60)}초)부터 이어서 재생합니다.`;
        note.hidden = false;
      }
    }, { once: true });
  }

  let last = 0;
  audio.addEventListener('timeupdate', () => {
    if (Math.abs(audio.currentTime - last) < 5) return;
    last = audio.currentTime;
    store(() => localStorage.setItem(key, String(Math.floor(audio.currentTime))));
  });
  audio.addEventListener('ended', () => store(() => localStorage.removeItem(key)));

  document.querySelectorAll('[data-rate]').forEach(btn => {
    btn.addEventListener('click', () => {
      audio.playbackRate = Number(btn.dataset.rate);
      document.querySelectorAll('[data-rate]').forEach(b => b.classList.toggle('on', b === btn));
    });
  });
  document.querySelectorAll('[data-skip]').forEach(btn => {
    btn.addEventListener('click', () => {
      audio.currentTime = Math.max(0, audio.currentTime + Number(btn.dataset.skip));
    });
  });
})();
