(function () {
  var cfg = window.APP_CONFIG || {};
  var e = function (id) { return document.getElementById(id); };
  var ENS_KW = ["קורוס", "ריקוד", "נשף", "מזימות", "המרושעות", "סיכוי",
    "אולי נסיך", "שעה הנשף", "זוגות", "פשוט להיות נסיך"];

  var parsed = null;

  function notice(msg, type) {
    e("notice").innerHTML = '<div class="notice ' + type + '" style="margin-top:14px">' + msg + "</div>";
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function parseXlsx(file) {
    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var wb = XLSX.read(new Uint8Array(ev.target.result), { type: "array" });
        var ws = wb.Sheets[wb.SheetNames[0]];
        var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
        if (!rows.length) { notice("הקובץ ריק.", "err"); return; }

        var header = rows[0];
        var perfs = header.slice(1, 7).map(function (x) {
          return typeof x === "string" ? x.trim() : (x == null ? "" : String(x));
        });
        var body = [];
        for (var i = 1; i < rows.length; i++) {
          var r = rows[i];
          if (!r || !r[0]) continue;
          var name = String(r[0]).trim();
          var actors = [];
          for (var j = 1; j <= 6; j++) {
            var c = r[j];
            actors.push(typeof c === "string" ? c.trim() : (c == null ? null : String(c)));
          }
          body.push({ name: name, actors: actors });
        }

        var counts = {};
        body.forEach(function (b) { counts[b.name] = (counts[b.name] || 0) + 1; });
        function isChorus(n) {
          if (counts[n] > 1) return true;
          for (var k = 0; k < ENS_KW.length; k++) if (n.indexOf(ENS_KW[k]) !== -1) return true;
          return false;
        }
        var roles = body.map(function (b) {
          return { role: b.name, type: isChorus(b.name) ? "chorus" : "role", actors: b.actors };
        });

        parsed = { performances: perfs, roles: roles };
        showPreview();
      } catch (err) {
        notice("שגיאה בקריאת הקובץ: " + (err && err.message ? err.message : err), "err");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function showPreview() {
    var p = parsed;
    var rolesOnly = p.roles.filter(function (r) { return r.type === "role"; });
    var chorus = p.roles.length - rolesOnly.length;
    var actors = {};
    p.roles.forEach(function (r) { r.actors.forEach(function (a) { if (a) actors[a] = 1; }); });
    e("statRoles").textContent = rolesOnly.length + " תפקידים";
    e("statChorus").textContent = chorus + " קורוסים";
    e("statActors").textContent = Object.keys(actors).length + " שחקנים";
    e("statPerfs").textContent = p.performances.length + " הצגות";

    var head = "<thead><tr><th>שורה</th><th>שם</th><th>סוג</th>" +
      p.performances.map(function (x) { return "<th>" + esc(x) + "</th>"; }).join("") + "</tr></thead>";
    var body = p.roles.map(function (r, i) {
      var tag = r.type === "chorus"
        ? '<span class="tag-chorus">קורוס</span>'
        : '<span class="tag-role">תפקיד</span>';
      return "<tr><td>" + (i + 1) + "</td><td><strong>" + esc(r.role) + "</strong></td><td>" + tag + "</td>" +
        r.actors.map(function (a) { return "<td>" + (a ? esc(a) : '<span style="color:#b9a9cc">—</span>') + "</td>"; }).join("") +
        "</tr>";
    }).join("");
    e("preview").innerHTML = head + "<tbody>" + body + "</tbody>";
    e("previewArea").style.display = "block";
    notice("הקובץ נטען בהצלחה. בדקי את התצוגה ולחצי שמירה.", "ok");
  }

  // Drag & drop + click
  var drop = e("drop");
  drop.addEventListener("dragover", function (ev) { ev.preventDefault(); drop.classList.add("over"); });
  drop.addEventListener("dragleave", function () { drop.classList.remove("over"); });
  drop.addEventListener("drop", function (ev) {
    ev.preventDefault(); drop.classList.remove("over");
    if (ev.dataTransfer.files && ev.dataTransfer.files[0]) parseXlsx(ev.dataTransfer.files[0]);
  });
  e("file").addEventListener("change", function (ev) {
    if (ev.target.files && ev.target.files[0]) parseXlsx(ev.target.files[0]);
  });

  e("saveBtn").addEventListener("click", function () {
    if (!parsed) { notice("טעני קובץ קודם.", "err"); return; }
    var pw = e("adminPw").value;
    if (!pw) { notice("הזיני סיסמת ניהול.", "err"); return; }

    var configured = cfg.SUPABASE_URL && cfg.SUPABASE_URL.indexOf("PUT_YOUR") === -1 &&
      cfg.SUPABASE_ANON_KEY && cfg.SUPABASE_ANON_KEY.indexOf("PUT_YOUR") === -1;
    if (!configured || !window.supabase) {
      notice("Supabase לא מוגדר ב-config.js — לא ניתן לשמור.", "err"); return;
    }

    var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    e("saveBtn").disabled = true;
    notice("שומר...", "info");
    sb.rpc("update_cast", {
      p_secret: pw,
      p_performances: parsed.performances,
      p_roles: parsed.roles,
    }).then(function (res) {
      e("saveBtn").disabled = false;
      if (res.error) {
        var msg = res.error.message || String(res.error);
        if (/unauthorized/i.test(msg)) msg = "סיסמה שגויה.";
        notice("שמירה נכשלה: " + msg, "err");
        return;
      }
      notice("נשמר בהצלחה! האתר יציג את הקאסט החדש לכל המבקרים מיד.", "ok");
    });
  });
})();
