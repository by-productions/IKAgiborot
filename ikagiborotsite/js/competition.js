(function () {
  var cfg = window.APP_CONFIG || {};
  var data = window.CAST_DATA || { roles: [], performances: [] };
  var perfs = data.performances || [];

  var e = function (id) { return document.getElementById(id); };
  if (cfg.TICKETS_URL) e("ticketsBtn").href = cfg.TICKETS_URL;
  if (cfg.COUPON_CODE) e("couponBox").textContent = cfg.COUPON_CODE;

  // רשימת שחקנים מתוך הקאסט
  var names = {};
  (data.roles || []).forEach(function (r) {
    (r.actors || []).forEach(function (a) { if (a) names[a.trim()] = true; });
  });
  var actorList = Object.keys(names).sort(function (a, b) { return a.localeCompare(b, "he"); });

  var sel = e("actorSelect");
  sel.innerHTML = '<option value="">— בחר/י את השם שלך —</option>' +
    actorList.map(function (n) { return '<option>' + n + "</option>"; }).join("") +
    '<option value="__other__">אחר (לא ברשימה)</option>';
  sel.addEventListener("change", function () {
    e("customNameWrap").style.display = sel.value === "__other__" ? "block" : "none";
  });

  // בחירת הצגה בטופס
  e("perfSelect").innerHTML = '<option value="">— בחר/י הצגה —</option>' +
    perfs.map(function (p, i) {
      return '<option value="' + p + '">הצגה ' + (i + 1) + " · " + p + "</option>";
    }).join("");

  function notice(msg, type) {
    e("notice").innerHTML = '<div class="notice ' + type + '">' + msg + "</div>";
  }

  var configured = cfg.SUPABASE_URL && cfg.SUPABASE_URL.indexOf("PUT_YOUR") === -1 &&
    cfg.SUPABASE_ANON_KEY && cfg.SUPABASE_ANON_KEY.indexOf("PUT_YOUR") === -1;

  var supa = null;
  if (configured && window.supabase) {
    supa = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }

  var LS_KEY = "ticket_sales_demo";
  function demoGet() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch (_) { return []; } }
  function demoAdd(rec) { var a = demoGet(); a.push(rec); localStorage.setItem(LS_KEY, JSON.stringify(a)); }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderBoard(rows) {
    var filtered = rows;

    var totals = {};
    filtered.forEach(function (r) {
      totals[r.actor_name] = (totals[r.actor_name] || 0) + Number(r.qty || 0);
    });
    var ranked = Object.keys(totals).map(function (k) { return { name: k, qty: totals[k] }; })
      .sort(function (a, b) { return b.qty - a.qty; });
    var board = e("scoreboard");
    if (!ranked.length) {
      board.innerHTML = '<li class="empty">עדיין אין מכירות. היו הראשונים!</li>';
    } else {
      board.innerHTML = ranked.map(function (r, i) {
        var cls = i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
        var medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1);
        return '<li class="score-row ' + cls + '">' +
          '<span class="rank">' + medal + "</span>" +
          '<span class="name">' + esc(r.name) + "</span>" +
          '<span class="count">' + r.qty + ' <small>כרטיסים</small></span></li>';
      }).join("");
    }
    var log = filtered.slice().sort(function (a, b) {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }).slice(0, 40);
    e("log").innerHTML = log.length
      ? '<h4 style="margin:14px 0 8px;color:var(--purple-dark)">מכירות אחרונות</h4>' +
        log.map(function (r) {
          var perf = r.performance ? ' · <span class="buyer">' + esc(r.performance) + "</span>" : "";
          return '<div class="item"><span><strong>' + esc(r.actor_name) + "</strong> · " +
            r.qty + " כרטיסים" + perf + '</span><span class="buyer">רוכש: ' +
            esc(r.buyer_name) + "</span></div>";
        }).join("")
      : "";
  }

  function loadAndRender() {
    if (supa) {
      supa.from("ticket_sales").select("*").then(function (res) {
        if (res.error) { notice("שגיאה בטעינת הנתונים: " + res.error.message, "err"); return; }
        renderBoard(res.data || []);
      });
    } else {
      renderBoard(demoGet());
    }
  }

  if (!configured) {
    notice("מצב הדגמה: הנתונים נשמרים בדפדפן בלבד. לאחר חיבור Supabase התחרות תהיה משותפת לכולם.", "info");
  }

  e("saleForm").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var actor = sel.value === "__other__" ? e("actorCustom").value.trim() : sel.value;
    var perf = e("perfSelect").value;
    var buyer = e("buyerName").value.trim();
    var qty = parseInt(e("qty").value, 10);
    if (!actor) { notice("בחר/י את השם שלך.", "err"); return; }
    if (!perf) { notice("בחר/י לאיזו הצגה נרכשו הכרטיסים.", "err"); return; }
    if (!buyer) { notice("יש להזין שם מלא של רוכש הכרטיס.", "err"); return; }
    if (!qty || qty < 1) { notice("כמות כרטיסים לא תקינה.", "err"); return; }

    var rec = {
      actor_name: actor, buyer_name: buyer, qty: qty,
      performance: perf, created_at: new Date().toISOString()
    };

    function done() {
      notice("נוסף! " + esc(actor) + " · " + qty + " כרטיסים ל" + esc(buyer) +
        " (" + esc(perf) + ").", "ok");
      e("saleForm").reset();
      e("customNameWrap").style.display = "none";
      loadAndRender();
    }

    if (supa) {
      supa.from("ticket_sales")
        .insert([{ actor_name: actor, buyer_name: buyer, qty: qty, performance: perf }])
        .then(function (res) {
          if (res.error) { notice("שמירה נכשלה: " + res.error.message, "err"); return; }
          done();
        });
    } else {
      demoAdd(rec);
      done();
    }
  });

  loadAndRender();

  if (supa) {
    supa.channel("ticket_sales_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "ticket_sales" }, loadAndRender)
      .subscribe();
  }
})();
