// ─────────────────────────────────────────────
// FABRIC LENS — Popup Script (v1.3)
// Three-tier: Light → Deep → Image (Vision AI)
// ─────────────────────────────────────────────

// ── Fiber helpers ──
function classifyFiber(name) {
  var tier = classifyFiberTier(name.toLowerCase());
  if (tier === "premium_natural" || tier === "natural") return "natural";
  if (tier === "innovative_bio") return "innovative";
  if (tier === "good_semi" || tier === "semi_synthetic") return "semi";
  if (tier === "synthetic") return "synthetic";
  return "unknown";
}

function fiberBarClass(type) {
  return { natural:"bar-natural", innovative:"bar-innovative", semi:"bar-semi", synthetic:"bar-synthetic", unknown:"bar-unknown" }[type] || "bar-unknown";
}

function animateRing(score) {
  var offset = 314 - (score / 100) * 314;
  var ring = document.getElementById("ring-fill");
  ring.style.stroke = getScoreLabel(score).color;
  setTimeout(function(){ ring.style.strokeDashoffset = offset; }, 80);
}

// ── Render materials ──
function renderMaterials(materials) {
  var container = document.getElementById("material-bars");
  container.innerHTML = "";
  if (!materials.length) {
    container.innerHTML = '<p style="font-size:12px;color:var(--text-muted)">Could not parse material breakdown.</p>';
    return;
  }

  var hasNullPct = materials.some(function(m) { return m.percentage === null; });
  var sorted = materials.slice().sort(function(a,b) {
    if (a.percentage === null && b.percentage === null) return a.name.localeCompare(b.name);
    if (a.percentage === null) return 1;
    if (b.percentage === null) return -1;
    return b.percentage - a.percentage;
  });

  sorted.forEach(function(m) {
    var type = classifyFiber(m.name);
    var row = document.createElement("div");
    row.className = "material-row";

    if (m.percentage === null) {
      row.innerHTML =
        '<span class="material-name" title="'+m.name+'">'+m.name+'</span>' +
        '<div class="bar-track"><div class="bar-fill '+fiberBarClass(type)+'" style="width:0%"></div></div>' +
        '<span class="material-pct">?%</span>';
      container.appendChild(row);
      requestAnimationFrame(function(){
        setTimeout(function(){ row.querySelector(".bar-fill").style.width = "100%"; row.querySelector(".bar-fill").style.opacity = "0.4"; }, 120);
      });
    } else {
      row.innerHTML =
        '<span class="material-name" title="'+m.name+'">'+m.name+'</span>' +
        '<div class="bar-track"><div class="bar-fill '+fiberBarClass(type)+'" style="width:0%"></div></div>' +
        '<span class="material-pct">'+m.percentage+'%</span>';
      container.appendChild(row);
      requestAnimationFrame(function(){
        setTimeout(function(){ row.querySelector(".bar-fill").style.width = m.percentage+"%"; }, 120);
      });
    }
  });

  if (hasNullPct) {
    var note = document.createElement("p");
    note.style.cssText = "font-size:11px;color:var(--text-muted);margin-top:8px;font-style:italic;";
    note.textContent = "Percentages not listed — breakdown unknown.";
    container.appendChild(note);
  }
}

function scoreDescription(score, materials) {
  if (materials.length === 0) return "No material data available.";
  var hasNullPct = materials.some(function(m) { return m.percentage === null; });
  if (hasNullPct) {
    var types = {};
    materials.forEach(function(m) { var cat = classifyFiber(m.name); types[cat] = (types[cat]||0) + 1; });
    var parts = [];
    if (types.natural) parts.push(types.natural + " natural");
    if (types.innovative) parts.push(types.innovative + " innovative");
    if (types.semi) parts.push(types.semi + " semi-synthetic");
    if (types.synthetic) parts.push(types.synthetic + " synthetic");
    return "Contains " + materials.length + " fiber(s): " + parts.join(", ") + ". Percentages unknown.";
  }
  if (score === null) return "No material data available.";
  var synthetic = 0, natural = 0, semi = 0, innovative = 0;
  materials.forEach(function(m) {
    var cat = classifyFiber(m.name);
    if (cat === "synthetic") synthetic += m.percentage;
    else if (cat === "natural") natural += m.percentage;
    else if (cat === "semi") semi += m.percentage;
    else if (cat === "innovative") innovative += m.percentage;
  });
  if (synthetic === 0 && semi === 0 && innovative === 0) return "100% natural fibers — an excellent choice.";
  if (innovative > 0 && synthetic === 0) return natural+"% natural, "+innovative+"% innovative bio-based.";
  if (synthetic >= 70) return synthetic+"% synthetic fibers. High petroleum content.";
  if (natural >= 70) return natural+"% natural fibers, "+synthetic+"% synthetic.";
  if (semi > 0 && synthetic === 0) return natural+"% natural, "+semi+"% semi-synthetic.";
  return natural+"% natural, "+synthetic+"% synthetic blend.";
}

