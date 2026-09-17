SK SAPILANG QMS — ONE-GO ACTIVITY + CERTIFICATE SYNC FIX

Replace these files in your website:
1. feedback.html
2. feedback-page.js
3. news-events.html
4. certificate.html
5. Code.gs (Apps Script)

IMPORTANT:
- Redeploy Code.gs as a NEW VERSION but keep the same /exec URL.
- Hard refresh the website (Ctrl+F5).
- Do NOT keep the previous simplified news-events.html.

FIXED:
- integratedEsc is not defined
- One Activity Manager reads existing activities from news-events.html, feedback.html and events.html
- Existing WASTEWISE/WILDWISE/NUTRIWISE/etc. records can appear in Activity Manager
- New activities save into the official Updates & Programs activity source
- Activity Evaluation choices sync from Activity Manager
- Certificate Center activity choices sync from Activity Manager
- Certificate design remains linked to the selected activity
- Public Updates & Programs keeps the official SK website styling
- Public cards no longer display the technical label “Scheduled Activity / Evaluation”
- All / Upcoming / Ongoing / Completed filters are styled and functional
