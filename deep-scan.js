// ─────────────────────────────────────────────
// FABRIC LENS — Deep Scan Script
// Injected on-demand when the light scan fails.
// Clicks accordions, expands tabs, waits for SPA content,
// scans embedded state, then returns extracted data.
// ─────────────────────────────────────────────

(async function () {
  "use strict";

  var FIBER_NAMES = [
    "polyester","nylon","acrylic","polyacrylic","polyacrilic",
    "spandex","elastane","lycra","polyamide","polyurethane",
    "polypropylene","modacrylic","microfiber","fleece",
    "olefin","aramid","kevlar","nomex","neoprene",
    "vinylon","vinalon","chlorofibre","elastodiene",
    "carbon fiber","glass fiber","ptfe",
    "econyl","repreve","coolmax","thermolite",
    "cordura","supplex","tactel","sorona",
    "lurex","metallic","elastomultiester",
    "rubber","latex","primaloft","thinsulate",
    "newlife","dyneema","spectra",
    "viscose","rayon","modal","lyocell","tencel",
    "acetate","triacetate","cupro","cupra","bemberg",
    "cuprammonium",
    "ecovero","lenzing","refibra","veocel",
    "seacell","smartcel","excel",
    "soy fiber","milk fiber","corn fiber",
    "pla","ingeo","chitin","chitosan",
    "cotton","linen","flax","hemp","jute","ramie",
    "kapok","bamboo","nettle","kenaf","abaca","sisal","coir",
    "pima cotton","supima","egyptian cotton","sea island cotton",
    "banana fiber","bananatex","pineapple fiber",
    "lotus fiber","lotus","cork",
    "wool","merino","cashmere","mohair","alpaca",
    "angora","camel","yak","qiviut","qiviuk",
    "vicuna","vicuña","llama","guanaco",
    "pashmina","horsehair","mink","rabbit",
    "silk","tussah","tussar",
    "down","feather",
    "leather","suede","nubuck","shearling","sheepskin",
    "pinatex","piñatex","desserto","vegea",
    "appleskin","muskin","mylo",
    "mycelium","spinnova","woocoa",
    "orange fiber","circulose",
    "brewed protein","spiber",
    "bloom","seaqual","infinna","nullarbor",
    "fiber","fibre","filament","yarn"
  ];

  function hasFiber(text) {
    var t = text.toLowerCase();
    for (var i = 0; i < FIBER_NAMES.length; i++) {
      if (t.indexOf(FIBER_NAMES[i]) !== -1) return true;
    }
    return false;
  }

  function hasPctFiber(text) {
    return /\d+\s*%/.test(text) && hasFiber(text);
  }

  function countFibers(text) {
    var t = text.toLowerCase(), c = 0;
    for (var i = 0; i < FIBER_NAMES.length; i++) {
      if (t.indexOf(FIBER_NAMES[i]) !== -1) c++;
    }
    return c;
  }

  function extractFiberNamesFromText(text) {
    var t = text.toLowerCase();
    var found = [], seen = {};
    var sorted = FIBER_NAMES.slice().sort(function(a,b){ return b.length - a.length; });
    for (var i = 0; i < sorted.length; i++) {
      var f = sorted[i];
      if (f === "fiber" || f === "fibre" || f === "filament" || f === "yarn") continue;
      if (t.indexOf(f) !== -1 && !seen[f]) {
        seen[f] = true;
        found.push(f);
        t = t.replace(new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "");
      }
    }
    return found;
  }

  function cleanPrice(text) {
    if (!text) return null;
    var match = text.match(/[\$€£¥₹]\s*[\d,.]+|[\d,.]+\s*[\$€£¥₹]|USD\s*[\d,.]+/);
    return match ? { raw: match[0].trim(), value: parseFloat(match[0].replace(/[^\d.]/g, "")) } : null;
  }

  function sleep(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
  }

  // ═══════════════════════════════════════════════
  //  STEP 1: CLICK ALL ACCORDIONS / TABS / EXPANDERS
  // ═══════════════════════════════════════════════

  var MATERIAL_KEYWORDS = /material|composition|fabric|detail|spec|supplier|about|content|care|beschreibung|matière|composición|zusammensetzung/i;

  async function clickAccordions() {
    var clicked = 0;

    // Native <details> elements
    var detailsEls = document.querySelectorAll("details:not([open])");
    for (var i = 0; i < detailsEls.length; i++) {
      var summary = detailsEls[i].querySelector("summary");
      if (summary && MATERIAL_KEYWORDS.test(summary.textContent)) {
        detailsEls[i].setAttribute("open", "");
        clicked++;
      }
    }

    // Buttons with aria-expanded="false"
    var ariaButtons = document.querySelectorAll('button[aria-expanded="false"]');
    for (var a = 0; a < ariaButtons.length; a++) {
      if (MATERIAL_KEYWORDS.test(ariaButtons[a].textContent)) {
        ariaButtons[a].click();
        clicked++;
      }
    }

    // Tabs that aren't selected
    var tabs = document.querySelectorAll('[role="tab"][aria-selected="false"]');
    for (var t = 0; t < tabs.length; t++) {
      if (MATERIAL_KEYWORDS.test(tabs[t].textContent)) {
        tabs[t].click();
        clicked++;
      }
    }

    // Generic accordion/collapse/expandable elements
    var accordionSelectors = [
      '[class*="accordion"] button', '[class*="accordion"] [role="button"]',
      '[class*="collapse"] button', '[class*="expandable"] button',
      '[data-toggle="collapse"]', '[data-bs-toggle="collapse"]',
      '[class*="disclosure"] button', '[class*="Disclosure"] button',
      'button[class*="toggle"]', 'button[class*="Toggle"]',
      'button[class*="expand"]', 'button[class*="Expand"]',
      // Shopify common patterns
      'button[class*="accordion"]', 'button[class*="Accordion"]',
      '.product__accordion button', '.product-accordion button',
      '[class*="product-detail"] button', '[class*="ProductDetail"] button',
      'summary', // <details> summary elements that might need clicking
      // Generic clickable elements with material keywords
      '[tabindex="0"]'
    ];

    for (var s = 0; s < accordionSelectors.length; s++) {
      try {
        var els = document.querySelectorAll(accordionSelectors[s]);
        for (var e = 0; e < els.length; e++) {
          var el = els[e];
          var txt = (el.textContent || "").trim();
          if (txt.length < 100 && MATERIAL_KEYWORDS.test(txt)) {
            // Check if not already expanded
            var expanded = el.getAttribute("aria-expanded");
            if (expanded === "true") continue;
            el.click();
            clicked++;
          }
        }
      } catch(err) {}
    }

    // Also try force-revealing hidden panels that contain fiber info
    var hiddenPanels = document.querySelectorAll('[aria-hidden="true"], [style*="display: none"], [style*="display:none"], [style*="height: 0"], [style*="height:0px"]');
    for (var h = 0; h < hiddenPanels.length; h++) {
      var panelText = (hiddenPanels[h].textContent || "").trim();
      if (hasFiber(panelText)) {
        hiddenPanels[h].removeAttribute("aria-hidden");
        hiddenPanels[h].style.display = "";
        hiddenPanels[h].style.height = "";
        hiddenPanels[h].style.overflow = "";
        hiddenPanels[h].style.visibility = "visible";
        hiddenPanels[h].style.opacity = "1";
        clicked++;
      }
    }

    return clicked;
  }

  // ═══════════════════════════════════════════════
  //  STEP 2: SCAN EMBEDDED SPA STATE
  // ═══════════════════════════════════════════════

  function deepSearchObject(obj, depth) {
    if (!obj || depth > 10) return null;
    if (typeof obj === "string") {
      if (obj.length > 5 && obj.length < 2000 && hasFiber(obj)) {
        if (hasPctFiber(obj)) return obj;
        // Short value with fiber name (like "Wool/cotton blend")
        if (obj.length < 200) return obj;
      }
      return null;
    }
    if (Array.isArray(obj)) {
      for (var i = 0; i < Math.min(obj.length, 200); i++) {
        var r = deepSearchObject(obj[i], depth + 1);
        if (r) return r;
      }
      return null;
    }
    if (typeof obj === "object") {
      for (var key in obj) {
        if (!obj.hasOwnProperty(key)) continue;
        var k = key.toLowerCase();
        // Priority keys
        if (/composit|material|fabric|fibre|fiber/.test(k)) {
          var val = obj[key];
          if (typeof val === "string" && val.length > 1 && val.length < 2000 && hasFiber(val)) {
            return val;
          }
        }
        // Description/detail fields
        if (/description|detail|spec/.test(k)) {
          var val2 = obj[key];
          if (typeof val2 === "string" && hasFiber(val2)) {
            return val2;
          }
        }
        var r2 = deepSearchObject(obj[key], depth + 1);
        if (r2) return r2;
      }
    }
    return null;
  }

  function scanEmbeddedState() {
    // __NEXT_DATA__
    var nextDataEl = document.querySelector('script#__NEXT_DATA__');
    if (nextDataEl) {
      try {
        var nd = JSON.parse(nextDataEl.textContent);
        var r = deepSearchObject(nd, 0);
        if (r) return r;
      } catch(e) {}
    }

    // Window globals
    var globals = ["__NEXT_DATA__", "__NUXT__", "__INITIAL_STATE__", "__PRELOADED_STATE__", "__APP_STATE__"];
    for (var g = 0; g < globals.length; g++) {
      try {
        if (window[globals[g]]) {
          var r2 = deepSearchObject(window[globals[g]], 0);
          if (r2) return r2;
        }
      } catch(e) {}
    }

    // Inline <script> tags with JSON blobs
    var scripts = document.querySelectorAll('script:not([src])');
    for (var s = 0; s < scripts.length; s++) {
      var txt = (scripts[s].textContent || "").trim();
      if (txt.length < 50 || txt.length > 100000) continue;
      if (!hasFiber(txt)) continue;
      // Try to find JSON objects
      var jsonMatches = txt.match(/\{[^{}]{20,5000}\}/g);
      if (jsonMatches) {
        for (var j = 0; j < Math.min(jsonMatches.length, 50); j++) {
          try {
            var parsed = JSON.parse(jsonMatches[j]);
            var r3 = deepSearchObject(parsed, 0);
            if (r3) return r3;
          } catch(e) {}
        }
      }
    }

    return null;
  }

  // ═══════════════════════════════════════════════
  //  STEP 3: FULL DOM RE-SCAN (post accordion clicks)
  // ═══════════════════════════════════════════════

  function fullDomScan() {
    var best = null, bestScore = 0;

    // Collect title text to avoid matching product names as materials
    var titleText = "";
    var h1El = document.querySelector("h1");
    if (h1El) titleText += " " + (h1El.textContent || "").toLowerCase();
    titleText += " " + document.title.toLowerCase();
    var ogT = document.querySelector('meta[property="og:title"]');
    if (ogT) titleText += " " + (ogT.getAttribute("content") || "").toLowerCase();

    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
      acceptNode: function(n) {
        if (["SCRIPT","STYLE","HEAD","META","LINK","NOSCRIPT","SVG","IFRAME"].indexOf(n.tagName) !== -1)
          return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    var node;
    while ((node = walker.nextNode())) {
      var text = (node.innerText || node.textContent || "").trim();
      if (text.length < 5 || text.length > 5000) continue;
      if (!hasFiber(text)) continue;

      // TITLE EXCLUSION: Skip h1, h2, title-like elements that just contain the product name
      var tag = node.tagName;
      if ((tag === "H1" || tag === "H2" || tag === "H3") && !hasPctFiber(text)) {
        // Heading with fiber name but no percentage — almost certainly a product title
        continue;
      }

      // Skip if text is very similar to the product title (within 20 chars)
      var textLower = text.toLowerCase();
      if (!hasPctFiber(text) && titleText.indexOf(textLower) !== -1 && text.length < 150) {
        continue;
      }

      // Skip breadcrumb-like text (contains "/" separators typical of nav)
      if (/[A-Z][a-z]+\s*\/\s*[A-Z][a-z]+\s*\//.test(text) && !hasPctFiber(text) && text.length > 60) {
        continue;
      }

      var score = countFibers(text) * 10;
      if (text.length < 500) score += 5;
      if (text.length < 200) score += 10;
      if (hasPctFiber(text)) score += 25;
      if (/material|fabric|composition|content/i.test(text.substring(0, 80))) score += 15;
      var attrs = ((node.className||"") + " " + (node.id||"")).toLowerCase();
      if (/material|fabric|composition|description|detail/.test(attrs)) score += 10;

      // Penalize if the fiber name also appears in the title and there's no percentage
      if (!hasPctFiber(text)) {
        var foundFibers = extractFiberNamesFromText(text);
        var allInTitle = foundFibers.length > 0 && foundFibers.every(function(f) {
          return titleText.indexOf(f.toLowerCase()) !== -1;
        });
        if (allInTitle) score -= 30;
      }

      if (score > bestScore) {
        bestScore = score;
        best = text;
      }
    }
    return best;
  }

  /** Label pattern: "Fabric: Wool/cotton blend" or "Material Wool/cotton blend" */
  function labelScan() {
    // Collect title text to exclude from matching
    var titleText = "";
    var h1 = document.querySelector("h1");
    if (h1) titleText += " " + (h1.textContent || "").toLowerCase();
    titleText += " " + document.title.toLowerCase();
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) titleText += " " + (ogTitle.getAttribute("content") || "").toLowerCase();

    var bodyText = (document.body.innerText || "");

    // Pattern 1: With percentage — always trust these
    var pctRegex = /(?:fabrics?|materials?|composition|content|fiber content|fibre content)\s*[:\s]\s*([^\n]{5,300})/gi;
    var match, best = null, bestCount = 0;
    while ((match = pctRegex.exec(bodyText)) !== null) {
      var candidate = match[1].trim();
      var count = countFibers(candidate);
      if (count > bestCount && hasPctFiber(candidate)) {
        best = candidate;
        bestCount = count;
      }
    }
    if (best) return best;

    // Pattern 2: Without percentage — "FabricWool/cotton blend" etc.
    // BUT skip if the match is just repeating the product title
    var looseRegex = /(?:fabrics?|materials?|composition|content)\s*[:\s]*\s*([^\n]{3,200})/gi;
    while ((match = looseRegex.exec(bodyText)) !== null) {
      var candidate2 = match[1].trim();
      candidate2 = candidate2.replace(/^(?:fabric|material|composition|content)\s*/i, "").trim();
      if (candidate2.length < 3 || !hasFiber(candidate2)) continue;

      // TITLE EXCLUSION: Skip if the fiber name found also appears in the product title.
      // e.g. "NYLON mock-NECK JACKET" → title contains "nylon" → skip
      var fibers = extractFiberNamesFromText(candidate2);
      var allInTitle = fibers.length > 0 && fibers.every(function(f) {
        return titleText.indexOf(f.toLowerCase()) !== -1;
      });
      // Also check if the candidate text overlaps substantially with the title
      var candidateLower = candidate2.toLowerCase();
      var looksLikeTitle = titleText.indexOf(candidateLower) !== -1 ||
        candidateLower.indexOf("jacket") !== -1 ||
        candidateLower.indexOf("shirt") !== -1 ||
        candidateLower.indexOf("dress") !== -1 ||
        candidateLower.indexOf("pant") !== -1 ||
        candidateLower.indexOf("coat") !== -1 ||
        candidateLower.indexOf("blouse") !== -1;

      // If fibers are only found because they're in the product name AND the text looks like
      // a title/heading rather than a composition string, skip it
      if (allInTitle && (looksLikeTitle || candidate2.length > 50)) continue;

      // Require that the match comes from a context that looks like a material field,
      // not just any text on the page
      var matchContext = bodyText.substring(Math.max(0, match.index - 30), match.index).toLowerCase();
      var hasLabel = /(?:fabric|material|composition|content|shell|lining|body)\s*$/i.test(matchContext) ||
        /^(?:fabric|material|composition|content)\s*[:\s]/i.test(match[0]);
      if (!hasLabel && allInTitle) continue;

      return candidate2;
    }
    return null;
  }

  // ═══════════════════════════════════════════════
  //  SITE-SPECIFIC API SCANNERS
  // ═══════════════════════════════════════════════

  var HOST = window.location.hostname.toLowerCase();

  /** COS (H&M Group) — extract from __NEXT_DATA__ or fetch product API */
  async function cosApiScan() {
    if (HOST.indexOf("cos.com") === -1) return null;

    // Try 1: __NEXT_DATA__ (H&M group embeds product data here)
    var nextEl = document.querySelector('script#__NEXT_DATA__');
    if (nextEl) {
      try {
        var nd = JSON.parse(nextEl.textContent);
        // H&M Group path: props.pageProps.productPageProps.aemData.productArticleDetails
        var details = nd.props && nd.props.pageProps && nd.props.pageProps.productPageProps &&
          nd.props.pageProps.productPageProps.aemData && nd.props.pageProps.productPageProps.aemData.productArticleDetails;
        if (details) {
          // Check variations for composition/material
          var variations = details.variations || {};
          for (var key in variations) {
            if (!variations.hasOwnProperty(key)) continue;
            var v = variations[key];
            // Check composition field
            if (v.composition && hasFiber(v.composition)) return v.composition;
            // Check materialDetails array
            if (v.materialDetails && Array.isArray(v.materialDetails)) {
              var parts = [];
              for (var m = 0; m < v.materialDetails.length; m++) {
                var md = v.materialDetails[m];
                if (md.name && md.percentage) parts.push(md.percentage + "% " + md.name);
                else if (md.name) parts.push(md.name);
              }
              if (parts.length > 0) return parts.join(", ");
            }
            // Check description for composition text
            if (v.description && hasPctFiber(v.description)) return v.description;
          }
          // Check top-level description
          if (details.description && hasPctFiber(details.description)) return details.description;
        }
        // Generic deep search of __NEXT_DATA__ for composition-like fields
        var result = deepSearchForComposition(nd, 0);
        if (result) return result;
      } catch(e) { console.log("FabricLens COS __NEXT_DATA__ error:", e); }
    }

    // Try 2: Fetch COS product API using article code from URL
    var articleMatch = window.location.pathname.match(/(\d{10,})/);
    if (articleMatch) {
      var articleCode = articleMatch[1];
      try {
        var resp = await fetch("/en-us/product/" + articleCode + ".json", { credentials: "same-origin" });
        if (resp.ok) {
          var data = await resp.json();
          var comp = deepSearchForComposition(data, 0);
          if (comp) return comp;
        }
      } catch(e) {}
      // Try alternate API pattern
      try {
        var resp2 = await fetch("/api/product/" + articleCode, { credentials: "same-origin" });
        if (resp2.ok) {
          var data2 = await resp2.json();
          var comp2 = deepSearchForComposition(data2, 0);
          if (comp2) return comp2;
        }
      } catch(e) {}
    }

    // Try 3: Check window.__INITIAL_STATE__ or similar globals
    var stateGlobals = ["__INITIAL_STATE__", "__PRELOADED_STATE__", "__APP_STATE__",
      "__NEXT_DATA__", "window.__remixContext", "__REMIX_CONTEXT__"];
    for (var g = 0; g < stateGlobals.length; g++) {
      try {
        if (window[stateGlobals[g]]) {
          var r = deepSearchForComposition(window[stateGlobals[g]], 0);
          if (r) return r;
        }
      } catch(e) {}
    }

    return null;
  }

  /** Macy's — fetch from their xapi product endpoint */
  async function macysApiScan() {
    if (HOST.indexOf("macys.com") === -1) return null;

    // Extract product ID from URL (e.g. ?ID=23784058 or /ID=23784058)
    var idMatch = window.location.href.match(/[?&]ID=(\d+)/i) ||
      window.location.href.match(/\/(\d{7,})/);
    if (!idMatch) return null;
    var productId = idMatch[1];

    try {
      var apiUrl = "/xapi/digital/v1/product/" + productId +
        "?currencyCode=USD&_deviceType=DESKTOP&_regionCode=US&_shoppingMode=SITE&_application=SITE";
      var resp = await fetch(apiUrl, {
        credentials: "same-origin",
        headers: { "Accept": "application/json" }
      });
      if (!resp.ok) return null;
      var data = await resp.json();

      // Search for composition in the product data
      // Macy's typically puts it in product.detail.fabricCare or bulletText
      var comp = deepSearchForComposition(data, 0);
      if (comp) return comp;

      // Try specific Macy's paths
      var product = data.product || data;
      if (product.detail) {
        var detail = product.detail;
        if (detail.fabricCare && hasFiber(detail.fabricCare)) return detail.fabricCare;
        if (detail.description && hasPctFiber(detail.description)) return detail.description;
        // bulletText array
        if (detail.bulletText && Array.isArray(detail.bulletText)) {
          for (var b = 0; b < detail.bulletText.length; b++) {
            if (hasPctFiber(detail.bulletText[b])) return detail.bulletText[b];
          }
          for (var b2 = 0; b2 < detail.bulletText.length; b2++) {
            if (hasFiber(detail.bulletText[b2])) return detail.bulletText[b2];
          }
        }
      }
      // Try traits/attributes
      if (product.traits) {
        var traits = product.traits;
        for (var t = 0; t < traits.length; t++) {
          var trait = traits[t];
          if (/material|fabric|composition|fiber/i.test(trait.traitName || trait.name || "")) {
            var val = trait.traitValue || trait.value || "";
            if (hasFiber(val)) return val;
          }
        }
      }
    } catch(e) { console.log("FabricLens Macy's API error:", e); }

    return null;
  }

  /**
   * Deep search an object for composition-related fields.
   * Prioritizes fields named "composition", "materialComposition", "fabricContent", etc.
   * Returns the first good match.
   */
  function deepSearchForComposition(obj, depth) {
    if (!obj || depth > 12) return null;
    if (typeof obj === "string") {
      if (obj.length > 5 && obj.length < 2000 && hasPctFiber(obj)) return obj;
      return null;
    }
    if (Array.isArray(obj)) {
      for (var i = 0; i < Math.min(obj.length, 200); i++) {
        var r = deepSearchForComposition(obj[i], depth + 1);
        if (r) return r;
      }
      return null;
    }
    if (typeof obj === "object") {
      // Priority: check composition-named keys first
      var priorityKeys = ["composition", "materialComposition", "fabricContent", "fiberContent",
        "fabricCare", "materialDetails", "materials", "fabricComposition"];
      for (var pk = 0; pk < priorityKeys.length; pk++) {
        var key = priorityKeys[pk];
        if (obj[key] !== undefined) {
          if (typeof obj[key] === "string" && obj[key].length > 2 && hasFiber(obj[key])) {
            return obj[key];
          }
          if (Array.isArray(obj[key])) {
            // materialDetails: [{name:"Cotton", percentage:"100"}]
            var parts = [];
            for (var a = 0; a < obj[key].length; a++) {
              var item = obj[key][a];
              if (item && typeof item === "object" && item.name) {
                if (item.percentage) parts.push(item.percentage + "% " + item.name);
                else parts.push(item.name);
              } else if (typeof item === "string" && hasFiber(item)) {
                parts.push(item);
              }
            }
            if (parts.length > 0) return parts.join(", ");
          }
        }
      }
      // Then check description/detail keys
      for (var k in obj) {
        if (!obj.hasOwnProperty(k)) continue;
        var kl = k.toLowerCase();
        if (/composit|material|fabric|fibre|fiber/.test(kl)) {
          var val = obj[k];
          if (typeof val === "string" && val.length > 2 && val.length < 2000 && hasFiber(val)) {
            return val;
          }
        }
      }
      // Recurse into all keys
      for (var k2 in obj) {
        if (!obj.hasOwnProperty(k2)) continue;
        var r2 = deepSearchForComposition(obj[k2], depth + 1);
        if (r2) return r2;
      }
    }
    return null;
  }

  // ═══════════════════════════════════════════════
  //  REACT/PREACT FIBER TREE SCAN
  // ═══════════════════════════════════════════════

  /**
   * React stores component state/props on DOM nodes via __reactFiber$xxx
   * or __reactInternalInstance$xxx. We walk the fiber tree looking for
   * props that contain composition data — this catches data from API calls
   * that React has already fetched and stored in component state.
   */
  function scanReactFiber() {
    _fiberCount = 0; // Reset counter for each scan attempt
    var roots = document.querySelectorAll("#root, #__next, #app, [data-reactroot], main, article, [class*='product']");
    if (!roots.length) roots = [document.body];

    for (var r = 0; r < roots.length; r++) {
      var fiberKey = null;
      var keys = Object.keys(roots[r]);
      for (var k = 0; k < keys.length; k++) {
        if (keys[k].startsWith("__reactFiber$") || keys[k].startsWith("__reactInternalInstance$") || keys[k].startsWith("__reactProps$")) {
          fiberKey = keys[k];
          break;
        }
      }
      if (!fiberKey) continue;
      var result = walkFiber(roots[r][fiberKey], 0);
      if (result) return result;
    }

    // Also try product detail elements specifically
    var detailEls = document.querySelectorAll("[class*='product-detail'], [class*='pdp'], [class*='ProductDetail'], [class*='description']");
    for (var d = 0; d < detailEls.length; d++) {
      var dKeys = Object.keys(detailEls[d]);
      for (var dk = 0; dk < dKeys.length; dk++) {
        if (dKeys[dk].startsWith("__reactFiber$") || dKeys[dk].startsWith("__reactInternalInstance$") || dKeys[dk].startsWith("__reactProps$")) {
          var dresult = walkFiber(detailEls[d][dKeys[dk]], 0);
          if (dresult) return dresult;
        }
      }
    }
    return null;
  }

  var _fiberCount = 0;
  var FIBER_LIMIT = 1000;

  function walkFiber(fiber, depth) {
    if (!fiber || depth > 15 || _fiberCount > FIBER_LIMIT) return null;
    _fiberCount++;
    try {
      if (fiber.memoizedProps) {
        var propsResult = deepSearchForComposition(fiber.memoizedProps, 0);
        if (propsResult) return propsResult;
      }
      if (fiber.memoizedState && typeof fiber.memoizedState === "object") {
        var stateResult = deepSearchForComposition(fiber.memoizedState, 0);
        if (stateResult) return stateResult;
      }
      if (fiber.pendingProps && fiber.pendingProps !== fiber.memoizedProps) {
        var ppResult = deepSearchForComposition(fiber.pendingProps, 0);
        if (ppResult) return ppResult;
      }
      var childResult = walkFiber(fiber.child, depth + 1);
      if (childResult) return childResult;
      var sibResult = walkFiber(fiber.sibling, depth + 1);
      if (sibResult) return sibResult;
    } catch(e) {}
    return null;
  }

  // ═══════════════════════════════════════════════
  //  PERFORMANCE API — REPLAY PRODUCT API CALLS
  // ═══════════════════════════════════════════════

  /**
   * Use performance.getEntries() to find XHR/fetch URLs that look like
   * product data endpoints, then re-fetch them to grab composition data.
   */
  async function replayProductApis() {
    var entries;
    try { entries = performance.getEntriesByType("resource"); } catch(e) { return null; }
    if (!entries || !entries.length) return null;

    var apiPattern = /\/api\/|\/v\d+\/|\/product|\/pdp|\/item|graphql|\.json/i;
    var skipPattern = /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico|webp|avif)(\?|$)/i;
    var candidates = [];

    for (var i = 0; i < entries.length; i++) {
      var url = entries[i].name;
      if (!url || entries[i].initiatorType === "img" || entries[i].initiatorType === "css") continue;
      if (skipPattern.test(url)) continue;
      if (apiPattern.test(url)) candidates.push(url);
    }

    // Try the most recent 5 API-looking URLs
    candidates = candidates.slice(-5);

    for (var c = 0; c < candidates.length; c++) {
      try {
        var resp = await fetch(candidates[c], { credentials: "include" });
        if (!resp.ok) continue;
        var contentType = resp.headers.get("content-type") || "";
        if (contentType.indexOf("json") === -1 && contentType.indexOf("text") === -1) continue;
        var body = await resp.text();
        if (body.length < 50 || body.length > 500000) continue;
        if (!hasFiber(body)) continue;
        try {
          var json = JSON.parse(body);
          var result = deepSearchForComposition(json, 0);
          if (result) return result;
        } catch(e) {
          if (hasPctFiber(body)) {
            var fiberMatch = body.match(/\d+\s*%\s*(?:cotton|polyester|nylon|wool|silk|linen|elastane|spandex|viscose|rayon|acrylic|cashmere|modal|lyocell|tencel)[^"]{0,200}/i);
            if (fiberMatch) return fiberMatch[0];
          }
        }
      } catch(e) {}
    }
    return null;
  }

  // ═══════════════════════════════════════════════
  //  BROAD WINDOW GLOBALS SCAN
  // ═══════════════════════════════════════════════

  /**
   * Scan ALL non-default window properties for product data.
   * Many SPAs use custom globals like window.productData, window.__PRODUCT__, etc.
   */
  function scanWindowGlobals() {
    // Known framework globals (already checked in scanEmbeddedState) — skip these
    var skip = new Set(["__NEXT_DATA__","__NUXT__","__INITIAL_STATE__","__PRELOADED_STATE__","__APP_STATE__"]);

    try {
      var keys = Object.keys(window);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (skip.has(key)) continue;
        // Skip standard browser APIs
        if (key.startsWith("on") || key.startsWith("webkit") || key.startsWith("__react") || key.startsWith("__vue")) continue;
        if (/^(location|navigator|screen|history|document|window|self|top|parent|frames|performance|chrome|console|fetch|caches)$/.test(key)) continue;
        try {
          var val = window[key];
          if (!val || typeof val === "function" || typeof val === "string" || typeof val === "number" || typeof val === "boolean") continue;
          if (typeof val === "object") {
            var result = deepSearchForComposition(val, 0);
            if (result) return result;
          }
        } catch(e) {}
      }
    } catch(e) {}
    return null;
  }

  // ═══════════════════════════════════════════════
  //  ORCHESTRATE DEEP SCAN
  // ═══════════════════════════════════════════════

  var materialText = null;

  // ── PHASE 1: Wait for SPA hydration (~2s) ──
  // Most SPAs take 1-3s to hydrate and make their initial API calls.
  // Scanning before this is wasted effort on client-rendered sites.
  await sleep(2000);

  // ── PHASE 2: Read data the SPA has already fetched ──
  // React fiber tree — reads component state/props from any API call
  try { materialText = scanReactFiber(); } catch(e) {}

  // Embedded state objects (__NEXT_DATA__, __NUXT__, etc.)
  if (!materialText) materialText = scanEmbeddedState();

  // Broad window globals (custom SPA state)
  if (!materialText) {
    try { materialText = scanWindowGlobals(); } catch(e) {}
  }

  // Full DOM scan (composition may have rendered by now)
  if (!materialText) materialText = fullDomScan();

  // Label/prose pattern scan
  if (!materialText) materialText = labelScan();

  // ── PHASE 3: Click accordions to reveal hidden composition ──
  // Many sites (COS, H&M, ASOS) hide composition behind expandable sections.
  // These clicks may trigger API calls that load the composition data.
  if (!materialText) {
    var clickCount = await clickAccordions();

    if (clickCount > 0) {
      // Wait for accordion content + any triggered API calls to complete
      await sleep(2000);

      // Re-scan everything after accordion expansion
      try { materialText = scanReactFiber(); } catch(e) {}
      if (!materialText) materialText = fullDomScan();
      if (!materialText) materialText = labelScan();
      if (!materialText) materialText = scanEmbeddedState();
    }
  }

  // ── PHASE 4: Second round — catch sub-accordions and late-loading content ──
  // Some sites have nested accordions (e.g., "Details" → "Composition").
  // The first click round may have revealed new clickable elements.
  if (!materialText) {
    var clickCount2 = await clickAccordions();
    if (clickCount2 > 0) {
      await sleep(1500);
      try { materialText = scanReactFiber(); } catch(e) {}
      if (!materialText) materialText = fullDomScan();
      if (!materialText) materialText = labelScan();
    }
  }

  // ── PHASE 5: Site-specific API fetchers (legacy, last resort) ──
  if (!materialText) {
    try { materialText = await cosApiScan(); } catch(e) {}
  }
  if (!materialText) {
    try { materialText = await macysApiScan(); } catch(e) {}
  }

  // ── PHASE 6: Replay API calls from performance log (last resort) ──
  if (!materialText) {
    try { materialText = await replayProductApis(); } catch(e) {}
  }

  // ═══════════════════════════════════════════════
  //  CLEAN + RETURN
  // ═══════════════════════════════════════════════

  // Clean: prefer lines with percentages
  if (materialText && hasPctFiber(materialText)) {
    var lines = materialText.split(/\n/);
    var good = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line.length > 3 && hasPctFiber(line)) good.push(line);
    }
    if (good.length > 0) materialText = good.join(" ");
  }
  // If no percentages but has fiber names, wrap in NO_PCT format
  else if (materialText && hasFiber(materialText) && !/\d+\s*%/.test(materialText)) {
    var fibers = extractFiberNamesFromText(materialText);
    if (fibers.length > 0) materialText = "NO_PCT:" + fibers.join(",");
    else materialText = null;
  }

  // Extract title + price
  var title = null;
  var titleEl = document.querySelector("h1");
  if (titleEl) title = (titleEl.textContent || "").trim().substring(0, 120);
  if (!title) title = document.title.substring(0, 120);

  var price = null;

  // Price priority 1: Structured data (JSON-LD)
  var ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (var li = 0; li < ldScripts.length && !price; li++) {
    try {
      var ld = JSON.parse(ldScripts[li].textContent || "");
      var ldItems = Array.isArray(ld) ? ld : (ld["@graph"] || [ld]);
      for (var lj = 0; lj < ldItems.length && !price; lj++) {
        var ldItem = ldItems[lj];
        if (!ldItem) continue;
        var ldType = ldItem["@type"];
        var isProduct = ldType === "Product" || (Array.isArray(ldType) && ldType.indexOf("Product") !== -1);
        if (!isProduct) continue;
        if (ldItem.offers) {
          var offers = Array.isArray(ldItem.offers) ? ldItem.offers : [ldItem.offers];
          for (var lk = 0; lk < offers.length; lk++) {
            var offerPrice = offers[lk].price || offers[lk].lowPrice;
            if (offerPrice) {
              var cur = offers[lk].priceCurrency || "";
              var sym = {USD:"$",EUR:"€",GBP:"£",CAD:"CA$",AUD:"A$",JPY:"¥",KRW:"₩"}[cur] || "$";
              price = { raw: sym + offerPrice, value: parseFloat(offerPrice) };
              break;
            }
          }
        }
      }
    } catch(e) {}
  }

  // Price priority 2: Meta tags
  if (!price) {
    var metaSels = ['meta[property="product:price:amount"]','meta[property="og:price:amount"]','meta[name="price"]'];
    for (var mi = 0; mi < metaSels.length && !price; mi++) {
      var mEl = document.querySelector(metaSels[mi]);
      if (mEl) price = cleanPrice(mEl.getAttribute("content") || "");
    }
  }

  // Price priority 3: DOM selectors with promo filtering
  if (!price) {
    var priceSels = ['[itemprop="price"]', '[class*="product-price"]', '[class*="pdp-price"]',
      '[class*="price"]:not([class*="compare"]):not([class*="was"]):not([class*="original"])',
      '.price', '#price'];
    for (var pi = 0; pi < priceSels.length && !price; pi++) {
      try {
        var pEls = document.querySelectorAll(priceSels[pi]);
        for (var pe = 0; pe < pEls.length && !price; pe++) {
          var pText = (pEls[pe].innerText || pEls[pe].textContent || "").trim();
          if (pText.length > 50 || /\b(off|save|was|compare|original|traditional)\b/i.test(pText)) continue;
          price = cleanPrice(pText);
        }
      } catch(e) {}
    }
  }

  var host = window.location.hostname.replace("www.","").split(".")[0];

  return {
    url: window.location.href,
    retailer: host.charAt(0).toUpperCase() + host.slice(1),
    title: title,
    materialText: materialText,
    price: price,
    timestamp: Date.now(),
    deepScan: true
  };

})();
