// app.js  -  buttons, current step and auto-play

var SAMPLES = [
  "abracadabra", "mississippi", "huffman coding", "data structures",
  "she sells sea shells", "banana bandana", "engineering",
  "artificial intelligence", "hello world", "success"
];

// S holds everything the page needs to remember
var S = {
  text: "",
  freq: {},
  steps: [],
  root: null,
  codes: {},
  i: 0,          // current step number
  timer: null    // auto-play timer
};
var lastSample = -1;

function stopAutoPlay() {
  if (S.timer) {
    clearInterval(S.timer);
    S.timer = null;
    $("play").textContent = "Auto-play";
  }
}

function goTo(n) {
  S.i = Math.max(0, Math.min(S.steps.length - 1, n));
  renderAll(S);
}

// Read the input box, build the tree data and show step 0
function start() {
  stopAutoPlay();
  var text = $("inp").value;
  if (!text) {
    $("msg").textContent = "Please type some text first.";
    return;
  }
  var r = buildHuffman(text);
  S.text = text;
  S.freq = r.freq;
  S.steps = r.steps;
  S.root = r.root;
  S.codes = r.codes;
  S.i = 0;

  renderFreq(S.freq);
  renderAll(S);
}

// ===== Button wiring =====
$("build").onclick = start;
$("inp").addEventListener("keydown", function (e) { if (e.key === "Enter") start(); });

$("sample").onclick = function () {
  var k;
  do { k = Math.floor(Math.random() * SAMPLES.length); } while (k === lastSample);
  lastSample = k;
  $("inp").value = SAMPLES[k];
  start();
};

$("next").onclick  = function () { stopAutoPlay(); goTo(S.i + 1); };
$("prev").onclick  = function () { stopAutoPlay(); goTo(S.i - 1); };
$("reset").onclick = function () { stopAutoPlay(); goTo(0); };
$("last").onclick  = function () { stopAutoPlay(); goTo(S.steps.length - 1); };

$("play").onclick = function () {
  if (S.timer) { stopAutoPlay(); return; }
  if (S.i >= S.steps.length - 1) goTo(0);
  $("play").textContent = "Pause";
  S.timer = setInterval(function () {
    if (S.i >= S.steps.length - 1) { stopAutoPlay(); return; }
    goTo(S.i + 1);
  }, 1100);
};

// Show something as soon as the page loads
start();