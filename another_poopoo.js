(function () {
  // ===== הגדרות =====
  var FILENAME = 'מעגלי ההיכרות שלי.png';
  var SCALE = 2;      // ~1080p ברוב התבניות
  var DELAY = 500;    // לתת רגע לטקסטים/משתנים להתעדכן
  var VAR_NAME = 'GoBackTo16';

  // מקורות טעינה
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
      
      // Load html2canvas now.
      await loadFrom(H2C_URLS, 'html2canvas');

      // Use html2canvas to generate a canvas of the whole element, including the background image.
      var canvas = await window.html2canvas(root, {
        scale: SCALE,
        useCORS: true,
        allowTaint: true
      });

      // Convert the canvas to a PNG data URL
      var dataUrl = canvas.toDataURL('image/png');

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
