(function () {
  // ===== הגדרות =====
  var FILENAME = 'מעגלי ההיכרות שלי.png';
  var SCALE = 2;      // ~1080p ברוב התבניות
  var DELAY = 500;    // לתת רגע לטקסטים/משתנים להתעדכן
  var VAR_NAME = 'GoBackTo16';

  // מקורות טעינה
  var D2I_URLS = [
    'https://cdn.jsdelivr.net/npm/dom-to-image-more@3.4.0/dist/dom-to-image-more.min.js',
    'https://unpkg.com/dom-to-image-more@3.4.0/dist/dom-to-image-more.min.js',
    'story_content/dom-to-image-more.min.js',
    '/story_content/dom-to-image-more.min.js'
  ];
  var H2C_URLS = [
    'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
    'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js',
    'story_content/html2canvas.min.js',
    '/story_content/html2canvas.min.js'
  ];

  // ===== עוזרים =====
  function setVarTrue(){ try{ (window.GetPlayer&&window.GetPlayer()).SetVar(VAR_NAME, true); }catch(e){} }
  function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
  function fontsReady(){ return (document.fonts&&document.fonts.ready) ? document.fonts.ready.catch(()=>{}) : Promise.resolve(); }

  function trySelectors(list){
    var best = null, bestScore = -1, bestArea = -1;
    for (var i=0;i<list.length;i++){
      var el = document.querySelector(list[i]);
      if (!el || el.clientWidth===0 || el.clientHeight===0) continue;
      var canvases = el.querySelectorAll('canvas').length;
      var area = el.clientWidth * el.clientHeight;
      if (canvases > bestScore || (canvases===bestScore && area>bestArea)) {
        best = el; bestScore = canvases; bestArea = area;
      }
    }
    return best || document.body;
  }
  function getRoot(){
    return trySelectors([
      '#player', '.player', '.player-container', '.framewrap',
      '#slide-stage', '.slide-stage', '.slide-holder',
      '.slides', '#content', '#slide', '.slide'
    ]);
  }

  function loadFrom(urls, globalKey){
    return new Promise(function(resolve,reject){
      if (window[globalKey]) return resolve();
      (function next(i){
        if (i>=urls.length) return reject(new Error('load fail: '+globalKey));
        var url = urls[i];
        function ok(){ resolve(); }
        function fail(){
          try{
            if (window.top && window.top!==window) {
              var s2 = window.top.document.createElement('script');
              s2.src = url;
              s2.onload = function(){
                window[globalKey] = window[globalKey] || window.top[globalKey];
                ok();
              };
              s2.onerror = function(){ next(i+1); };
              window.top.document.head.appendChild(s2);
              return;
            }
          }catch(_) {}
          next(i+1);
        }
        var s = document.createElement('script');
        s.src = url;
        s.onload = ok;
        s.onerror = fail;
        document.head.appendChild(s);
      })(0);
    });
  }

  function safeDownload(dataUrl){
    try{
      var a=document.createElement('a'); a.href=dataUrl; a.download=FILENAME;
      document.body.appendChild(a); a.click(); a.remove(); return true;
    }catch(_) {}
    try{
      if (window.top && window.top!==window){
        var a2=window.top.document.createElement('a'); a2.href=dataUrl; a2.download=FILENAME;
        window.top.document.body.appendChild(a2); a2.click(); a2.remove(); return true;
      }
    }catch(_) {}
    try{ window.open(dataUrl, '_blank'); return true; }catch(_) {}
    return false;
  }

  (async function run(){
    try{
      await fontsReady();
      await sleep(DELAY);

      var root = getRoot();
      var r = root.getBoundingClientRect();
      var W = Math.max(10, Math.round(r.width * SCALE));
      var H = Math.max(10, Math.round(r.height * SCALE));

      // Load both libraries
      await Promise.all([
        loadFrom(H2C_URLS, 'html2canvas'),
        loadFrom(D2I_URLS, 'domtoimage')
      ]);

      // Step 1: Use html2canvas to capture the images (circles) and background
      var h2cCanvas = await window.html2canvas(root, {
        scale: SCALE,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null // Ensures the background is transparent if not already
      });

      // Step 2: Use dom-to-image-more to capture only the text
      // We will clone the root and hide everything that is NOT text.
      var clone = root.cloneNode(true);
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.left = '-9999px';
      document.body.appendChild(clone);
      
      // Hide all non-text elements to isolate the text.
      // This is a more aggressive approach, but more likely to work
      // if text is the only element without a specific class.
      var elementsToHide = clone.querySelectorAll('div:not(.sl-text-box):not(.slide-text), img, svg, [id*="shape"], canvas, video');
      elementsToHide.forEach(el => el.style.visibility = 'hidden');

      var textDataUrl = await window.domtoimage.toPng(clone, {
        width: W,
        height: H,
        style: {
          transform: 'scale(' + SCALE + ')',
          transformOrigin: 'top left'
        },
        cacheBust: true,
        imagePlaceholder: undefined,
        bgcolor: 'transparent'
      });

      // Cleanup the temporary clone
      document.body.removeChild(clone);

      // Step 3: Combine the two images on a final canvas
      var finalCanvas = document.createElement('canvas');
      finalCanvas.width = W;
      finalCanvas.height = H;
      var ctx = finalCanvas.getContext('2d');

      // Draw the html2canvas output first
      ctx.drawImage(h2cCanvas, 0, 0, W, H);

      // Draw the dom-to-image text output on top of it
      var textImage = new Image();
      textImage.src = textDataUrl;

      await new Promise(resolve => textImage.onload = resolve);
      ctx.drawImage(textImage, 0, 0, W, H);

      var dataUrl = finalCanvas.toDataURL('image/png');

      // Directly download the result
      safeDownload(dataUrl);

    } catch(e){
      console.error('Screenshot failed:', e);
      alert('Sorry, the screenshot could not be created. An error occurred.');
    } finally {
      setVarTrue();
    }
  })();
})();
