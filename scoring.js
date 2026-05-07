// ─────────────────────────────────────────────
// FABRIC LENS — Scoring Engine (v2.0)
// Comprehensive fiber database with 100+ materials
// ─────────────────────────────────────────────

// ═══════════════════════════════════════════════
//  FIBER CLASSIFICATION LISTS
// ═══════════════════════════════════════════════

// ── SYNTHETIC: Petroleum/chemical-derived, score = 0.0 ──
const SYNTHETIC_FIBERS = [
  // Core synthetics
  "polyester", "nylon", "acrylic", "polyacrylic", "polyacrilic",
  "spandex", "elastane", "lycra", "polyamide", "polyurethane",
  "polypropylene", "modacrylic", "microfiber", "fleece",
  // Technical / performance synthetics
  "olefin", "aramid", "kevlar", "nomex", "neoprene",
  "vinylon", "vinalon", "chlorofibre", "elastodiene",
  "carbon fiber", "glass fiber", "ptfe", "pvc",
  // Brand-name synthetics (appear on labels)
  "econyl", "repreve", "coolmax", "thermolite",
  "cordura", "supplex", "tactel", "sorona",
  "gore-tex", "goretex", "dyneema", "spectra",
  "newlife", "primaloft", "thinsulate",
  // Metallic / mineral
  "lurex", "metallic", "metal fiber", "elastomultiester",
  // Rubber-based
  "rubber", "latex", "silicone", "elastodiene"
];

// ── SEMI-SYNTHETIC: Cellulose/plant-pulp regenerated, score = 0.4 ──
const SEMI_SYNTHETIC = [
  // Classic regenerated cellulosics
  "viscose", "rayon", "modal", "lyocell", "tencel",
  "acetate", "triacetate", "cupro", "cupra", "bemberg",
  "cuprammonium", "cuprammonium rayon",
  // Branded sustainable semi-synthetics
  "ecovero", "lenzing", "refibra", "veocel",
  // Specialty regenerated fibers
  "seacell", "smartcel", "excel",
  "orange fiber", "soy fiber", "milk fiber",
  "corn fiber", "pla", "ingeo",
  "chitin", "chitosan"
];

// ── NATURAL: Plant-based fibers, score = 0.9 ──
const NATURAL_FIBERS = [
  // Plant-based (seed)
  "cotton", "organic cotton", "kapok", "coir",
  "pima cotton", "supima", "egyptian cotton", "sea island cotton",
  // Plant-based (bast/stem)
  "linen", "flax", "hemp", "jute", "ramie", "nettle",
  "kenaf", "abaca", "sisal",
  // Plant-based (leaf/fruit)
  "bamboo", "banana fiber", "bananatex", "pineapple fiber",
  "lotus fiber", "lotus",
  // Animal-based (hair/fur)
  "wool", "merino", "cashmere", "mohair", "alpaca",
  "angora", "camel", "yak", "qiviut", "qiviuk",
  "vicuna", "vicuña", "llama", "guanaco",
  "pashmina", "shahtoosh",
  "horsehair", "mink", "rabbit",
  // Animal-based (other)
  "silk", "peace silk", "ahimsa silk", "tussah", "tussar",
  "down", "feather",
  // Leather & hides (when listed as material)
  "leather", "suede", "nubuck", "shearling", "sheepskin",
  // Cork
  "cork"
];

// ── PREMIUM NATURAL: Best-scoring fibers, score = 1.0 ──
const PREMIUM_NATURAL = [
  // High-quality / sustainable plant fibers
  "organic cotton", "hemp", "linen", "flax", "bamboo",
  "pima cotton", "supima", "egyptian cotton", "sea island cotton",
  "nettle", "ramie", "abaca", "lotus fiber", "lotus",
  // Premium animal fibers
  "wool", "merino", "cashmere", "alpaca", "mohair",
  "vicuna", "vicuña", "yak", "qiviut", "qiviuk",
  "silk", "peace silk", "ahimsa silk", "pashmina",
  // Certified / responsible variants
  "responsible wool", "responsible alpaca", "responsible mohair",
  "mulesing free wool", "mulesing-free wool", "mulesing free merino",
  "responsible down", "rds down",
  // Cork (renewable, biodegradable)
  "cork"
];

