window.loadCastData(function () {
  var cfg = window.APP_CONFIG || {};
  var data = window.CAST_DATA || { performances: [], roles: [] };
  var perfs = data.performances || [];

  function setLink(id, href) { var e = document.getElementById(id); if (e && href) e.href = href; }
  setLink("ticketsBtn", cfg.TICKETS_URL);
  setLink("ticketsBtn2", cfg.TICKETS_URL);
  setLink("footerTickets", cfg.TICKETS_URL);
  setLink("driveBtn", cfg.REHEARSAL_DRIVE_URL);
  setLink("driveBtn2", cfg.REHEARSAL_DRIVE_URL);
  var t = function (id, v) { var e = document.getElementById(id); if (e && v) e.textContent = v; };
  t("showTitle", cfg.SHOW_TITLE);
  t("showSub", cfg.SHOW_SUBTITLE);
  t("showDates", cfg.SHOW_DATES);
  t("couponBox", cfg.COUPON_CODE);

  // אינדקס: שם שחקן -> [perfIndex] -> [{role,type}]
  var index = {};
  var allNames = [];
  (data.roles || []).forEach(function (r) {
    (r.actors || []).forEach(function (actor, pi) {
      if (!actor) return;
      var name = actor.trim();
      if (!index[name]) { index[name] = perfs.map(function () { return []; }); allNames.push(name); }
      index[name][pi].push({ role: r.role, type: r.type });
    });
  });
  allNames = allNames.filter(function (v, i, a) { return a.indexOf(v) === i; });
  allNames.sort(function (a, b) { return a.localeCompare(b, "he"); });

  var input = document.getElementById("searchInput");
  var results = document.getElementById("results");
  var suggestionsEl = document.getElementById("suggestions");

  function norm(s) { return (s || "").replace(/["'.־]/g, "").replace(/\s+/g, " ").trim().toLowerCase(); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function render(name) {
    var byPerf = index[name];
    if (!byPerf) { results.innerHTML = '<div class="empty">לא נמצא שחקן בשם הזה.</div>'; return; }
    var cards = perfs.map(function (p, pi) {
      var roles = byPerf[pi];
      var body;
      if (!roles.length) {
        body = '<div class="empty" style="padding:10px">משתתף/ת בהצגה זו בקאסטים הכללים</div>';
      } else {
        body = '<table class="role-table"><tbody>' + roles.map(function (r) {
          var tag = r.type === "chorus"
            ? '<span class="tag-chorus">קורוס</span>'
            : '<span class="tag-role">תפקיד</span>';
          return "<tr><td>" + esc(r.role) + "</td><td>" + tag + "</td></tr>";
        }).join("") + "</tbody></table>";
      }
      return '<div class="card" style="margin-bottom:14px">' +
        '<h3 style="color:var(--purple);border-bottom:3px solid var(--yellow);padding-bottom:6px;display:inline-block;margin-bottom:10px">הצגה ' +
        (pi + 1) + " · " + esc(p) + "</h3>" + body + "</div>";
    }).join("");
    results.innerHTML = '<div class="actor-result"><h3>' + esc(name) +
      "</h3><p class=\"sub\">סך הכל " +
      perfs.reduce(function (s, _, i) { return s + byPerf[i].length; }, 0) +
      " השתתפויות לאורך 6 ההצגות</p>" + cards + "</div>";
    highlightTable(name);
  }

  function search() {
    var q = norm(input.value);
    suggestionsEl.innerHTML = "";
    if (!q) { results.innerHTML = ""; highlightTable(null); showAllNames(); return; }
    var exact = allNames.filter(function (n) { return norm(n) === q; });
    if (exact.length === 1) { render(exact[0]); return; }
    var matches = allNames.filter(function (n) { return norm(n).indexOf(q) !== -1; });
    if (matches.length === 0) {
      results.innerHTML = '<div class="empty">לא נמצא שחקן תואם. בדקו את האיות.</div>';
      highlightTable(null);
    } else if (matches.length === 1) {
      render(matches[0]);
    } else {
      highlightTable(null);
      results.innerHTML = '<div class="empty">נמצאו כמה תוצאות — בחרו שם:</div>';
      suggestionsEl.innerHTML = matches.slice(0, 30).map(function (n) {
        return '<button data-name="' + esc(n) + '">' + esc(n) + "</button>";
      }).join("");
    }
  }

  function showAllNames() {
    suggestionsEl.innerHTML = allNames.map(function (n) {
      return '<button data-name="' + esc(n) + '">' + esc(n) + "</button>";
    }).join("");
  }

  // ---- טבלת תפקידים מלאה (ללא קורוסים) ----
  var tableEl = document.getElementById("castTable");
  function buildTable() {
    if (!tableEl) return;
    var rolesOnly = (data.roles || []).filter(function (r) { return r.type !== "chorus"; });
    var head = "<thead><tr><th>תפקיד</th>" + perfs.map(function (p, i) {
      return "<th>הצגה " + (i + 1) + "<br><small>" + esc(p) + "</small></th>";
    }).join("") + "</tr></thead>";
    var bodyRows = rolesOnly.map(function (r) {
      var cells = (r.actors || []).map(function (a) {
        if (!a) return '<td class="muted">—</td>';
        return '<td data-actor="' + esc(norm(a)) + '">' + esc(a) + "</td>";
      }).join("");
      return "<tr><td><strong>" + esc(r.role) + "</strong></td>" + cells + "</tr>";
    }).join("");
    tableEl.innerHTML = head + "<tbody>" + bodyRows + "</tbody>";
  }

  function highlightTable(name) {
    if (!tableEl) return;
    var target = name ? norm(name) : null;
    var cells = tableEl.querySelectorAll("td[data-actor]");
    for (var i = 0; i < cells.length; i++) {
      if (target && cells[i].getAttribute("data-actor") === target) {
        cells[i].classList.add("hl");
      } else {
        cells[i].classList.remove("hl");
      }
    }
  }

  if (input) {
    input.addEventListener("input", search);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") search(); });
  }
  var sb = document.getElementById("searchBtn");
  if (sb) sb.addEventListener("click", search);
  suggestionsEl.addEventListener("click", function (e) {
    if (e.target.tagName === "BUTTON") {
      input.value = e.target.getAttribute("data-name");
      suggestionsEl.innerHTML = "";
      render(input.value);
    }
  });

  buildTable();
  if (allNames.length) {
    showAllNames();
  } else {
    results.innerHTML = '<div class="empty">נתוני הקאסט עדיין לא הוזנו.</div>';
  }
});
