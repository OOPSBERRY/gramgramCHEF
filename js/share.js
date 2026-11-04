/* QR 코드 팝업: 배포된 주소(또는 data/share.js 의 주소)를 QR 로 보여줘요. 버튼은 첫 화면과 홈 화면에 있어요. */
(function () {
  const modal = document.getElementById('qr-modal');
  if (!modal) return;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /** QR 로 만들 주소: 설정 파일의 주소 → 없으면 지금 열린 주소(인터넷 주소일 때만) */
  function shareUrl() {
    if (typeof GG_SHARE_URL === 'string' && GG_SHARE_URL.trim()) return GG_SHARE_URL.trim();
    if (/^https?:$/.test(location.protocol)) return location.origin + location.pathname.replace(/index\.html$/, '');
    return '';
  }

  function open() {
    const url = shareUrl();
    let body;
    if (!url) {
      body = '<div class="qr-warn">지금은 파일로 직접 열려 있어서 QR 코드를 만들 수 없어요.<br>인터넷에 배포한 주소로 열거나, <b>data/share.js</b>의 GG_SHARE_URL에 배포 주소를 적어 주세요.</div>';
    } else {
      try { body = '<div class="qr-img">' + GGQR.svg(url, 320) + '</div><p class="qr-url">' + esc(url) + '</p><p>태블릿이나 휴대폰 카메라로 비추면 바로 열려요.</p>'; }
      catch (e) { body = '<div class="qr-warn">주소가 너무 길어서 QR 코드를 만들 수 없어요.</div>'; }
    }
    modal.innerHTML = '<div class="modal-card qr-card"><h2>그램그램 셰프 접속 QR</h2>' + body + '<div class="di-btns"><button class="m-go" id="qr-close">닫기</button></div></div>';
    modal.hidden = false;
    document.getElementById('qr-close').onclick = () => { modal.hidden = true; };
  }

  document.querySelectorAll('.qr-btn').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); open(); }));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });      // 바깥을 누르면 닫힘
})();