// ── INNOVATIVE BIO-BASED: Next-gen sustainable materials, score = 0.65 ──
// These are newer materials that are more sustainable than synthetics
// but still involve significant processing
const INNOVATIVE_BIO = [
  // Leather alternatives (plant/bio-based)
  "pinatex", "piñatex", "desserto", "vegea",
  "appleskin", "apple skin", "muskin", "mylo",
  "mushroom leather", "mycelium", "cactus leather",
  "grape leather", "mango leather", "leaf leather",
  // Bio-fabricated fibers
  "spinnova", "woocoa", "bananatex",
  "orange fiber", "circulose",
  "brewed protein", "spiber",
  "s.cafe", "scafe",
  "bloom foam", "bloom", "seaqual",
  // Recycled natural origin
  "regenerated cotton", "regenerated wool",
  "refibra", "infinna", "nullarbor",
  // Recycled synthetics — diverts plastic from landfill, lower carbon than virgin
  "recycled polyester", "recycled nylon", "recycled cotton", "recycled wool",
  "recycled cashmere", "recycled down", "recycled acrylic"
];

// ── GOOD SEMI-SYNTHETIC: More sustainably produced, score = 0.55 ──
// Closed-loop or certified semi-synthetics that are better than standard
const GOOD_SEMI_SYNTHETIC = [
  "tencel", "lyocell", "ecovero", "lenzing ecovero",
  "lenzing modal", "refibra", "veocel",
  "seacell", "smartcel"
];

// ═══════════════════════════════════════════════
//  ALL KNOWN FIBER NAMES (for regex matching)
// ═══════════════════════════════════════════════

const ALL_FIBER_NAMES = [
  // ── Compound names (must come before individual names for longest-first matching) ──
  "ecovero viscose", "lenzing viscose", "lenzing modal", "lenzing ecovero",
  "mulberry silk", "peace silk", "ahimsa silk", "tussah silk",
  "organic cotton", "pima cotton", "supima cotton", "egyptian cotton", "sea island cotton",
  "recycled polyester", "recycled nylon", "recycled cotton", "recycled wool",
  "carbon fiber", "glass fiber", "corn fiber", "soy fiber", "milk fiber",
  "banana fiber", "pineapple fiber", "lotus fiber", "orange fiber",
  "metal fiber",

  // ── Synthetics ──
  "polyester", "nylon", "acrylic", "polyacrylic", "polyacrilic",
  "spandex", "elastane", "lycra", "polyamide", "polyurethane",
  "polypropylene", "modacrylic", "microfiber", "fleece",
  "olefin", "aramid", "kevlar", "nomex", "neoprene",
  "vinylon", "vinalon", "chlorofibre", "elastodiene",
  "ptfe",
  "econyl", "repreve", "coolmax", "thermolite",
  "cordura", "supplex", "tactel", "sorona",
  "lurex", "metallic", "elastomultiester",
  "rubber", "latex", "primaloft", "thinsulate",
  "newlife", "dyneema", "spectra",

  // ── Semi-synthetics ──
  "viscose", "rayon", "modal", "lyocell", "tencel",
  "acetate", "triacetate", "cupro", "cupra", "bemberg",
  "cuprammonium",
  "ecovero", "lenzing", "refibra", "veocel",
  "seacell", "smartcel", "excel",
  "pla", "ingeo", "chitin", "chitosan",

  // ── Naturals (plant) ──
  "cotton", "linen", "flax", "hemp", "jute", "ramie",
  "kapok", "bamboo", "nettle", "kenaf", "abaca", "sisal", "coir",
  "supima",
  "bananatex",
  "lotus", "cork",

  // ── Naturals (animal) ──
  "wool", "merino", "cashmere", "mohair", "alpaca",
  "angora", "camel", "yak", "qiviut", "qiviuk",
  "vicuna", "vicuña", "llama", "guanaco",
  "pashmina", "horsehair", "mink", "rabbit",
  "silk", "tussah", "tussar",
  "down", "feather",
  "leather", "suede", "nubuck", "shearling", "sheepskin",

  // ── Innovative / bio-based ──
  "pinatex", "piñatex", "desserto", "vegea",
  "appleskin", "muskin", "mylo",
  "mycelium", "spinnova", "woocoa",
  "circulose",
  "brewed protein", "spiber",
  "bloom", "seaqual", "infinna", "nullarbor",

  // ── Generic catch-all ──
  "fiber", "fibre", "filament", "yarn"
];

