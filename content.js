// ─────────────────────────────────────────────
// FABRIC LENS — Content Extraction Script (v1.1)
// This file does NOTHING on its own.
// It is injected on-demand by popup.js when the user clicks the icon.
// It runs once, extracts product data, and returns the result.
// ─────────────────────────────────────────────

(function () {
  "use strict";

  // ═══════════════════════════════════════════════
  //  FIBER VOCABULARY (142 fiber names)
  // ═══════════════════════════════════════════════

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

  var CONTEXT_KEYWORDS = [
    "composition","material","fabric","made of","made from",
    "fiber content","fibre content","cloth","textile",
    "care & material","details & care","product details",
    "about this item","specifications","materials & care",
    "materials and care","composition & care","fabric & care",
    "fabric details","material details","content:",
    "matière","composición","zusammensetzung","composizione"
  ];

  // ═══════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════

  function hasFiberKeyword(text) {
    var t = text.toLowerCase();
    for (var i = 0; i < FIBER_NAMES.length; i++) {
      if (t.indexOf(FIBER_NAMES[i]) !== -1) return true;
    }
    return false;
  }

  function hasContextKeyword(text) {
    var t = text.toLowerCase();
    for (var i = 0; i < CONTEXT_KEYWORDS.length; i++) {
      if (t.indexOf(CONTEXT_KEYWORDS[i]) !== -1) return true;
    }
    return false;
  }

  function hasPercentageWithFiber(text) {
    return /\d+\s*%/.test(text) && hasFiberKeyword(text);
  }

  function countFiberMatches(text) {
    var t = text.toLowerCase();
    var count = 0;
    for (var i = 0; i < FIBER_NAMES.length; i++) {
      if (t.indexOf(FIBER_NAMES[i]) !== -1) count++;
    }
    return count;
  }

  function cleanPrice(text) {
    if (!text) return null;
    text = text.trim();
    // Try standard currency symbol + number patterns
    var match = text.match(/[\$€£¥₹₩₪]\s*[\d,.]+|[\d,.]+\s*[\$€£¥₹₩₪]/);
    if (!match) {
      // Try currency code patterns: USD 39.50, 39.50 USD, CAD 29.99
      match = text.match(/(?:USD|EUR|GBP|CAD|AUD|NZD|SEK|NOK|DKK|CHF|JPY|KRW)\s*[\d,.]+|[\d,.]+\s*(?:USD|EUR|GBP|CAD|AUD|NZD|SEK|NOK|DKK|CHF|JPY|KRW)/i);
    }
    if (!match) {
      // Try "Price: 39.50" or just a bare number if text is short
      if (text.length < 20 && /^\d+[.,]\d{2}$/.test(text.trim())) {
        match = [text.trim()];
      }
    }
    if (!match) return null;
    var raw = match[0].trim();
    // Normalize: remove everything except digits and dots
    var numStr = raw.replace(/[^\d.,]/g, "");
    // Handle European format: 1.234,50 → 1234.50
    if (/\d+\.\d{3},\d{2}$/.test(numStr)) {
      numStr = numStr.replace(/\./g, "").replace(",", ".");
    }
    // Handle comma as thousands separator: 1,234.50 → 1234.50
    else if (/,\d{3}/.test(numStr)) {
      numStr = numStr.replace(/,/g, "");
    }
    // Handle comma as decimal separator: 39,50 → 39.50
    else if (/,\d{2}$/.test(numStr) && numStr.indexOf(".") === -1) {
      numStr = numStr.replace(",", ".");
    }
    var value = parseFloat(numStr);
    if (isNaN(value) || value <= 0) return null;
    // Build a clean display string
    if (!/[\$€£¥₹₩₪]/.test(raw)) raw = "$" + raw;
    return { raw: raw, value: value };
  }

  function cleanMaterialText(raw) {
    if (!raw) return null;
    // Pass through special NO_PCT format
    if (raw.indexOf("NO_PCT:") === 0) return raw;
    var lines = raw.split(/\n/);
    var good = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line.length > 3 && hasPercentageWithFiber(line)) good.push(line);
    }
    if (good.length > 0) return good.join(" ");
    if (hasPercentageWithFiber(raw)) return raw;
    return null;
  }

  // ═══════════════════════════════════════════════
  //  RETAILER + PLATFORM CONFIGS
  // ═══════════════════════════════════════════════

  var RETAILER_CONFIGS = {
    "ebay.com":   { name: "eBay",   mat: [".ux-layout-section--material .ux-textspans", '#viTabs_0_is .ux-labels-values__values-content', '.ux-labels-values--material .ux-labels-values__values', '.ux-labels-values--fabric .ux-labels-values__values', '.itemAttr [data-attrLabel="Material"] .ux-textspans', '.itemAttr [data-attrLabel="Fabric Type"] .ux-textspans', '#itemSpecifics .ux-labels-values__values'], price: ['[data-testid="x-price-primary"] .ux-textspans', '.x-price-primary .ux-textspans', '[itemprop="price"]'], title: ['[data-testid="x-item-title"] .ux-textspans', '.x-item-title .ux-textspans', "h1"] },
    "asos.com":   { name: "ASOS",   mat: ['[class*="product-description"]','[class*="about-me"]',".product-detail"], price: ['[data-id="current-price"]',".current-price"], title: ['[class*="jcdpl"]',"h1"] },
    "zara.com":   { name: "Zara",   mat: [".product-detail-info__content",'[class*="product-detail"] [class*="description"]'], price: ['[class*="price__amount"]',".price"], title: ['[class*="product-detail-info__header-name"]',"h1"] },
    "hm.com":     { name: "H&M",    mat: [".pdp-description",'[class*="product-description"]'], price: ['[class*="ProductPrice"]',".price"], title: ['[class*="ProductName"]',"h1"] },
    "cos.com":    { name: "COS",    mat: ['[class*="product-description"]','[class*="material"]','[class*="composition"]'], price: ['[class*="price"]'], title: ['[class*="product-title"]',"h1"] },
    "amazon.com": { name: "Amazon", mat: ["#productDescription","#feature-bullets"], price: ['[class*="a-price"] .a-offscreen',"#priceblock_ourprice"], title: ["#productTitle","h1"] }
  };

  var PLATFORM_DETECTORS = [
    { name: "Shopify",      detect: function(){ return !!document.querySelector('meta[name="shopify-checkout-api-token"],link[href*="cdn.shopify.com"]'); },
      mat: [".product__description",".product-single__description",".rte",'[class*="product-description"]','[class*="ProductDescription"]',".product-details"], price: ['[class*="product__price"]','[class*="price"]',".money"], title: ['[class*="product__title"]',"h1"] },
    { name: "WooCommerce",  detect: function(){ return !!document.querySelector('body.woocommerce,.woocommerce-page'); },
      mat: [".woocommerce-product-details__short-description",".woocommerce-Tabs-panel","#tab-description"], price: [".woocommerce-Price-amount"], title: [".product_title","h1"] },
    { name: "Magento",      detect: function(){ return !!document.querySelector('body.catalog-product-view'); },
      mat: [".product.attribute.description","#description"], price: ['[data-price-type="finalPrice"] .price'], title: [".page-title .base","h1"] },
    { name: "BigCommerce",  detect: function(){ return !!document.querySelector('[data-content-region]'); },
      mat: ["#tab-description",".productView-description"], price: ['[data-product-price-without-tax]'], title: [".productView-title","h1"] },
    { name: "Squarespace",  detect: function(){ return !!document.querySelector('meta[content*="Squarespace"]'); },
      mat: [".product-description",".ProductItem-details-excerpt"], price: [".product-price",".sqs-money-native"], title: [".ProductItem-details-title","h1"] }
  ];

  var GENERIC_SEL = {
    mat: [
      '[class*="material"]','[class*="composition"]','[class*="fabric"]',
      '[id*="material"]','[id*="composition"]','[id*="fabric"]',
      '[class*="product-description"]','[class*="product-detail"]',
      '[role="tabpanel"]','[class*="tab-content"]','[class*="accordion-content"]',
      '[class*="accordion-body"]','[class*="pdp-description"]','[class*="product-info"]',
      "article","main",".description",".details"
    ],
    price: ['[class*="price"]','[data-testid*="price"]','[itemprop="price"]',".price","#price"],
    title: ["h1",'[class*="product-title"]','[class*="product-name"]','[class*="ProductTitle"]']
  };

  // ═══════════════════════════════════════════════
  //  EXTRACTION FUNCTIONS
  // ═══════════════════════════════════════════════

  function getRetailer() {
    var host = window.location.hostname.replace("www.","");
    for (var key in RETAILER_CONFIGS) {
      if (host.indexOf(key) !== -1) return RETAILER_CONFIGS[key];
    }
    return null;
  }

  function getPlatform() {
    for (var i = 0; i < PLATFORM_DETECTORS.length; i++) {
      try { if (PLATFORM_DETECTORS[i].detect()) return PLATFORM_DETECTORS[i]; } catch(e){}
    }
    return null;
  }

  function extractText(selectors, requireFiber) {
    for (var s = 0; s < selectors.length; s++) {
      try {
        var els = document.querySelectorAll(selectors[s]);
        for (var e = 0; e < els.length; e++) {
          var text = (els[e].innerText || els[e].textContent || "").trim();
          if (text.length < 5 || text.length > 10000) continue;
          if (requireFiber && hasFiberKeyword(text)) return text;
          if (!requireFiber && text.length > 5) return text;
        }
      } catch(e){}
    }
    return null;
  }

  function extractFromStructuredData() {
    var result = { title: null, price: null, materialText: null };
    var ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < ldScripts.length; i++) {
      try {
        var data = JSON.parse(ldScripts[i].textContent || "");
        // Search for Product items in various structures
        var items = [];
        if (Array.isArray(data)) {
          items = data;
        } else if (data["@graph"]) {
          items = data["@graph"];
        } else {
          items = [data];
        }
        for (var j = 0; j < items.length; j++) {
          var item = items[j];
          if (!item) continue;
          var itemType = item["@type"];
          // Handle both "Product" and ["Product", "..."] formats
          var isProduct = itemType === "Product" ||
            (Array.isArray(itemType) && itemType.indexOf("Product") !== -1);
          if (!isProduct) continue;

          if (!result.title && item.name) result.title = item.name;
          if (!result.materialText && item.material) result.materialText = item.material;
          if (item.description && hasPercentageWithFiber(item.description)) {
            if (!result.materialText) result.materialText = item.description;
          }
          if (!result.price && item.offers) {
            var offers = Array.isArray(item.offers) ? item.offers : [item.offers];
            for (var k = 0; k < offers.length; k++) {
              var offer = offers[k];
              // Skip AggregateOffer if individual offers exist
              var offerPrice = offer.price || offer.lowPrice;
              if (offerPrice) {
                var currency = offer.priceCurrency || "";
                var sym = {USD:"$",EUR:"€",GBP:"£",CAD:"CA$",AUD:"A$",SEK:"kr",JPY:"¥",KRW:"₩"}[currency] || "$";
                result.price = { raw: sym + offerPrice, value: parseFloat(offerPrice) };
                break;
              }
            }
          }
        }
      } catch(e){}
    }
    return result;
  }

  function expandDetails() {
    // Native <details> elements — no click needed, just set the attribute
    var details = document.querySelectorAll("details:not([open])");
    for (var i = 0; i < details.length; i++) {
      var summary = details[i].querySelector("summary");
      if (summary && hasContextKeyword(summary.textContent)) {
        details[i].setAttribute("open","");
      }
    }

    // Collapsed buttons and role="button" elements — covers custom accordion triggers
    // (div, span, etc.) that don't use the native <details> element.
    // Note: content.js is synchronous so we can't wait for async fetches after clicking;
    // for nested accordions that load content async, deep-scan.js handles the waiting.
    var ariaEls = document.querySelectorAll('button[aria-expanded="false"], [role="button"][aria-expanded="false"]');
    for (var a = 0; a < ariaEls.length; a++) {
      var el = ariaEls[a];
      var txt = (el.textContent || "").trim();
      if (txt.length < 150 && hasContextKeyword(txt)) {
        // Skip nav/header/footer and add-to-cart buttons
        if (el.closest("nav, header, footer, [role='navigation']")) continue;
        if (/add to cart|add to bag|buy|checkout|wishlist/i.test(txt)) continue;
        el.click();
      }
    }
  }

  function labelPatternScan() {
    var bodyText = (document.body.innerText || "");

    // Pattern 1: Labeled format with colon — "Material: 65% cotton" / "Main: 92% Polyester"
    var labelRegex = /(?:fabrics?|materials?|composition|content|fiber content|fibre content|shell|outer|body|main|lining|upper)\s*[:]\s*([^\n]{5,300})/gi;
    var match, best = null, bestCount = 0;
    while ((match = labelRegex.exec(bodyText)) !== null) {
      var candidate = match[1].trim();
      // Strip section prefixes within the captured text (e.g., "100% Cotton, Trim: 96% Cotton" → take before first section)
      var mainSection = extractMainSection(candidate);
      var count = countFiberMatches(mainSection);
      if (count > bestCount && hasPercentageWithFiber(mainSection)) {
        best = mainSection;
        bestCount = count;
      }
    }
    if (best) return best;

    // Pattern 2: Label concatenated without colon — "Fabric100% pima cotton" / "Fabric details 100% Cotton"
    var nocolonRegex = /(?:fabrics?|materials?|composition)\s*(?:details?)?\s*(\d+\s*%\s*[^\n]{3,200})/gi;
    while ((match = nocolonRegex.exec(bodyText)) !== null) {
      var candidate2 = match[1].trim();
      if (hasPercentageWithFiber(candidate2)) {
        var count2 = countFiberMatches(candidate2);
        if (count2 > bestCount) {
          best = candidate2;
          bestCount = count2;
        }
      }
    }
    if (best) return best;

    // Pattern 3: Prose format — "made from 100% mulberry silk" / "crafted from 65% organic cotton"
    var proseRegex = /(?:made (?:from|of|with|in)|crafted (?:from|in|with)|composed of|constructed (?:from|of|with)|sewn (?:from|in)|woven (?:from|in)|knit (?:from|in|with)|featuring|contains?)\s+([^\n.;]{5,200})/gi;
    while ((match = proseRegex.exec(bodyText)) !== null) {
      var candidate3 = match[1].trim();
      if (hasPercentageWithFiber(candidate3)) {
        var count3 = countFiberMatches(candidate3);
        if (count3 > bestCount) {
          best = candidate3;
          bestCount = count3;
        }
      }
    }
    if (best) return best;

    // Pattern 4: Bullet point format — "• 100% cotton" or "- 100% organic cotton"
    var bulletRegex = /(?:^|\n)\s*[•\-\*·]\s*(\d+(?:[.,]\d+)?\s*%\s*[^\n]{3,150})/gm;
    while ((match = bulletRegex.exec(bodyText)) !== null) {
      var candidate4 = match[1].trim();
      if (hasPercentageWithFiber(candidate4)) return candidate4;
    }

    return null;
  }

  /**
   * Extract the main/primary section from multi-section composition text.
   * "100% Cotton, Trim: 96% Cotton, 4% Spandex" → "100% Cotton"
   * "Body: 100% Cotton, Lining: 100% Polyester" → "100% Cotton" (body section)
   */
  function extractMainSection(text) {
    var sectionNames = "body|main|shell|outer|upper|self|trim|lining|inner|filling|collar|cuff|pocket|rib|skirt|sleeve|hood|panel";
    var sectionPattern = new RegExp("(?:^|[,;.]\\s*)(?:" + sectionNames + ")\\s*:", "i");
    if (sectionPattern.test(text)) {
      var splitRegex = new RegExp("[,;.]\\s*(?=(?:" + sectionNames + ")\\s*:)", "gi");
      var sections = text.split(splitRegex);
      return sections[0].replace(new RegExp("^(?:" + sectionNames + ")\\s*:\\s*", "i"), "").trim();
    }
    return text;
  }

  function deepScan() {
    // Collect title text to exclude from matching
    var titleText = "";
    var h1El = document.querySelector("h1");
    if (h1El) titleText += " " + (h1El.textContent || "").toLowerCase();
    titleText += " " + document.title.toLowerCase();
    var ogT = document.querySelector('meta[property="og:title"]');
    if (ogT) titleText += " " + (ogT.getAttribute("content") || "").toLowerCase();

    var candidates = [];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
      acceptNode: function(node) {
        if (["SCRIPT","STYLE","HEAD","META","LINK","NOSCRIPT","SVG","IFRAME"].indexOf(node.tagName) !== -1)
          return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while ((node = walker.nextNode())) {
      var text = (node.innerText || node.textContent || "").trim();
      if (text.length < 8 || text.length > 5000) continue;
      var fiberCount = countFiberMatches(text);
      if (fiberCount < 1) continue;

      // Skip headings that contain fiber names but no percentages (likely product titles)
      var tag = node.tagName;
      if ((tag === "H1" || tag === "H2" || tag === "H3") && !hasPercentageWithFiber(text)) continue;

      // Skip text that matches the product title without percentages
      var textLower = text.toLowerCase();
      if (!hasPercentageWithFiber(text) && titleText.indexOf(textLower) !== -1 && text.length < 150) continue;

      var score = fiberCount * 10;
      if (text.length < 500) score += 5;
      if (text.length < 200) score += 5;
      if (hasContextKeyword(text)) score += 15;
      if (hasPercentageWithFiber(text)) score += 20;
      var attrs = ((node.className||"") + " " + (node.id||"")).toLowerCase();
      if (/material|fabric|composition|description|detail/.test(attrs)) score += 10;

      // Penalize if all fibers found also appear in the product title (without percentages)
      if (!hasPercentageWithFiber(text)) {
        var allInTitle = true;
        var tLower = text.toLowerCase();
        for (var f = 0; f < FIBER_NAMES.length; f++) {
          if (tLower.indexOf(FIBER_NAMES[f]) !== -1 && titleText.indexOf(FIBER_NAMES[f]) === -1) {
            allInTitle = false;
            break;
          }
        }
        if (allInTitle && fiberCount > 0) score -= 30;
      }

      candidates.push({ text: text, score: score, len: text.length });
    }
    if (!candidates.length) return null;
    candidates.sort(function(a,b){ return b.score - a.score || a.len - b.len; });
    return candidates[0].text;
  }

  function altMetaScan() {
    var imgs = document.querySelectorAll("img[alt]");
    for (var i = 0; i < imgs.length; i++) {
      var alt = imgs[i].getAttribute("alt") || "";
      if (alt.length > 20 && hasPercentageWithFiber(alt)) return alt;
    }
    var meta = document.querySelector('meta[name="description"],meta[property="og:description"]');
    if (meta) {
      var c = meta.getAttribute("content")||"";
      if (hasPercentageWithFiber(c)) return c;
    }
    return null;
  }

  // ═══════════════════════════════════════════════
  //  EBAY ITEM SPECIFICS + NO-PERCENTAGE EXTRACTION
  // ═══════════════════════════════════════════════

  /** eBay puts material info in structured label/value pairs in Item Specifics */
  function extractEbayItemSpecifics() {
    // Modern eBay layout: ux-labels-values pairs
    var labelRows = document.querySelectorAll(".ux-labels-values");
    for (var i = 0; i < labelRows.length; i++) {
      var label = labelRows[i].querySelector(".ux-labels-values__labels .ux-textspans");
      if (!label) continue;
      var labelText = (label.textContent || "").trim().toLowerCase();
      if (/^(material|fabric|fabric type|fiber content|fibre content|composition|shell|lining)$/i.test(labelText)) {
        var valueEl = labelRows[i].querySelector(".ux-labels-values__values .ux-textspans");
        if (valueEl) {
          var val = (valueEl.textContent || "").trim();
          if (val.length > 1 && val.length < 500) return val;
        }
      }
    }
    // Legacy eBay: itemSpecifics table
    var specRows = document.querySelectorAll("#itemSpecifics tr, .itemAttr tr");
    for (var j = 0; j < specRows.length; j++) {
      var cells = specRows[j].querySelectorAll("td, th");
      if (cells.length >= 2) {
        var lbl = (cells[0].textContent || "").trim().toLowerCase();
        if (/material|fabric|composition|fiber|fibre/.test(lbl)) {
          var v = (cells[1].textContent || "").trim();
          if (v.length > 1 && v.length < 500) return v;
        }
      }
    }
    return null;
  }

  /** 
   * Scan for fiber names mentioned without percentages.
   * Returns "NO_PCT:cotton,polyester" to signal unknown percentages.
   */
  function fiberNamesOnlyScan() {
    var host = window.location.hostname.toLowerCase();

    // eBay item specifics first
    if (host.indexOf("ebay") !== -1) {
      var ebayVal = extractEbayItemSpecifics();
      if (ebayVal && hasFiberKeyword(ebayVal)) {
        if (hasPercentageWithFiber(ebayVal)) return ebayVal;
        var foundFibers = extractFiberNamesFromText(ebayVal);
        if (foundFibers.length > 0) return "NO_PCT:" + foundFibers.join(",");
      }
    }

    // Generic: label/value patterns with fibers but no percentages
    var labelRegex = /(?:material|fabric|fabric type|composition|fiber content|fibre content)\s*[:\-]\s*([^\n]{2,200})/gi;
    var bodyText = (document.body.innerText || "");
    var match;
    while ((match = labelRegex.exec(bodyText)) !== null) {
      var candidate = match[1].trim();
      if (hasFiberKeyword(candidate) && !/\d+\s*%/.test(candidate)) {
        var fibers = extractFiberNamesFromText(candidate);
        if (fibers.length > 0) return "NO_PCT:" + fibers.join(",");
      }
    }
    return null;
  }

  /** Extract recognized fiber names from a text string */
  function extractFiberNamesFromText(text) {
    var t = text.toLowerCase();
    var found = [];
    var seen = {};
    var sorted = FIBER_NAMES.slice().sort(function(a,b){ return b.length - a.length; });
    for (var i = 0; i < sorted.length; i++) {
      var fiber = sorted[i];
      if (fiber === "fiber" || fiber === "fibre" || fiber === "filament" || fiber === "yarn") continue;
      if (t.indexOf(fiber) !== -1 && !seen[fiber]) {
        seen[fiber] = true;
        found.push(fiber);
        t = t.replace(new RegExp(fiber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "");
      }
    }
    return found;
  }

  // ═══════════════════════════════════════════════
  //  SPA STATE SCANNING (non-invasive, no clicks/waits)
  // ═══════════════════════════════════════════════

  /**
   * Recursively search an object for composition-related fields.
   * Returns the first string value that contains fiber + percentage data.
   */
  function deepSearchObj(obj, depth) {
    if (!obj || depth > 10) return null;
    if (typeof obj === "string") {
      if (obj.length > 5 && obj.length < 2000 && hasPercentageWithFiber(obj)) return obj;
      return null;
    }
    if (Array.isArray(obj)) {
      for (var i = 0; i < Math.min(obj.length, 100); i++) {
        var r = deepSearchObj(obj[i], depth + 1);
        if (r) return r;
      }
      return null;
    }
    if (typeof obj === "object") {
      // Priority: check composition-named keys first
      var priorityKeys = ["composition", "materialComposition", "fabricContent",
        "fiberContent", "fabricComposition", "materials", "materialDetails"];
      for (var pk = 0; pk < priorityKeys.length; pk++) {
        var pv = obj[priorityKeys[pk]];
        if (typeof pv === "string" && pv.length > 2 && pv.length < 2000 && hasFiberKeyword(pv)) return pv;
        if (Array.isArray(pv)) {
          var parts = [];
          for (var a = 0; a < pv.length; a++) {
            if (pv[a] && typeof pv[a] === "object" && pv[a].name) {
              parts.push(pv[a].percentage ? pv[a].percentage + "% " + pv[a].name : pv[a].name);
            } else if (typeof pv[a] === "string" && hasFiberKeyword(pv[a])) {
              parts.push(pv[a]);
            }
          }
          if (parts.length > 0) return parts.join(", ");
        }
      }
      // Then check any key with fiber-related name
      for (var k in obj) {
        if (!obj.hasOwnProperty(k)) continue;
        if (/composit|material|fabric|fibre|fiber/i.test(k)) {
          var v = obj[k];
          if (typeof v === "string" && v.length > 2 && v.length < 2000 && hasFiberKeyword(v)) return v;
        }
      }
      // Recurse
      for (var k2 in obj) {
        if (!obj.hasOwnProperty(k2)) continue;
        var r2 = deepSearchObj(obj[k2], depth + 1);
        if (r2) return r2;
      }
    }
    return null;
  }

  /** Scan embedded SPA state: __NEXT_DATA__, __NUXT__, inline JSON blobs */
  function scanSpaState() {
    // __NEXT_DATA__ (Next.js)
    var nextEl = document.querySelector("script#__NEXT_DATA__");
    if (nextEl) {
      try {
        var nd = JSON.parse(nextEl.textContent);
        var r = deepSearchObj(nd, 0);
        if (r) return r;
      } catch(e) {}
    }

    // Window globals
    var globals = ["__NEXT_DATA__", "__NUXT__", "__INITIAL_STATE__", "__PRELOADED_STATE__", "__APP_STATE__"];
    for (var g = 0; g < globals.length; g++) {
      try {
        if (window[globals[g]]) {
          var r2 = deepSearchObj(window[globals[g]], 0);
          if (r2) return r2;
        }
      } catch(e) {}
    }

    // Inline <script> tags containing JSON with fiber data
    var scripts = document.querySelectorAll("script:not([src])");
    for (var s = 0; s < scripts.length; s++) {
      var txt = (scripts[s].textContent || "").trim();
      if (txt.length < 50 || txt.length > 100000) continue;
      if (scripts[s].type === "application/ld+json") continue; // already handled
      if (!hasFiberKeyword(txt)) continue;
      var jsonMatches = txt.match(/\{[^{}]{20,5000}\}/g);
      if (jsonMatches) {
        for (var j = 0; j < Math.min(jsonMatches.length, 30); j++) {
          try {
            var parsed = JSON.parse(jsonMatches[j]);
            var r3 = deepSearchObj(parsed, 0);
            if (r3) return r3;
          } catch(e) {}
        }
      }
    }

    return null;
  }

  /** Scan React/Preact fiber tree for composition in component props/state */
  function scanReactFiber() {
    _fiberNodesVisited = 0; // Reset counter
    var roots = document.querySelectorAll("#root, #__next, #app, [data-reactroot], main, [class*='product']");
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
      var result = walkFiberLight(roots[r][fiberKey], 0);
      if (result) return result;
    }
    return null;
  }

  var _fiberNodesVisited = 0;
  var FIBER_NODE_LIMIT = 500;

  function walkFiberLight(fiber, depth) {
    if (!fiber || depth > 12 || _fiberNodesVisited > FIBER_NODE_LIMIT) return null;
    _fiberNodesVisited++;
    try {
      if (fiber.memoizedProps) {
        var pr = deepSearchObj(fiber.memoizedProps, 0);
        if (pr) return pr;
      }
      if (fiber.memoizedState && typeof fiber.memoizedState === "object") {
        var sr = deepSearchObj(fiber.memoizedState, 0);
        if (sr) return sr;
      }
      var cr = walkFiberLight(fiber.child, depth + 1);
      if (cr) return cr;
      var sibr = walkFiberLight(fiber.sibling, depth + 1);
      if (sibr) return sibr;
    } catch(e) {}
    return null;
  }

  /** Scan non-standard window globals for product data */
  function scanWindowGlobals() {
    var skip = new Set(["__NEXT_DATA__","__NUXT__","__INITIAL_STATE__","__PRELOADED_STATE__","__APP_STATE__"]);
    try {
      var keys = Object.keys(window);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (skip.has(key)) continue;
        if (key.startsWith("on") || key.startsWith("webkit") || key.startsWith("__react") || key.startsWith("__vue")) continue;
        if (/^(location|navigator|screen|history|document|window|self|top|parent|frames|performance|chrome|console|fetch|caches)$/.test(key)) continue;
        try {
          var val = window[key];
          if (!val || typeof val === "function" || typeof val === "string" || typeof val === "number" || typeof val === "boolean") continue;
          if (typeof val === "object") {
            var result = deepSearchObj(val, 0);
            if (result) return result;
          }
        } catch(e) {}
      }
    } catch(e) {}
    return null;
  }

  // ═══════════════════════════════════════════════
  //  MAIN EXTRACTION PIPELINE
  // ═══════════════════════════════════════════════

  function extractMaterialText() {
    var raw = null;
    var retailer = getRetailer();
    var platform = getPlatform();

    // 1: Retailer selectors
    if (retailer) {
      var t = extractText(retailer.mat, true);
      if (t && hasPercentageWithFiber(t)) raw = t;
    }
    // 1b: eBay item specifics (structured, most reliable for eBay)
    if (!raw && window.location.hostname.indexOf("ebay") !== -1) {
      var ebayText = extractEbayItemSpecifics();
      if (ebayText) {
        if (hasPercentageWithFiber(ebayText)) {
          raw = ebayText;
        } else if (hasFiberKeyword(ebayText)) {
          var fibers = extractFiberNamesFromText(ebayText);
          if (fibers.length > 0) raw = "NO_PCT:" + fibers.join(",");
        }
      }
    }
    // 2: Platform selectors
    if (!raw && platform) {
      var t2 = extractText(platform.mat, true);
      if (t2 && hasPercentageWithFiber(t2)) raw = t2;
    }
    // 3: Structured data (JSON-LD)
    if (!raw) {
      var sd = extractFromStructuredData();
      if (sd.materialText) raw = sd.materialText;
    }
    // 3b: SPA embedded state (__NEXT_DATA__, __NUXT__, inline JSON)
    if (!raw) {
      try { raw = scanSpaState(); } catch(e) {}
    }
    // 3c: React/Preact fiber tree (component props/state from API calls)
    if (!raw) {
      try { raw = scanReactFiber(); } catch(e) {}
    }
    // 3d: Non-standard window globals
    if (!raw) {
      try { raw = scanWindowGlobals(); } catch(e) {}
    }
    // 4: Generic selectors
    if (!raw) {
      var t3 = extractText(GENERIC_SEL.mat, true);
      if (t3 && hasPercentageWithFiber(t3)) raw = t3;
    }
    // 5: Expand <details> and retry
    if (!raw) {
      expandDetails();
      var t4 = extractText(GENERIC_SEL.mat, true);
      if (t4 && hasPercentageWithFiber(t4)) raw = t4;
    }
    // 6: Label pattern
    if (!raw) raw = labelPatternScan();
    // 7: Deep scan
    if (!raw) raw = deepScan();
    // 8: Alt/meta scan
    if (!raw) raw = altMetaScan();

    // 9: Fiber names without percentages (eBay item specifics, label/value pairs)
    if (!raw) raw = fiberNamesOnlyScan();

    return cleanMaterialText(raw);
  }

  function extractPrice() {
    // ── 1. STRUCTURED DATA (most reliable — works across all sites) ──
    var sd = extractFromStructuredData();
    if (sd.price) return sd.price;

    // ── 2. META TAGS (often present even on SPAs before JS hydration) ──
    var metaTags = [
      'meta[property="product:price:amount"]',
      'meta[property="og:price:amount"]',
      'meta[property="product:price"]',
      'meta[name="price"]',
      'meta[name="twitter:data1"]'
    ];
    for (var m = 0; m < metaTags.length; m++) {
      var metaEl = document.querySelector(metaTags[m]);
      if (metaEl) {
        var mc = metaEl.getAttribute("content") || "";
        if (mc) {
          // Meta content might be just a number like "39.50"
          var metaPrice = cleanPrice(mc);
          if (!metaPrice && /^\d+[\d,.]*$/.test(mc.trim())) {
            metaPrice = { raw: "$" + mc.trim(), value: parseFloat(mc.trim()) };
          }
          if (metaPrice && metaPrice.value > 0) return metaPrice;
        }
      }
    }

    // ── 3. RETAILER-SPECIFIC SELECTORS ──
    var retailer = getRetailer();
    if (retailer && retailer.price) {
      var rp = extractPriceFromSelectors(retailer.price);
      if (rp) return rp;
    }

    // ── 4. PLATFORM-SPECIFIC SELECTORS ──
    var platform = getPlatform();
    if (platform && platform.price) {
      var pp = extractPriceFromSelectors(platform.price);
      if (pp) return pp;
    }

    // ── 5. SMART GENERIC EXTRACTION ──
    // Query ALL elements matching price selectors, score them, pick the best
    var candidates = [];
    var genericPriceSelectors = [
      '[class*="price"]:not([class*="compare"]):not([class*="was"]):not([class*="original"]):not([class*="old"])',
      '[data-testid*="price"]',
      '[itemprop="price"]',
      '.price',
      '#price',
      '[class*="Price"]',
      '[class*="product-price"]',
      '[class*="pdp-price"]',
      '[class*="sales"] [class*="value"]',
      '[data-price]'
    ];

    for (var g = 0; g < genericPriceSelectors.length; g++) {
      try {
        var els = document.querySelectorAll(genericPriceSelectors[g]);
        for (var e = 0; e < els.length; e++) {
          var el = els[e];
          var text = (el.innerText || el.textContent || "").trim();
          // Also check data-price attribute
          var dataPrice = el.getAttribute("data-price") || el.getAttribute("content") || "";
          var priceText = text || dataPrice;

          if (!priceText || priceText.length > 100) continue;

          var parsed = cleanPrice(priceText);
          if (!parsed || parsed.value <= 0 || parsed.value > 50000) continue;

          // Score this candidate
          var score = 10;

          // PENALTIES — skip promotional/discount text
          var textLower = priceText.toLowerCase();
          if (/\b(off|save|was|regular|compare|original|retail|msrp|from)\b/i.test(textLower)) score -= 20;
          if (/\d+\s*%\s*off/i.test(textLower)) score -= 30;
          if (/free shipping|shipping/i.test(textLower)) score -= 15;
          if (text.split("$").length > 2) score -= 10; // Multiple prices in one element

          // Check parent/ancestor classes for promo indicators
          var parentClasses = "";
          var p = el;
          for (var depth = 0; depth < 3 && p; depth++) {
            parentClasses += " " + ((p.className || "") + " " + (p.id || "")).toLowerCase();
            p = p.parentElement;
          }
          if (/compare|was|original|old|strike|crossed|discount|saving|badge|banner|promo/i.test(parentClasses)) score -= 15;

          // BONUSES — signs this is the real product price
          var elClasses = ((el.className || "") + " " + (el.id || "")).toLowerCase();
          if (/current|sale|final|now|actual|selling/i.test(elClasses)) score += 10;
          if (/product.price|pdp.price|item.price/i.test(elClasses.replace(/[-_]/g, "."))) score += 15;
          if (el.getAttribute("itemprop") === "price") score += 15;
          if (el.getAttribute("data-price")) score += 10;

          // Prefer elements near add-to-cart or product-title
          var nearProduct = el.closest('[class*="product"], [class*="pdp"], [class*="detail"], main, article');
          if (nearProduct) score += 5;

          // Prefer shorter text (just the price, not a paragraph)
          if (priceText.length < 15) score += 5;
          if (priceText.length < 8) score += 5;

          if (score > 0) {
            candidates.push({ price: parsed, score: score });
          }
        }
      } catch(e){}
    }

    // Pick highest-scoring candidate
    if (candidates.length > 0) {
      candidates.sort(function(a, b) { return b.score - a.score; });
      return candidates[0].price;
    }

    return null;
  }

  /** Extract price from a specific selector list (retailer/platform) */
  function extractPriceFromSelectors(selectors) {
    for (var i = 0; i < selectors.length; i++) {
      try {
        var els = document.querySelectorAll(selectors[i]);
        for (var e = 0; e < els.length; e++) {
          var text = (els[e].innerText || els[e].textContent || els[e].getAttribute("content") || "").trim();
          if (!text || text.length > 100) continue;
          // Skip if it looks promotional
          if (/\b(off|save|was|compare|original)\b/i.test(text)) continue;
          var p = cleanPrice(text);
          if (p && p.value > 0) return p;
        }
      } catch(e){}
    }
    return null;
  }

  function extractTitle() {
    var retailer = getRetailer();
    var platform = getPlatform();
    var selectors = (retailer ? retailer.title : [])
      .concat(platform ? platform.title : [])
      .concat(GENERIC_SEL.title);
    var t = extractText(selectors, false);
    if (t) return t.substring(0, 120);
    var sd = extractFromStructuredData();
    if (sd.title) return sd.title.substring(0, 120);
    return document.title.substring(0, 120);
  }

  // ═══════════════════════════════════════════════
  //  RETURN RESULT — this is what gets sent back to popup.js
  // ═══════════════════════════════════════════════

  var retailer = getRetailer();
  var platform = getPlatform();
  var host = window.location.hostname.replace("www.","").split(".")[0];

  return {
    url: window.location.href,
    retailer: retailer ? retailer.name : (platform ? platform.name : host.charAt(0).toUpperCase() + host.slice(1)),
    title: extractTitle(),
    materialText: extractMaterialText(),
    price: extractPrice(),
    timestamp: Date.now()
  };

})();
