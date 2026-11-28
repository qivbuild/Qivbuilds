/* qiv-engine.js (naya, halka version)
   Sab pages is ko load karte hain aur window.QIV_APPLY&&QIV_APPLY() call karte hain.
   Yeh file khud bhi load hote hi chal jati hai, isliye <script defer> ke saath safe hai. */
(function () {
  "use strict";

  // 1) Sirf screen ke neeche wali images lazy (upar wali/LCP image ko nahi chhedta)
  function fixImages(root) {
    var imgs = (root || document).querySelectorAll("img:not([loading])");
    var vh = window.innerHeight || 800;
    for (var i = 0; i < imgs.length; i++) {
      var im = imgs[i];
      if (im.getAttribute("fetchpriority") === "high") continue;
      if (im.getBoundingClientRect().top > vh * 1.5) im.setAttribute("loading", "lazy");
      if (!im.hasAttribute("decoding")) im.setAttribute("decoding", "async");
    }
  }

  // 2) target="_blank" links par rel="noopener"
  function fixLinks(root) {
    var links = (root || document).querySelectorAll('a[target="_blank"]');
    for (var i = 0; i < links.length; i++) {
      var rel = (links[i].getAttribute("rel") || "").toLowerCase();
      if (rel.indexOf("noopener") < 0) links[i].setAttribute("rel", (rel + " noopener").trim());
    }
  }

  // 3) Slider ke screen se bahar wale slides ke buttons/links chhupata hai.
  //    Wajah: bahar wale slides ke buttons doosre elements ke upar aa jate hain aur
  //    PageSpeed "touch targets overlap" ka warning deta hai. Slide screen mein aate hi button wapas dikhta hai.
  var observers = new Map();
  function guardSlides() {
    if (!("IntersectionObserver" in window)) return;
    var slides = document.querySelectorAll(".sd:not([data-qg])");
    for (var i = 0; i < slides.length; i++) {
      var s = slides[i], host = s.parentElement;
      s.setAttribute("data-qg", "1");
      if (!host) continue;
      var ox = getComputedStyle(host).overflowX;
      if (ox !== "auto" && ox !== "scroll" && ox !== "hidden") continue;
      var io = observers.get(host);
      if (!io) {
        io = new IntersectionObserver(function (entries) {
          for (var k = 0; k < entries.length; k++) {
            var ctl = entries[k].target.querySelectorAll("button,a");
            for (var j = 0; j < ctl.length; j++) ctl[j].style.visibility = entries[k].intersectionRatio >= 0.05 ? "" : "hidden";
          }
        }, { root: host, threshold: [0, 0.05, 0.25, 0.5, 1] });
        observers.set(host, io);
      }
      io.observe(s);
    }
  }

  window.QIV_APPLY = function (root) {
    try { fixImages(root); fixLinks(root); guardSlides(); } catch (e) {}
  };

  var pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; try { guardSlides(); } catch (e) {} });
  }

  function start() {
    window.QIV_APPLY();
    if ("MutationObserver" in window) {
      new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
