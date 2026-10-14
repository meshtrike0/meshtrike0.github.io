/* Meshtrike website behaviour. Vanilla JS, no dependencies, no network requests. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var CFG = window.MESHTRIKE_CONFIG || {};
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fineMQ = window.matchMedia('(hover: hover) and (pointer: fine)');
  var motionOK = function () { return !reduceMQ.matches; };

  /* ---------- Toast + screen-reader announcements ---------- */
  var toastEl = $('.toast'), srEl = $('[data-sr]'), toastT;
  function toast(text) {
    clearTimeout(toastT);
    toastEl.textContent = text;
    toastEl.classList.add('show');
    toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
  }
  function announce(text) { srEl.textContent = ''; setTimeout(function () { srEl.textContent = text; }, 30); }

  /* ---------- Config: download links + version labels ---------- */
  var apk = {
    meshtrike: { url: CFG.MESHTRIKE_APK_URL || '#download', name: CFG.MESHTRIKE_APK_NAME || 'Meshtrike APK' },
    reach: { url: CFG.REACH_APK_URL || '#download-reach', name: CFG.REACH_APK_NAME || 'MeshGRID APK' }
  };
  $$('[data-apk]').forEach(function (a) {
    var item = apk[a.getAttribute('data-apk')];
    if (!item) return;
    a.setAttribute('href', item.url);
    a.addEventListener('click', function (e) {
      if (item.url.charAt(0) === '#') {
        e.preventDefault();
        toast('Download link coming soon');
      } else {
        toast('Downloading ' + item.name);
      }
    });
  });
  $$('[data-ver]').forEach(function (el) {
    var v = el.getAttribute('data-ver') === 'reach' ? CFG.REACH_VERSION : CFG.MESHTRIKE_VERSION;
    if (v) el.textContent = v;
  });

  /* ---------- Hero chat: replays the conversation (final frame is static HTML) ---------- */
  (function heroChat() {
    var chat = $('.chat'), pill = $('[data-pill]');
    if (!chat || !pill || !motionOK()) return;
    var templates = $$('.bub', chat).map(function (n) { return n.cloneNode(true); });
    var pillMesh = pill.innerHTML;
    var pillBt = '<svg class="i" aria-hidden="true" focusable="false"><use href="#i-bt"/></svg><span>Nearby · Bluetooth</span>';
    var step = 0, pillState = '';

    function setStatus(el, label) {
      if (!el) return;
      var icon = label === 'Waiting' ? 'clock' : label === 'Sent' ? 'check' : 'checks';
      el.querySelector('use').setAttribute('href', '#i-' + icon);
      el.querySelector('span').textContent = label;
      el.classList.toggle('read', label === 'Read');
    }
    function render() {
      if (step === 0) chat.innerHTML = '';
      templates.forEach(function (t) {
        var at = +t.getAttribute('data-at');
        if (step >= at && !chat.querySelector('[data-at="' + at + '"]')) {
          var el = t.cloneNode(true);
          el.classList.add('anim');
          chat.appendChild(el);
        }
      });
      setStatus(chat.querySelector('[data-st="first"]'), step >= 3 ? 'Read' : 'Sent');
      setStatus(chat.querySelector('[data-st="last"]'), step >= 9 ? 'Delivered' : step >= 8 ? 'Sent' : 'Waiting');
      var want = step >= 6 ? 'mesh' : 'bt';
      if (want !== pillState) {
        pillState = want;
        pill.innerHTML = want === 'mesh' ? pillMesh : pillBt;
        pill.className = 'route-pill ' + (want === 'mesh' ? 'c-mesh' : 'c-bt');
        void pill.offsetWidth;
        pill.classList.add('anim');
      }
    }
    render();
    setInterval(function () {
      if (document.hidden) return;
      step = (step + 1) % 11;
      render();
    }, 1500);
  })();

  /* ---------- Scroll reveal ---------- */
  if (motionOK() && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('rv-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    setTimeout(function () {
      $$('[data-reveal]').forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) return;
        el.classList.add('rv');
        io.observe(el);
      });
    }, 60);
  }

  /* ---------- Cursor blob, tilt cards, magnetic buttons (mouse only) ---------- */
  if (motionOK() && fineMQ.matches) {
    var blob = $('.blob');
    if (blob) {
      var mx = innerWidth / 2, my = innerHeight / 3, bx = mx, by = my;
      blob.classList.add('on');
      addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
      (function loop() {
        bx += (mx - bx) * 0.08; by += (my - by) * 0.08;
        blob.style.transform = 'translate(' + bx + 'px,' + by + 'px)';
        requestAnimationFrame(loop);
      })();
    }
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var b = el.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5;
        el.style.transform = 'perspective(900px) rotateX(' + (-y * 7) + 'deg) rotateY(' + (x * 9) + 'deg) translateY(-4px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
    $$('[data-magnet]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var b = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - b.left - b.width / 2) * 0.18) + 'px,' + ((e.clientY - b.top - b.height / 2) * 0.3) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- Use-case tabs ---------- */
  (function tabs() {
    var list = $('[role="tablist"]');
    if (!list) return;
    var tabs = $$('[role="tab"]', list);
    function select(i, focus) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (on) {
          panel.hidden = false;
          // restart the entrance animation like the design's keyed re-render
          panel.style.animation = 'none'; void panel.offsetWidth; panel.style.animation = '';
          $$('li', panel).forEach(function (li) { li.style.animation = 'none'; void li.offsetWidth; li.style.animation = ''; });
        } else {
          panel.hidden = true;
        }
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, false); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, k = e.key, to = null;
        if (k === 'ArrowDown' || k === 'ArrowRight') to = (i + 1) % n;
        else if (k === 'ArrowUp' || k === 'ArrowLeft') to = (i - 1 + n) % n;
        else if (k === 'Home') to = 0;
        else if (k === 'End') to = n - 1;
        if (to !== null) { e.preventDefault(); select(to, true); }
      });
    });
  })();

  /* ---------- FAQ accordion (one open at a time, like the design) ---------- */
  (function faq() {
    var items = $$('.qa');
    items.forEach(function (qa) {
      var btn = $('.qa__btn', qa);
      btn.addEventListener('click', function () {
        var willOpen = btn.getAttribute('aria-expanded') !== 'true';
        items.forEach(function (o) {
          o.classList.remove('open');
          $('.qa__btn', o).setAttribute('aria-expanded', 'false');
        });
        if (willOpen) { qa.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
      });
    });
  })();

  /* ---------- Swag: filters, sizes, bag ---------- */
  var products = {};
  $$('.product').forEach(function (p) {
    products[p.getAttribute('data-id')] = {
      el: p,
      name: p.getAttribute('data-name'),
      price: +p.getAttribute('data-price'),
      bg: p.getAttribute('data-bg'),
      cat: p.getAttribute('data-cat')
    };
  });

  $$('.cat').forEach(function (b) {
    b.addEventListener('click', function () {
      var cat = b.getAttribute('data-cat');
      $$('.cat').forEach(function (o) { o.setAttribute('aria-pressed', o === b); });
      Object.keys(products).forEach(function (id) {
        var p = products[id], show = cat === 'All' || p.cat === cat;
        p.el.hidden = !show;
        if (show) p.el.classList.add('rv-in');
      });
      announce(cat === 'All' ? 'Showing all swag' : 'Showing ' + cat);
    });
  });

  $$('.sizes').forEach(function (g) {
    $$('.size', g).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.size', g).forEach(function (o) { o.setAttribute('aria-pressed', o === b); });
      });
    });
  });

  var cart = {}; // key "id|size" -> qty
  var cartBtn = $('[data-open-cart]'), cartN = $('.cart-btn__n');
  var drawer = $('#cart'), panel = $('.drawer__panel'), body = $('[data-cart-body]'), empty = $('[data-cart-empty]');
  var subtotalEl = $('[data-subtotal]'), lastFocus = null;

  function renderCart() {
    $$('.line', body).forEach(function (n) { n.remove(); });
    var count = 0, total = 0;
    Object.keys(cart).forEach(function (key) {
      var qty = cart[key];
      if (qty <= 0) return;
      var parts = key.split('|'), p = products[parts[0]], size = parts[1];
      count += qty; total += p.price * qty;
      var dark = p.bg.toUpperCase() === '#15171C';
      var row = document.createElement('div');
      row.className = 'line';
      row.innerHTML =
        '<span class="line__img" style="--bg:' + p.bg + ';--fg:' + (dark ? '#CDF25C' : '#15171C') + '"><svg class="i" aria-hidden="true" focusable="false"><use href="#i-bag"/></svg></span>' +
        '<div class="line__txt"><span class="line__name"></span><span class="line__meta"></span></div>' +
        '<div class="qty"><button type="button" data-d="-1">−</button><span></span><button type="button" data-d="1">+</button></div>';
      $('.line__name', row).textContent = p.name;
      $('.line__meta', row).textContent = (size ? 'Size ' + size + ' · ' : '') + '$' + p.price;
      $('.qty span', row).textContent = qty;
      $('[data-d="-1"]', row).setAttribute('aria-label', 'Remove one ' + p.name);
      $('[data-d="1"]', row).setAttribute('aria-label', 'Add one ' + p.name);
      $$('.qty button', row).forEach(function (b) {
        b.addEventListener('click', function () {
          cart[key] = Math.max(0, (cart[key] || 0) + +b.getAttribute('data-d'));
          if (!cart[key]) delete cart[key];
          renderCart();
          var again = $('.line [data-d]', body);
          (again || $('[data-close-cart].icon-btn')).focus();
        });
      });
      body.appendChild(row);
    });
    empty.hidden = count > 0;
    subtotalEl.textContent = '$' + total;
    var prev = cartN.textContent;
    cartN.textContent = count;
    cartN.hidden = count === 0;
    if (String(count) !== prev && count) { cartN.classList.remove('bump'); void cartN.offsetWidth; cartN.classList.add('bump'); }
    cartBtn.setAttribute('aria-label', 'Open bag, ' + count + (count === 1 ? ' item' : ' items'));
    return count;
  }

  $$('[data-add]').forEach(function (btn) {
    var timer;
    btn.addEventListener('click', function () {
      var li = btn.closest('.product'), id = li.getAttribute('data-id');
      var sel = $('.size[aria-pressed="true"]', li), size = sel ? sel.getAttribute('data-size') : '';
      var key = id + (size ? '|' + size : '');
      cart[key] = (cart[key] || 0) + 1;
      renderCart();
      btn.classList.add('added');
      btn.querySelector('span').textContent = 'Added to bag';
      announce(products[id].name + (size ? ', size ' + size : '') + ' added to bag');
      clearTimeout(timer);
      timer = setTimeout(function () {
        btn.classList.remove('added');
        btn.querySelector('span').textContent = 'Add to bag';
      }, 1400);
    });
  });

  function focusables() {
    return $$('button, [href], input, [tabindex]:not([tabindex="-1"])', panel).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
  }
  function openCart() {
    lastFocus = document.activeElement;
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { $('.icon-btn', panel).focus(); }, 50);
  }
  function closeCart() {
    if (!drawer.classList.contains('open')) return;
    drawer.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  cartBtn.addEventListener('click', openCart);
  $$('[data-close-cart]').forEach(function (b) { b.addEventListener('click', closeCart); });
  document.addEventListener('keydown', function (e) {
    if (!drawer.classList.contains('open')) return;
    if (e.key === 'Escape') { closeCart(); return; }
    if (e.key === 'Tab') {
      var f = focusables(); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  $('[data-checkout]').addEventListener('click', function () {
    toast(renderCart() ? 'Checkout opens with the store launch' : 'Your bag is empty');
  });
  renderCart();
})();