// ── Render product ──
function renderProduct(data) {
  var materials = parseMaterials(data.materialText || "");
  var score = scoreMaterials(materials);
  var info = getScoreLabel(score);
  var hasNullPct = materials.some(function(m) { return m.percentage === null; });

  hideAllStates();
  document.getElementById("state-product").classList.remove("hidden");

  var badge = data.retailer || "Unknown";
  if (data.deepScan) badge += " (deep)";
  if (data.imageScan) badge += " (vision)";
  document.getElementById("retailer-badge").textContent = badge;
  document.getElementById("product-title").textContent = data.title || "Product";
  document.getElementById("product-price").textContent = (data.price && data.price.raw) ? data.price.raw : "Price not found";

  if (hasNullPct) {
    document.getElementById("score-grade").textContent = "?";
    document.getElementById("score-grade").style.color = "#d4a520";
    document.getElementById("score-num").textContent = "N/A";
    document.getElementById("score-label").textContent = "Incomplete Data";
    document.getElementById("score-label").style.color = "#d4a520";
    document.getElementById("ring-fill").style.stroke = "#d4a520";
    document.getElementById("ring-fill").style.strokeDashoffset = "314";
  } else {
    document.getElementById("score-grade").textContent = info.grade;
    document.getElementById("score-grade").style.color = info.color;
    document.getElementById("score-num").textContent = score !== null ? score+"/100" : "—";
    document.getElementById("score-label").textContent = info.label;
    document.getElementById("score-label").style.color = info.color;
    if (score !== null) animateRing(score);
  }

  document.getElementById("score-desc").textContent = scoreDescription(score, materials);
  renderMaterials(materials);

  var rawDisplay = data.materialText || "No composition text found.";
  if (rawDisplay.indexOf("NO_PCT:") === 0) rawDisplay = rawDisplay.substring(7).split(",").join(", ");
  document.getElementById("raw-text").textContent = rawDisplay;
}

// ── State management ──
function hideAllStates() {
  ["state-loading","state-no-data","state-product","state-deep-scanning","state-image-scanning"].forEach(function(id) {
    document.getElementById(id).classList.add("hidden");
  });
}

function showState(id) { hideAllStates(); document.getElementById(id).classList.remove("hidden"); }

// ── Inject helper ──
async function getActiveTab() {
  var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
}

async function injectScript(tabId, file) {
  var results = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: [file],
    world: "MAIN"
  });
  return (results && results[0]) ? results[0].result : null;
}

// ═══════════════════════════════════════════════
//  AUTO SCAN: Light scan → auto-escalate to deep scan
// ═══════════════════════════════════════════════

async function autoScan() {
  showState("state-loading");
  try {
    var tab = await getActiveTab();
    if (!tab || !tab.id) { showState("state-no-data"); return; }

    // ── Attempt 1: Light scan (fast, non-invasive) ──
    var data = await injectScript(tab.id, "content.js");
    if (data && data.materialText) { renderProduct(data); return; }

    // ── Attempt 2: Light scan retry after 1.5s (for slow server responses) ──
    await new Promise(function(r) { setTimeout(r, 1500); });
    data = await injectScript(tab.id, "content.js");
    if (data && data.materialText) { renderProduct(data); return; }

    // ── Attempt 3: Auto-escalate to deep scan (clicks accordions, scans SPA state) ──
    showState("state-deep-scanning");
    var deepData = await injectScript(tab.id, "deep-scan.js");
    if (deepData && deepData.materialText) { renderProduct(deepData); return; }

    // Nothing found — offer image scan as manual option
    showState("state-no-data");
  } catch (err) {
    console.error("FabricLens autoScan:", err);
    showState("state-no-data");
  }
}

// ═══════════════════════════════════════════════
//  MANUAL DEEP SCAN: User-triggered retry
// ═══════════════════════════════════════════════

async function manualDeepScan() {
  showState("state-deep-scanning");
  try {
    var tab = await getActiveTab();
    if (!tab || !tab.id) { showState("state-no-data"); return; }

    var data = await injectScript(tab.id, "deep-scan.js");
    if (data && data.materialText) {
      renderProduct(data);
    } else {
      showState("state-no-data");
    }
  } catch (err) {
    console.error("FabricLens manualDeepScan:", err);
    showState("state-no-data");
  }
}

// ═══════════════════════════════════════════════
//  TIER 3: Image scan (Vision AI)
// ═══════════════════════════════════════════════

