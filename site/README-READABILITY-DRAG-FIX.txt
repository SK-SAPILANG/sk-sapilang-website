SK SAPILANG — CERTIFICATE DRAG + GLOBAL READABILITY FIX

1. Copy feedback.html, feedback-page.js, certificate.html and global-readability.css to the website root.
2. To apply the readability standard to EVERY existing HTML page in the repository, place APPLY-READABILITY-TO-ALL-HTML.ps1 in the repository root, right-click it / run it in PowerShell once.
3. Test feedback.html -> Certificate Center. Participant Name, QR Code and Certificate Number are the only generated layers. They can be freely dragged anywhere and resized.
4. Click SAVE POSITIONS & MASTER CERTIFICATE. The public certificate.html now reads those saved master positions.
5. Hard-refresh with Ctrl+F5.

No new Apps Script backend is required for this drag/readability patch if the latest Code.gs is already deployed.