// ═══════════════════════════════════════════════
//  MODIFIER PATTERN (for regex)
// ═══════════════════════════════════════════════

const MODIFIER_PATTERN =
  "(?:(?:recycled|organic|responsible|bluesign|certified|virgin|traceable|" +
  "sustainable|regenerative|mulesing[- ]free|rws|gots|ocs|grs|oeko[- ]tex|" +
  "fair trade|biodynamic|demeter|supima|pima|egyptian|sea island|" +
  "peace|ahimsa|wild|raw|unbleached|undyed|natural|pure|washable|" +
  "mulberry|muga|eri|charmeuse|chiffon|crepe|satin|twill|jersey|" +
  "brushed|combed|ring[- ]spun|mercerized|long[- ]staple|extra[- ]fine|" +
  "post[- ]consumer|pre[- ]consumer|upcycled|deadstock|rds|free)\\s+)*";

// ═══════════════════════════════════════════════
//  REGEX CONSTRUCTION
// ═══════════════════════════════════════════════

var FIBER_ALTERNATION = ALL_FIBER_NAMES
  .sort(function(a, b) { return b.length - a.length; })
  .join("|");

// Pattern 1: "60% organic cotton" — percentage before fiber
var P1 = "(\\d+(?:[.,]\\d+)?)\\s*%\\s*(" + MODIFIER_PATTERN + "(?:" + FIBER_ALTERNATION + "))";
// Pattern 2: "organic cotton 60%" — fiber before percentage
var P2 = "(" + MODIFIER_PATTERN + "(?:" + FIBER_ALTERNATION + "))\\s+(\\d+(?:[.,]\\d+)?)\\s*%";

var PARSE_REGEX = new RegExp(P1 + "|" + P2, "gi");

// ═══════════════════════════════════════════════
//  PARSING
// ═══════════════════════════════════════════════

/**
 * Parse a material string like "60% cotton, 35% polyester, 5% elastane"
 * Also handles "NO_PCT:cotton,polyester" for fibers without percentages.
 * Returns an array of { name, percentage } objects (percentage=null when unknown)
 */
