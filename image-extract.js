// ─────────────────────────────────────────────
// FABRIC LENS — Image URL Extractor
// Injected into the page to grab product image URLs.
// Returns an array of image URLs for the popup to send to vision API.
// ─────────────────────────────────────────────

(function() {
  "use strict";

  var images = [];
  var seen = {};
  var host = window.location.hostname.toLowerCase();

  function addImage(url) {
    if (!url || seen[url]) return;
    // Basic filters
    if (url.indexOf("data:") === 0) return; // skip data URIs
    if (/icon|logo|sprite|pixel|tracking|badge|banner|avatar|profile/i.test(url)) return;
    // Make absolute
    if (url.indexOf("//") === 0) url = "https:" + url;
    if (url.indexOf("/") === 0) url = window.location.origin + url;
    if (url.indexOf("http") !== 0) return;
    seen[url] = true;
    images.push(url);
  }

  // ── eBay: product gallery images ──
  if (host.indexOf("ebay") !== -1) {
    // Main product images (high-res)
    document.querySelectorAll('[data-testid="ux-image-carousel"] img, .ux-image-carousel img').forEach(function(img) {
      var src = img.getAttribute("data-zoom-src") || img.getAttribute("src") || "";
      // eBay uses s-l64 for thumbnails, get s-l1600 for full res
      src = src.replace(/s-l\d+/g, "s-l800");
      addImage(src);
    });
    // Fallback: any large product images
    document.querySelectorAll('#mainImgHldr img, .img-wrapper img, [class*="image-treatment"] img').forEach(function(img) {
      var src = img.getAttribute("src") || "";
      src = src.replace(/s-l\d+/g, "s-l800");
      addImage(src);
    });
    // Gallery thumbnails as fallback
    document.querySelectorAll('[class*="filmstrip"] img, [class*="thumbnail"] img').forEach(function(img) {
      var src = img.getAttribute("src") || "";
      src = src.replace(/s-l\d+/g, "s-l800");
      addImage(src);
    });
  }

  // ── Depop ──
  else if (host.indexOf("depop") !== -1) {
    document.querySelectorAll('[class*="ProductImage"] img, [class*="product-image"] img, main img').forEach(function(img) {
      addImage(img.getAttribute("src") || "");
    });
  }

  // ── Poshmark ──
  else if (host.indexOf("poshmark") !== -1) {
    document.querySelectorAll('[class*="covershot"] img, .carousel img, .listing-image img').forEach(function(img) {
      addImage(img.getAttribute("src") || "");
    });
  }

  // ── Generic: grab all product-area images ──
  // Try specific product image containers first
  var productContainers = document.querySelectorAll(
    '[class*="product-image"], [class*="ProductImage"], [class*="product-gallery"], ' +
    '[class*="ProductGallery"], [class*="pdp-image"], [class*="carousel"], ' +
    '[data-testid*="image"], [class*="gallery"], main'
  );

  productContainers.forEach(function(container) {
    container.querySelectorAll("img").forEach(function(img) {
      var src = img.getAttribute("data-zoom-src") || img.getAttribute("data-src") || img.getAttribute("src") || "";
      var w = img.naturalWidth || parseInt(img.getAttribute("width") || "0");
      var h = img.naturalHeight || parseInt(img.getAttribute("height") || "0");
      // Only grab images that are reasonably sized (not tiny icons)
      if (w > 150 || h > 150 || (!w && !h)) {
        addImage(src);
      }
    });
  });

  // Also check og:image meta tag
  var ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) {
    addImage(ogImage.getAttribute("content") || "");
  }

  // Cap at 6 images to keep API costs reasonable
  return {
    images: images.slice(0, 6),
    title: (document.querySelector("h1") || {}).textContent || document.title,
    url: window.location.href
  };
})();
