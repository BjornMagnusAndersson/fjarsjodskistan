/* =====================================================================
   Face paint (slot face, cat face): drawn on the face, under the front
   hair, so it can be worn together with glasses, hats and earrings.
   ===================================================================== */
(function () {
  'use strict';
  const { ink } = H;

  /* -------------------------------------------------------------
     Cat face: a little cat nose over her own nose, a line down to
     the mouth, and three painted whiskers on each cheek.
     colors: [nose, whiskers]
     rainbow: true gives a rainbow nose and a different colour per whisker.
     ------------------------------------------------------------- */
  const NOSE = 'M188,177 Q200,171 212,177 Q214,182 206,188 Q200,193 194,188 Q186,182 188,177 Z';
  // left cheek whiskers (from the nose side outwards); the right side is mirrored
  const WHISKERS = ['M176,186 Q160,180 142,180', 'M175,193 Q158,193 140,196', 'M176,200 Q160,205 145,212'];
  const RAINBOW_W = [['#ef5b6c', '#f6a447', '#f2cf3b'], ['#5fc46d', '#4aa8e0', '#9b72e0']];

  DOLL.shape('face-cat', {
    slot: 'face',
    draw(it) {
      const [noseC, whiskC] = it.colors;
      const noseFill = it.rainbow
        ? H.def('g-' + it.id, '<linearGradient id="g-' + it.id + '" x1="0" y1="0" x2="1" y2="0">' +
            ['#ef5b6c', '#f6a447', '#f2cf3b', '#5fc46d', '#4aa8e0', '#9b72e0'].map((c, i) => `<stop offset="${i / 5}" stop-color="${c}"/>`).join('') + '</linearGradient>')
        : noseC;
      const mirror = d => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (m, x, y) => (400 - x) + ',' + y);
      // one whisker: soft light halo underneath, then the paint line
      const whisker = (d, c) =>
        `<path d="${d}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35"/>` +
        `<path d="${d}" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
      let g = '';
      WHISKERS.forEach((d, i) => {
        g += whisker(d, it.rainbow ? RAINBOW_W[0][i] : whiskC) + whisker(mirror(d), it.rainbow ? RAINBOW_W[1][i] : whiskC);
      });
      // nose with a shine, and the little line down to the mouth
      g += `<path d="M200,191 L200,198" stroke="${it.rainbow ? '#9b72e0' : whiskC}" stroke-width="2.6" stroke-linecap="round"/>` +
        `<path d="${NOSE}" fill="${noseFill}" stroke="${ink(noseC)}" stroke-width="2" stroke-linejoin="round"/>` +
        `<ellipse cx="195.5" cy="178.5" rx="4" ry="2.2" fill="#fff" opacity=".75"/>`;
      return g;
    },
  });

  DOLL.add([
    { id: 'face-cat-blue', shape: 'face-cat', cat: 'face', name: { is: 'Blátt kisunef', en: 'Blue cat nose' }, colors: ['#5aa9ec', '#2f6fb0'] },
    { id: 'face-cat-pink', shape: 'face-cat', cat: 'face', name: { is: 'Bleikt kisunef', en: 'Pink cat nose' }, colors: ['#f58bb8', '#d4588a'] },
    { id: 'face-cat-rainbow', shape: 'face-cat', cat: 'face', name: { is: 'Regnbogakisunef', en: 'Rainbow cat nose' }, colors: ['#f2cf3b', '#9b72e0'], rainbow: true },
    { id: 'face-cat-black', shape: 'face-cat', cat: 'face', name: { is: 'Svart kisunef', en: 'Black cat nose' }, colors: ['#2d2a33', '#2d2a33'] },
  ]);
})();
