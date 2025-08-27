(function () {
  // ===== הגדרות =====
  var FILENAME = 'מעגלי ההיכרות שלי.png';
  var SCALE = 2;      // ~1080p ברוב התבניות
  var DELAY = 500;    // לתת רגע לטקסטים/משתנים להתעדכן
  var VAR_NAME = 'GoBackTo16';

  // מקורות טעינה - הקוד מנסה את כולם, בלי שתעשי כלום
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
    // בוחר את האלמנט עם "הכי הרבה קאנבאסים", ואם תיקו - את הגדול בשטח
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
          // ניסיון דרך חלון-על (חלק מה-LMSים מרשים)
          try{
            if (window.top && window.top!==window) {
              var s2 = window.top.document.createElement('script');
              s2.src = url;
              s2.onload = function(){
                // חולקים את הספרייה לאייפריים אם צריך
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
    // ניסיון 1: בתוך המסמך
    try{
      var a=document.createElement('a'); a.href=dataUrl; a.download=FILENAME;
      document.body.appendChild(a); a.click(); a.remove(); return true;
    }catch(_) {}
    // ניסיון 2: דרך חלון-על
    try{
      if (window.top && window.top!==window){
        var a2=window.top.document.createElement('a'); a2.href=dataUrl; a2.download=FILENAME;
        window.top.document.body.appendChild(a2); a2.click(); a2.remove(); return true;
      }
    }catch(_) {}
    // ניסיון 3: פתיחה בלשונית חדשה לשמירה ידנית (fallback קשיח)
    try{ window.open(dataUrl, '_blank'); return true; }catch(_) {}
    return false;
  }

  (async function run(){
    try{
      await fontsReady();
      await sleep(DELAY);

      var root = getRoot();
      var r = root.getBoundingClientRect();
      var W = Math.max(10, Math.round(r.width  * SCALE));
      var H = Math.max(10, Math.round(r.height * SCALE));

      // We will only use dom-to-image-more now.
      await loadFrom(D2I_URLS, 'domtoimage');

      // Use domtoimage to generate a single PNG of the whole element
      var dataUrl = await window.domtoimage.toPng(root, {
        width: W, 
        height: H,
        style: { 
          transform: 'scale(' + SCALE + ')', 
          transformOrigin: 'top left' 
        },
        // These options can help with loading external images
        cacheBust: true,
        imagePlaceholder: undefined // Don't use a placeholder if an image fails
      });

      // Directly download the result
      safeDownload(dataUrl);

    } catch(e){
      // Log the error to the console to see what went wrong
      console.error('Screenshot failed:', e);
      alert('Sorry, the screenshot could not be created. An error occurred.');
    } finally {
      setVarTrue();
    }
  })();
})();