async function imageScan() {
  // Check for API key first
  var stored = await chrome.storage.local.get("anthropicApiKey");
  var apiKey = stored.anthropicApiKey;
  if (!apiKey) {
    alert("Please add your Anthropic API key in FabricLens settings (click ⚙️).");
    return;
  }

  showState("state-image-scanning");

  try {
    var tab = await getActiveTab();
    if (!tab || !tab.id) { showState("state-no-data"); return; }

    // Step 1: Extract image URLs from the page
    var extracted = await injectScript(tab.id, "image-extract.js");
    if (!extracted || !extracted.images || extracted.images.length === 0) {
      alert("No product images found on this page.");
      showState("state-no-data");
      return;
    }

    // Step 2: Fetch images as base64 (up to 4)
    var imageContents = [];
    var imageUrls = extracted.images.slice(0, 4);

    for (var i = 0; i < imageUrls.length; i++) {
      try {
        var resp = await fetch(imageUrls[i]);
        if (!resp.ok) continue;
        var blob = await resp.blob();
        var mimeType = blob.type || "image/jpeg";
        // Only process image types
        if (mimeType.indexOf("image/") !== 0) continue;
        var arrayBuf = await blob.arrayBuffer();
        var bytes = new Uint8Array(arrayBuf);
        var binary = "";
        for (var b = 0; b < bytes.length; b++) binary += String.fromCharCode(bytes[b]);
        var base64 = btoa(binary);
        imageContents.push({
          type: "image",
          source: { type: "base64", media_type: mimeType, data: base64 }
        });
      } catch (e) {
        console.log("FabricLens: Could not fetch image", imageUrls[i], e);
      }
    }

    if (imageContents.length === 0) {
      alert("Could not load any product images.");
      showState("state-no-data");
      return;
    }

    // Step 3: Call Claude Vision API
    var messages = [{
      role: "user",
      content: imageContents.concat([{
        type: "text",
        text: "Look at these product images carefully. I need you to find ANY material composition or fabric content information visible in the images — this could be on care labels, tags, product descriptions shown in the photos, or printed on the garment.\n\nRespond in EXACTLY this format and nothing else:\nMATERIAL: [percentage]% [fiber name], [percentage]% [fiber name]\n\nExamples:\nMATERIAL: 100% cotton\nMATERIAL: 60% cotton, 35% polyester, 5% elastane\nMATERIAL: 80% wool, 20% nylon\n\nIf you can see fiber names but NOT percentages, respond:\nMATERIAL_NAMES: [fiber1], [fiber2]\n\nIf you cannot find any material/fabric information in any of the images, respond exactly:\nNO_MATERIAL_FOUND"
      }])
    }];

    var apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        messages: messages
      })
    });

    if (!apiResponse.ok) {
      var errBody = await apiResponse.text();
      console.error("API error:", apiResponse.status, errBody);
      if (apiResponse.status === 401) {
        alert("Invalid API key. Please check your key in settings (⚙️).");
      } else if (apiResponse.status === 429) {
        alert("Rate limited. Please wait a moment and try again.");
      } else {
        alert("API error: " + apiResponse.status);
      }
      showState("state-no-data");
      return;
    }

    var apiData = await apiResponse.json();
    var responseText = "";
    if (apiData.content) {
      for (var c = 0; c < apiData.content.length; c++) {
        if (apiData.content[c].type === "text") responseText += apiData.content[c].text;
      }
    }

    // Step 4: Parse the response
    var materialText = null;

    // Check for "MATERIAL: 100% cotton" format
    var matMatch = responseText.match(/MATERIAL:\s*(.+)/i);
    if (matMatch) {
      materialText = matMatch[1].trim();
    }
    // Check for "MATERIAL_NAMES: cotton, polyester" format
    else {
      var namesMatch = responseText.match(/MATERIAL_NAMES:\s*(.+)/i);
      if (namesMatch) {
        var names = namesMatch[1].split(",").map(function(n) { return n.trim().toLowerCase(); }).filter(function(n) { return n.length > 0; });
        if (names.length > 0) materialText = "NO_PCT:" + names.join(",");
      }
    }

    if (materialText && materialText !== "NO_MATERIAL_FOUND") {
      // Build result
      var result = {
        url: extracted.url,
        retailer: extracted.title ? extracted.title.split("-")[0].trim().substring(0, 30) : "Unknown",
        title: extracted.title || "Product",
        materialText: materialText,
        price: null,
        imageScan: true,
        timestamp: Date.now()
      };
      renderProduct(result);
    } else {
      alert("Could not find material information in the product images.");
      showState("state-no-data");
    }

  } catch (err) {
    console.error("FabricLens image scan:", err);
    alert("Image scan failed: " + err.message);
    showState("state-no-data");
  }
}

// ── Event listeners ──
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("btn-rescan").addEventListener("click", autoScan);
  document.getElementById("btn-deep-scan-empty").addEventListener("click", manualDeepScan);
  document.getElementById("btn-deep-scan-footer").addEventListener("click", manualDeepScan);
  document.getElementById("btn-image-scan-empty").addEventListener("click", imageScan);
  document.getElementById("btn-image-scan-footer").addEventListener("click", imageScan);
  document.getElementById("btn-settings").addEventListener("click", function() {
    chrome.runtime.openOptionsPage();
  });

  // Check if API key exists and show/hide image scan buttons accordingly
  chrome.storage.local.get("anthropicApiKey", function(data) {
    if (!data.anthropicApiKey) {
      // Show a subtle indicator that image scan needs setup
      document.querySelectorAll(".btn-image-scan").forEach(function(btn) {
        btn.title = "Requires API key — click ⚙️ to set up";
      });
    }
  });

  autoScan();
});
