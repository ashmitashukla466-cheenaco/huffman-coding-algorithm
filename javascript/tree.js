// treeLayout.js  -  decides where each node sits (x = column, y = depth)

var GX = 56;   // horizontal gap between leaves
var GY = 64;   // vertical gap between levels
var PAD = 32;  // space around the drawing

// Sets n.x and n.y on every node of every tree in the forest.
// Returns how many leaf columns were used and how deep the tallest tree is.
function layoutForest(forest) {
  var x = 0;
  var maxDepth = 0;

  function place(n, depth) {
    n.y = depth;
    if (depth > maxDepth) maxDepth = depth;

    if (!n.left) {          // leaf: take the next free column
      n.x = x++;
      return;
    }
    place(n.left, depth + 1);
    place(n.right, depth + 1);
    n.x = (n.left.x + n.right.x) / 2;   // parent sits between its children
  }

  forest.forEach(function (root, i) {
    place(root, 0);
    if (i < forest.length - 1) x += 0.4;   // small gap between separate trees
  });

  return { cols: x, maxDepth: maxDepth };
}

// Pixel position of a node
function px(n) { return PAD + n.x * GX; }
function py(n) { return PAD + n.y * GY; }