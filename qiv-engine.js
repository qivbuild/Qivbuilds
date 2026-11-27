/* qiv-engine.js (naya, halka version, ~1 KB)
   Sab pages (index, about, services, byowner, blog, reviews, contact, hours, post-shell) is ko load karte hain.
   Pages window.QIV_APPLY&&QIV_APPLY() call karte hain; yeh file us hook ko define karti hai.
   Yeh khud bhi load hote hi chal jati hai, isliye <script defer> ke saath bhi safe hai. */
(function () {
  "use strict";

  // Sirf screen ke neeche wali images ko lazy karta hai (upar wali/LCP image ko nahi chhedta)
  function fixImages(root) {
    var imgs = (root || document).querySelectorAll("img:not([loading])");
    var vh = window.innerHeight || 800;
    for (var i = 0; i < imgs.length; i++) {
      var im = imgs[i];
      if (im.getAttribute("fetchpriority") === "high") continue;
      var top = im.getBoundingClientRect().top;
      if (top > vh * 1.5) im.setAttribute("loading", "lazy");
      if (!im.hasAttribute("decoding")) im.setAttribute("decoding", "async");
    }
  }

  // target="_blank" links par rel="noopener" (security)
  function fixLinks(root) {
    var links = (root || document).querySelectorAll('a[target="_blank"]');
    for (var i = 0; i < links.length; i++) {
      var rel = (links[i].getAttribute("rel") || "").toLowerCase();
      if (rel.indexOf("noopener") < 0) links[i].setAttribute("rel", (rel + " noopener").trim());
    }
  }

  // Dynamic cards (gallery/blog) render hone ke baad dobara call hona bhi theek hai
  window.QIV_APPLY = function (root) {
    try {
      fixImages(root);
      fixLinks(root);
    } catch (e) {}
  };

  function start() {
    window.QIV_APPLY();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