function parseMaterials(text) {
  if (!text) return [];

  // Handle NO_PCT format: fiber names only, no percentages
  if (text.indexOf("NO_PCT:") === 0) {
    var fiberList = text.substring(7).split(",");
    return fiberList
      .map(function(f) { return f.trim().toLowerCase(); })
      .filter(function(f) { return f.length > 0; })
      .map(function(f) { return { name: f, percentage: null }; });
  }

  // ── PRE-PROCESSING: Extract main section from multi-section compositions ──
  // "Body: 100% Cotton, Trim: 96% Cotton, 4% Spandex" → "100% Cotton"
  // "Outer: 80% Wool, 20% Nylon. Lining: 100% Viscose" → "80% Wool, 20% Nylon"
  var sectionNames = "body|main|shell|outer|upper|self|trim|lining|inner|filling|collar|cuff|pocket|rib|skirt|sleeve|hood|panel";
  var sectionPattern = new RegExp("(?:^|[,;.]\\s*)(?:" + sectionNames + ")\\s*:", "i");
  if (sectionPattern.test(text)) {
    // Split on any separator (comma, period, semicolon) before a section prefix
    var splitRegex = new RegExp("[,;.]\\s*(?=(?:" + sectionNames + ")\\s*:)", "gi");
    var sections = text.split(splitRegex);
    // Use the first section — strip its label prefix
    var bestSection = sections[0].replace(new RegExp("^(?:" + sectionNames + ")\\s*:\\s*", "i"), "").trim();
    text = bestSection;
  }

  // ── PRE-PROCESSING: Normalize separators ──
  // Detect format and add commas at material boundaries

  var normalized = text;

  // Rewrite "FiberName(pct% Modifier)" → "Modifier FiberName" so modifier words like
  // "Recycled" become a recognized prefix ("recycled polyester" is in ALL_FIBER_NAMES).
  // Without this, "(100% Recycled)" inflates pctCount and corrupts comma insertion.
  normalized = normalized.replace(
    /(\w+)\s*\(\s*\d+\s*%\s*([a-zA-Z][a-zA-Z\s-]{1,30})\s*\)/g,
    function(_, fiber, mod) { return mod.trim() + " " + fiber.trim(); }
  );

  // Normalize various separators to commas first: semicolons, pipes, bullet points
  normalized = normalized.replace(/\s*[;|•·]\s*/g, ", ");
  // Handle "and" as separator
  normalized = normalized.replace(/\s+and\s+/gi, ", ");

  // Only add boundary commas if the text has multiple percentages but few/no commas
  var pctCount = (normalized.match(/\d+\s*%/g) || []).length;
  var commaCount = (normalized.match(/,/g) || []).length;

  if (pctCount > 1 && commaCount < pctCount - 1) {
    // Detect format: does text start with a percentage or a fiber name?
    var isPctFirst = /^\s*\d/.test(normalized.trim());

    if (isPctFirst) {
      // Percentage-first: "65% Cotton 32% Viscose 3% Cashmere"
      // Insert comma before each \d+% that follows a word character
      normalized = normalized.replace(/([a-zA-Z])\s+(\d+(?:[.,]\d+)?\s*%)/g, "$1, $2");
    } else {
      // Fiber-first: "Cotton 65% Polyester 30% Elastane 5%"
      // Insert comma after each \d+% that is followed by a word character
      normalized = normalized.replace(/(\d+(?:[.,]\d+)?\s*%)\s+([a-zA-Z])/g, "$1, $2");
    }
  }

  // Clean up double commas
  normalized = normalized.replace(/,\s*,/g, ",");

  var materials = [];
  var seen = {};
  var match;

  PARSE_REGEX.lastIndex = 0;

  while ((match = PARSE_REGEX.exec(normalized)) !== null) {
    var percentage, name;

    if (match[1] !== undefined && match[2] !== undefined) {
      percentage = parseFloat(match[1].replace(",", "."));
      name = match[2].trim().toLowerCase();
    } else if (match[3] !== undefined && match[4] !== undefined) {
      name = match[3].trim().toLowerCase();
      percentage = parseFloat(match[4].replace(",", "."));
    } else {
      continue;
    }

    // Strip trailing modifiers/noise from name
    name = name.replace(/\s*(blend|fabric|material|cloth|textile|jersey|knit|weave|woven)\s*$/i, "").trim();

    if (percentage > 0 && percentage <= 100 && name.length > 1) {
      var key = name + "_" + percentage;
      if (!seen[key]) {
        seen[key] = true;
        materials.push({ name: name, percentage: percentage });
      }
    }
  }

  // Normalize to 100
  var total = materials.reduce(function(sum, m) { return sum + m.percentage; }, 0);
  if (total > 0 && total !== 100) {
    materials.forEach(function(m) {
      m.percentage = Math.round((m.percentage / total) * 100);
    });
  }

  return materials;
}

// ═══════════════════════════════════════════════
//  SCORING
// ═══════════════════════════════════════════════

