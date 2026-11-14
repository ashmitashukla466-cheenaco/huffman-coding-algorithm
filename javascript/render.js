// render.js  -  everything that draws on the page

function $(id) { return document.getElementById(id); }

// Make text safe to put inside HTML
function esc(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}

// Frequency chips (section 2)
function renderFreq(freq) {
  var chars = Object.keys(freq).sort(function (a, b) {
    return freq[a] - freq[b] || (a < b ? -1 : 1);
  });
  $("freq").innerHTML = chars.map(function (c) {
    return '<span class="chip leaf">' + esc(lab(c)) + " : " + freq[c] + "</span>";
  }).join("");
}

// Priority queue chips
function renderQueue(step) {
  $("queue").innerHTML = step.forest.map(function (n) {
    var cls = "chip " + (n.left ? "" : "leaf ") + (n.id === step.newId ? "new" : "");
    return '<span class="' + cls + '">' + esc(n.left ? "node" : lab(n.ch)) + " : " + n.freq + "</span>";
  }).join("");
}

// SVG tree. hlIds = list of node ids to highlight (or null)
function drawTree(step, hlIds) {
  var hl = hlIds ? new Set(hlIds) : null;
  var size = layoutForest(step.forest);
  var edges = "";
  var nodes = "";

  function draw(n) {
    if (n.left) {
      [[n.left, "0"], [n.right, "1"]].forEach(function (pair) {
        var child = pair[0];
        var bit = pair[1];
        var on = hl && hl.has(n.id) && hl.has(child.id);
        var lx = (px(n) + px(child)) / 2 + (bit === "0" ? -9 : 9);
        var ly = (py(n) + py(child)) / 2;

        edges += '<line class="edge' + (on ? " hl" : "") + '" x1="' + px(n) + '" y1="' + py(n) +
                 '" x2="' + px(child) + '" y2="' + py(child) + '"/>';
        edges += '<text class="lbl" x="' + lx + '" y="' + ly + '">' + bit + "</text>";
        draw(child);
      });
    }

    var cls = "nd" + (n.left ? "" : " leaf") + (n.id === step.newId ? " new" : "") +
              (hl && hl.has(n.id) ? " hl" : "");
    nodes += '<circle class="' + cls + '" cx="' + px(n) + '" cy="' + py(n) + '" r="21"/>';

    if (n.left) {
      nodes += '<text class="t" x="' + px(n) + '" y="' + (py(n) + 5) + '">' + n.freq + "</text>";
    } else {
      nodes += '<text class="t" x="' + px(n) + '" y="' + (py(n) - 1) + '" style="font-weight:700">' +
               esc(lab(n.ch)) + "</text>";
      nodes += '<text class="t s" x="' + px(n) + '" y="' + (py(n) + 12) + '">' + n.freq + "</text>";
    }
  }

  step.forest.forEach(draw);

  var w = Math.max(PAD * 2 + Math.max(size.cols - 1, 0) * GX, 200);
  var h = PAD * 2 + size.maxDepth * GY;
  var svg = $("svg");
  svg.setAttribute("width", w);
  svg.setAttribute("height", h);
  svg.setAttribute("viewBox", "0 0 " + w + " " + h);
  svg.innerHTML = edges + nodes;
}

// Code table, encoded bits and stats (section 4)
function drawResult(S, isLast) {
  var el = $("result");
  if (!isLast) {
    el.innerHTML = '<p class="hint">Reach the last step to see the codes.</p>';
    return;
  }

  var chars = Object.keys(S.codes).sort(function (a, b) {
    return S.codes[a].length - S.codes[b].length || (a < b ? -1 : 1);
  });

  var rows = chars.map(function (c) {
    var f = S.freq[c];
    var len = S.codes[c].length;
    return '<tr data-c="' + esc(c) + '"><td><b>' + esc(lab(c)) + "</b></td><td>" + f +
           "</td><td><code>" + S.codes[c] + "</code></td><td>" + len + "</td><td>" + (f * len) + "</td></tr>";
  }).join("");

  var encoded = S.text.split("").map(function (c) { return S.codes[c]; }).join("");
  var originalBits = S.text.length * 8;
  var newBits = encoded.length;
  var shown = encoded.length > 240 ? encoded.slice(0, 240) + "…" : encoded;

  el.innerHTML =
    '<div class="scroll"><table><thead><tr><th>Char</th><th>Freq</th><th>Code</th><th>Bits</th>' +
    "<th>Freq × bits</th></tr></thead><tbody>" + rows + "</tbody></table></div>" +
    '<p class="hint">Hover or tap a row to highlight its path in the tree.</p>' +
    '<p style="margin:10px 0 4px"><b>Encoded bits</b></p><code>' + shown + "</code>" +
    '<div class="stats">' +
    '<div class="stat"><b>' + originalBits + ' bits</b><span>Original (8 bits per char)</span></div>' +
    '<div class="stat"><b>' + newBits + ' bits</b><span>Huffman encoded</span></div>' +
    '<div class="stat"><b>' + (100 - newBits / originalBits * 100).toFixed(1) + '%</b><span>Space saved</span></div>' +
    "</div>";

  // Highlight a character's path when its row is hovered or tapped
  Array.prototype.forEach.call(el.querySelectorAll("tbody tr"), function (tr) {
    function show() {
      drawTree(S.steps[S.i], pathIds(S.root, tr.getAttribute("data-c")));
    }
    tr.addEventListener("mouseenter", show);
    tr.addEventListener("click", show);
    tr.addEventListener("mouseleave", function () { drawTree(S.steps[S.i], null); });
  });
}

// Redraw everything for the current step
function renderAll(S) {
  var step = S.steps[S.i];
  var isLast = S.i === S.steps.length - 1;

  $("count").textContent = "Step " + S.i + " of " + (S.steps.length - 1);
  $("msg").textContent = step.msg + (isLast && S.steps.length > 1 ? " Only one tree is left, so we are done." : "");

  $("prev").disabled = $("reset").disabled = S.i === 0;
  $("next").disabled = $("last").disabled = isLast;

  renderQueue(step);
  drawTree(step, null);
  drawResult(S, isLast);
}