// terminal.js  -  Huffman coding demo in the terminal (standalone)

function lab(c) { return c === " " ? "␣" : c === "\n" ? "⏎" : c; }
function cmp(a, b) { return a.freq - b.freq || a.id - b.id; }
function nodeName(n) { return n.left ? "node(" + n.freq + ")" : "'" + lab(n.ch) + "'"; }

// Print the tree sideways. [0] = left edge, [1] = right edge
function printTree(n, indent, bit) {
  var label = n.left ? "(" + n.freq + ")" : "'" + lab(n.ch) + "' " + n.freq;
  console.log(indent + (bit ? "[" + bit + "] " : "") + label);
  if (n.left) {
    printTree(n.left, indent + "    ", "0");
    printTree(n.right, indent + "    ", "1");
  }
}

// Decode a bit string back to text by walking the tree
function decode(root, bits) {
  if (!root.left) return root.ch.repeat(bits.length);   // only one unique character
  var out = "";
  var n = root;
  for (var i = 0; i < bits.length; i++) {
    n = bits[i] === "0" ? n.left : n.right;
    if (!n.left) { out += n.ch; n = root; }
  }
  return out;
}

// ===== Input: text from the command line, or a default =====
var text = process.argv.slice(2).join(" ") || "abracadabra";
console.log('\nText: "' + text + '"\n');

// 1. Count frequencies
var freq = {};
for (var i = 0; i < text.length; i++) freq[text[i]] = (freq[text[i]] || 0) + 1;

console.log("STEP 1: Frequencies");
Object.keys(freq).forEach(function (c) {
  console.log("  '" + lab(c) + "' : " + freq[c]);
});

// 2. Make leaves
var id = 0;
var forest = Object.keys(freq)
  .map(function (ch) { return { id: id++, ch: ch, freq: freq[ch] }; })
  .sort(cmp);

console.log("\nSTEP 2: Build the tree");
console.log("  Start queue: " + forest.map(function (n) { return nodeName(n) + ":" + n.freq; }).join("  "));

// 3. Merge the two smallest until one node is left
var stepNo = 1;
while (forest.length > 1) {
  var a = forest[0];
  var b = forest[1];
  var parent = { id: id++, freq: a.freq + b.freq, left: a, right: b };
  forest = forest.slice(2);
  forest.push(parent);
  forest.sort(cmp);

  console.log("  Merge " + stepNo++ + ": " + nodeName(a) + " (" + a.freq + ") + " +
              nodeName(b) + " (" + b.freq + ") = " + parent.freq);
  console.log("     Queue: " + forest.map(function (n) { return nodeName(n) + ":" + n.freq; }).join("  "));
}

var root = forest[0];

// 4. Show the tree
console.log("\nSTEP 3: Final tree");
printTree(root, "  ", "");

// 5. Make codes
var codes = {};
(function walk(n, path) {
  if (!n.left) { codes[n.ch] = path || "0"; return; }
  walk(n.left, path + "0");
  walk(n.right, path + "1");
})(root, "");

console.log("\nSTEP 4: Codes");
console.log("  Char | Freq | Code | Bits");
console.log("  -----+------+------+-----");
Object.keys(codes)
  .sort(function (a, b) { return codes[a].length - codes[b].length || (a < b ? -1 : 1); })
  .forEach(function (c) {
    console.log("  '" + lab(c) + "'  |  " + freq[c] + "   | " + codes[c] + " | " + codes[c].length);
  });

// 6. Compare ASCII (fixed 8 bits) vs Huffman (variable length)
var encoded = text.split("").map(function (c) { return codes[c]; }).join("");
var asciiBits = text.length * 8;
var huffBits = encoded.length;

function asciiCode(c) { return c.charCodeAt(0).toString(2).padStart(8, "0"); }
function bar(bits, max) { return "█".repeat(Math.max(1, Math.round(bits / max * 40))); }
function cut(s, n) { return s.length > n ? s.slice(0, n) + "…" : s; }

// ---- Per-character table ----
console.log("\nSTEP 5: ASCII vs Huffman, per character");
console.log("  " + "Char".padEnd(6) + "Freq".padEnd(6) + "ASCII code".padEnd(12) +
            "ASCII bits".padEnd(12) + "Huffman".padEnd(10) + "Huffman bits");
console.log("  " + "-".repeat(58));

Object.keys(codes)
  .sort(function (a, b) { return codes[a].length - codes[b].length || (a < b ? -1 : 1); })
  .forEach(function (c) {
    console.log("  " + ("'" + lab(c) + "'").padEnd(6) +
                String(freq[c]).padEnd(6) +
                asciiCode(c).padEnd(12) +
                String(freq[c] * 8).padEnd(12) +
                codes[c].padEnd(10) +
                freq[c] * codes[c].length);
  });

console.log("  " + "-".repeat(58));
console.log("  " + "Total".padEnd(6) + String(text.length).padEnd(6) + "".padEnd(12) +
            String(asciiBits).padEnd(12) + "".padEnd(10) + huffBits);

// ---- Whole text encoded both ways ----
console.log("\nSTEP 6: The whole text encoded both ways");
console.log("  ASCII  : " + cut(text.split("").map(asciiCode).join(" "), 110));
console.log("  Huffman: " + cut(encoded, 110));

// ---- Summary ----
var saved = asciiBits - huffBits;
console.log("\nSTEP 7: Comparison summary");
console.log("  " + "".padEnd(24) + "ASCII".padEnd(12) + "Huffman");
console.log("  " + "Total bits".padEnd(24) + String(asciiBits).padEnd(12) + huffBits);
console.log("  " + "Average bits per char".padEnd(24) + "8.00".padEnd(12) + (huffBits / text.length).toFixed(2));
console.log("  " + "Compression ratio".padEnd(24) + "1 : 1".padEnd(12) + (asciiBits / huffBits).toFixed(2) + " : 1");
console.log("  Bits saved             : " + saved + " (" + (saved / asciiBits * 100).toFixed(1) + "%)");

console.log("\n  ASCII   " + bar(asciiBits, asciiBits) + " " + asciiBits);
console.log("  Huffman " + bar(huffBits, asciiBits) + " " + huffBits);