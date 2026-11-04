/* ============================================================
   오프닝 화면 데이터  (직접 추가·수정하는 파일)
   ------------------------------------------------------------
   ★ 재료를 늘리고 싶을 때
     1) 사진(투명 PNG)을 dir 폴더에 넣습니다.   예) assets/ingredients/carrot.png
     2) 아래 items 목록에 사진 이름(확장자 빼고)을 한 줄 추가합니다.  예) 'carrot'
     3) (선택) 사진이 없을 때 대신 보일 이모지를 emoji 목록에 추가합니다.
   크기, 높이, 회전 속도, 타이밍은 자동으로 조금씩 다르게 정해집니다.
   직접 정하고 싶으면 items 에 { name:'tomato', size:16, x:-20, y:25 } 처럼 적으면 됩니다.
     size 크기(vmin) / x 좌우 위치(vw, 0이 가운데) / y 튀어 오르는 높이(vh)
     spin 한 바퀴 도는 시간(초) / rise 튀어 오르는 시간(초) / delay 시작 시간(초) / bob 둥둥 주기(초)
   ============================================================ */
const GG_OPENING = {
  dir: 'assets/ingredients/',   // 재료 사진이 있는 폴더
  ext: '.png',
  pan: { src: 'assets/ui/pan.png', emoji: '🍳' },

  // 튀어 오를 재료 (사진 이름)
  items: ['tomato', 'chili', 'onion', 'garlic', 'scallion', 'mushroom', 'carrot', 'basil'],

  // 사진 파일이 없을 때 대신 보일 이모지
  emoji: {
    tomato: '🍅', chili: '🌶️', onion: '🧅', garlic: '🧄',
    scallion: '🌿', mushroom: '🍄', carrot: '🥕', basil: '🌿'
  }
};
