// טוען את הקאסט מ-Supabase ומחליף את window.CAST_DATA לפני הרצת שאר הסקריפטים.
// אם אין חיבור או הטבלה ריקה — נשארים עם הקובץ הסטטי המצורף (cast-data.js).
window.loadCastData = function (done) {
  var cfg = window.APP_CONFIG || {};
  var configured = cfg.SUPABASE_URL && cfg.SUPABASE_URL.indexOf("PUT_YOUR") === -1 &&
    cfg.SUPABASE_ANON_KEY && cfg.SUPABASE_ANON_KEY.indexOf("PUT_YOUR") === -1;
  if (!configured || !window.supabase) { done(); return; }

  try {
    var client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    client.from("cast_state").select("performances,roles").eq("id", 1).maybeSingle()
      .then(function (res) {
        if (!res.error && res.data && Array.isArray(res.data.roles) && res.data.roles.length) {
          window.CAST_DATA = {
            performances: res.data.performances || [],
            roles: res.data.roles || [],
          };
        }
        done();
      }, function () { done(); });
  } catch (_) { done(); }
};
