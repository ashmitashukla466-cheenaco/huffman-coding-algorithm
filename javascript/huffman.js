// huffman.js  -  core algorithm only (nothing about HTML here)

// Show spaces and newlines in a readable way
function lab(c) {
  if (c === " ") return "␣";
  if (c === "\n") return "⏎";
  return c;
}

// Sort rule for the priority queue: smaller frequency first.
// If equal, the older node (smaller id) goes first, so results are always the same.
function cmp(a, b) {
  return a.freq - b.freq || a.id - b.id;
}

// Name used in the step messages
function nodeName(n) {
  return n.left ? "node(" + n.freq + ")" : "'" + lab(n.ch) + "'";
}

// Main function: returns frequencies, every step, the root and the codes
function buildHuffman(text) {
  // 1. Count frequencies
  var freq = {};
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    freq[c] = (freq[c] || 0) + 1;
  }

  // 2. Make one leaf node per character
  var id = 0;
  var forest = Object.keys(freq)
    .map(function (ch) { return { id: id++, ch: ch, freq: freq[ch] }; })
    .sort(cmp);

  // Step 0 = starting state
  var steps = [{
    forest: forest.slice(),
    newId: null,
    msg: "Start: one leaf per character, sorted by frequency."
  }];

  // 3. Repeatedly merge the two smallest nodes
  while (forest.length > 1) {
    var a = forest[0];
    var b = forest[1];
    var parent = { id: id++, freq: a.freq + b.freq, left: a, right: b };

    forest = forest.slice(2);
    forest.push(parent);
    forest.sort(cmp);

    steps.push({
      forest: forest.slice(),
      newId: parent.id,
      msg: "Take the two smallest: " + nodeName(a) + " (" + a.freq + ") + " +
           nodeName(b) + " (" + b.freq + ") → new node with frequency " + parent.freq + "."
    });
  }

  // 4. Walk the final tree to make codes (left = 0, right = 1)
  var root = forest[0];
  var codes = {};
  (function walk(n, path) {
    if (!n.left) {
      codes[n.ch] = path || "0";   // "0" is for the case of only one unique character
      return;
    }
    walk(n.left, path + "0");
    walk(n.right, path + "1");
  })(root, "");

  return { freq: freq, steps: steps, root: root, codes: codes };
}

// List of node ids from the root down to one character (used for highlighting)
function pathIds(node, ch) {
  if (!node.left) return node.ch === ch ? [node.id] : null;
  var rest = pathIds(node.left, ch) || pathIds(node.right, ch);
  return rest ? [node.id].concat(rest) : null;
}