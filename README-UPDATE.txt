SK SAPILANG QMS — ONE-GO UPDATE

FILES TO REPLACE ON GITHUB:
1. feedback.html
2. feedback-page.js (place in the same current JS location/name used by feedback.html)
3. certificate.html
4. events.html

GOOGLE APPS SCRIPT:
5. Replace your current QMS/CMS Apps Script with Code.gs.
6. Save, then Deploy > Manage deployments > Edit > New version > Deploy.
7. Keep the same /exec URL.

CANVA CERTIFICATE WORKFLOW:
- Open QMS Admin > Manage Activities.
- Under Canva Master Certificate, paste your private Canva edit link.
- In Canva, export the final certificate WITHOUT participant name, certificate number, or QR.
- Host the exported PNG/JPG at a public image URL and paste that URL as Master Certificate Image URL.
- Click Save Master Design.
- The system automatically overlays a participant's NAME, unique CERTIFICATE NUMBER, and unique QR.
- Every QR opens certificate-verify.html for that certificate ID.

IMPORTANT CERTIFICATE DESIGN NOTE:
Leave open space around the center for the participant name and at the bottom corners for the certificate number and QR. If you later redesign the certificate, edit only the Canva master and replace the background URL. Existing verification records remain unique.

FUTURE / FINISHED ACTIVITIES:
- QMS Admin > Manage Activities > Future & Finished Activities.
- Add title, date, status, description, venue, pubmat URL, Facebook link, and optional documentation photo URLs.
- Upcoming/Ongoing automatically appears in events.html under Future Activities.
- Change Status to Completed and it automatically appears under Finished Activities.
- Add the official Facebook post/album link so visitors can open the documentation on Facebook.

No administrator password is stored in the website files.
