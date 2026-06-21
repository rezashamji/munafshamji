/* =========================================================================
   familytree.js — renders the expandable family tree from data.js.
   Anyone can click "+ add" to add a relative; additions save to this browser.
   ========================================================================= */
(function () {
  "use strict";
  var mount = document.getElementById("ftree");
  var tabsEl = document.getElementById("ftree-tabs");
  if (!mount || !window.SITE || !window.SITE.familyTree) return;

  var TREE = window.SITE.familyTree;
  var ORDER = ["paternal", "maternal", "wife"];
  var current = "paternal";

  function addsKey(branch) { return "ft_add_" + branch; }
  function getAdds(branch) {
    try { return JSON.parse(localStorage.getItem(addsKey(branch)) || "[]"); }
    catch (e) { return []; }
  }
  function saveAdd(branch, path, node) {
    var a = getAdds(branch); a.push({ path: path, node: node });
    try { localStorage.setItem(addsKey(branch), JSON.stringify(a)); } catch (e) {}
  }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // merge stored additions into a working copy of the data
  function withAdds(node, branch, path) {
    var copy = { name: node.name, sub: node.sub, partner: node.partner, highlight: node.highlight,
      children: (node.children || []).map(function (c, i) { return withAdds(c, branch, path + "." + i); }) };
    getAdds(branch).forEach(function (a) {
      if (a.path === path) copy.children.push({ name: a.node.name, sub: a.node.sub, children: [] });
    });
    return copy;
  }

  function renderNode(node, branch, path) {
    var li = document.createElement("li");
    var hasKids = node.children && node.children.length;
    var box = document.createElement("div");
    box.className = "fnode" + (hasKids ? " has-kids" : "") + (node.highlight ? " fnode--me" : "");
    var html = '<span class="fnode__name">' + esc(node.name) + "</span>";
    if (node.partner) html += '<span class="fnode__partner">married <b>' + esc(node.partner) + "</b></span>";
    if (node.sub) html += '<span class="fnode__sub">' + esc(node.sub) + "</span>";
    html += '<span class="fnode__add"><button type="button">+ add a relative</button></span>';
    box.innerHTML = html;
    li.appendChild(box);

    var ul = document.createElement("ul");
    (node.children || []).forEach(function (c, i) { ul.appendChild(renderNode(c, branch, path + "." + i)); });
    li.appendChild(ul);

    if (hasKids || node.highlight) li.classList.add("open"), box.classList.add("open");

    box.querySelector(".fnode__name").addEventListener("click", function () {
      if (!ul.children.length) return;
      var open = li.classList.toggle("open");
      box.classList.toggle("open", open);
    });
    box.querySelector(".fnode__add button").addEventListener("click", function (e) {
      e.stopPropagation();
      var name = window.prompt("Add a relative to " + node.name + "'s family — their name:");
      if (!name) return;
      var rel = window.prompt("How are they related? (optional, e.g. 'cousin', 'daughter')") || "";
      saveAdd(branch, path, { name: name.trim(), sub: rel.trim() });
      render();
    });
    return li;
  }

  function render() {
    var data = withAdds(TREE[current].root, current, "0");
    mount.innerHTML = "";
    var rootUl = document.createElement("ul");
    rootUl.appendChild(renderNode(data, current, "0"));
    mount.appendChild(rootUl);
  }

  // tabs
  if (tabsEl) {
    ORDER.forEach(function (k) {
      if (!TREE[k]) return;
      var b = document.createElement("button");
      b.className = "ftree-tab" + (k === current ? " active" : "");
      b.textContent = TREE[k].label;
      b.addEventListener("click", function () {
        current = k;
        tabsEl.querySelectorAll(".ftree-tab").forEach(function (t) { t.classList.remove("active"); });
        b.classList.add("active");
        render();
      });
      tabsEl.appendChild(b);
    });
  }
  render();

  var resetBtn = document.getElementById("ftree-reset");
  if (resetBtn) resetBtn.addEventListener("click", function () {
    if (window.confirm("Remove all the relatives you've added on this page?")) {
      ORDER.forEach(function (k) { try { localStorage.removeItem(addsKey(k)); } catch (e) {} });
      render();
    }
  });
})();