/**
 * Score materials from 0–100
 *
 * Scoring tiers:
 *   1.0  — Premium natural (organic cotton, hemp, linen, silk, cashmere…)
 *   0.9  — Standard natural (regular cotton, jute, basic wool…)
 *   0.65 — Innovative bio-based (piñatex, mycelium, spinnova…)
 *   0.55 — Good semi-synthetic (tencel, lyocell, ecovero…)
 *   0.4  — Semi-synthetic (viscose, rayon, cupro, acetate…)
 *   0.0  — Synthetic (polyester, nylon, acrylic…)
 *   0.5  — Unknown fiber
 */
function scoreMaterials(materials) {
  if (!materials.length) return null;

  // If any material has null percentage, we can't compute a weighted score
  var hasNullPct = materials.some(function(m) { return m.percentage === null; });
  if (hasNullPct) return null;

  var score = 0;

  for (var i = 0; i < materials.length; i++) {
    var name = materials[i].name;
    var percentage = materials[i].percentage;

    var tier = classifyFiberTier(name);

    if (tier === "premium_natural") {
      score += percentage * 1.0;
    } else if (tier === "natural") {
      score += percentage * 0.9;
    } else if (tier === "innovative_bio") {
      score += percentage * 0.65;
    } else if (tier === "good_semi") {
      score += percentage * 0.55;
    } else if (tier === "semi_synthetic") {
      score += percentage * 0.4;
    } else if (tier === "synthetic") {
      score += percentage * 0.0;
    } else {
      score += percentage * 0.5; // Unknown
    }
  }

  return Math.round(Math.min(score, 100));
}

/**
 * Classify a fiber name into a scoring tier.
 * Order matters — check most specific categories first.
 */
function classifyFiberTier(name) {
  // Check premium natural first (most specific)
  if (PREMIUM_NATURAL.some(function(f) { return name.includes(f); })) return "premium_natural";
  // Check innovative bio-based
  if (INNOVATIVE_BIO.some(function(f) { return name.includes(f); })) return "innovative_bio";
  // Check good semi-synthetic (tencel, ecovero, etc.)
  if (GOOD_SEMI_SYNTHETIC.some(function(f) { return name.includes(f); })) return "good_semi";
  // Check standard natural
  if (NATURAL_FIBERS.some(function(f) { return name.includes(f); })) return "natural";
  // Check semi-synthetic
  if (SEMI_SYNTHETIC.some(function(f) { return name.includes(f); })) return "semi_synthetic";
  // Check synthetic
  if (SYNTHETIC_FIBERS.some(function(f) { return name.includes(f); })) return "synthetic";
  // Unknown
  return "unknown";
}

// ═══════════════════════════════════════════════
//  DISPLAY HELPERS
// ═══════════════════════════════════════════════

/**
 * Get a label, grade, and color based on score
 */
function getScoreLabel(score) {
  if (score === null) return { label: "Unknown", grade: "?", color: "#888888" };
  if (score >= 85) return { label: "Excellent", grade: "A", color: "#2d8a4e" };
  if (score >= 70) return { label: "Good",      grade: "B", color: "#5aaa72" };
  if (score >= 50) return { label: "Fair",      grade: "C", color: "#d4a520" };
  if (score >= 30) return { label: "Poor",      grade: "D", color: "#e07840" };
  return               { label: "Very Poor",    grade: "F", color: "#c0392b" };
}

/**
 * Calculate synthetic percentage from parsed materials
 */
function getSyntheticPercentage(materials) {
  return materials
    .filter(function(m) {
      return SYNTHETIC_FIBERS.some(function(f) { return m.name.includes(f); });
    })
    .reduce(function(sum, m) { return sum + m.percentage; }, 0);
}

// Export for use in other scripts
if (typeof module !== "undefined") {
  module.exports = { parseMaterials, scoreMaterials, getScoreLabel, getSyntheticPercentage };
}
