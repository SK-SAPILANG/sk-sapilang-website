/**
 * ============================================================================
 * SANGGUNIANG KABATAAN NG BARANGAY SAPILANG
 * Quality Management System (QMS) & Digital Certificate Studio
 * JavaScript Engine (js/feedback-page.js)
 * 
 * Version: 2026.3.0 - Unified Rebuilt Edition
 * ============================================================================
 */

(function () {
  'use strict';

  // --- CONFIGURATION & ENDPOINTS ---
  function getCmsEndpoint() {
    return window.SK_CMS_ENDPOINT || localStorage.getItem('skCmsEndpoint') || '';
  }

  // --- GLOBAL STATE ---
  let activitiesList = [];
  let currentAdminPassword = sessionStorage.getItem('skQmsAdminKey') || '';
  let issuedCertificates = [];
  let activeSelectedObj = 'name'; // 'name' | 'qr' | 'no'

  // Per-activity certificate templates dictionary
  // Structure: { [activityId]: { backgroundUrl, layout: { nameX, nameY, ... } } }
  let activityTemplates = {};

  // Master / Fallback Template State (Percentage-based)
  const DEFAULT_MASTER_TEMPLATE = {
    backgroundUrl: '',
    canvaUrl: '',
    certType: 'Certificate of Participation',
    layout: {
      nameX: 50,
      nameY: 48,
      nameSize: 38,
      nameFont: 'Georgia, serif',
      nameColor: '#0A2540',
      nameBold: true,
      nameAlign: 'center',
      qrX: 84,
      qrY: 80,
      qrSize: 96,
      noX: 18,
      noY: 92,
      noSize: 13,
      noColor: '#0A2540'
    }
  };

  let activeStudioTemplate = JSON.parse(JSON.stringify(DEFAULT_MASTER_TEMPLATE));

  // Default seed activities if fresh install
  const SEED_ACTIVITIES = [
    {
      id: 'ACT-NUTRIWISE',
      title: 'NUTRIWISE: Community Nutrition & Health Workshop',
      date: '2026-09-24',
      status: 'Upcoming',
      venue: 'Sapilang Barangay Covered Court',
      speaker: 'Dr. Maria Elena Santos, RND',
      description: 'Educational seminar on balanced youth nutrition and adolescent wellness.'
    },
    {
      id: 'ACT-WASTEWISE',
      title: 'WASTEWISE: Youth Ecological Solid Waste Summit',
      date: '2026-10-12',
      status: 'Upcoming',
      venue: 'Bacnotan Cultural Center',
      speaker: 'Engr. Carlos Mendoza, EnP',
      description: 'Hands-on training on zero-waste barangay practices and composting.'
    },
    {
      id: 'ACT-KABOTEHAN',
      title: 'kaBOTEhan: Plastic Bottle Upcycling Drive',
      date: '2026-08-15',
      status: 'Completed',
      venue: 'Barangay Hall Grounds',
      speaker: '', // No speaker: tests adaptive question hiding!
      description: 'Community plastic bottle exchange for school supplies.'
    }
  ];

  // --- HELPER: JSONP / API CALLS ---
  function callApi(params) {
    return new Promise((resolve, reject) => {
      const endpoint = getCmsEndpoint();
      if (!endpoint) {
        return resolve(null); // Fallback to local storage if endpoint unset
      }
      const cb = 'qms_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
      const s = document.createElement('script');
      const timer = setTimeout(() => {
        s.remove();
        delete window[cb];
        resolve(null);
      }, 15000);

      window[cb] = (data) => {
        clearTimeout(timer);
        s.remove();
        delete window[cb];
        resolve(data);
      };

      s.onerror = () => {
        clearTimeout(timer);
        s.remove();
        delete window[cb];
        resolve(null);
      };

      s.src = endpoint + '?' + new URLSearchParams({ ...params, callback: cb, _: Date.now() });
      document.head.appendChild(s);
    });
  }

  async function postApi(params) {
    const endpoint = getCmsEndpoint();
    if (!endpoint) return null;

    const body = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => body.append(k, v ?? ''));

    const resp = await fetch(endpoint, {
      method: 'POST',
      body,
      redirect: 'follow'
    });
    return resp.json();
  }

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', async () => {
    initTabNavigation();
    initVisitorForm();
    initEvaluationForm();
    initSuggestionForm();
    initAdminAuthentication();
    initActivityManager();
    initCertificateStudio();
    initIssuedTracker();

    await loadAllActivities();
    loadLocalTemplates();
    loadLocalIssuedCerts();
  });

  // --- TAB NAVIGATION ---
  function initTabNavigation() {
    const tabButtons = document.querySelectorAll('.qms-tab-btn');
    const panels = {
      visitor: document.getElementById('visitorPanel'),
      activity: document.getElementById('activityPanel'),
      suggestion: document.getElementById('suggestionPanel'),
      admin: document.getElementById('adminPanel')
    };

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        tabButtons.forEach(b => b.classList.remove('active'));
        Object.values(panels).forEach(p => p && p.classList.remove('active'));

        btn.classList.add('active');
        if (panels[target]) panels[target].classList.add('active');
      });
    });

    const triggerAdmin = document.getElementById('btnAdminTrigger');
    if (triggerAdmin) {
      triggerAdmin.addEventListener('click', () => {
        const adminBtn = document.querySelector('.qms-tab-btn[data-tab="admin"]');
        if (adminBtn) adminBtn.click();
      });
    }

    const navEval = document.getElementById('navEvalLink');
    if (navEval) {
      navEval.addEventListener('click', (e) => {
        e.preventDefault();
        const actBtn = document.querySelector('.qms-tab-btn[data-tab="activity"]');
        if (actBtn) actBtn.click();
        document.getElementById('activityPanel').scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  // ==========================================================================
  // ACTIVITY MANAGER (Single Source of Truth)
  // ==========================================================================
  async function loadAllActivities() {
    try {
      // 1. Fetch from Google Apps Script if online
      const remote = await callApi({ action: 'get-activities' });
      if (remote && remote.success && Array.isArray(remote.activities) && remote.activities.length) {
        activitiesList = remote.activities;
      } else {
        // 2. Fallback to local storage or seeds
        const local = localStorage.getItem('sk_activities');
        if (local) {
          activitiesList = JSON.parse(local);
        } else {
          activitiesList = SEED_ACTIVITIES;
          localStorage.setItem('sk_activities', JSON.stringify(activitiesList));
        }
      }
    } catch (e) {
      activitiesList = SEED_ACTIVITIES;
    }

    syncActivitiesToUI();
  }

  function syncActivitiesToUI() {
    // 1. Evaluation Form Select
    const evalSelect = document.getElementById('evalActivitySelect');
    if (evalSelect) {
      const currentVal = evalSelect.value;
      evalSelect.innerHTML = '<option value="">-- Choose Youth Activity / Program --</option>' +
        activitiesList.map(a => `<option value="${escapeHtml(a.id)}" data-title="${escapeHtml(a.title)}">${escapeHtml(a.title)} (${a.status})</option>`).join('');
      if (currentVal) evalSelect.value = currentVal;
    }

    // 2. Certificate Studio Select
    const studioSelect = document.getElementById('studioActivitySelect');
    if (studioSelect) {
      const currentStudio = studioSelect.value;
      studioSelect.innerHTML = '<option value="master">★ Master / Fallback Certificate Template</option>' +
        activitiesList.map(a => `<option value="${escapeHtml(a.id)}">${escapeHtml(a.title)}</option>`).join('');
      if (currentStudio) studioSelect.value = currentStudio;
    }

    // 3. Admin Activities Table
    renderActivitiesTable();
  }

  function renderActivitiesTable() {
    const tbody = document.getElementById('activitiesTableBody');
    if (!tbody) return;

    if (!activitiesList.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--sk-text-muted);">No activities recorded. Add one above.</td></tr>';
      return;
    }

    tbody.innerHTML = activitiesList.map(a => `
      <tr>
        <td><strong>${escapeHtml(a.title)}</strong></td>
        <td>${escapeHtml(a.date || '—')}</td>
        <td>${escapeHtml(a.venue || '—')}</td>
        <td>${escapeHtml(a.speaker || 'None')}</td>
        <td>
          <span class="status-badge ${a.status === 'Completed' ? 'status-valid' : 'status-revoked'}" style="background: #E0F2FE; color: #0369A1;">
            ${escapeHtml(a.status || 'Upcoming')}
          </span>
        </td>
        <td>
          <button type="button" class="studio-btn" onclick="window.editActivity('${escapeHtml(a.id)}')">Edit</button>
          <button type="button" class="studio-btn" style="color: var(--sk-red);" onclick="window.deleteActivity('${escapeHtml(a.id)}')">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  function initActivityManager() {
    const form = document.getElementById('actManagerForm');
    const clearBtn = document.getElementById('btnClearActivity');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('actEditId').value.trim();
        const title = document.getElementById('actTitle').value.trim();
        const date = document.getElementById('actDate').value;
        const status = document.getElementById('actStatus').value;
        const venue = document.getElementById('actVenue').value.trim();
        const speaker = document.getElementById('actSpeaker').value.trim();
        const desc = document.getElementById('actDesc').value.trim();

        const actData = {
          id: editId || ('ACT-' + Date.now().toString(36).toUpperCase()),
          title,
          date,
          status,
          venue,
          speaker,
          description: desc
        };

        if (editId) {
          const idx = activitiesList.findIndex(a => a.id === editId);
          if (idx >= 0) activitiesList[idx] = actData;
        } else {
          activitiesList.unshift(actData);
        }

        // Save locally and attempt backend sync
        localStorage.setItem('sk_activities', JSON.stringify(activitiesList));
        syncActivitiesToUI();

        if (currentAdminPassword) {
          postApi({
            action: 'save-item',
            password: currentAdminPassword,
            id: actData.id,
            page: 'news-events.html',
            itemType: 'Activity / Program',
            title: actData.title,
            description: actData.description,
            status: actData.status,
            eventDate: actData.date,
            venue: actData.venue,
            speaker: actData.speaker
          }).catch(() => {});
        }

        form.reset();
        document.getElementById('actEditId').value = '';
        document.getElementById('btnSaveActivity').textContent = 'Save Activity';
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        form.reset();
        document.getElementById('actEditId').value = '';
        document.getElementById('btnSaveActivity').textContent = 'Save Activity';
      });
    }

    window.editActivity = (id) => {
      const item = activitiesList.find(a => a.id === id);
      if (!item) return;
      document.getElementById('actEditId').value = item.id;
      document.getElementById('actTitle').value = item.title;
      document.getElementById('actDate').value = item.date;
      document.getElementById('actStatus').value = item.status;
      document.getElementById('actVenue').value = item.venue || '';
      document.getElementById('actSpeaker').value = item.speaker || '';
      document.getElementById('actDesc').value = item.description || '';
      document.getElementById('btnSaveActivity').textContent = 'Update Activity';
      form.scrollIntoView({ behavior: 'smooth' });
    };

    window.deleteActivity = (id) => {
      if (!confirm('Are you sure you want to delete this activity?')) return;
      activitiesList = activitiesList.filter(a => a.id !== id);
      localStorage.setItem('sk_activities', JSON.stringify(activitiesList));
      syncActivitiesToUI();

      if (currentAdminPassword) {
        postApi({ action: 'delete-item', password: currentAdminPassword, id }).catch(() => {});
      }
    };
  }

  // ==========================================================================
  // ADAPTIVE ACTIVITY EVALUATION & AUTO CERTIFICATE ISSUANCE
  // ==========================================================================
  function initEvaluationForm() {
    const actSelect = document.getElementById('evalActivitySelect');
    const speakerArea = document.getElementById('adaptiveSpeakerArea');
    const form = document.getElementById('activityEvalForm');
    const resultBox = document.getElementById('activityResult');

    // Adaptive Speaker Questions Logic
    if (actSelect) {
      actSelect.addEventListener('change', () => {
        const selectedId = actSelect.value;
        const act = activitiesList.find(a => a.id === selectedId);

        if (act) {
          document.getElementById('evalDate').value = act.date || '';
          document.getElementById('evalVenue').value = act.venue || '';
          document.getElementById('evalSpeaker').value = act.speaker || '';

          // IF activity has a speaker -> show speaker questions. IF NOT -> hide them!
          if (act.speaker && act.speaker.trim().length > 0) {
            speakerArea.style.display = 'block';
          } else {
            speakerArea.style.display = 'none';
          }
        } else {
          document.getElementById('evalDate').value = '';
          document.getElementById('evalVenue').value = '';
          document.getElementById('evalSpeaker').value = '';
          speakerArea.style.display = 'none';
        }
      });
    }

    // Form Submission & Automatic Certificate Issuance
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('btnSubmitEval');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing & Issuing Certificate...';
        resultBox.classList.remove('show');

        const formData = new FormData(form);
        const participantName = (formData.get('participant') || '').trim();
        const activityId = formData.get('activity');
        const activityObj = activitiesList.find(a => a.id === activityId);
        const activityTitle = activityObj ? activityObj.title : 'Youth Activity';

        // Unique Certificate Number Generation: SK-SAP-2026-000001
        const year = new Date().getFullYear();
        const seq = String(Math.floor(1000 + Math.random() * 9000));
        const certNumber = `SK-SAP-${year}-${seq}`;
        const refNumber = `ACT-${Date.now().toString(36).toUpperCase()}`;

        // Prepare Certificate Record
        const newCert = {
          id: 'CERT-' + Date.now(),
          certificateNumber: certNumber,
          qmsReference: refNumber,
          participantName: participantName, // SINGLE SOURCE OF TRUTH
          activityId: activityId,
          activityTitle: activityTitle,
          certificateType: 'Certificate of Participation',
          dateIssued: new Date().toISOString().slice(0, 10),
          email: formData.get('email') || '',
          status: 'ACTIVE',
          emailStatus: formData.get('email') ? 'QUEUED' : 'NOT PROVIDED',
          deliveryPreference: formData.get('certificatePreference') || 'Digital Certificate'
        };

        // Attempt Backend Submission
        try {
          const backendParams = {
            type: 'activity',
            action: 'activity-evaluation',
            participant: participantName,
            activity: activityTitle,
            activityId: activityId,
            rating: formData.get('rating') || '5',
            email: formData.get('email') || '',
            contact: formData.get('contact') || '',
            futureEmailConsent: formData.get('futureEmailConsent') || 'no',
            futureSmsConsent: formData.get('futureSmsConsent') || 'no',
            certificatePreference: formData.get('certificatePreference') || 'Digital Certificate',
            date: formData.get('date') || '',
            venue: formData.get('venue') || '',
            speaker: formData.get('speaker') || '',
            learning: formData.get('learning') || '',
            improvement: formData.get('improvement') || ''
          };

          const res = await postApi(backendParams);
          if (res && res.certificateId) {
            newCert.certificateNumber = res.certificateId;
          }
        } catch (err) {
          // Offline / local resilience
        }

        // Save certificate locally
        issuedCertificates.unshift(newCert);
        localStorage.setItem('sk_issued_certificates', JSON.stringify(issuedCertificates));
        renderIssuedTable();

        // Render Success Outcome with direct links
        const certViewUrl = `certificate.html?id=${encodeURIComponent(newCert.certificateNumber)}`;
        const verifyUrl = `certificate-verify.html?id=${encodeURIComponent(newCert.certificateNumber)}`;

        resultBox.innerHTML = `
          <div class="result-badge">✓ Official Evaluation Recorded</div>
          <h3>Thank You, ${escapeHtml(participantName)}!</h3>
          <p>Your evaluation has been successfully submitted and your official Digital Certificate of Participation has been issued.</p>

          <div class="result-card-details">
            <div class="result-metric">
              <small>Certificate Number</small>
              <strong>${newCert.certificateNumber}</strong>
            </div>
            <div class="result-metric">
              <small>QMS Reference</small>
              <strong>${refNumber}</strong>
            </div>
            <div class="result-metric">
              <small>Activity</small>
              <strong>${escapeHtml(activityTitle)}</strong>
            </div>
            <div class="result-metric">
              <small>Status</small>
              <strong style="color: var(--sk-green);">ACTIVE / VERIFIED</strong>
            </div>
          </div>

          <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px;">
            <a href="${certViewUrl}" target="_blank" class="btn-header btn-header-orange" style="padding: 10px 20px;">
              View / Print Digital Certificate
            </a>
            <a href="${verifyUrl}" target="_blank" class="btn-header btn-header-outline" style="color: var(--sk-navy); border-color: var(--sk-border-strong); padding: 10px 20px;">
              Verify QR Record
            </a>
          </div>
        `;

        resultBox.classList.add('show');
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Evaluation & Generate Certificate';
      });
    }
  }

  // ==========================================================================
  // VISITOR LOGBOOK & SUGGESTIONS
  // ==========================================================================
  function initVisitorForm() {
    const form = document.getElementById('visitorForm');
    const resultBox = document.getElementById('visitorResult');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('btnSubmitVisitor');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Recording visit...';

        const fd = new FormData(form);
        const ref = 'VIS-' + Date.now().toString(36).toUpperCase();
        const visitorName = fd.get('name');

        try {
          await postApi({
            action: 'visitor-log',
            name: visitorName,
            clientType: fd.get('clientType'),
            age: fd.get('age'),
            address: fd.get('address'),
            contact: fd.get('contact'),
            purpose: fd.get('purpose'),
            service: fd.get('service'),
            rating: fd.get('rating') || '',
            comments: fd.get('comments') || '',
            consent: 'yes',
            clientReference: ref
          });
        } catch (err) {}

        resultBox.innerHTML = `
          <div class="result-badge">✓ Visitor Logbook Recorded</div>
          <h3>Welcome, ${escapeHtml(visitorName)}!</h3>
          <p>Your visit has been officially logged in the Sangguniang Kabataan Visitor Logbook.</p>
          <div class="result-metric" style="max-width: 260px; margin: 14px 0;">
            <small>Visitor Reference Code</small>
            <strong>${ref}</strong>
          </div>
        `;
        resultBox.classList.add('show');
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Visitor Logbook Entry';
      });
    }
  }

  function initSuggestionForm() {
    const form = document.getElementById('suggestionForm');
    const resultBox = document.getElementById('suggestionResult');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('btnSubmitSuggestion');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const fd = new FormData(form);
        const ref = 'SUG-' + Date.now().toString(36).toUpperCase();

        try {
          await postApi({
            type: 'suggestion',
            name: fd.get('name') || 'Anonymous',
            email: fd.get('email') || '',
            category: fd.get('category'),
            area: fd.get('area'),
            subject: fd.get('subject'),
            message: fd.get('message'),
            solution: fd.get('solution') || '',
            reference: ref
          });
        } catch (err) {}

        resultBox.innerHTML = `
          <div class="result-badge">✓ Proposal Received</div>
          <h3>Thank you for your valuable idea!</h3>
          <p>Your suggestion has been logged for review during the next regular SK session.</p>
          <div class="result-metric" style="max-width: 260px; margin: 14px 0;">
            <small>Submission Reference</small>
            <strong>${ref}</strong>
          </div>
        `;
        resultBox.classList.add('show');
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Suggestion';
      });
    }
  }

  // ==========================================================================
  // CERTIFICATE STUDIO (REBUILT FROM SCRATCH — SINGLE IMPLEMENTATION)
  // ==========================================================================
  function initCertificateStudio() {
    const canvas = document.getElementById('studioCanvas');
    const actSelect = document.getElementById('studioActivitySelect');
    const fileInput = document.getElementById('studioFileInput');
    const btnUpload = document.getElementById('btnPermanentUpload');
    const uploadStatus = document.getElementById('uploadStatusMsg');
    const feedbackMsg = document.getElementById('studioFeedbackMsg');
    const btnSave = document.getElementById('btnSaveTemplate');
    const btnReset = document.getElementById('btnResetPositions');

    const objName = document.getElementById('objName');
    const objQr = document.getElementById('objQr');
    const objNo = document.getElementById('objNo');

    // Controls
    const fontSelect = document.getElementById('fontFamilySelect');
    const fontSizeInput = document.getElementById('fontSizeInput');
    const fontColorInput = document.getElementById('fontColorInput');
    const btnBold = document.getElementById('btnBoldToggle');
    const alignSelect = document.getElementById('textAlignSelect');
    const certTypeSelect = document.getElementById('studioCertType');

    // 1. Select Activity -> Loads That Activity's Saved Design
    if (actSelect) {
      actSelect.addEventListener('change', async () => {
        const actId = actSelect.value;
        let loaded = null;
        // Load the persisted server template first so another browser/device sees the same design.
        if (actId !== 'master') {
          try {
            const remote = await callApi({ action: 'get-template', activityId: actId });
            if (remote && remote.success && remote.found && remote.template) {
              loaded = {
                backgroundUrl: remote.template.backgroundUrl || remote.mediaUrl || '',
                canvaUrl: remote.template.canvaUrl || '',
                certType: remote.template.certType || 'Certificate of Participation',
                layout: { ...DEFAULT_MASTER_TEMPLATE.layout, ...(remote.template.layout || {}) }
              };
              activityTemplates[actId] = JSON.parse(JSON.stringify(loaded));
              localStorage.setItem('sk_cert_templates', JSON.stringify(activityTemplates));
            }
          } catch (e) {}
        }
        if (loaded) activeStudioTemplate = loaded;
        else if (actId === 'master') activeStudioTemplate = JSON.parse(JSON.stringify(activityTemplates['master'] || DEFAULT_MASTER_TEMPLATE));
        else if (activityTemplates[actId]) activeStudioTemplate = JSON.parse(JSON.stringify(activityTemplates[actId]));
        else activeStudioTemplate = JSON.parse(JSON.stringify(activityTemplates['master'] || DEFAULT_MASTER_TEMPLATE));
        applyStudioTemplateToUI();
        if (certTypeSelect) certTypeSelect.value = activeStudioTemplate.certType || 'Certificate of Participation';
        feedbackMsg.textContent = `Loaded design for: ${actSelect.options[actSelect.selectedIndex].text}`;
      });
    }

    // 2. Canva File Upload: Temporary Local Preview + Drive Permanent Upload
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Immediate local preview using FileReader data URL
        const reader = new FileReader();
        reader.onload = (evt) => {
          activeStudioTemplate.backgroundUrl = evt.target.result;
          canvas.style.backgroundImage = `url("${evt.target.result}")`;
          uploadStatus.innerHTML = `<span style="color: var(--sk-orange);">Local preview active. Click "Permanently Upload to Drive" to save permanently.</span>`;
        };
        reader.readAsDataURL(file);
      });
    }

    // Permanent Backend Upload
    if (btnUpload) {
      btnUpload.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) {
          alert('Please choose a Canva-exported PNG or JPG file first.');
          return;
        }

        btnUpload.disabled = true;
        btnUpload.textContent = 'Uploading to Drive...';
        uploadStatus.textContent = 'Uploading file to Google Drive...';

        try {
          const reader = new FileReader();
          reader.onload = async (evt) => {
            const base64Data = evt.target.result;
            const res = await postApi({
              action: 'upload-certificate-background',
              password: currentAdminPassword,
              name: file.name,
              data: base64Data
            });

            if (res && res.success && res.url) {
              activeStudioTemplate.backgroundUrl = res.url;
              canvas.style.backgroundImage = `url("${res.url}")`;
              uploadStatus.innerHTML = `<span style="color: var(--sk-green); font-weight: 700;">✓ Permanently uploaded to Google Drive! Permanent URL saved.</span>`;
            } else {
              // Retain base64 if Drive upload not connected
              uploadStatus.innerHTML = `<span style="color: var(--sk-navy);">Saved locally in browser template.</span>`;
            }
            btnUpload.disabled = false;
            btnUpload.textContent = 'Permanently Upload to Drive';
          };
          reader.readAsDataURL(file);
        } catch (err) {
          btnUpload.disabled = false;
          btnUpload.textContent = 'Permanently Upload to Drive';
          uploadStatus.textContent = 'Upload note: Stored in local layout cache.';
        }
      });
    }


    // LIVE PREVIEW: always preview the currently selected activity/template.
    const btnTestPreview = document.getElementById('btnTestPreview');
    if (btnTestPreview) {
      btnTestPreview.addEventListener('click', (e) => {
        e.preventDefault();
        const actId = (actSelect && actSelect.value) ? actSelect.value : 'master';

        // Keep the latest editor state available to certificate.html immediately.
        activeStudioTemplate.certType = certTypeSelect ? certTypeSelect.value : (activeStudioTemplate.certType || 'Certificate of Participation');
        activityTemplates[actId] = JSON.parse(JSON.stringify(activeStudioTemplate));
        localStorage.setItem('sk_cert_templates', JSON.stringify(activityTemplates));
        localStorage.setItem('sk_cert_preview_activity', actId);
        localStorage.setItem('sk_cert_preview_template', JSON.stringify(activeStudioTemplate));

        const url = 'certificate.html?blank=1&activityId=' + encodeURIComponent(actId) + '&preview=1&_=' + Date.now();
        window.open(url, '_blank', 'noopener');
      });
    }

    // 3. Selection & Direct Visual Dragging with Pointer Events
    [objName, objQr, objNo].forEach(el => {
      el.addEventListener('pointerdown', (e) => {
        if (e.target.classList.contains('cert-resize-handle')) return; // handled separately
        e.preventDefault();
        selectStudioObject(el.dataset.kind);

        const rect = canvas.getBoundingClientRect();
        const startX = e.clientX;
        const startY = e.clientY;
        const kind = el.dataset.kind;

        const initialX = activeStudioTemplate.layout[kind + 'X'];
        const initialY = activeStudioTemplate.layout[kind + 'Y'];

        function onPointerMove(moveEvent) {
          const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
          const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;

          const newX = Math.max(5, Math.min(95, initialX + deltaX));
          const newY = Math.max(5, Math.min(95, initialY + deltaY));

          activeStudioTemplate.layout[kind + 'X'] = Math.round(newX * 10) / 10;
          activeStudioTemplate.layout[kind + 'Y'] = Math.round(newY * 10) / 10;

          el.style.left = activeStudioTemplate.layout[kind + 'X'] + '%';
          el.style.top = activeStudioTemplate.layout[kind + 'Y'] + '%';
        }

        function onPointerUp() {
          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', onPointerUp);
        }

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
      });

      // Resize Handle Pointer Events
      const handle = el.querySelector('.cert-resize-handle');
      if (handle) {
        handle.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const kind = el.dataset.kind;
          const startX = e.clientX;

          const initSize = kind === 'name' 
            ? activeStudioTemplate.layout.nameSize 
            : kind === 'qr' 
            ? activeStudioTemplate.layout.qrSize 
            : activeStudioTemplate.layout.noSize;

          function onResizeMove(moveEvent) {
            const diff = (moveEvent.clientX - startX) * 0.4;
            if (kind === 'name') {
              activeStudioTemplate.layout.nameSize = Math.max(14, Math.min(80, Math.round(initSize + diff)));
              document.getElementById('objNameText').style.fontSize = activeStudioTemplate.layout.nameSize + 'px';
              fontSizeInput.value = activeStudioTemplate.layout.nameSize;
            } else if (kind === 'qr') {
              activeStudioTemplate.layout.qrSize = Math.max(48, Math.min(220, Math.round(initSize + diff * 2)));
              objQr.style.width = activeStudioTemplate.layout.qrSize + 'px';
              objQr.style.height = activeStudioTemplate.layout.qrSize + 'px';
            } else if (kind === 'no') {
              activeStudioTemplate.layout.noSize = Math.max(9, Math.min(30, Math.round(initSize + diff * 0.3)));
              document.getElementById('objNoText').style.fontSize = activeStudioTemplate.layout.noSize + 'px';
            }
          }

          function onResizeUp() {
            window.removeEventListener('pointermove', onResizeMove);
            window.removeEventListener('pointerup', onResizeUp);
          }

          window.addEventListener('pointermove', onResizeMove);
          window.addEventListener('pointerup', onResizeUp);
        });
      }
    });

    function selectStudioObject(kind) {
      activeSelectedObj = kind;
      [objName, objQr, objNo].forEach(el => {
        el.classList.toggle('selected', el.dataset.kind === kind);
      });

      // Update control values to match selected
      const certTypeSelect = document.getElementById('studioCertType');
    if (certTypeSelect) certTypeSelect.value = activeStudioTemplate.certType || 'Certificate of Participation';
    const l = activeStudioTemplate.layout;
      if (kind === 'name') {
        fontSelect.value = l.nameFont || 'Georgia, serif';
        fontSizeInput.value = l.nameSize || 38;
        fontColorInput.value = l.nameColor || '#0A2540';
        alignSelect.value = l.nameAlign || 'center';
        btnBold.classList.toggle('active', !!l.nameBold);
        feedbackMsg.textContent = 'Selected: PARTICIPANT NAME. Drag to move, or drag orange handle to resize.';
      } else if (kind === 'qr') {
        fontSizeInput.value = l.qrSize || 96;
        feedbackMsg.textContent = 'Selected: UNIQUE QR CODE. Drag to position on your Canva layout.';
      } else if (kind === 'no') {
        fontSizeInput.value = l.noSize || 13;
        fontColorInput.value = l.noColor || '#0A2540';
        feedbackMsg.textContent = 'Selected: CERTIFICATE NUMBER. Drag to position on your Canva layout.';
      }
    }

    // Formatting Toolbar Event Listeners
    if (fontSelect) {
      fontSelect.addEventListener('change', () => {
        if (activeSelectedObj === 'name') {
          activeStudioTemplate.layout.nameFont = fontSelect.value;
          document.getElementById('objNameText').style.fontFamily = fontSelect.value;
        }
      });
    }

    if (fontSizeInput) {
      fontSizeInput.addEventListener('input', () => {
        const val = Number(fontSizeInput.value);
        if (!val) return;
        if (activeSelectedObj === 'name') {
          activeStudioTemplate.layout.nameSize = val;
          document.getElementById('objNameText').style.fontSize = val + 'px';
        } else if (activeSelectedObj === 'qr') {
          activeStudioTemplate.layout.qrSize = val;
          objQr.style.width = val + 'px';
          objQr.style.height = val + 'px';
        } else if (activeSelectedObj === 'no') {
          activeStudioTemplate.layout.noSize = val;
          document.getElementById('objNoText').style.fontSize = val + 'px';
        }
      });
    }

    if (fontColorInput) {
      fontColorInput.addEventListener('input', () => {
        const val = fontColorInput.value;
        if (activeSelectedObj === 'name') {
          activeStudioTemplate.layout.nameColor = val;
          document.getElementById('objNameText').style.color = val;
        } else if (activeSelectedObj === 'no') {
          activeStudioTemplate.layout.noColor = val;
          document.getElementById('objNoText').style.color = val;
        }
      });
    }

    if (btnBold) {
      btnBold.addEventListener('click', () => {
        if (activeSelectedObj === 'name') {
          activeStudioTemplate.layout.nameBold = !activeStudioTemplate.layout.nameBold;
          btnBold.classList.toggle('active', activeStudioTemplate.layout.nameBold);
          document.getElementById('objNameText').style.fontWeight = activeStudioTemplate.layout.nameBold ? '700' : '400';
        }
      });
    }

    if (alignSelect) {
      alignSelect.addEventListener('change', () => {
        if (activeSelectedObj === 'name') {
          activeStudioTemplate.layout.nameAlign = alignSelect.value;
          document.getElementById('objNameText').style.textAlign = alignSelect.value;
        }
      });
    }

    if (certTypeSelect) {
      certTypeSelect.addEventListener('change', () => {
        activeStudioTemplate.certType = certTypeSelect.value;
      });
    }

    // Save Template (Per-Activity & Master)
    if (btnSave) {
      btnSave.addEventListener('click', async () => {
        const actId = actSelect.value;
        activeStudioTemplate.certType = certTypeSelect ? certTypeSelect.value : (activeStudioTemplate.certType || 'Certificate of Participation');
        activityTemplates[actId] = JSON.parse(JSON.stringify(activeStudioTemplate));
        localStorage.setItem('sk_cert_templates', JSON.stringify(activityTemplates));

        btnSave.disabled = true;
        btnSave.textContent = 'Saving...';

        // Also push to backend
        try {
          if (actId === 'master') {
            await postApi({
              action: 'save-certificate-settings',
              password: currentAdminPassword,
              certificateBackground: activeStudioTemplate.backgroundUrl,
              certificateType: activeStudioTemplate.certType,
              ...activeStudioTemplate.layout
            });
          } else {
            await postApi({
              action: 'save-certificate-template',
              password: currentAdminPassword,
              activityId: actId,
              title: actSelect.options[actSelect.selectedIndex].text,
              backgroundUrl: activeStudioTemplate.backgroundUrl,
              certType: activeStudioTemplate.certType,
              ...activeStudioTemplate.layout
            });
          }
        } catch (e) {}

        btnSave.disabled = false;
        btnSave.textContent = 'Save Design for Activity';
        feedbackMsg.textContent = `✓ Layout permanently saved for: ${actSelect.options[actSelect.selectedIndex].text}`;
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        activeStudioTemplate.layout = JSON.parse(JSON.stringify(DEFAULT_MASTER_TEMPLATE.layout));
        applyStudioTemplateToUI();
        feedbackMsg.textContent = 'Coordinates reset to default positions.';
      });
    }

    // Initial render
    applyStudioTemplateToUI();
    selectStudioObject('name');
  }

  function applyStudioTemplateToUI() {
    const canvas = document.getElementById('studioCanvas');
    const objName = document.getElementById('objName');
    const objNameText = document.getElementById('objNameText');
    const objQr = document.getElementById('objQr');
    const objNo = document.getElementById('objNo');
    const objNoText = document.getElementById('objNoText');

    if (!canvas || !activeStudioTemplate) return;

    // Apply Background
    if (activeStudioTemplate.backgroundUrl) {
      canvas.style.backgroundImage = `url("${activeStudioTemplate.backgroundUrl}")`;
    } else {
      canvas.style.backgroundImage = 'none';
      canvas.style.backgroundColor = '#FFFFFF';
    }

    const l = activeStudioTemplate.layout;

    // Name
    objName.style.left = l.nameX + '%';
    objName.style.top = l.nameY + '%';
    objNameText.style.fontSize = l.nameSize + 'px';
    objNameText.style.fontFamily = l.nameFont || 'Georgia, serif';
    objNameText.style.color = l.nameColor || '#0A2540';
    objNameText.style.fontWeight = l.nameBold ? '700' : '400';
    objNameText.style.textAlign = l.nameAlign || 'center';

    // QR
    objQr.style.left = l.qrX + '%';
    objQr.style.top = l.qrY + '%';
    objQr.style.width = l.qrSize + 'px';
    objQr.style.height = l.qrSize + 'px';

    // No
    objNo.style.left = l.noX + '%';
    objNo.style.top = l.noY + '%';
    objNoText.style.fontSize = l.noSize + 'px';
    objNoText.style.color = l.noColor || '#0A2540';
  }

  function loadLocalTemplates() {
    try {
      const saved = localStorage.getItem('sk_cert_templates');
      if (saved) {
        activityTemplates = JSON.parse(saved);
        if (activityTemplates['master']) {
          activeStudioTemplate = JSON.parse(JSON.stringify(activityTemplates['master']));
          applyStudioTemplateToUI();
        }
      }
    } catch (e) {}
  }

  // ==========================================================================
  // ISSUED CERTIFICATE TRACKER
  // ==========================================================================
  function initIssuedTracker() {
    const searchInput = document.getElementById('certSearchInput');
    const refreshBtn = document.getElementById('btnRefreshCerts');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase().trim();
        const rows = document.querySelectorAll('#certsTableBody tr');
        rows.forEach(r => {
          r.style.display = !q || r.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        await fetchRemoteCertificates();
      });
    }
  }

  async function fetchRemoteCertificates() {
    if (!currentAdminPassword) return;
    try {
      const resp = await callApi({ action: 'certificate-list', password: currentAdminPassword });
      if (resp && resp.success && Array.isArray(resp.certificates)) {
        issuedCertificates = resp.certificates.map(c => ({
          id: c.certificateId,
          certificateNumber: c.certificateId,
          participantName: c.participant,
          activityTitle: c.activity,
          dateIssued: c.issuedAt || c.date,
          status: c.status || 'ACTIVE',
          email: c.email || '',
          emailStatus: c.emailStatus || ''
        }));
        localStorage.setItem('sk_issued_certificates', JSON.stringify(issuedCertificates));
        renderIssuedTable();
      }
    } catch (e) {}
  }

  function loadLocalIssuedCerts() {
    try {
      const local = localStorage.getItem('sk_issued_certificates');
      if (local) {
        issuedCertificates = JSON.parse(local);
        renderIssuedTable();
      }
    } catch (e) {}
  }

  function renderIssuedTable() {
    const tbody = document.getElementById('certsTableBody');
    const kpiCerts = document.getElementById('kpiTotalCerts');
    if (kpiCerts) kpiCerts.textContent = issuedCertificates.length;
    if (!tbody) return;

    if (!issuedCertificates.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--sk-text-muted);">No certificates issued yet. Submit an activity evaluation to issue one.</td></tr>';
      return;
    }

    tbody.innerHTML = issuedCertificates.map(c => {
      const isRevoked = String(c.status || '').toUpperCase() === 'REVOKED';
      const certUrl = `certificate.html?id=${encodeURIComponent(c.certificateNumber || c.id)}`;
      return `
        <tr>
          <td><strong>${escapeHtml(c.certificateNumber || c.id)}</strong></td>
          <td>${escapeHtml(c.participantName)}</td>
          <td>${escapeHtml(c.activityTitle)}</td>
          <td>${escapeHtml(c.dateIssued || '—')}</td>
          <td>
            <span class="status-badge ${isRevoked ? 'status-revoked' : 'status-valid'}">
              ${isRevoked ? 'REVOKED' : 'ACTIVE'}
            </span>
          </td>
          <td><small>${escapeHtml(c.emailStatus || (c.email ? 'SENT' : 'DIGITAL'))}</small></td>
          <td>
            <a href="${certUrl}" target="_blank" class="studio-btn">Open</a>
            ${isRevoked ? '' : `<button type="button" class="studio-btn" style="color: var(--sk-red);" onclick="window.revokeCert('${escapeHtml(c.certificateNumber || c.id)}')">Revoke</button>`}
          </td>
        </tr>
      `;
    }).join('');
  }

  window.revokeCert = async (certId) => {
    if (!confirm(`Are you sure you want to REVOKE Certificate ${certId}? It will immediately show as invalid on public verification.`)) return;

    const matched = issuedCertificates.find(c => (c.certificateNumber || c.id) === certId);
    if (matched) {
      matched.status = 'REVOKED';
      localStorage.setItem('sk_issued_certificates', JSON.stringify(issuedCertificates));
      renderIssuedTable();
    }

    if (currentAdminPassword) {
      postApi({
        action: 'revoke-certificate',
        password: currentAdminPassword,
        certificateId: certId,
        status: 'REVOKED'
      }).catch(() => {});
    }
  };

  // ==========================================================================
  // ADMIN AUTHENTICATION & SUB-TABS
  // ==========================================================================
  function initAdminAuthentication() {
    const loginForm = document.getElementById('adminLoginForm');
    const loginBox = document.getElementById('adminLoginBox');
    const workspace = document.getElementById('adminWorkspace');
    const logoutBtn = document.getElementById('btnAdminLogout');
    const refreshBtn = document.getElementById('btnAdminRefresh');
    const errorEl = document.getElementById('adminLoginError');

    if (currentAdminPassword) {
      loginBox.style.display = 'none';
      workspace.style.display = 'block';
      fetchRemoteCertificates();
    }

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pwd = document.getElementById('adminPasswordInput').value.trim();
        errorEl.style.display = 'none';

        try {
          const endpoint = getCmsEndpoint();
          if (endpoint) {
            const resp = await callApi({ action: 'login', password: pwd });
            if (!resp || !resp.success) {
              throw new Error('Incorrect administrator password.');
            }
          }
          currentAdminPassword = pwd;
          sessionStorage.setItem('skQmsAdminKey', pwd);
          loginBox.style.display = 'none';
          workspace.style.display = 'block';
          fetchRemoteCertificates();
        } catch (err) {
          errorEl.textContent = err.message || 'Incorrect password.';
          errorEl.style.display = 'block';
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        currentAdminPassword = '';
        sessionStorage.removeItem('skQmsAdminKey');
        workspace.style.display = 'none';
        loginBox.style.display = 'block';
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        loadAllActivities();
        fetchRemoteCertificates();
      });
    }

    // Subtab switching
    const subBtns = document.querySelectorAll('[data-subtab]');
    subBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        subBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const views = {
          studio: document.getElementById('subtabStudio'),
          activities: document.getElementById('subtabActivities'),
          tracker: document.getElementById('subtabTracker'),
          analytics: document.getElementById('subtabAnalytics')
        };
        Object.values(views).forEach(v => v && (v.style.display = 'none'));
        if (views[btn.dataset.subtab]) views[btn.dataset.subtab].style.display = 'block';
      });
    });
  }

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

})();


/* ===== SK SAPILANG CERTIFICATE STUDIO FREE-MOVE V4 ===== */
(function(){
  if(window.__SK_FREE_CERT_MOVE_V4) return;
  window.__SK_FREE_CERT_MOVE_V4=true;

  const selector='.cert-edit-item,.ct-edit-item,[data-cert-field],[data-key="name"],[data-key="qr"],[data-key="no"]';
  let drag=null;

  function stageOf(el){
    return el.closest('#certVisualStage,#ctEditor,#certStudioStage,.certificate-stage,.cert-stage');
  }
  function fieldOf(el){
    const raw=(el.dataset.key||el.dataset.certField||el.id||'').toLowerCase();
    if(raw.includes('qr')) return 'qr';
    if(raw.includes('no')||raw.includes('number')) return 'no';
    return 'name';
  }
  function saveToState(el,stage){
    const r=stage.getBoundingClientRect(), e=el.getBoundingClientRect();
    const x=((e.left+e.width/2-r.left)/r.width)*100;
    const y=((e.top+e.height/2-r.top)/r.height)*100;
    const f=fieldOf(el);
    if(window.CERT_STATE){
      if(f==='name'){CERT_STATE.nameX=x;CERT_STATE.nameY=y;}
      if(f==='qr'){CERT_STATE.qrX=x;CERT_STATE.qrY=y;}
      if(f==='no'){CERT_STATE.noX=x;CERT_STATE.noY=y;}
    }
    // Activity Studio template layout
    if(typeof activeStudioTemplate!=='undefined' && activeStudioTemplate && activeStudioTemplate.layout){
      activeStudioTemplate.layout[f]=activeStudioTemplate.layout[f]||{};
      activeStudioTemplate.layout[f].x=x;
      activeStudioTemplate.layout[f].y=y;
    }
    el.style.left=x+'%'; el.style.top=y+'%';
  }

  document.addEventListener('pointerdown',function(e){
    const el=e.target.closest(selector);
    if(!el) return;
    const stage=stageOf(el); if(!stage) return;
    // Resize handles remain available to existing resize code.
    if(e.target.closest('.cert-resize-handle,.ct-resize-handle,[data-resize]')) return;
    e.preventDefault(); e.stopPropagation();
    const sr=stage.getBoundingClientRect(), er=el.getBoundingClientRect();
    drag={el,stage,pid:e.pointerId,dx:e.clientX-(er.left+er.width/2),dy:e.clientY-(er.top+er.height/2)};
    el.style.position='absolute';
    el.style.transform='translate(-50%,-50%)';
    el.style.cursor='grabbing';
    el.style.touchAction='none';
    try{el.setPointerCapture(e.pointerId)}catch(_){}
  },true);

  document.addEventListener('pointermove',function(e){
    if(!drag||e.pointerId!==drag.pid)return;
    e.preventDefault();
    const r=drag.stage.getBoundingClientRect();
    let x=((e.clientX-drag.dx-r.left)/r.width)*100;
    let y=((e.clientY-drag.dy-r.top)/r.height)*100;
    x=Math.max(0,Math.min(100,x)); y=Math.max(0,Math.min(100,y));
    drag.el.style.left=x+'%'; drag.el.style.top=y+'%';
  },true);

  function end(e){
    if(!drag||e.pointerId!==drag.pid)return;
    saveToState(drag.el,drag.stage);
    drag.el.style.cursor='grab';
    drag=null;
  }
  document.addEventListener('pointerup',end,true);
  document.addEventListener('pointercancel',end,true);

  function prep(){
    document.querySelectorAll(selector).forEach(el=>{
      if(stageOf(el)){
        el.style.cursor='grab';
        el.style.touchAction='none';
        el.style.userSelect='none';
      }
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prep);else prep();
  new MutationObserver(prep).observe(document.documentElement,{childList:true,subtree:true});
})();



/* Receive drag/resize adjustments from certificate.html live preview. */
window.addEventListener('message',function(e){
  if(e.origin!==location.origin||!e.data||e.data.type!=='SK_CERT_LAYOUT_UPDATED')return;
  try{
    if(typeof activeStudioTemplate!=='undefined'&&activeStudioTemplate){
      activeStudioTemplate.layout={...(activeStudioTemplate.layout||{}),...(e.data.layout||{})};
    }
    if(typeof activityTemplates!=='undefined'&&e.data.activityId){
      activityTemplates[e.data.activityId]=activityTemplates[e.data.activityId]||{};
      activityTemplates[e.data.activityId].layout={...(activityTemplates[e.data.activityId].layout||{}),...(e.data.layout||{})};
    }
  }catch(_){}
});


/* ===== GUARANTEED LIVE PREVIEW OPENER V6 ===== */
window.skOpenCertificatePreview=function(){
 try{
   var activity=document.getElementById('ctActivity')||document.getElementById('certActivity')||document.getElementById('activityTemplateSelect');
   var actId=(activity&&activity.value)||'master';
   var layout={};try{layout=(activeStudioTemplate&&activeStudioTemplate.layout)||{};}catch(_){}
   var p=new URLSearchParams({blank:'1',preview:'1',edit:'1',v11:'1',activityId:actId,layout:JSON.stringify(layout),_:Date.now()});
   var w=window.open('certificate.html?'+p.toString(),'_blank');
   if(!w)alert('Please allow pop-ups for this local site, then try again.');
   return false;
 }catch(err){alert('Unable to open certificate preview: '+err.message);return false;}
};


/* ===== CERTIFICATE BACKGROUND BRIDGE V7 ===== */
window.skCertBgPut=function(value){
 return new Promise((resolve,reject)=>{
   const r=indexedDB.open('SKSapilangQMS',1);
   r.onupgradeneeded=()=>r.result.createObjectStore('certificate');
   r.onerror=()=>reject(r.error);
   r.onsuccess=()=>{
     const tx=r.result.transaction('certificate','readwrite');
     tx.objectStore('certificate').put(value,'previewBackground');
     tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error);
   };
 });
};


/* ===== LIVE CERTIFICATE BACKGROUND POSTMESSAGE V8 ===== */
window.addEventListener('message', async function(e){
  if(e.origin!==location.origin || !e.data || e.data.type!=='SK_CERT_REQUEST_BACKGROUND') return;
  try{
    var stage=document.getElementById('ctEditor')||document.getElementById('certVisualStage')||document.getElementById('certStudioStage');
    var bg='';
    if(stage){
      var im=stage.querySelector('img');
      if(im && im.src) bg=im.src;
      if(!bg){
        var bi=getComputedStyle(stage).backgroundImage;
        var mm=bi&&bi.match(/^url\(["']?(.*?)["']?\)$/);
        if(mm) bg=mm[1];
      }
    }
    try{ if(!bg && activeStudioTemplate) bg=activeStudioTemplate.backgroundUrl||''; }catch(_){}
    if(!bg){ e.source.postMessage({type:'SK_CERT_BACKGROUND_RESPONSE',empty:true},e.origin); return; }

    // Convert local blob/data URL to transferable ArrayBuffer.
    var resp=await fetch(bg);
    var blob=await resp.blob();
    var buf=await blob.arrayBuffer();
    e.source.postMessage({
      type:'SK_CERT_BACKGROUND_RESPONSE',
      mime:blob.type||'image/png',
      buffer:buf
    },e.origin,[buf]);
  }catch(err){
    e.source.postMessage({type:'SK_CERT_BACKGROUND_RESPONSE',error:String(err.message||err)},e.origin);
  }
});





/* ===== CERTIFICATE BACKGROUND CAPTURE V10 - SINGLE DB VERSION ===== */
(function(){
 if(window.__SK_CERT_BG_CAPTURE_V10)return;window.__SK_CERT_BG_CAPTURE_V10=1;

 function saveBlob(blob){
   return new Promise((resolve,reject)=>{
     const req=indexedDB.open('SKSapilangQMS',1);
     req.onupgradeneeded=()=>{
       if(!req.result.objectStoreNames.contains('certificate')) req.result.createObjectStore('certificate');
     };
     req.onerror=()=>reject(req.error);
     req.onsuccess=()=>{
       const db=req.result;
       const tx=db.transaction('certificate','readwrite');
       tx.objectStore('certificate').put(blob,'previewBackground');
       tx.oncomplete=()=>{db.close();resolve(true)};
       tx.onerror=()=>{db.close();reject(tx.error)};
     };
   });
 }

 document.addEventListener('change',async function(e){
   const input=e.target;
   if(!input||input.type!=='file'||!input.files||!input.files[0])return;
   const id=(input.id||'').toLowerCase();
   if(!(id==='ctfile'||id==='certmasterfile'||id.includes('cert')))return;
   const file=input.files[0];
   if(!file.type.startsWith('image/'))return;
   try{
     await saveBlob(file);
     window.__SK_CERT_BG_READY=true;
     window.__SK_CERT_BG_FILE=file;
     const stage=document.getElementById('ctEditor')||document.getElementById('certVisualStage')||document.getElementById('certStudioStage');
     if(stage){
       if(window.__skCertStageUrl)URL.revokeObjectURL(window.__skCertStageUrl);
       window.__skCertStageUrl=URL.createObjectURL(file);
       stage.style.backgroundImage='url("'+window.__skCertStageUrl+'")';
       stage.style.backgroundSize='100% 100%';
       stage.style.backgroundPosition='center';
       stage.style.backgroundRepeat='no-repeat';
     }
   }catch(err){
     console.error('Certificate background save failed',err);
     alert('The certificate image could not be prepared for preview: '+err.message);
   }
 },true);

 // Expose one reliable saver to the preview opener.
 window.skCertBgPut=saveBlob;
})();


/* ===== CERTIFICATE UNIFIED PREVIEW V11 ===== */
(function(){
 if(window.__SK_CERT_V11)return;window.__SK_CERT_V11=1;
 window.__SK_CERT_UPLOAD_DATAURL='';

 document.addEventListener('change',function(e){
   const i=e.target;
   if(!i||i.type!=='file'||!i.files||!i.files[0])return;
   const id=(i.id||'').toLowerCase();
   if(!(id==='ctfile'||id==='certmasterfile'||id.includes('cert')))return;
   const f=i.files[0]; if(!f.type.startsWith('image/'))return;
   const r=new FileReader();
   r.onload=()=>{window.__SK_CERT_UPLOAD_DATAURL=r.result;};
   r.readAsDataURL(f);
 },true);

 window.addEventListener('message',function(e){
   if(e.origin!==location.origin||!e.data||e.data.type!=='SK_CERT_V11_READY')return;
   const send=()=>{
     let bg=window.__SK_CERT_UPLOAD_DATAURL||'';
     if(!bg){
       const stage=document.getElementById('ctEditor')||document.getElementById('certVisualStage')||document.getElementById('certStudioStage');
       const img=stage&&stage.querySelector('img');
       if(img&&String(img.src).startsWith('data:'))bg=img.src;
       try{if(!bg&&activeStudioTemplate&&String(activeStudioTemplate.backgroundUrl||'').startsWith('data:'))bg=activeStudioTemplate.backgroundUrl;}catch(_){}
     }
     e.source.postMessage({type:'SK_CERT_V11_BACKGROUND',background:bg},e.origin);
   };
   if(window.__SK_CERT_UPLOAD_DATAURL)send(); else setTimeout(send,150);
 });
})();


/* ===== SK SAPILANG CERTIFICATE ONE-GO V12 ===== */
(function(){
 if(window.__SK_CERT_V12)return; window.__SK_CERT_V12=1;

 let V12_BG='', V12_FILE='';
 const state={
   name:{x:50,y:48,size:38},
   qr:{x:82,y:78,size:90},
   no:{x:8,y:91,size:13}
 };
 let drag=null;

 function fileInput(){
   return document.getElementById('ctFile')||
          document.getElementById('certMasterFile')||
          document.querySelector('input[type="file"][accept*="image"]');
 }
 function studioStage(){
   return document.getElementById('ctEditor')||
          document.getElementById('certVisualStage')||
          document.getElementById('certStudioStage');
 }
 function setStudioBackground(url){
   const st=studioStage(); if(!st)return;
   st.style.backgroundImage=`url("${url}")`;
   st.style.backgroundSize='100% 100%';
   st.style.backgroundPosition='center';
   st.style.backgroundRepeat='no-repeat';
 }
 function capture(file){
   if(!file || !file.type.startsWith('image/'))return;
   const r=new FileReader();
   r.onload=()=>{
     V12_BG=String(r.result||'');
     V12_FILE=file.name||'certificate';
     window.__SK_CERT_V12_BG=V12_BG;
     setStudioBackground(V12_BG);
   };
   r.readAsDataURL(file);
 }
 document.addEventListener('change',e=>{
   const i=e.target;
   if(i && i.type==='file' && i.files && i.files[0]){
     const id=(i.id||'').toLowerCase();
     if(id==='ctfile'||id==='certmasterfile'||id.includes('cert')) capture(i.files[0]);
   }
 },true);

 function ensureOverlay(){
   let ov=document.getElementById('skCertV12Overlay');
   if(ov)return ov;
   ov=document.createElement('div');
   ov.id='skCertV12Overlay';
   ov.innerHTML=`
   <style>
   #skCertV12Overlay{position:fixed;inset:0;background:#dfe7f2;z-index:2147483000;overflow:auto;padding:16px;box-sizing:border-box}
   #skCertV12Bar{max-width:1120px;margin:0 auto 10px;display:flex;gap:8px;align-items:center;justify-content:flex-end;flex-wrap:wrap;font:600 13px Arial}
   #skCertV12Bar button{border:1px solid #b8c4d2;background:white;border-radius:7px;padding:10px 14px;cursor:pointer;font-weight:700}
   #skCertV12Bar .orange{background:#ff7900;color:#fff;border-color:#ff7900}
   #skCertV12Canvas{width:min(1120px,calc(100vw - 32px));aspect-ratio:297/210;margin:auto;position:relative;background:#fff center/100% 100% no-repeat;box-shadow:0 8px 30px #23364a35;overflow:hidden;touch-action:none}
   .skv12item{position:absolute;z-index:5;cursor:move;user-select:none;touch-action:none;box-sizing:border-box}
   .skv12item.active{outline:2px dashed #ff8a36;outline-offset:3px}
   #skv12name{transform:translate(-50%,-50%);font-family:Georgia,serif;font-weight:700;white-space:nowrap}
   #skv12qr{transform:translate(-50%,-50%);display:grid;place-items:center;background:#fff}
   #skv12qr img{width:100%;height:100%;display:block}
   #skv12no{white-space:nowrap;font:700 13px Arial}
   #skCertV12Controls{max-width:1120px;margin:10px auto;background:#fff;padding:10px;border-radius:9px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;font:13px Arial}
   #skCertV12Controls button{padding:7px 10px}
   @media print{body>*:not(#skCertV12Overlay){display:none!important}#skCertV12Overlay{position:static;padding:0;background:#fff}#skCertV12Bar,#skCertV12Controls{display:none!important}#skCertV12Canvas{width:297mm;height:210mm;box-shadow:none}}
   </style>
   <div id="skCertV12Bar">
     <button type="button" data-v12="close">Back to QMS</button>
     <button type="button" data-v12="reset">Reset Positions</button>
     <button type="button" class="orange" data-v12="print">Print / Save PDF</button>
   </div>
   <div id="skCertV12Canvas">
     <div id="skv12name" class="skv12item">SAMPLE PARTICIPANT NAME</div>
     <div id="skv12qr" class="skv12item"><img alt="QR Code"></div>
     <div id="skv12no" class="skv12item">Certificate No. SK-SAP-2026-000001</div>
   </div>
   <div id="skCertV12Controls">
     <b>Selected:</b> <span id="skv12selected">Participant Name</span>
     <label>Size <input id="skv12size" type="range" min="8" max="100" value="38"></label>
     <button type="button" data-v12="name">Participant Name</button>
     <button type="button" data-v12="qr">QR Code</button>
     <button type="button" data-v12="no">Certificate Number</button>
     <button type="button" data-v12="save">Save Adjustments</button>
   </div>`;
   document.body.appendChild(ov);

   // Reuse the QR already generated by the QMS if available.
   const sourceQR=document.querySelector('#ctEditor img[src*="qr"],#certVisualStage img[src*="qr"],img[alt*="QR"]');
   const qri=ov.querySelector('#skv12qr img');
   if(sourceQR && sourceQR.src) qri.src=sourceQR.src;
   else qri.src='https://api.qrserver.com/v1/create-qr-code/?size=180x180&data='+encodeURIComponent(location.href);

   ov.addEventListener('pointerdown',e=>{
     const item=e.target.closest('.skv12item'); if(!item)return;
     e.preventDefault();
     ov.querySelectorAll('.skv12item').forEach(x=>x.classList.remove('active'));
     item.classList.add('active');
     const key=item.id==='skv12name'?'name':item.id==='skv12qr'?'qr':'no';
     select(key);
     const can=ov.querySelector('#skCertV12Canvas').getBoundingClientRect();
     const r=item.getBoundingClientRect();
     drag={item,key,can,dx:e.clientX-r.left,dy:e.clientY-r.top,pid:e.pointerId};
     try{item.setPointerCapture(e.pointerId)}catch(_){}
   });
   ov.addEventListener('pointermove',e=>{
     if(!drag)return;
     const {item,key,can}=drag;
     let px=(e.clientX-can.left-drag.dx)/can.width*100;
     let py=(e.clientY-can.top-drag.dy)/can.height*100;
     if(key==='name'||key==='qr'){
       const rr=item.getBoundingClientRect();
       px+=(rr.width/2)/can.width*100; py+=(rr.height/2)/can.height*100;
     }
     state[key].x=Math.max(0,Math.min(100,px));
     state[key].y=Math.max(0,Math.min(100,py));
     render();
   });
   const end=e=>{if(drag){try{drag.item.releasePointerCapture(drag.pid)}catch(_){} drag=null}};
   ov.addEventListener('pointerup',end);ov.addEventListener('pointercancel',end);

   ov.addEventListener('click',e=>{
     const a=e.target.closest('[data-v12]'); if(!a)return;
     const k=a.dataset.v12;
     if(k==='close'){ov.remove();return}
     if(k==='print'){window.print();return}
     if(k==='reset'){
       state.name={x:50,y:48,size:38};state.qr={x:82,y:78,size:90};state.no={x:8,y:91,size:13};render();return
     }
     if(k==='name'||k==='qr'||k==='no'){select(k);return}
     if(k==='save'){
       localStorage.setItem('skCertV12Layout',JSON.stringify(state));
       alert('Certificate positions saved on this browser.');
     }
   });
   ov.querySelector('#skv12size').addEventListener('input',e=>{
     const key=ov.dataset.selected||'name';state[key].size=Number(e.target.value);render();
   });
   return ov;
 }
 function select(key){
   const ov=document.getElementById('skCertV12Overlay');if(!ov)return;
   ov.dataset.selected=key;
   ov.querySelector('#skv12selected').textContent=key==='name'?'Participant Name':key==='qr'?'QR Code':'Certificate Number';
   ov.querySelector('#skv12size').value=state[key].size;
   ov.querySelectorAll('.skv12item').forEach(x=>x.classList.remove('active'));
   ov.querySelector(key==='name'?'#skv12name':key==='qr'?'#skv12qr':'#skv12no').classList.add('active');
 }
 function render(){
   const ov=document.getElementById('skCertV12Overlay');if(!ov)return;
   const canvas=ov.querySelector('#skCertV12Canvas');
   canvas.style.backgroundImage=V12_BG?`url("${V12_BG}")`:'none';
   const n=ov.querySelector('#skv12name'),q=ov.querySelector('#skv12qr'),no=ov.querySelector('#skv12no');
   n.style.left=state.name.x+'%';n.style.top=state.name.y+'%';n.style.fontSize=state.name.size+'px';
   q.style.left=state.qr.x+'%';q.style.top=state.qr.y+'%';q.style.width=state.qr.size+'px';q.style.height=state.qr.size+'px';
   no.style.left=state.no.x+'%';no.style.top=state.no.y+'%';no.style.fontSize=state.no.size+'px';
 }
 window.skOpenCertificatePreview=function(){
   const i=fileInput();
   if(!V12_BG && i && i.files && i.files[0]) capture(i.files[0]);
   setTimeout(()=>{
     if(!V12_BG){alert('Please choose your finished certificate PNG/JPG first.');return}
     try{
       const saved=JSON.parse(localStorage.getItem('skCertV12Layout')||'null');
       if(saved){Object.assign(state.name,saved.name||{});Object.assign(state.qr,saved.qr||{});Object.assign(state.no,saved.no||{})}
     }catch(_){}
     ensureOverlay();render();select('name');
   },V12_BG?0:250);
   return false;
 };

 // Force existing "Open Live Certificate Preview" links/buttons to use V12.
 document.addEventListener('click',e=>{
   const el=e.target.closest('a,button');if(!el)return;
   const t=(el.textContent||'').trim().toLowerCase();
   if(t.includes('open live certificate preview')){
     e.preventDefault();e.stopImmediatePropagation();window.skOpenCertificatePreview();
   }
 },true);
})();


/* ===== SK SAPILANG CERTIFICATE BACKGROUND REPLACE V13 ===== */
(function(){
 if(window.__SK_CERT_REPLACE_V13)return;window.__SK_CERT_REPLACE_V13=1;

 function isCertInput(i){
   if(!i||i.type!=='file')return false;
   const id=(i.id||'').toLowerCase(), name=(i.name||'').toLowerCase();
   return id==='ctfile'||id==='certmasterfile'||id.includes('cert')||name.includes('cert');
 }
 function applyNewFile(file){
   if(!file||!file.type.startsWith('image/'))return;
   const reader=new FileReader();
   reader.onload=function(){
     const fresh=String(reader.result||'');

     // Explicitly discard the old background and replace it everywhere.
     window.__SK_CERT_UPLOAD_DATAURL=fresh;
     window.__SK_CERT_V12_BG=fresh;

     // V12 keeps V12_BG in its closure, so force its preview canvas and
     // Studio stage to use the new image immediately.
     const stages=[
       document.getElementById('ctEditor'),
       document.getElementById('certVisualStage'),
       document.getElementById('certStudioStage')
     ].filter(Boolean);
     stages.forEach(st=>{
       st.style.backgroundImage='url("'+fresh+'")';
       st.style.backgroundSize='100% 100%';
       st.style.backgroundPosition='center';
       st.style.backgroundRepeat='no-repeat';
       const bg=st.querySelector('#certStudioBackground,img[data-background],img.cert-background');
       if(bg){bg.src=fresh;bg.style.display='block'}
     });

     // If the full V12 editor is already open, replace its background live.
     const canvas=document.getElementById('skCertV12Canvas');
     if(canvas){
       canvas.style.backgroundImage='url("'+fresh+'")';
       canvas.style.backgroundSize='100% 100%';
       canvas.style.backgroundPosition='center';
       canvas.style.backgroundRepeat='no-repeat';
     }

     // Remember the newest selection independently of old template/cache data.
     try{sessionStorage.setItem('skCertLatestBackground',fresh)}catch(_){}
   };
   reader.readAsDataURL(file);
 }

 document.addEventListener('change',function(e){
   const i=e.target;
   if(!isCertInput(i)||!i.files||!i.files[0])return;
   // Clear old object/data references before reading the replacement.
   window.__SK_CERT_UPLOAD_DATAURL='';
   window.__SK_CERT_V12_BG='';
   try{sessionStorage.removeItem('skCertLatestBackground')}catch(_){}
   applyNewFile(i.files[0]);
 },true);

 // Override the V12 open action so the newest selected file always wins.
 document.addEventListener('click',function(e){
   const b=e.target.closest('a,button');if(!b)return;
   const text=(b.textContent||'').trim().toLowerCase();
   if(!text.includes('open live certificate preview'))return;

   const input=document.getElementById('ctFile')||
               document.getElementById('certMasterFile')||
               document.querySelector('input[type="file"][accept*="image"]');

   if(input&&input.files&&input.files[0]){
     applyNewFile(input.files[0]);
     // Give FileReader a moment, then update the V12 canvas after it opens.
     setTimeout(function(){
       try{
         const latest=sessionStorage.getItem('skCertLatestBackground')||window.__SK_CERT_UPLOAD_DATAURL||'';
         const cv=document.getElementById('skCertV12Canvas');
         if(cv&&latest){
           cv.style.backgroundImage='url("'+latest+'")';
           cv.style.backgroundSize='100% 100%';
         }
       }catch(_){}
     },350);
   }
 },true);
})();


/* ===== SK SAPILANG PRINT CERTIFICATE V14 =====
   Fix: use a real IMG layer for printing, force A4 landscape,
   and keep Name / QR / Certificate No. above it.
*/
(function(){
 if(window.__SK_CERT_PRINT_V14)return; window.__SK_CERT_PRINT_V14=1;

 function latestBg(){
   try{
     return sessionStorage.getItem('skCertLatestBackground') ||
            window.__SK_CERT_UPLOAD_DATAURL ||
            window.__SK_CERT_V12_BG || '';
   }catch(_){
     return window.__SK_CERT_UPLOAD_DATAURL || window.__SK_CERT_V12_BG || '';
   }
 }

 function installPrintImage(){
   const canvas=document.getElementById('skCertV12Canvas');
   if(!canvas)return;
   let img=document.getElementById('skCertV14PrintBg');
   if(!img){
     img=document.createElement('img');
     img.id='skCertV14PrintBg';
     img.alt='Certificate Background';
     img.setAttribute('aria-hidden','true');
     Object.assign(img.style,{
       position:'absolute',inset:'0',width:'100%',height:'100%',
       objectFit:'fill',display:'block',zIndex:'0',
       pointerEvents:'none',userSelect:'none'
     });
     canvas.insertBefore(img,canvas.firstChild);
   }
   const bg=latestBg();
   if(bg) img.src=bg;
   canvas.style.backgroundImage='none';
   canvas.querySelectorAll('.skv12item').forEach(el=>{
     el.style.zIndex='5';
     el.style.position='absolute';
   });
 }

 function addPrintCss(){
   if(document.getElementById('skCertV14PrintCss'))return;
   const s=document.createElement('style');
   s.id='skCertV14PrintCss';
   s.textContent=`
   @page{size:A4 landscape;margin:0}
   @media print{
     html,body{margin:0!important;padding:0!important;width:297mm!important;height:210mm!important;overflow:hidden!important;background:#fff!important}
     body>*:not(#skCertV12Overlay){display:none!important}
     #skCertV12Overlay{
       display:block!important;position:fixed!important;inset:0!important;
       width:297mm!important;height:210mm!important;margin:0!important;padding:0!important;
       background:#fff!important;overflow:hidden!important;
     }
     #skCertV12Bar,#skCertV12Controls{display:none!important}
     #skCertV12Canvas{
       display:block!important;position:absolute!important;left:0!important;top:0!important;
       width:297mm!important;height:210mm!important;max-width:none!important;
       margin:0!important;padding:0!important;border:0!important;box-shadow:none!important;
       overflow:hidden!important;background:none!important;aspect-ratio:auto!important;
       -webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;
     }
     #skCertV14PrintBg{
       display:block!important;position:absolute!important;left:0!important;top:0!important;
       width:297mm!important;height:210mm!important;object-fit:fill!important;z-index:0!important;
     }
     #skCertV12Canvas .skv12item{z-index:5!important}
   }`;
   document.head.appendChild(s);
 }

 // Keep the real image synchronized whenever a different PNG is selected.
 document.addEventListener('change',function(e){
   const i=e.target;
   if(!i || i.type!=='file' || !i.files || !i.files[0])return;
   const id=(i.id||'').toLowerCase();
   if(!(id==='ctfile'||id==='certmasterfile'||id.includes('cert')))return;
   const r=new FileReader();
   r.onload=function(){
     const data=String(r.result||'');
     try{sessionStorage.setItem('skCertLatestBackground',data)}catch(_){}
     setTimeout(installPrintImage,0);
   };
   r.readAsDataURL(i.files[0]);
 },true);

 // When the editor opens, create the image layer.
 document.addEventListener('click',function(e){
   const el=e.target.closest('a,button'); if(!el)return;
   const t=(el.textContent||'').toLowerCase();
   if(t.includes('open live certificate preview')){
     addPrintCss();
     setTimeout(installPrintImage,450);
   }
 },true);

 // Intercept only V12's Print / Save PDF button.
 document.addEventListener('click',function(e){
   const el=e.target.closest('[data-v12="print"]'); if(!el)return;
   e.preventDefault(); e.stopImmediatePropagation();
   addPrintCss(); installPrintImage();
   const img=document.getElementById('skCertV14PrintBg');
   if(!img || !img.src){
     alert('Please choose the certificate PNG/JPG before printing.');
     return;
   }
   const doPrint=()=>setTimeout(()=>window.print(),80);
   if(img.complete) doPrint();
   else { img.onload=doPrint; img.onerror=()=>alert('The certificate image could not be loaded for printing. Please select the PNG/JPG again.'); }
 },true);

 addPrintCss();
})();
