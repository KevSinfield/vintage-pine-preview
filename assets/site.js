/* Vintage Pine Etc. — redesign preview.
   Every listing on every page is rendered from data/catalogue.js (shared sample data,
   mirroring WooCommerce product fields). In production these come from WooCommerce:
   the Divi Shop module / Woo modules replace renderCard() and the item page. */
(function () {
  "use strict";
  var C = window.VPE_CATALOGUE;
  var byId = {}; C.products.forEach(function (p) { byId[p.id] = p; });
  var cats = {}; C.categories.forEach(function (c) { cats[c.slug] = c; });

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]; }); }
  function money(n) { return "£" + n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function isSold(p) { return p.stock_status !== "instock"; }
  function itemUrl(p) { return "item.html?id=" + p.id; }
  function collectionUrl(slug) { return "collection.html?c=" + encodeURIComponent(slug); }
  function primaryCat(p) { return cats[p.categories.filter(function (s) { return s !== "sold-items"; })[0] || p.categories[0]]; }
  function param(k) { return new URLSearchParams(location.search).get(k); }
  /* Illustrative category artwork (supplied crops, used as-is). Real listing photos stay on cards and item pages.
     Production: a fixed Image module per category tile in Divi. */
  var CATEGORY_ART = { "furniture": "furniture", "vintage-enamel-signs": "advertising-signs", "vintage-tins": "vintage-tins",
    "architectural-industrial": "industrial-pub", "home-garden-leisure": "home-garden" };
  function categoryTile(c, label, cls) {
    return '<li class="tile' + (cls || "") + '"><a href="' + collectionUrl(c.slug) + '"><div class="img"><img src="assets/categories/' + CATEGORY_ART[c.slug] + '.png" alt="" loading="lazy" width="191" height="188"></div><span>' + esc(label) + "</span></a></li>";
  }

  /* Latest finds = newest products that are in stock (WooCommerce: orderby=date, stock_status=instock). */
  function latest(n, excludeId) {
    return C.products.filter(function (p) { return !isSold(p) && p.id !== excludeId; })
      .sort(function (a, b) { return b.id - a.id; }).slice(0, n);
  }
  function inCategory(slug) {
    return C.products.filter(function (p) { return p.categories.indexOf(slug) > -1 || (slug === "sold-items" && isSold(p)); })
      .sort(function (a, b) { return (isSold(a) - isSold(b)) || (b.id - a.id); });
  }

  function renderCard(p, headingLevel) {
    var h = headingLevel || 3, sold = isSold(p), img = p.images[0];
    return '<li class="card' + (sold ? " is-sold" : "") + '"><a class="card-link" href="' + itemUrl(p) + '">' +
      '<div class="img"><img src="' + esc(img.src) + '" alt="" loading="lazy" width="600" height="450">' +
      (sold ? '<span class="badge-sold">Sold</span>' : "") + "</div>" +
      "<h" + h + ">" + esc(p.card_title || p.name) + "</h" + h + ">" +
      '<p class="price">' + (sold ? '<span class="visually-hidden">Sold. </span>' : "") + money(p.price) + "</p>" +
      '<span class="view" aria-hidden="true">' + (sold ? "See sold item" : "View item") + "</span></a></li>";
  }
  function renderCards(list, el, h) { el.innerHTML = list.map(function (p) { return renderCard(p, h); }).join(""); }

  /* ---------- Global header / footer (Divi Theme Builder global templates) ---------- */
  var NAV = [
    { href: collectionUrl("furniture"), label: "Furniture", key: "furniture" },
    { href: collectionUrl("vintage-enamel-signs"), label: "Advertising signs", key: "vintage-enamel-signs" },
    { href: collectionUrl("vintage-tins"), label: "Vintage tins", key: "vintage-tins" },
    { href: collectionUrl("architectural-industrial"), label: "Industrial & pub", key: "architectural-industrial" },
    { href: collectionUrl("home-garden-leisure"), label: "Home & garden", key: "home-garden-leisure" },
    { href: "contact.html", label: "Contact", key: "contact" }
  ];
  function currentKey() { return document.body.getAttribute("data-nav") || param("c") || ""; }

  function header() {
    var cur = currentKey();
    var strip = '<div class="preview-strip" role="note"><div class="wrap"><span><strong>Redesign preview.</strong> Not the official shop<span class="ps-long">; visit <a href="https://www.vintagepineetc.co.uk/" rel="noopener">vintagepineetc.co.uk</a> to buy. Checkout, payments and enquiries are switched off here</span>.</span><span class="ps-links"><a class="ps-short" href="https://www.vintagepineetc.co.uk/" rel="noopener">Official shop</a><a href="preview-guide.html"><span class="ps-long">What’s in this preview</span><span class="ps-short">About</span></a></span></div></div>';
    var nav = NAV.map(function (n) { return '<li><a href="' + n.href + '"' + (n.key === cur ? ' aria-current="page"' : "") + ">" + n.label + "</a></li>"; }).join("");
    return strip + '<header class="site-header"><div class="wrap">' +
      '<a class="logo" href="index.html">Vintage Pine Etc.</a>' +
      '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="main-nav"><span class="bars" aria-hidden="true"></span>Menu</button>' +
      '<nav class="main-nav" id="main-nav" aria-label="Main"><ul>' + nav + "</ul></nav></div></header>";
  }
  function footer() {
    var links = NAV.slice(0, 5).concat([{ href: "sell.html", label: "Something to sell?" }, { href: "contact.html", label: "Contact" }, { href: collectionUrl("sold-items"), label: "Sold items" }]);
    return '<footer class="site-footer"><div class="wrap"><a class="logo" href="index.html">Vintage Pine Etc.</a>' +
      '<nav aria-label="Footer"><ul>' + links.map(function (n) { return '<li><a href="' + n.href + '">' + n.label + "</a></li>"; }).join("") + "</ul></nav>" +
      '<p class="legal">Copyright © 2026 Vintage Pine Etc. Ltd ® · ' + esc(C.shop.address.join(", ")) + "</p></div></footer>";
  }
  function mountChrome() {
    var skip = '<a class="skip-link" href="#main">Skip to content</a>';
    document.body.insertAdjacentHTML("afterbegin", skip + header());
    document.body.insertAdjacentHTML("beforeend", footer());
    var btn = document.querySelector(".nav-toggle"), nav = document.getElementById("main-nav");
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open)); nav.classList.toggle("open", !open);
      if (!open) nav.querySelector("a").focus();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") { btn.click(); btn.focus(); }
    });
  }

  /* ---------- Pages ---------- */
  var pages = {};

  pages.home = function () {
    var tiles = document.getElementById("collection-tiles");
    tiles.innerHTML = Object.keys(CATEGORY_ART).map(function (slug) { return categoryTile(cats[slug], cats[slug].label); }).join("");
    renderCards(latest(6), document.getElementById("latest-finds"));
    renderCards(inCategory("sold-items").filter(isSold).slice(0, 3), document.getElementById("recently-sold"));
  };

  pages.collection = function () {
    var slug = param("c") || "furniture", c = cats[slug];
    if (!c) { slug = "furniture"; c = cats[slug]; }
    document.title = c.label + " – Vintage Pine Etc. (preview)";
    document.getElementById("c-title").textContent = c.label;
    document.getElementById("c-crumb").textContent = c.label;
    var list = inCategory(slug);
    renderCards(list, document.getElementById("c-items"), 2);
    document.getElementById("c-count").textContent = list.length + " item" + (list.length === 1 ? "" : "s");
  };

  pages.item = function () {
    var p = byId[param("id")] || byId[C.demo_items.available];
    var sold = isSold(p), cat = primaryCat(p), root = document.getElementById("item");
    document.title = p.name + " – Vintage Pine Etc. (preview)";
    document.body.classList.add(sold ? "outofstock" : "instock");
    var n = p.images.length, current = 0;
    /* Strip a leading "Size." / "Approximate size." label, since the box is already labelled. */
    var size = p.size.map(function (s) { s = s.replace(/^(approximate\s+)?sizes?\.?\s*/i, ""); return s.charAt(0).toUpperCase() + s.slice(1); });
    var summaryIsEra = p.era.length && p.summary === p.era[0];
    var boxes = [];
    if (size.length) boxes.push(["Dimensions", size]);
    if (p.era.length && !summaryIsEra) boxes.push(["Age", p.era]);
    if (p.condition.length) boxes.push(["Condition", p.condition]);
    boxes.push(["Collection &amp; delivery", ["Viewing by appointment in Bexleyheath, DA7. Free local delivery on large items."]]);
    var mag = '<svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>';

    /* Up to 4 thumbnails, as in the mockup; the 4th opens the full set when there are more. */
    var shown = Math.min(n, 4);
    var thumbs = n > 1 ? '<ul class="thumbs">' + p.images.slice(0, shown).map(function (im, i) {
      var more = (i === 3 && n > 4);
      return '<li><button type="button" data-i="' + i + '"' + (more ? ' data-more="1" aria-label="View all ' + n + ' photos"' : ' aria-label="Show photo ' + (i + 1) + " of " + n + '"') + (i === 0 ? ' aria-current="true"' : "") + '><img src="' + esc(im.src) + '" alt="" loading="lazy" width="200" height="200">' + (more ? '<span class="more-count" aria-hidden="true">+' + (n - 3) + "</span>" : "") + "</button></li>";
    }).join("") + "</ul>" : "";

    var action = sold
      ? '<div class="sold-note" role="status"><p>This piece has been sold. <span class="price-was">It was listed at ' + money(p.price).replace(/\.00$/, "") + ".</span></p></div>" +
        '<a class="btn btn-primary btn-block" href="' + collectionUrl(cat.slug) + '">Browse more ' + esc(cat.label.toLowerCase()) + "</a>" +
        '<p class="sub-action">Looking for something similar? <a class="text-link" href="contact.html">Get in touch</a></p>'
      : '<button class="btn btn-primary btn-block" type="button" id="add-to-basket" aria-describedby="checkout-off">Add to basket</button>' +
        '<p class="checkout-off" id="checkout-off">Demo only: checkout is switched off in this preview.</p>' +
        '<p class="sub-action">or <a class="text-link" href="contact.html?about=' + p.id + '">enquire about this piece</a> and arrange a viewing</p>' +
        '<div class="demo-notice" id="basket-msg" role="status" aria-live="polite" hidden></div>';

    root.innerHTML =
      '<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="index.html">Home</a></li><li><a href="' + collectionUrl(cat.slug) + '">' + esc(cat.label) + '</a></li><li aria-current="page">' + esc(p.name) + "</li></ol></nav>" +
      '<div class="item"><section class="gallery" aria-label="Photos">' +
        '<div class="main" id="main-frame">' +
          '<img id="main-photo" src="' + esc(p.images[0].src) + '" alt="' + esc(p.images[0].alt) + '" width="1200" height="900">' +
          '<p class="photo-count" id="photo-count" aria-live="polite">' + (n > 1 ? "Photo 1 of " + n : "") + "</p>" +
          '<button class="view-larger" type="button" id="view-larger">' + mag + "View larger</button>" +
        "</div>" + thumbs + "</section>" +
      '<div class="summary">' +
        '<p class="cat-line"><a href="' + collectionUrl(cat.slug) + '">' + esc(cat.label) + '</a><span class="rule" aria-hidden="true"></span></p>' +
        "<h1" + (p.name.length > 40 ? ' class="is-long"' : "") + ">" + esc(p.name) + "</h1>" +
        '<p class="pill ' + (sold ? "pill-sold" : "pill-available") + '">' + (sold ? "Sold" : "Available") + "</p>" +
        (sold ? "" : '<p class="price">' + money(p.price).replace(/\.00$/, "") + "</p>") +
        (p.summary ? '<p class="item-summary">' + esc(p.summary) + "</p>" : "") +
        '<p class="read-more"><a href="#full-description" id="read-more">Read full description <span aria-hidden="true">↓</span></a></p>' +
        action +
        '<div class="info-boxes">' + boxes.map(function (b) { return '<div class="info-box"><h2>' + b[0] + "</h2><p>" + b[1].map(esc).join("<br>") + "</p></div>"; }).join("") + "</div>" +
      "</div></div>" +
      '<details class="full-desc" id="full-description"><summary><span class="fd-title">Full description</span><span class="fd-sub">About this piece, its details and character</span><span class="fd-icon" aria-hidden="true"></span></summary>' +
        '<div class="fd-body">' + p.full_text.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") +
        '<p class="flag">Text, price and photos taken from the live listing (<a href="' + esc(p.source_permalink) + '" rel="noopener">view on current site</a>).</p></div></details>';

    /* Gallery */
    var main = document.getElementById("main-photo"), frame = document.getElementById("main-frame");
    function fit() { frame.classList.toggle("is-portrait", main.naturalHeight > main.naturalWidth * 1.05); }
    main.addEventListener("load", fit); if (main.complete) fit();
    function show(i) {
      current = i; main.src = p.images[i].src; main.alt = p.images[i].alt;
      root.querySelectorAll(".thumbs button").forEach(function (x) {
        if (+x.getAttribute("data-i") === i && !x.hasAttribute("data-more")) x.setAttribute("aria-current", "true"); else x.removeAttribute("aria-current");
      });
      if (n > 1) document.getElementById("photo-count").textContent = "Photo " + (i + 1) + " of " + n;
    }
    root.querySelectorAll(".thumbs button").forEach(function (b) {
      b.addEventListener("click", function () { var i = +b.getAttribute("data-i"); if (b.hasAttribute("data-more")) openBox(i, b); else show(i); });
    });

    /* Lightbox (production: Divi/WooCommerce built-in gallery lightbox) */
    var box = document.getElementById("lightbox"), lbImg = document.getElementById("lb-img"), lbCount = document.getElementById("lb-count");
    document.getElementById("lb-title").textContent = "Photos of " + p.name;
    function lbShow(i) { current = (i + n) % n; lbImg.src = p.images[current].src; lbImg.alt = p.images[current].alt; lbCount.textContent = "Photo " + (current + 1) + " of " + n; }
    function openBox(i) { lbShow(i); box.showModal(); document.getElementById(n > 1 ? "lb-next" : "lb-close").focus(); }
    document.getElementById("view-larger").addEventListener("click", function () { openBox(current); });
    main.addEventListener("click", function () { openBox(current); });
    document.getElementById("lb-prev").addEventListener("click", function () { lbShow(current - 1); });
    document.getElementById("lb-next").addEventListener("click", function () { lbShow(current + 1); });
    document.getElementById("lb-close").addEventListener("click", function () { box.close(); });
    box.addEventListener("click", function (e) { if (e.target === box) box.close(); });
    box.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") lbShow(current + 1); if (e.key === "ArrowLeft") lbShow(current - 1); });
    box.addEventListener("close", function () { show(current); });
    if (n < 2) { document.getElementById("lb-prev").hidden = true; document.getElementById("lb-next").hidden = true; }

    /* "Read full description" opens and scrolls to the panel */
    document.getElementById("read-more").addEventListener("click", function (e) {
      e.preventDefault(); var d = document.getElementById("full-description"); d.open = true;
      var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      d.querySelector("summary").focus({ preventScroll: true });
      d.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
      /* Fallback for browsers that ignore smooth scrolling */
      setTimeout(function () { if (d.getBoundingClientRect().top > window.innerHeight * 0.6) d.scrollIntoView({ block: "start" }); }, 700);
    });

    var add = document.getElementById("add-to-basket");
    if (add) add.addEventListener("click", function () {
      var m = document.getElementById("basket-msg");
      m.hidden = false;
      m.innerHTML = "<strong>Demo mode:</strong> on the live site this adds the item to the WooCommerce basket, then on to checkout. Nothing has been added, ordered or paid for in this preview.";
      add.textContent = "Added (demo only)"; add.setAttribute("aria-disabled", "true");
    });

    /* More from the collection: this item's category first, then two others */
    var order = ["furniture", "vintage-enamel-signs", "vintage-tins", "architectural-industrial", "home-garden-leisure"];
    var picks = [cat.slug].concat(order.filter(function (s) { return s !== cat.slug; })).filter(function (s) { return cats[s] && !cats[s].footer_only; }).slice(0, 3);
    /* Same illustrative category artwork as the homepage tiles, as in the product-page mockup */
    document.getElementById("more-tiles").innerHTML = picks.map(function (s) { return categoryTile(cats[s], "Browse " + cats[s].label.toLowerCase()); }).join("");
  };

  pages.sell = function () {
    var form = document.getElementById("sell-form"), files = document.getElementById("photos"), prev = document.getElementById("upload-preview");
    files.addEventListener("change", function () {
      prev.innerHTML = "";
      Array.prototype.slice.call(files.files, 0, 6).forEach(function (f) {
        if (!/^image\//.test(f.type)) return;
        var img = new Image(); img.alt = "Selected photo: " + f.name; img.src = URL.createObjectURL(f); prev.appendChild(img);
      });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var m = document.getElementById("sell-msg"); m.hidden = false;
      m.innerHTML = "<strong>Demo mode:</strong> nothing has been sent and no photos have left this device. On the live site this would email Vintage Pine Etc., who will then make contact.";
      m.focus();
    });
  };

  pages.contact = function () {
    var about = byId[param("about")];
    if (about) {
      var el = document.getElementById("about-item");
      el.hidden = false;
      el.innerHTML = "You’re asking about: <a class=\"text-link\" href=\"" + itemUrl(about) + "\">" + esc(about.name) + "</a> (" + money(about.price) + ")";
      document.getElementById("msg").value = "Hello, I’m interested in the " + about.name + ". ";
    }
    document.getElementById("contact-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var m = document.getElementById("contact-msg"); m.hidden = false;
      m.innerHTML = "<strong>Demo mode:</strong> enquiry not sent. On the live site this goes to the shop’s email.";
      m.focus();
    });
  };

  document.addEventListener("DOMContentLoaded", function () {
    mountChrome();
    var page = document.body.getAttribute("data-page");
    if (pages[page]) pages[page]();
  });
})();
