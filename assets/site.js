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
      "<h" + h + ">" + esc(p.name) + "</h" + h + ">" +
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
    tiles.innerHTML = C.categories.filter(function (c) { return !c.footer_only; }).map(function (c) {
      return '<li class="tile"><a href="' + collectionUrl(c.slug) + '"><div class="img"><img src="' + c.image + '" alt="" loading="lazy" width="400" height="400"></div><span>' + esc(c.label) + "</span></a></li>";
    }).join("");
    renderCards(latest(6), document.getElementById("latest-finds"));
    renderCards(inCategory("sold-items").filter(isSold).slice(0, 3), document.getElementById("recently-sold"));
  };

  pages.collection = function () {
    var slug = param("c") || "furniture", c = cats[slug];
    if (!c) { slug = "furniture"; c = cats[slug]; }
    document.title = c.label + " – Vintage Pine Etc. (preview)";
    document.getElementById("c-title").textContent = c.label;
    document.getElementById("c-crumb").textContent = c.label;
    document.getElementById("c-live").textContent = c.live_count + " listings (available and sold) in “" + c.live_name + "” on the live site";
    var list = inCategory(slug);
    renderCards(list, document.getElementById("c-items"), 2);
    document.getElementById("c-count").textContent = list.length + " sample item" + (list.length === 1 ? "" : "s") + " shown";
  };

  pages.item = function () {
    var p = byId[param("id")] || byId[C.demo_items.available];
    var sold = isSold(p), cat = primaryCat(p), root = document.getElementById("item");
    document.title = p.name + " – Vintage Pine Etc. (preview)";
    document.body.classList.add(sold ? "outofstock" : "instock");
    var n = p.images.length;
    /* Strip a leading "Size." / "Approximate size." label, since the row is already labelled. */
    var size = p.size.map(function (s) { s = s.replace(/^(approximate\s+)?sizes?\.?\s*/i, ""); return s.charAt(0).toUpperCase() + s.slice(1); });
    var details = [["Era", p.era], ["Size", size], ["Condition", p.condition]].filter(function (d) { return d[1] && d[1].length; });

    var buy = sold
      ? '<div class="sold-panel" role="status"><p class="big">Sold</p><p>This piece has found a new home. <span class="price-was">It was listed at ' + money(p.price) + ".</span></p>" +
        '<a class="btn btn-primary" href="' + collectionUrl(cat.slug) + '">Browse more ' + esc(cat.label.toLowerCase()) + "</a>" +
        '<a class="btn btn-secondary" href="index.html#latest">See latest finds</a>' +
        '<p class="help" style="margin:14px 0 0">Looking for something similar? <a class="text-link" href="contact.html">Get in touch</a> – stock changes often.</p></div>'
      : '<div class="buy"><button class="btn btn-primary" type="button" id="add-to-basket">Add to basket</button>' +
        '<a class="btn btn-secondary" href="contact.html?about=' + p.id + '">Ask a question or arrange a viewing</a>' +
        '<small>' + esc(C.shop.viewing) + ". Viewing and collection: Bexleyheath, DA7.</small>" +
        '<div class="demo-notice" id="basket-msg" role="status" aria-live="polite" hidden></div></div>';

    root.innerHTML =
      '<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="index.html">Home</a></li><li><a href="' + collectionUrl(cat.slug) + '">' + esc(cat.label) + '</a></li><li aria-current="page">' + esc(p.name) + "</li></ol></nav>" +
      '<div class="item"><section class="gallery" aria-label="Photos">' +
        '<div class="main"><img id="main-photo" src="' + esc(p.images[0].src) + '" alt="' + esc(p.images[0].alt) + '" width="1200" height="900">' + (sold ? '<span class="badge-sold" aria-hidden="true">Sold</span>' : "") + "</div>" +
        (n > 1 ? '<ul class="thumbs">' + p.images.map(function (im, i) {
          return '<li><button type="button" data-i="' + i + '" aria-label="Show photo ' + (i + 1) + " of " + n + '"' + (i === 0 ? ' aria-current="true"' : "") + '><img src="' + esc(im.src) + '" alt="" loading="lazy" width="120" height="120"></button></li>';
        }).join("") + "</ul>" : "") +
        '<p class="count" id="photo-count">' + (n > 1 ? "Photo 1 of " + n : "") + "</p></section>" +
      '<div class="summary"><p class="cat"><a href="' + collectionUrl(cat.slug) + '">' + esc(cat.label) + "</a></p>" +
        "<h1>" + esc(p.name) + "</h1>" +
        (sold ? "" : '<p class="price">' + money(p.price) + '</p><p class="status">Available</p>') +
        buy +
        (details.length ? '<dl class="details">' + details.map(function (d) { return "<div><dt>" + d[0] + "</dt><dd>" + d[1].map(esc).join("<br>") + "</dd></div>"; }).join("") + "</dl>" : "") +
        (p.description.length ? '<div class="description">' + p.description.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") + "</div>" : "") +
        '<p class="flag">Text, price and photos taken from the live listing (<a href="' + esc(p.source_permalink) + '" rel="noopener">view on current site</a>).</p>' +
      "</div></div>";

    var main = document.getElementById("main-photo");
    root.querySelectorAll(".thumbs button").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = +b.getAttribute("data-i");
        main.src = p.images[i].src; main.alt = p.images[i].alt;
        root.querySelectorAll(".thumbs button").forEach(function (x) { x.removeAttribute("aria-current"); });
        b.setAttribute("aria-current", "true");
        document.getElementById("photo-count").textContent = "Photo " + (i + 1) + " of " + n;
      });
    });
    var add = document.getElementById("add-to-basket");
    if (add) add.addEventListener("click", function () {
      var m = document.getElementById("basket-msg");
      m.hidden = false;
      m.innerHTML = "<strong>Demo mode:</strong> on the live site this adds the item to the WooCommerce basket, then on to checkout. Nothing has been added, ordered or paid for in this preview.";
      add.textContent = "Added (demo only)"; add.setAttribute("aria-disabled", "true");
    });

    var related = C.products.filter(function (x) { return x.id !== p.id && !isSold(x) && x.categories.indexOf(cat.slug) > -1; }).slice(0, 3);
    if (related.length < 3) related = related.concat(latest(6, p.id).filter(function (x) { return related.indexOf(x) < 0; })).slice(0, 3);
    document.getElementById("related-title").textContent = sold ? "Available now" : "More " + cat.label.toLowerCase();
    document.getElementById("related-more").href = collectionUrl(cat.slug);
    renderCards(related, document.getElementById("related"));
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
