# גיבורות מהאגדות · אזור השחקנים

אתר לשחקני סדנת תיאטרון איקה זהר — חיפוש קאסטים לפי שם שחקן (כולל קורוסים)
ותחרות כרטיסים עם scoreboard בזמן אמת.

## מבנה

- `index.html` — עמוד ראשי: פוסטר, חיפוש שחקן, קישורים
- `competition.html` — תחרות הכרטיסים (scoreboard)
- `js/config.js` — הגדרות (מפתחות Supabase, קישורים, קוד קופון)
- `js/cast-data.js` — נתוני הקאסט (נוצר אוטומטית מהאקסל)
- `js/app.js` — לוגיקת החיפוש
- `js/competition.js` — לוגיקת התחרות + חיבור Supabase
- `db/schema.sql` — סכימת מסד הנתונים
- `assets/poster.jpg`, `assets/logo.png` — תמונות (יש להוסיף ידנית, ראו למטה)

## תמונות

יש להעלות לתיקיית `assets/`:
- `poster.jpg` — פוסטר המחזמר
- `logo.png` — לוגו סדנת תיאטרון איקה זהר

עד שיתווספו, האתר מציג רקע חלופי אוטומטית (לא נשבר).

## הפעלה מקומית

```bash
python3 -m http.server 8000
# פתחו http://localhost:8000
```

## הקמת Supabase

1. צרו פרויקט ב-https://supabase.com
2. **SQL Editor** → הדביקו והריצו את `db/schema.sql`
3. **Project Settings → API** → העתיקו `Project URL` ו-`anon public key`
4. עדכנו ב-`js/config.js`:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

ללא חיבור Supabase האתר עובד ב"מצב הדגמה" (נתונים בדפדפן בלבד).

## פריסה ל-Vercel

1. חברו את ה-repo ל-Vercel (Add New → Project → Import)
2. Framework Preset: **Other** · ללא build command · Output: שורש הריפו
3. Deploy — מקבלים כתובת לשיתוף עם השחקנים

## קישורים

- רכישת כרטיסים: ב-`js/config.js` (`TICKETS_URL`)
- קוד קופון: `SADNA45`
- חומרים מהחזרות: קישור הדרייב ב-`js/config.js`
