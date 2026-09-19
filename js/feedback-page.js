
/* ===== V45 BACKWARD-COMPATIBLE GLOBAL CMS ENDPOINT ===== */
function getCmsEndpoint() {
  try {
    return String(
      window.SK_CMS_ENDPOINT ||
      localStorage.getItem('skCmsEndpoint') ||
      localStorage.getItem('sk_cms_endpoint') ||
      ''
    ).trim();
  } catch (e) {
    return String(window.SK_CMS_ENDPOINT || '').trim();
  }
}
window.getCmsEndpoint = getCmsEndpoint;
window.skGetCmsEndpoint = getCmsEndpoint;



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

  function postApiViaFrame(params) {
    return new Promise((resolve, reject) => {
      const endpoint = getCmsEndpoint();
      if (!endpoint) return reject(new Error('CMS endpoint is not configured.'));
      const requestId = 'qms_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      const frameName = 'qms_post_' + requestId;
      const iframe = document.createElement('iframe');
      iframe.name = frameName;
      iframe.style.display = 'none';
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = endpoint;
      form.target = frameName;
      form.style.display = 'none';
      const payload = { ...params, transport: 'frame', requestId };
      Object.entries(payload).forEach(([k, v]) => {
        const input = document.createElement('input');
        input.type = 'hidden'; input.name = k; input.value = v ?? '';
        form.appendChild(input);
      });
      let timer;
      const cleanup = () => {
        clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        setTimeout(() => { try { form.remove(); iframe.remove(); } catch (_) {} }, 0);
      };
      const onMessage = (event) => {
        const msg = event && event.data;
        if (!msg || msg.source !== 'sk-cms-response' || msg.requestId !== requestId) return;
        cleanup();
        resolve(msg.data);
      };
      window.addEventListener('message', onMessage);
      document.body.appendChild(iframe);
      document.body.appendChild(form);
      timer = setTimeout(() => {
        cleanup();
        reject(new Error('Apps Script did not return a QMS response. Confirm the Web App is deployed as Execute as: Me and accessible to the intended users, then redeploy the newest Code.gs.'));
      }, (params && params.action === 'upload-certificate-background') ? 90000 : 18000);
      form.submit();
    });
  }

  async function postApi(params) {
    const endpoint = getCmsEndpoint();
    if (!endpoint) return null;
    const body = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => body.append(k, v ?? ''));
    try {
      const resp = await fetch(endpoint, { method: 'POST', body, redirect: 'follow' });
      const text = await resp.text();
      const trimmed = String(text || '').trim();
      if (trimmed && !trimmed.startsWith('<')) {
        try { return JSON.parse(trimmed); } catch (_) {}
      }
      // Apps Script can return an HTML redirect/authorization page to fetch().
      // Retry through a hidden form/iframe, which Code.gs answers using postMessage.
      return await postApiViaFrame(params);
    } catch (fetchErr) {
      return await postApiViaFrame(params);
    }
  }

  async function prepareCertificateUploadData(dataUrl) {
    if (!/^data:image\/(png|jpeg);base64,/i.test(String(dataUrl || ''))) throw new Error('Please choose a PNG or JPG certificate image.');
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxW = 2400, maxH = 1700;
          const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
          const w = Math.max(1, Math.round(img.naturalWidth * scale));
          const h = Math.max(1, Math.round(img.naturalHeight * scale));
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0,0,w,h); ctx.drawImage(img,0,0,w,h);
          let out = c.toDataURL('image/jpeg', 0.86);
          // If still unusually large, use a slightly lower quality.
          if (out.length > 4.5 * 1024 * 1024) out = c.toDataURL('image/jpeg', 0.72);
          resolve(out);
        } catch (e) { reject(e); }
      };
      img.onerror = () => reject(new Error('The certificate image could not be prepared for upload.'));
      img.src = dataUrl;
    });
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

    // V49: Activity Manager / Apps Script is the single source of truth.
    // Remove obsolete certificate templates belonging to deleted/renamed legacy activities.
    try {
      const validIds = new Set(activitiesList.map(a => String(a.id)));
      const cached = JSON.parse(localStorage.getItem('sk_cert_templates') || '{}');
      Object.keys(cached).forEach(id => {
        if (id !== 'master' && !validIds.has(String(id))) delete cached[id];
      });
      localStorage.setItem('sk_cert_templates', JSON.stringify(cached));
      const previewId=String(localStorage.getItem('sk_cert_preview_activity')||'');
      if(previewId && previewId!=='master' && !validIds.has(previewId)){
        localStorage.removeItem('sk_cert_preview_activity');
        localStorage.removeItem('sk_cert_preview_activity_title');
        localStorage.removeItem('sk_cert_preview_template');
      }
    } catch(_) {}

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
          </span><br><small style="font-weight:700;color:${a.gadVisibility==='HIDE'?'#64748b':'#0f766e'}">GAD: ${a.gadVisibility==='HIDE'?'Hidden':'Shown'}</small>
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
        const gadVisibility = document.getElementById('actGadVisibility')?.value || 'SHOW';

        const actData = {
          id: editId || ('ACT-' + Date.now().toString(36).toUpperCase()),
          title,
          date,
          status,
          venue,
          speaker,
          description: desc,
          gadVisibility: gadVisibility
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
            speaker: actData.speaker,
            linkUrl: 'GAD:' + actData.gadVisibility
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
      if(document.getElementById('actGadVisibility')) document.getElementById('actGadVisibility').value = item.gadVisibility || 'SHOW';
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
      try {
        localStorage.setItem('sk_cert_preview_activity', String(actSelect.value||'master'));
        localStorage.removeItem('sk_cert_preview_template');
      } catch(_) {}

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
          // Per-activity GAD visibility. The questions stay voluntary whenever shown.
          const evalGadCard=document.getElementById('evalGadCard');
          if(evalGadCard) evalGadCard.style.display=(act.gadVisibility==='HIDE')?'none':'block';
        } else {
          document.getElementById('evalDate').value = '';
          document.getElementById('evalVenue').value = '';
          document.getElementById('evalSpeaker').value = '';
          speakerArea.style.display = 'none';
          const evalGadCard=document.getElementById('evalGadCard'); if(evalGadCard) evalGadCard.style.display='none';
        }
      });
    }

    // Form Submission & Automatic Certificate Issuance
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('btnSubmitEval');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving Evaluation...';
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
          emailStatus: formData.get('email') ? 'BATCH DELIVERY' : 'NOT PROVIDED',
          deliveryPreference: formData.get('certificatePreference') || 'E-Certificate'
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
            certificatePreference: formData.get('certificatePreference') || 'E-Certificate',
            date: formData.get('date') || '',
            venue: formData.get('venue') || '',
            speaker: formData.get('speaker') || '',
            learning: formData.get('learning') || '',
            improvement: formData.get('improvement') || ''
          };

          // Include every non-sensitive evaluation answer expected by the backend.
          ['relevance','objectives','facilitatorRating','organization','venueRating','materials','timeManagement','engagement','speakerKnowledge','speakerClarity','speakerEngagement','speakerResponsiveness','speakerComments','likedMost','future','classification'].forEach(k => { backendParams[k] = formData.get(k) || ''; });
          ['sexAssignedAtBirth','sexAssignedAtBirthOther','genderIdentity','genderIdentityOther','preferredPronouns','preferredPronounsOther','accessibilitySupport','accessibilitySupportOther','organizationOffice','positionDesignation','sectorClassificationOther'].forEach(k => { backendParams[k] = formData.get(k) || ''; });
          backendParams.programFormat = formData.get('programFormat') || 'In-Person';
          const res = await postApi(backendParams);
          if (!res || !res.success || !res.certificateId) throw new Error((res && res.message) || 'The evaluation could not be saved.');
          newCert.certificateNumber = res.certificateId;
          newCert.qmsReference = res.reference || refNumber;
          newCert.emailStatus = res.emailStatus || (newCert.email ? 'BATCH DELIVERY' : 'NOT PROVIDED');
          newCert.deliveryPreference = res.certificatePreference || newCert.deliveryPreference;
        } catch (err) {
          resultBox.innerHTML = `<div class="result-badge" style="background:#fff1f0;color:#b42318">Submission not completed</div><h3>Please try again.</h3><p>${escapeHtml(err.message || 'The server did not confirm your submission.')}</p>`;
          resultBox.classList.add('show');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Evaluation & Generate Certificate';
          return;
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
          <p>Your evaluation has been successfully submitted and your certificate record has been generated. E-Certificates are prepared in about 1 day; Hard Copies are prepared in about 3 working days.</p>

          <div class="result-card-details">
            <div class="result-metric">
              <small>Certificate Number</small>
              <strong>${newCert.certificateNumber}</strong>
            </div>
            <div class="result-metric">
              <small>QMS Reference</small>
              <strong>${newCert.qmsReference}</strong>
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
              View Certificate
            </a>
            <a href="${verifyUrl}" target="_blank" class="btn-header btn-header-outline" style="color: var(--sk-navy); border-color: var(--sk-border-strong); padding: 10px 20px;">Verify QR Record</a>
            <button type="button" class="btn-header btn-header-outline" style="color:var(--sk-navy);border-color:var(--sk-border-strong);padding:10px 20px" onclick="document.getElementById('activityResult').classList.remove('show');document.getElementById('evalActivitySelect').focus();">Submit Another Response</button>
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
            office: fd.get('office') || '',
            birthdate: fd.get('birthdate') || '',
            resourceSpeakerActivity: fd.get('resourceSpeakerActivity') || '',
            organizerCoordination: fd.get('organizerCoordination') || '',
            organizerHospitality: fd.get('organizerHospitality') || '',
            organizerLogistics: fd.get('organizerLogistics') || '',
            organizerInclusion: fd.get('organizerInclusion') || '',
            organizerComments: fd.get('organizerComments') || '',
            rating: fd.get('rating') || '',
            comments: fd.get('comments') || '',
            consent: 'yes',
            clientReference: ref,
            sexAssignedAtBirth: fd.get('sexAssignedAtBirth') || '',
            sexAssignedAtBirthOther: fd.get('sexAssignedAtBirthOther') || '',
            genderIdentity: fd.get('genderIdentity') || '',
            genderIdentityOther: fd.get('genderIdentityOther') || '',
            preferredPronouns: fd.get('preferredPronouns') || '',
            preferredPronounsOther: fd.get('preferredPronounsOther') || '',
            accessibilitySupport: fd.get('accessibilitySupport') || '',
            accessibilitySupportOther: fd.get('accessibilitySupportOther') || ''
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
          <div class="qms-success-actions"><button type="button" class="btn-header btn-header-orange" onclick="document.getElementById('visitorResult').classList.remove('show');document.getElementById('visitorForm').scrollIntoView({behavior:'smooth'});">Submit Another Response</button></div>
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
          <div class="qms-success-actions"><button type="button" class="btn-header btn-header-orange" onclick="document.getElementById('suggestionResult').classList.remove('show');document.getElementById('suggestionForm').scrollIntoView({behavior:'smooth'});">Submit Another Response</button></div>
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
    const driveLinkInput = document.getElementById('studioDriveLink');
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

    // Keep the selected image in JavaScript state. This prevents the browser/file input
    // from losing the File object after the local preview has already been rendered.
    let selectedCertificateFile = null;
    let selectedCertificateDataUrl = '';

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
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!/^image\/(png|jpeg)$/i.test(file.type || '')) {
          selectedCertificateFile = null; selectedCertificateDataUrl = '';
          alert('Please choose a PNG or JPG certificate image.');
          e.target.value = ''; return;
        }
        selectedCertificateFile = file;

        // Immediate local preview using FileReader data URL
        const reader = new FileReader();
        reader.onload = (evt) => {
          selectedCertificateDataUrl = String(evt.target.result || '');
          try { sessionStorage.setItem('skCertStudioPendingImageV23', selectedCertificateDataUrl); sessionStorage.setItem('skCertStudioPendingImageV22', selectedCertificateDataUrl); } catch (_) {}
          activeStudioTemplate.backgroundUrl = selectedCertificateDataUrl;
          canvas.style.backgroundImage = `url("${evt.target.result}")`;
          uploadStatus.innerHTML = `<span style="color: var(--sk-orange);">Local preview active. Upload this image to Google Drive, then paste its sharing link in Step 4.</span>`;
        };
        reader.readAsDataURL(file);
      });
    }

    // Permanent template by Google Drive link/File ID — no image bytes pass through Apps Script.
    // This avoids slow browser -> Apps Script -> Drive uploads. The image must already be
    // uploaded to Drive and shared as "Anyone with the link" (Viewer).
    function normalizeDriveImageUrl(value) {
      const raw = String(value || '').trim();
      if (!raw) return '';
      // Accept a bare Drive file ID.
      if (/^[A-Za-z0-9_-]{20,}$/.test(raw)) {
        return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(raw) + '&sz=w2400';
      }
      let id = '';
      let m = raw.match(/\/file\/d\/([A-Za-z0-9_-]+)/i);
      if (m) id = m[1];
      if (!id) {
        try {
          const u = new URL(raw);
          id = u.searchParams.get('id') || '';
        } catch (_) {}
      }
      if (id) return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w2400';
      // Also allow a direct public image URL when needed.
      if (/^https:\/\//i.test(raw)) return raw;
      return '';
    }

    if (btnUpload) {
      btnUpload.addEventListener('click', async () => {
        const actId = actSelect ? actSelect.value : 'master';
        const actTitle = actSelect && actSelect.selectedIndex >= 0 ? actSelect.options[actSelect.selectedIndex].text : 'Master Certificate';
        const entered = driveLinkInput ? driveLinkInput.value : '';
        const driveImageUrl = normalizeDriveImageUrl(entered);
        if (!driveImageUrl) {
          alert('Paste the Google Drive sharing link or File ID of the certificate image first.');
          if (driveLinkInput) driveLinkInput.focus();
          return;
        }

        btnUpload.disabled = true;
        btnUpload.textContent = 'Saving Link...';
        uploadStatus.textContent = 'Linking Google Drive certificate to this activity...';
        try {
          activeStudioTemplate.backgroundUrl = driveImageUrl;
          canvas.style.backgroundImage = `url("${driveImageUrl}")`;
          activityTemplates[actId] = JSON.parse(JSON.stringify(activeStudioTemplate));
          localStorage.setItem('sk_cert_templates', JSON.stringify(activityTemplates));

          if (actId === 'master') {
            const res = await postApi({ action:'save-certificate-settings', password:currentAdminPassword,
              certificateBackground:driveImageUrl, certificateType:activeStudioTemplate.certType, ...activeStudioTemplate.layout });
            if (res && res.success === false) throw new Error(res.message || 'Could not save certificate settings.');
          } else {
            const res = await postApi({ action:'save-certificate-template', password:currentAdminPassword,
              activityId:actId, title:actTitle, backgroundUrl:driveImageUrl,
              certType:activeStudioTemplate.certType, ...activeStudioTemplate.layout });
            if (res && res.success === false) throw new Error(res.message || 'Could not save certificate template.');
          }

          uploadStatus.innerHTML = `<span style="color: var(--sk-green); font-weight:700;">✓ Drive template linked to ${actTitle}. No image upload was required.</span>`;
          btnUpload.textContent = 'Drive Template Linked ✓';
          setTimeout(() => { btnUpload.disabled = false; btnUpload.textContent = 'Update Drive Template'; }, 1200);
        } catch (err) {
          btnUpload.disabled = false;
          btnUpload.textContent = 'Use Drive Template';
          uploadStatus.innerHTML = `<span style="color:#b42318;font-weight:700;">Could not save Drive link: ${err && err.message ? err.message : 'Please try again.'}</span>`;
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
        try { localStorage.setItem('skCertStudioAdminKey', currentAdminPassword || sessionStorage.getItem('skQmsAdminKey') || ''); } catch(_) {}

        const url = 'certificate.html?blank=1&activityId=' + encodeURIComponent(actId) + '&preview=1&_=' + Date.now();
        window.open(url, '_blank');
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

    // Keep the selected image in JavaScript state. This prevents the browser/file input
    // from losing the File object after the local preview has already been rendered.
    let selectedCertificateFile = null;
    let selectedCertificateDataUrl = '';
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

    // V34: Save adjustments made directly inside certificate.html preview.
    window.addEventListener('message', async (e) => {
      if (e.origin !== location.origin || !e.data || e.data.type !== 'SK_CERT_SAVE_ADJUSTMENTS_V34') return;
      const targetId = String(e.data.activityId || actSelect.value || 'master');
      if (actSelect && actSelect.value !== targetId) actSelect.value = targetId;
      if (e.data.layout) Object.assign(activeStudioTemplate.layout, e.data.layout);
      activityTemplates[targetId] = JSON.parse(JSON.stringify(activeStudioTemplate));
      localStorage.setItem('sk_cert_templates', JSON.stringify(activityTemplates));
      applyStudioTemplateToUI();
      feedbackMsg.textContent = 'Saving adjustments from live certificate preview...';
      try {
        const payload = { password: currentAdminPassword, certificateBackground: activeStudioTemplate.backgroundUrl, certificateType: activeStudioTemplate.certType, ...activeStudioTemplate.layout };
        if (targetId === 'master') await postApi({ action:'save-certificate-settings', ...payload });
        else await postApi({ action:'save-certificate-template', activityId:targetId, title:actSelect.options[actSelect.selectedIndex] ? actSelect.options[actSelect.selectedIndex].text : targetId, backgroundUrl:activeStudioTemplate.backgroundUrl, certType:activeStudioTemplate.certType, ...payload });
        feedbackMsg.textContent = '✓ Live preview adjustments permanently saved.';
      } catch (_) { feedbackMsg.textContent = 'Saved in this browser. Click Save Design for Activity to retry permanent server saving.'; }
    });

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
    const driveLinkInput = document.getElementById('studioDriveLink');
    if (driveLinkInput && activeStudioTemplate.backgroundUrl && !/^data:image\//i.test(activeStudioTemplate.backgroundUrl)) {
      driveLinkInput.value = activeStudioTemplate.backgroundUrl;
    } else if (driveLinkInput && !activeStudioTemplate.backgroundUrl) {
      driveLinkInput.value = '';
    }
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
  function chooseCertificateActivity(kind, btn) {
    const titles=[...new Set(issuedCertificates.map(c=>String(c.activityTitle||'').trim()).filter(Boolean))].sort();
    if(!titles.length) return alert('No certificate activities are available yet.');
    const menu=titles.map((t,i)=>`${i+1}. ${t}`).join('\n');
    const answer=window.prompt(`Choose an activity by number:\n\n${menu}`);
    if(answer===null) return;
    const n=Number(answer);
    if(!Number.isInteger(n)||n<1||n>titles.length) return alert('Please enter a valid activity number.');
    const title=titles[n-1];
    if(kind==='download') return window.downloadECertificatesZip(btn,title);
    if(kind==='hardcopy') return window.downloadHardCopyPdf(btn,title);
  }

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
    const copyBtn=document.getElementById('btnCopyECertEmails'); if(copyBtn) copyBtn.addEventListener('click', window.copyECertificateEmails);
    const zipBtn=document.getElementById('btnDownloadECertZip'); if(zipBtn) zipBtn.addEventListener('click', ()=>chooseCertificateActivity('download',zipBtn));
    const hardBtn=document.getElementById('btnCombinedHardCopyPdf'); if(hardBtn) hardBtn.addEventListener('click', ()=>chooseCertificateActivity('hardcopy',hardBtn));
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
          activityId: c.activityId || '',
          dateIssued: c.issuedAt || c.date,
          status: c.status || 'ACTIVE',
          email: c.email || '',
          emailStatus: c.emailStatus || '',
          deliveryPreference: c.deliveryPreference || 'E-Certificate',
          hardCopyAvailableOn: c.hardCopyAvailableOn || ''
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


  function ensureActivityCertificateControlPanel() {
    const table = document.getElementById('certsTableBody');
    if (!table) return null;
    const host = table.closest('table')?.parentElement || table.parentElement;
    if (!host) return null;

    let panel = document.getElementById('activityCertificateControlPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'activityCertificateControlPanel';
      panel.style.cssText = 'margin:18px 0;padding:16px;border:1px solid #dbe3ee;border-radius:14px;background:#fff;';
      host.parentElement.insertBefore(panel, host);
    }
    return panel;
  }

  function renderActivityCertificateControls() {
    const panel = ensureActivityCertificateControlPanel();
    if (!panel) return;

    const groups = new Map();
    issuedCertificates.forEach(c => {
      const title = String(c.activityTitle || 'Unspecified Activity').trim();
      if (!groups.has(title)) groups.set(title, []);
      groups.get(title).push(c);
    });

    if (!groups.size) {
      panel.innerHTML = '<strong>Activity Certificate Control</strong><p style="margin:8px 0 0;color:#64748b">No issued certificates yet.</p>';
      return;
    }

    const escAttr = v => escapeHtml(String(v || '')).replace(/`/g,'&#96;');
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
        <div>
          <h3 style="margin:0">Activity Certificate Control</h3>
          <p style="margin:4px 0 0;color:#64748b">Download, email, copy addresses, or prepare hard copies by seminar/activity.</p>
        </div>
      </div>
      <div style="display:grid;gap:10px">
        ${[...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([title,rows])=>{
          const ecount=rows.filter(c=>/E-Certificate|Digital Certificate/i.test(String(c.deliveryPreference||'E-Certificate'))).length;
          const hcount=rows.filter(c=>/Hard Copy/i.test(String(c.deliveryPreference||''))).length;
          return `<div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px">
            <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center">
              <div><strong>${escapeHtml(title)}</strong><br><small>${rows.length} certificate(s) • ${ecount} e-certificate request(s) • ${hcount} hard-copy request(s)</small></div>
              <div style="display:flex;gap:7px;flex-wrap:wrap">
                <button type="button" class="studio-btn" onclick="skActivityCertAction('view', decodeURIComponent('${encodeURIComponent(title)}'), this)">View List</button>
                <button type="button" class="studio-btn" onclick="skActivityCertAction('copy', decodeURIComponent('${encodeURIComponent(title)}'), this)">Copy Emails</button>
                <button type="button" class="studio-btn" onclick="skActivityCertAction('download', decodeURIComponent('${encodeURIComponent(title)}'), this)">Download All</button>
                <button type="button" class="studio-btn" onclick="skActivityCertAction('send', decodeURIComponent('${encodeURIComponent(title)}'), this)">Send All</button>
                <button type="button" class="studio-btn" onclick="skActivityCertAction('hardcopy', decodeURIComponent('${encodeURIComponent(title)}'), this)">Hard-Copy PDF</button>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  function setBatchActivityByTitle(title) {
    const sel=document.getElementById('certBatchActivity');
    if(!sel) return false;
    const target=String(title||'').trim().toLowerCase();
    let found=false;
    [...sel.options].forEach(o=>{
      if(String(o.text||'').trim().toLowerCase()===target || String(o.value||'').trim().toLowerCase()===target){
        sel.value=o.value; found=true;
      }
    });
    if(!found){
      const o=document.createElement('option'); o.value=title; o.textContent=title; sel.appendChild(o); sel.value=title;
    }
    return true;
  }

  window.skActivityCertAction = async function(action,title,btn){
    setBatchActivityByTitle(title);
    if(action==='view'){
      const q=document.getElementById('certSearchInput');
      if(q){ q.value=title; q.dispatchEvent(new Event('input',{bubbles:true})); q.scrollIntoView({behavior:'smooth',block:'center'}); }
      return;
    }
    if(action==='copy') {
      const rows=selectedBatchCertificates('email',title);
      const emails=[...new Set(rows.map(c=>String(c.email||'').trim()).filter(Boolean))];
      if(!emails.length) return alert('No e-certificate email addresses found for '+title+'.');
      const txt=emails.join(', ');
      try{await navigator.clipboard.writeText(txt);alert(`${emails.length} email address(es) copied.`);}
      catch(_){window.prompt('Copy these email addresses:',txt);}
      return;
    }
    if(action==='download') return window.downloadECertificatesZip(btn,title);
    if(action==='hardcopy') return window.downloadHardCopyPdf(btn,title);
    if(action==='send'){
      const rows=selectedBatchCertificates('email',title);
      if(!rows.length) return alert('No e-certificate recipients with email addresses were found for '+title+'.');
      if(!confirm(`Send ${rows.length} e-certificate email(s) for ${title}?`)) return;
      const old=btn.textContent; btn.disabled=true; let sent=0, failed=0;
      try{
        for(let i=0;i<rows.length;i++){
          btn.textContent=`Sending ${i+1}/${rows.length}…`;
          const id=rows[i].certificateNumber||rows[i].id;
          try{
            const resp=await postApi({action:'resend-certificate',password:currentAdminPassword||sessionStorage.getItem('skQmsAdminKey')||'',certificateId:id});
            if(resp && resp.success!==false) sent++; else failed++;
          }catch(_){ failed++; }
        }
        alert(`Send All finished for ${title}. Sent: ${sent}. Failed: ${failed}.`);
        await fetchRemoteCertificates();
      }finally{btn.disabled=false;btn.textContent=old;}
    }
  };

  function renderIssuedTable() {
    renderActivityCertificateControls();
    const tbody = document.getElementById('certsTableBody');
    const kpiCerts = document.getElementById('kpiTotalCerts');
    if (kpiCerts) kpiCerts.textContent = issuedCertificates.length;
    refreshCertificateBatchActivities();
    if (!tbody) return;

    if (!issuedCertificates.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="cert-empty">No certificates issued yet. Completed activity evaluations will appear here.</td></tr>';
      return;
    }

    const deliveryView = (c) => {
      const pref = String(c.deliveryPreference || 'E-Certificate');
      const eta = /Hard Copy/i.test(pref) ? (/E-Certificate/i.test(pref) ? '~1 day e-cert / ~3 working days hard copy' : '~3 working days') : '~1 day';
      return `<span class="delivery-badge pending">${escapeHtml(pref)}</span><small class="delivery-help">${eta}</small>`;
    };

    tbody.innerHTML = issuedCertificates.map(c => {
      const id = c.certificateNumber || c.id;
      const isRevoked = String(c.status || '').toUpperCase() === 'REVOKED';
      const certUrl = `certificate.html?id=${encodeURIComponent(id)}`;
      return `
        <tr>
          <td><strong class="cert-number">${escapeHtml(id)}</strong></td>
          <td><strong>${escapeHtml(c.participantName || '—')}</strong></td>
          <td>${escapeHtml(c.activityTitle || '—')}</td>
          <td>${escapeHtml(c.dateIssued || '—')}</td>
          <td><span class="status-badge ${isRevoked ? 'status-revoked' : 'status-valid'}">${isRevoked ? 'REVOKED' : 'ACTIVE'}</span></td>
          <td>${deliveryView(c)}</td>
          <td><div class="cert-actions">
            <a href="${certUrl}" target="_blank" class="studio-btn cert-open">Open</a>
            ${isRevoked ? `<button type="button" class="studio-btn" onclick="window.restoreCert('${escapeHtml(id)}')">Restore</button>` : `<button type="button" class="studio-btn cert-danger" onclick="window.revokeCert('${escapeHtml(id)}')">Revoke</button>`}
            <button type="button" class="studio-btn cert-danger" onclick="window.deleteCert('${escapeHtml(id)}')">Delete</button>
          </div></td>
        </tr>`;
    }).join('');
  }

  function refreshCertificateBatchActivities() {
    const sel = document.getElementById('certBatchActivity');
    if (!sel) return;
    const current = sel.value;
    const names = [...new Set(issuedCertificates.map(c => c.activityTitle).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    sel.innerHTML = '<option value="">All activities</option>' + names.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
    if (names.includes(current)) sel.value = current;
  }

  function selectedBatchCertificates(kind, explicitActivity) {
    const sel=document.getElementById('certBatchActivity');
    const act=String(explicitActivity || (sel ? sel.value : '') || '').trim();
    const norm=v=>String(v||'').trim().toLowerCase();
    return issuedCertificates.filter(c=>{
      if(act && norm(c.activityTitle)!==norm(act) && norm(c.activityId)!==norm(act)) return false;
      const pref=String(c.deliveryPreference||'E-Certificate');
      if(kind==='email') return !!c.email && (/E-Certificate/i.test(pref)||/Digital Certificate/i.test(pref)||/Both/i.test(pref));
      if(kind==='hardcopy') return /Hard Copy/i.test(pref)||/Both/i.test(pref);
      return /E-Certificate/i.test(pref)||/Digital Certificate/i.test(pref)||/Both/i.test(pref);
    });
  }

  function safeFileName(v) { return String(v || 'certificate').replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').trim(); }

  // Robust on-demand loaders for certificate batch PDF/ZIP export.
  let batchToolsPromise=null;
  function loadExternalScript(url,test){
    return new Promise((resolve,reject)=>{
      if(test()) return resolve(true);
      const tag=document.createElement('script');
      tag.src=url; tag.async=true; tag.crossOrigin='anonymous';
      tag.onload=()=>test()?resolve(true):reject(new Error('Library unavailable after loading.'));
      tag.onerror=()=>reject(new Error('Could not load export library.'));
      document.head.appendChild(tag);
    });
  }
  async function loadWithFallback(urls,test){
    if(test()) return true;
    let last;
    for(const url of urls){try{await loadExternalScript(url,test);if(test())return true;}catch(e){last=e;}}
    throw last||new Error('Required export library could not be loaded.');
  }
  async function ensureBatchTools(needZip){
    if(!batchToolsPromise) batchToolsPromise=(async()=>{
      await loadWithFallback([
        'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
        'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
      ],()=>typeof window.html2canvas==='function');
      await loadWithFallback([
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js',
        'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js'
      ],()=>!!(window.jspdf&&window.jspdf.jsPDF));
    })().catch(e=>{batchToolsPromise=null;throw e;});
    await batchToolsPromise;
    if(needZip) await loadWithFallback([
      'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
      'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'
    ],()=>typeof window.JSZip==='function');
  }


  async function renderCertificateCanvas(certId) {
    const iframe = document.createElement('iframe');
    iframe.style.cssText='position:fixed;left:-10000px;top:0;width:1400px;height:1100px;border:0;opacity:0;pointer-events:none';
    iframe.src = `certificate.html?id=${encodeURIComponent(certId)}`;
    document.body.appendChild(iframe);
    try {
      await new Promise((resolve,reject)=>{ const t=setTimeout(()=>reject(new Error('Certificate preview timed out.')),20000); iframe.onload=()=>{clearTimeout(t);resolve();}; });
      const doc = iframe.contentDocument;
      const canvasEl = doc && doc.getElementById('certificateCanvas');
      if (!canvasEl) throw new Error('Certificate canvas was not found.');
      for (let i=0;i<40 && getComputedStyle(canvasEl).display==='none';i++) await new Promise(r=>setTimeout(r,250));
      await new Promise(r=>setTimeout(r,500));
      return await html2canvas(canvasEl,{scale:2,useCORS:true,backgroundColor:'#ffffff',logging:false});
    } finally { iframe.remove(); }
  }

  async function certificatePdfBlob(c) {
    const id=c.certificateNumber||c.id, canvas=await renderCertificateCanvas(id);
    const { jsPDF } = window.jspdf;
    const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
    pdf.addImage(canvas.toDataURL('image/jpeg',0.95),'JPEG',0,0,297,210);
    return pdf.output('blob');
  }

  window.copyECertificateEmails = async () => {
    const rows=selectedBatchCertificates('email');
    const emails=[...new Set(rows.map(c=>String(c.email||'').trim()).filter(Boolean))];
    if(!emails.length) return alert('No e-certificate email addresses found for the selected activity.');
    const emailText=emails.join(', ');
    let copied=false;
    try{
      if(navigator.clipboard && window.isSecureContext){
        await navigator.clipboard.writeText(emailText);
        copied=true;
      }
    }catch(_){}
    if(!copied){
      const ta=document.createElement('textarea');
      ta.value=emailText;
      ta.setAttribute('readonly','');
      ta.style.cssText='position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta);
      ta.select(); ta.setSelectionRange(0,ta.value.length);
      try{copied=document.execCommand('copy');}catch(_){}
      ta.remove();
    }
    if(copied) alert(`${emails.length} e-certificate email address(es) copied.`);
    else window.prompt('Copy these e-certificate email addresses:',emailText);
  };

  window.downloadECertificatesZip = async (btn, explicitActivity) => {
    const sel=document.getElementById('certBatchActivity');
    const selectedActivity=String(explicitActivity || (sel ? sel.value : '') || '').trim();
    if(!selectedActivity) return alert('Please select one seminar/activity first.');

    const rows=selectedBatchCertificates('ecert', selectedActivity);
    if(!rows.length) return alert('No E-Certificate or Both requests found for the selected activity.');

    const activityLabel=(explicitActivity || (sel && sel.selectedIndex>=0 ? sel.options[sel.selectedIndex].text : selectedActivity)).trim();
    const old=btn.textContent; btn.disabled=true;
    try {
      btn.textContent='Loading PDF/ZIP tools…';
      if(typeof ensureBatchTools==='function') await ensureBatchTools(true);
      else await ensureCertificateExportTools(true);

      const zip=new JSZip();
      for(let i=0;i<rows.length;i++){
        btn.textContent=`Preparing ${i+1}/${rows.length}…`;
        const c=rows[i];
        const blob=await certificatePdfBlob(c);
        const person=safeFileName(c.participantName || 'Participant');
        const seminar=safeFileName(c.activityTitle || activityLabel || 'Activity');
        zip.file(`${person} - ${seminar} Certificate.pdf`,blob);
      }

      const out=await zip.generateAsync({type:'blob'});
      const a=document.createElement('a');
      a.href=URL.createObjectURL(out);
      a.download=`${safeFileName(activityLabel)} - E-Certificates.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(a.href),3000);
    } catch(e){
      alert('Could not create the E-Certificates ZIP. '+(e.message||e));
    } finally {
      btn.disabled=false;
      btn.textContent=old;
    }
  };

  window.downloadHardCopyPdf = async (btn, explicitActivity) => {
    const rows=selectedBatchCertificates('hardcopy', explicitActivity);
    if(!rows.length) return alert('No Hard Copy or Both requests found for the selected activity.');
    const old=btn.textContent; btn.disabled=true;
    try {
      btn.textContent='Loading PDF tools…';
      await ensureBatchTools(false);
      const { jsPDF }=window.jspdf; const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
      for(let i=0;i<rows.length;i++){
        btn.textContent=`Preparing ${i+1}/${rows.length}…`;
        const canvas=await renderCertificateCanvas(rows[i].certificateNumber||rows[i].id);
        if(i) pdf.addPage('a4','landscape');
        pdf.addImage(canvas.toDataURL('image/jpeg',0.95),'JPEG',0,0,297,210);
      }
      pdf.save(`${safeFileName((document.getElementById('certBatchActivity')||{}).value||'All Activities')} - Hard Copies.pdf`);
    } catch(e){ alert('Could not create the combined Hard Copy PDF. '+(e.message||e)); }
    finally { btn.disabled=false;btn.textContent=old; }
  };

  window.resendCert = async (certId, btn) => {
    if (!currentAdminPassword) return alert('Please sign in as administrator first.');
    const old = btn ? btn.textContent : '';
    try {
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      const resp = await postApi({action:'resend-certificate', password:currentAdminPassword, certificateId:certId});
      if (!resp || resp.success === false) throw new Error((resp && resp.message) || 'Unable to resend email.');
      if (btn) btn.textContent = 'Sent ✓';
      await fetchRemoteCertificates();
    } catch (err) {
      alert('Email could not be sent. Open the Apps Script project, run/authorize a MailApp function once, then redeploy the Web App and try Resend Email again.\n\n' + (err.message || err));
      if (btn) btn.textContent = old;
    } finally { if (btn) btn.disabled = false; }
  };

  async function setCertStatus(certId, status) {
    if (!currentAdminPassword) throw new Error('Please sign in as administrator first.');
    const resp = await postApi({type:'admin-update-certificate', adminKey:currentAdminPassword, certificateId:certId, status});
    if (!resp || resp.success === false) throw new Error((resp && resp.message) || 'Unable to update certificate.');
    const matched = issuedCertificates.find(c => (c.certificateNumber || c.id) === certId);
    if (matched) matched.status = status;
    localStorage.setItem('sk_issued_certificates', JSON.stringify(issuedCertificates));
    renderIssuedTable();
  }

  window.revokeCert = async (certId) => {
    if (!confirm(`Revoke Certificate ${certId}? Public verification will immediately show it as revoked.`)) return;
    try { await setCertStatus(certId, 'REVOKED'); }
    catch (err) { alert(err.message || err); }
  };

  window.deleteCert = async (certId) => {
    if (!confirm(`Move Certificate ${certId} to the Recycle Bin? You can restore it later.`)) return;
    try {
      const resp = await postApi({action:'qms-delete-certificate', password:currentAdminPassword, certificateId:certId});
      if (!resp || resp.success === false) throw new Error((resp && resp.message) || 'Unable to delete certificate.');
      await fetchRemoteCertificates();
      if (typeof window.skQmsRefreshDashboard === 'function') window.skQmsRefreshDashboard();
    } catch (err) { alert(err.message || err); }
  };

  window.restoreCert = async (certId) => {
    if (!confirm(`Restore Certificate ${certId} to ACTIVE status?`)) return;
    try { await setCertStatus(certId, 'ACTIVE'); }
    catch (err) { alert(err.message || err); }
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
          records: document.getElementById('subtabRecords'),
          tracker: document.getElementById('subtabTracker'),
          recycle: document.getElementById('subtabRecycle'),
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
    // Activity Studio uses FLAT percentage keys (nameX/nameY, qrX/qrY, noX/noY).
    // Keep the drag state in exactly the same structure used by Save Design for Activity.
    if(typeof activeStudioTemplate!=='undefined' && activeStudioTemplate && activeStudioTemplate.layout){
      activeStudioTemplate.layout[f + 'X'] = Math.round(x * 10) / 10;
      activeStudioTemplate.layout[f + 'Y'] = Math.round(y * 10) / 10;
      // Remove obsolete nested coordinates left by older free-move builds.
      if(activeStudioTemplate.layout[f] && typeof activeStudioTemplate.layout[f] === 'object'){
        delete activeStudioTemplate.layout[f];
      }
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
      const incoming={...(e.data.layout||{})};
      ['name','qr','no'].forEach(function(f){
        if(incoming[f] && typeof incoming[f]==='object'){
          if(Number.isFinite(Number(incoming[f].x))) incoming[f+'X']=Number(incoming[f].x);
          if(Number.isFinite(Number(incoming[f].y))) incoming[f+'Y']=Number(incoming[f].y);
          delete incoming[f];
        }
      });
      activeStudioTemplate.layout={...(activeStudioTemplate.layout||{}),...incoming};
    }
    if(typeof activityTemplates!=='undefined'&&e.data.activityId){
      activityTemplates[e.data.activityId]=activityTemplates[e.data.activityId]||{};
      activityTemplates[e.data.activityId].layout={...(activityTemplates[e.data.activityId].layout||{}),...(e.data.layout||{})};
    }
  }catch(_){}
});


/* ===== V49 LIVE PREVIEW — SERVER ACTIVITY SOURCE ===== */
window.skOpenCertificatePreview=function(){
 try{
   var sel=document.getElementById('studioActivitySelect');
   var actId=(sel&&sel.value)?String(sel.value).trim():'master';
   var title=(sel&&sel.selectedIndex>=0)?String(sel.options[sel.selectedIndex].text||''):'';
   var ep='';
   try{ep=String(window.SK_CMS_ENDPOINT||localStorage.getItem('skCmsEndpoint')||localStorage.getItem('sk_cms_endpoint')||'').trim();}catch(_){}
   try{
     localStorage.setItem('sk_cert_preview_activity',actId);
     localStorage.setItem('sk_cert_preview_activity_title',title);
     localStorage.removeItem('sk_cert_preview_template'); // prevent stale activity template crossing
   }catch(_){}
   var p=new URLSearchParams({blank:'1',preview:'1',edit:'1',activityId:actId,activityTitle:title,api:ep,_:Date.now()});
   var w=window.open('certificate.html?'+p.toString(),'_blank');
   if(!w)alert('Please allow pop-ups for this site, then try again.');
   return false;
 }catch(err){alert('Unable to open certificate preview: '+(err&&err.message?err.message:err));return false;}
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


/* ===== LEGACY V16 CERTIFICATE OVERLAY REMOVED IN V28 =====
   Drive-link templates and local preview are handled by the current Certificate Studio only.
   This prevents the obsolete PNG/JPG-required validation from overriding the Drive workflow. */

/* ===== QMS CONSOLIDATED RECORDS / ACTIVITY REPORTS / RECYCLE V20 ===== */
(function(){
'use strict';
let dashboard=null,recordKind='clients';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const endpoint=()=>window.SK_CMS_ENDPOINT||localStorage.getItem('skCmsEndpoint')||'';
async function api(params){const ep=endpoint();if(!ep)throw new Error('CMS endpoint is not configured.');const r=await fetch(ep,{method:'POST',body:new URLSearchParams(params),redirect:'follow'});const j=await r.json();if(!j||!j.success)throw new Error(j?.message||'Request failed.');return j}
async function load(){const pwd=sessionStorage.getItem('skQmsAdminKey')||'';if(!pwd)return;try{const r=await api({action:'qms-dashboard',password:pwd});dashboard=r.dashboard;fillActivities();render()}catch(e){console.warn(e)}loadRecycle()}
function fillActivities(){const sel=document.getElementById('qmsActivityFilter');if(!sel||!dashboard)return;const cur=sel.value,titles=[...new Set((dashboard.activities||[]).map(x=>x.activity).filter(Boolean))].sort();sel.innerHTML='<option value="">All Activities</option>'+titles.map(x=>`<option>${esc(x)}</option>`).join('');sel.value=titles.includes(cur)?cur:''}
function rows(){return dashboard?.[recordKind]||[]}
function searchable(x){return Object.values(x).join(' ').toLowerCase()}
function filtered(){const q=(document.getElementById('qmsRecordSearch')?.value||'').toLowerCase(),act=document.getElementById('qmsActivityFilter')?.value||'';return rows().filter(x=>(!q||searchable(x).includes(q))&&(!act||recordKind!=='activities'||x.activity===act))}
function render(){const h=document.getElementById('qmsRecordsHead'),b=document.getElementById('qmsRecordsBody'),af=document.getElementById('qmsActivityFilter');if(!h||!b||!dashboard)return;if(af)af.style.display=recordKind==='activities'?'block':'none';let data=filtered(),heads=[],body='';if(recordKind==='clients'){heads=['Date','Reference','Visitor','Service / Purpose','Rating','Actions'];body=data.map(x=>`<tr><td>${esc(x.timestamp)}</td><td>${esc(x.reference)}</td><td><strong>${esc(x.name)}</strong><br><small>${esc(x.clientType)}</small></td><td>${esc(x.service)}<br><small>${esc(x.purpose)}</small></td><td>${Number(x.rating||0).toFixed(2)} / 5</td><td>${actions('client',x.reference)}</td></tr>`).join('')}else if(recordKind==='activities'){heads=['Date','Reference','Participant','Activity','Score','Actions'];body=data.map(x=>`<tr><td>${esc(x.timestamp)}</td><td>${esc(x.reference)}</td><td><strong>${esc(x.participant)}</strong><br><small>${esc(x.classification)}</small></td><td>${esc(x.activity)}<br><small>${esc(x.activityType)}</small></td><td>${Number(x.averageScore||0).toFixed(2)} / 5</td><td>${actions('activity',x.reference)}</td></tr>`).join('')}else{heads=['Date','Reference','From','Subject','Status','Actions'];body=data.map(x=>`<tr><td>${esc(x.timestamp)}</td><td>${esc(x.reference)}</td><td>${esc(x.name||'Anonymous')}</td><td><strong>${esc(x.subject)}</strong><br><small>${esc(x.category)} · ${esc(x.area)}</small></td><td>${esc(x.status)}</td><td>${actions('suggestion',x.reference)}</td></tr>`).join('')}h.innerHTML='<tr>'+heads.map(x=>'<th>'+x+'</th>').join('')+'</tr>';b.innerHTML=body||`<tr><td colspan="${heads.length}" style="text-align:center">No matching records.</td></tr>`}
function actions(type,ref){return `<div class="record-actions"><button type="button" onclick="skQmsPrintRecord('${type}','${esc(ref)}')">Print</button><button type="button" class="danger" onclick="skQmsDeleteRecord('${type}','${esc(ref)}')">Delete</button></div>`}
function findRecord(type,ref){const key=type==='client'?'clients':type==='activity'?'activities':'suggestions';return(dashboard?.[key]||[]).find(x=>x.reference===ref)}
const labels={rating:'Overall Rating',relevance:'Relevance of Activity',objectives:'Objectives Achieved',facilitatorRating:'Facilitation',organization:'Organization',venueRating:'Venue / Facilities',materials:'Materials',timeManagement:'Time Management',engagement:'Participant Engagement',speakerKnowledge:'Speaker Knowledge',speakerClarity:'Speaker Clarity',speakerEngagement:'Speaker Engagement',speakerResponsiveness:'Speaker Responsiveness'};
function printDoc(title,html){const w=open('','_blank');w.document.write(`<title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#082b50}h1{font-size:22px;margin:0 0 5px}h2{font-size:17px;margin-top:24px}.meta{color:#52677d;margin-bottom:18px}table{border-collapse:collapse;width:100%;margin:12px 0 20px}th,td{border:1px solid #ccd5df;padding:8px;text-align:left;vertical-align:top}th{background:#f4f7fa}.num{text-align:center}.summary{display:flex;gap:14px;flex-wrap:wrap}.card{border:1px solid #ccd5df;border-radius:10px;padding:12px;min-width:150px}.card strong{font-size:20px;color:#f47b20}@media print{button{display:none}.card{break-inside:avoid}}</style><h1>SK Sapilang Quality Management System</h1>${html}<p class="meta">Printed ${new Date().toLocaleString()}</p><button onclick="print()">Print / Save PDF</button>`);w.document.close()}
window.skQmsPrintRecord=function(type,ref){const x=findRecord(type,ref);if(!x)return;if(type==='activity'){const ratingRows=Object.keys(labels).map(k=>{const n=Number(x[k]||0);return `<tr><th>${labels[k]}</th><td class="num">${n>0?n.toFixed(2)+' / 5':'N/A'}</td></tr>`}).join('');const comments=[['Speaker Comments',x.speakerComments],['Key Learning',x.learning],['Liked Most',x.likedMost],['Areas for Improvement',x.improvement],['Future Activities',x.future]].filter(x=>x[1]).map(x=>`<tr><th>${esc(x[0])}</th><td>${esc(x[1])}</td></tr>`).join('');return printDoc('Evaluation '+ref,`<h2>Individual Activity Evaluation</h2><p class="meta"><strong>${esc(x.activity)}</strong> · ${esc(ref)}</p><table><tr><th>Participant</th><td>${esc(x.participant)}</td></tr><tr><th>Classification</th><td>${esc(x.classification)}</td></tr><tr><th>Date Submitted</th><td>${esc(x.timestamp)}</td></tr><tr><th>Activity Type</th><td>${esc(x.activityType)}</td></tr><tr><th>Total / Average Rating</th><td><strong>${Number(x.averageScore||0).toFixed(2)} / 5</strong></td></tr></table><h2>Ratings</h2><table>${ratingRows}</table>${comments?'<h2>Feedback</h2><table>'+comments+'</table>':''}`)}const privateKeys=['birthdate','address','contact','email'];const lines=Object.entries(x).filter(([k,v])=>v!==''&&v!=null&&!privateKeys.includes(k)).map(([k,v])=>`<tr><th>${esc(k.replace(/([A-Z])/g,' $1'))}</th><td>${esc(v)}</td></tr>`).join('');printDoc('QMS Record '+ref,`<h2>Official ${esc(type)} Record</h2><p class="meta">${esc(ref)}</p><table>${lines}</table>`)};
window.skQmsPrintActivityReport=function(){if(recordKind!=='activities'){print();return}const data=filtered();if(!data.length)return alert('No activity evaluations to print.');const selected=document.getElementById('qmsActivityFilter')?.value||'';if(!selected){const names=[...new Set(data.map(x=>x.activity).filter(Boolean))];if(names.length!==1)return alert('Select one Activity first to print its consolidated report.')}const title=selected||data[0].activity,criteria=Object.keys(labels);const avgs={};criteria.forEach(k=>{const nums=data.map(x=>Number(x[k])).filter(n=>n>0);avgs[k]=nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:0});const overall=data.reduce((a,x)=>a+Number(x.averageScore||0),0)/data.length;const dist=[5,4,3,2,1].map(n=>({n,count:data.filter(x=>Math.round(Number(x.averageScore||0))===n).length}));const ratingRows=criteria.map(k=>{const count=data.map(x=>Number(x[k])).filter(n=>n>0).length;return `<tr><th>${labels[k]}</th><td class="num">${count?avgs[k].toFixed(2)+' / 5':'N/A'}</td><td class="num">${count} response(s)</td></tr>`}).join('');const people=data.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.participant)}</td><td>${esc(x.reference)}</td><td class="num">${Number(x.averageScore||0).toFixed(2)} / 5</td></tr>`).join('');const comments=data.filter(x=>x.improvement||x.likedMost||x.future).map(x=>`<tr><td>${esc(x.reference)}</td><td>${esc(x.likedMost||'—')}</td><td>${esc(x.improvement||'—')}</td><td>${esc(x.future||'—')}</td></tr>`).join('');printDoc(title+' Activity Report',`<h2>Activity Evaluation Report</h2><p class="meta"><strong>${esc(title)}</strong></p><div class="summary"><div class="card">Responses<br><strong>${data.length}</strong></div><div class="card">Overall Average<br><strong>${overall.toFixed(2)} / 5</strong></div>${dist.map(d=>`<div class="card">${d.n}-Star / Rating<br><strong>${d.count}</strong></div>`).join('')}</div><h2>Rating for Every Evaluation Question</h2><table><tr><th>Evaluation Question / Criterion</th><th>Average Rating</th><th>Rated Responses</th></tr>${ratingRows}</table><h2>Participant Evaluation Summary</h2><table><tr><th>#</th><th>Participant</th><th>Reference</th><th>Average</th></tr>${people}</table>${comments?'<h2>Comments & Suggestions</h2><table><tr><th>Reference</th><th>Liked Most</th><th>Improvement</th><th>Future Activities</th></tr>'+comments+'</table>':''}`)};
window.skQmsDeleteRecord=async function(type,ref){if(!confirm('Move this response to the Recycle Bin? Analytics will automatically recalculate using active records only.'))return;try{await api({action:'qms-delete-record',password:sessionStorage.getItem('skQmsAdminKey')||'',recordType:type,reference:ref});await load()}catch(e){alert(e.message)}};
async function loadRecycle(){const b=document.getElementById('qmsRecycleBody');if(!b)return;try{const r=await api({action:'recycle-list',password:sessionStorage.getItem('skQmsAdminKey')||''});b.innerHTML=(r.records||[]).map(x=>{let d={};try{d=JSON.parse(x.data||'{}')}catch(_){}const label=d.FULL_NAME||d.PARTICIPANT||d.SUBJECT||d.NAME||'',context=d.ACTIVITY||d.SERVICE_AVAILED||d.SUBJECT||d.CATEGORY||'—';return `<tr><td>${esc(x.deletedAt)}</td><td>${esc(x.type)}</td><td>${esc(x.reference)}</td><td>${esc(label)}</td><td>${esc(context)}</td><td><div class="record-actions"><button type="button" onclick="skQmsRestoreRecord('${esc(x.reference)}')">Restore</button><button type="button" class="danger" onclick="skQmsPurgeRecord('${esc(x.reference)}')">Delete Permanently</button></div></td></tr>`}).join('')||'<tr><td colspan="6" style="text-align:center">Recycle Bin is empty.</td></tr>'}catch(e){b.innerHTML='<tr><td colspan="6">Unable to load Recycle Bin.</td></tr>'}}
window.skQmsRestoreRecord=async ref=>{try{await api({action:'recycle-restore',password:sessionStorage.getItem('skQmsAdminKey')||'',reference:ref});await load()}catch(e){alert(e.message)}};
window.skQmsPurgeRecord=async ref=>{if(!confirm('Permanently delete this recycled record? This cannot be undone.'))return;try{await api({action:'recycle-purge',password:sessionStorage.getItem('skQmsAdminKey')||'',reference:ref});await load()}catch(e){alert(e.message)}};
document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('[data-record-kind]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-record-kind]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');recordKind=btn.dataset.recordKind;render()}));document.getElementById('qmsRecordSearch')?.addEventListener('input',render);document.getElementById('qmsActivityFilter')?.addEventListener('change',render);document.getElementById('btnPrintRecordGroup')?.addEventListener('click',window.skQmsPrintActivityReport);document.querySelector('[data-subtab="records"]')?.addEventListener('click',load);document.querySelector('[data-subtab="recycle"]')?.addEventListener('click',loadRecycle);document.getElementById('btnAdminRefresh')?.addEventListener('click',load);const observer=new MutationObserver(()=>{if(document.getElementById('adminWorkspace')?.style.display==='block'&&!dashboard)load()});observer.observe(document.getElementById('adminWorkspace')||document.body,{attributes:true,attributeFilter:['style']})})
})();


/* ===== V29 ACTIVITY FOLDERS + LIVE ANALYTICS ===== */
(function(){
  if(window.__SK_V29_GROUPS)return; window.__SK_V29_GROUPS=true;
  function esc29(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function groupCerts(){
    const body=document.getElementById('certsTableBody'); if(!body||!Array.isArray(window.__v29Certs||null))return;
  }
  function enhanceCertificateFolders(){
    const body=document.getElementById('certsTableBody'); if(!body)return;
    const rows=[...body.querySelectorAll('tr')].filter(r=>r.children.length===7 && !r.classList.contains('v29-folder'));
    if(!rows.length)return;
    body.querySelectorAll('.v29-folder').forEach(x=>x.remove());
    let last=''; rows.forEach(r=>{const act=(r.children[2]?.textContent||'Unassigned Activity').trim(); if(act!==last){const tr=document.createElement('tr');tr.className='v29-folder';tr.innerHTML=`<td colspan="7"><div class="v29-folderbar"><strong>📁 ${esc29(act)}</strong><span><button type="button" onclick="window.skPrintCertificateActivity('${encodeURIComponent(act)}')">Print Activity List</button></span></div></td>`;body.insertBefore(tr,r);last=act;}});
  }
  window.skPrintCertificateActivity=function(encoded){const act=decodeURIComponent(encoded), rows=[...document.querySelectorAll('#certsTableBody tr')].filter(r=>r.children.length===7&&(r.children[2]?.textContent||'').trim()===act);const html=rows.map((r,i)=>`<tr><td>${i+1}</td><td>${r.children[0].innerText}</td><td>${r.children[1].innerText}</td><td>${r.children[3].innerText}</td><td>${r.children[4].innerText}</td></tr>`).join('');const w=open('','_blank');w.document.write(`<title>${esc29(act)} Certificates</title><style>body{font-family:Arial;padding:28px;color:#082b50}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccd5df;padding:8px}th{background:#f4f7fa}button{margin-top:20px}@media print{button{display:none}}</style><h1>SK Sapilang Certificate Registry</h1><h2>${esc29(act)}</h2><p>Total Certificates: <strong>${rows.length}</strong></p><table><tr><th>#</th><th>Certificate No.</th><th>Participant</th><th>Issued</th><th>Status</th></tr>${html}</table><button onclick="print()">Print / Save PDF</button>`);w.document.close();};
  let folderBusy=false,folderTimer=null;
  const safeEnhance=()=>{if(folderBusy)return;folderBusy=true;try{enhanceCertificateFolders();}finally{folderBusy=false;}};
  const mo=new MutationObserver(()=>{if(folderBusy)return;clearTimeout(folderTimer);folderTimer=setTimeout(safeEnhance,60);});
  const start=()=>{const b=document.getElementById('certsTableBody');if(b){safeEnhance();mo.observe(b,{childList:true});}};
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();

  async function refreshAnalytics(){
    const pwd=sessionStorage.getItem('skQmsAdminKey')||''; if(!pwd)return;
    try{const endpoint=(window.SK_CMS_ENDPOINT||localStorage.getItem('skCmsEndpoint')||localStorage.getItem('sk_cms_endpoint')||'').trim(); if(!endpoint)return; const d=await new Promise(resolve=>{const cb='qms_an_'+Date.now()+'_'+Math.floor(Math.random()*9999),sc=document.createElement('script');let t=setTimeout(()=>{try{sc.remove();delete window[cb]}catch(_){}resolve(null)},10000);window[cb]=v=>{clearTimeout(t);try{sc.remove();delete window[cb]}catch(_){}resolve(v)};sc.onerror=()=>{clearTimeout(t);try{sc.remove();delete window[cb]}catch(_){}resolve(null)};sc.src=endpoint+'?'+new URLSearchParams({action:'qms-dashboard',password:pwd,callback:cb,_:Date.now()});document.head.appendChild(sc)});const x=d&&d.dashboard;if(!x)return;
      const s=x.summary||{}; window.__skLastQmsDashboard=x; const a=document.getElementById('kpiActivityAvg'),c=document.getElementById('kpiClientAvg'),sg=document.getElementById('kpiTotalSuggestions'),ct=document.getElementById('kpiTotalCerts'); if(a)a.textContent=(Number(s.averageActivityScore||0)).toFixed(2)+' / 5.0';if(c)c.textContent=(Number(s.averageClientSatisfaction||0)).toFixed(2)+' / 5.0';if(sg)sg.textContent=Number(s.suggestions||0);if(ct)ct.textContent=Number(s.activeCertificates||0);
      let host=document.getElementById('v29AnalyticsAll');if(!host){host=document.createElement('div');host.id='v29AnalyticsAll';document.querySelector('#subtabAnalytics .panel-header')?.insertAdjacentElement('afterend',host);}
      const groups={};(x.activities||[]).forEach(r=>{const k=r.activity||'Unassigned Activity';(groups[k]??=[]).push(r)});
      host.innerHTML=`<div class="v29-analytics-grid"><div class="v29-card"><small>Activity Evaluations</small><strong>${Number(s.activityEvaluations||0)}</strong></div><div class="v29-card"><small>Visitor / Client Responses</small><strong>${Number(s.clientResponses||0)}</strong></div><div class="v29-card"><small>Speaker Evaluations</small><strong>${Number(s.speakerEvaluations||0)}</strong></div><div class="v29-card"><small>Suggestions / Proposals</small><strong>${Number(s.suggestions||0)}</strong></div></div><h4>Activity-by-Activity Analytics</h4>${Object.entries(groups).map(([name,rs])=>{const avg=rs.length?rs.reduce((t,r)=>t+Number(r.averageScore||0),0)/rs.length:0;return `<div class="v29-activity-analytics"><strong>📁 ${esc29(name)}</strong><span>${rs.length} response(s) · ${avg.toFixed(2)} / 5.0</span><button type="button" onclick="window.skV29PrintEvalActivity('${encodeURIComponent(name)}')">Print Report</button></div>`}).join('')||'<p>No active activity evaluations yet.</p>'}`;
      const gad=x.gadSummary||{};
      host.insertAdjacentHTML('beforeend',`<div class="gad-admin-report"><div class="gad-admin-head"><div><h4>GAD Compliance & Documentation View</h4><p>Optional administrative view for legitimate Gender and Development monitoring, verification, validation, assessment, recognition, awards, planning, and official documentation. Displays aggregated information only.</p></div><button type="button" id="btnToggleGadReport">Show GAD Documentation</button></div><div id="gadAdminBody" style="display:none"><label><strong>Purpose of Report</strong></label><select id="gadReportPurpose" class="form-control" style="max-width:420px;margin:8px 0 14px"><option>GAD Accomplishment / Monitoring</option><option>Validation / Verification</option><option>Awards / Recognition Documentation</option><option>Audit / Assessment</option><option>Planning / Program Review</option><option>Other Official GAD Purpose</option></select><div id="gadAggregateCards"></div><p class="gad-privacy-note">Privacy safeguard: this view shows aggregate counts only. Names, contact details, addresses, and individual optional GAD responses are not shown.</p><button type="button" class="btn-header btn-header-orange" id="btnPrintGadReport">Print GAD Documentation Report</button></div></div>`);
      const body=document.getElementById('gadAdminBody'),toggle=document.getElementById('btnToggleGadReport');
      const list=(title,arr)=>`<div class="gad-stat"><strong>${esc29(title)}</strong>${(arr||[]).map(i=>`<span>${esc29(i.label)} <b>${Number(i.value||0)}</b></span>`).join('')||'<span>No active responses</span>'}</div>`;
      const cards=document.getElementById('gadAggregateCards'); if(cards)cards.innerHTML=`<div class="v29-analytics-grid"><div class="v29-card"><small>Active GAD Profiles</small><strong>${Number(gad.totalProfiles||0)}</strong></div><div class="v29-card"><small>Resource Speaker Evaluations</small><strong>${Number(s.resourceSpeakerEvaluations||0)}</strong></div></div><div class="gad-stat-grid">${list('Sex Assigned at Birth',gad.sex)}${list('Gender Identity / Expression',gad.gender)}${list('Accessibility / Participation Support',gad.accessibility)}${list('Form / Participation Source',gad.formTypes)}</div>`;
      if(toggle)toggle.onclick=()=>{const show=body.style.display==='none';body.style.display=show?'block':'none';toggle.textContent=show?'Hide GAD Documentation':'Show GAD Documentation'};
      document.getElementById('btnPrintGadReport')?.addEventListener('click',()=>window.skPrintGadDocumentation&&window.skPrintGadDocumentation());
    }catch(e){console.warn('Analytics refresh failed',e)}
  }
  window.skQmsRefreshDashboard=refreshAnalytics;
  window.skV29PrintEvalActivity=function(enc){const name=decodeURIComponent(enc);const filter=document.getElementById('qmsActivityFilter');if(filter){filter.value=name;filter.dispatchEvent(new Event('change'));}setTimeout(()=>window.skQmsPrintActivityReport&&window.skQmsPrintActivityReport(),50)};
  window.skPrintGadDocumentation=function(){const x=window.__skLastQmsDashboard||{},g=x.gadSummary||{},s=x.summary||{},purpose=document.getElementById('gadReportPurpose')?.value||'GAD Documentation';const rows=(title,arr)=>`<h3>${esc29(title)}</h3><table><tr><th>Category</th><th>Active Responses</th></tr>${(arr||[]).map(i=>`<tr><td>${esc29(i.label)}</td><td>${Number(i.value||0)}</td></tr>`).join('')||'<tr><td colspan="2">No active responses</td></tr>'}</table>`;const w=open('','_blank');w.document.write(`<title>SK Sapilang GAD Documentation Report</title><style>body{font-family:Arial,sans-serif;color:#082b50;padding:30px}h1{margin-bottom:4px}p{line-height:1.5}table{width:100%;border-collapse:collapse;margin:8px 0 20px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#f1f5f9}.note{font-size:12px;color:#475569;border:1px solid #cbd5e1;padding:12px}button{margin-top:18px;padding:10px 16px}@media print{button{display:none}}</style><h1>Sangguniang Kabataan of Barangay Sapilang</h1><h2>GAD Compliance & Documentation Report</h2><p><strong>Purpose:</strong> ${esc29(purpose)}<br><strong>Generated:</strong> ${new Date().toLocaleString()}<br><strong>Active GAD profiles:</strong> ${Number(g.totalProfiles||0)}<br><strong>Active activity evaluations:</strong> ${Number(s.activityEvaluations||0)}<br><strong>Active visitor/client responses:</strong> ${Number(s.clientResponses||0)}<br><strong>Resource speaker evaluations of organizers:</strong> ${Number(s.resourceSpeakerEvaluations||0)}</p>${rows('Sex Assigned at Birth',g.sex)}${rows('Gender Identity / Expression',g.gender)}${rows('Accessibility / Participation Support',g.accessibility)}${rows('Participation / Form Source',g.formTypes)}<p class="note"><strong>Data privacy and integrity note:</strong> This report contains aggregated active records only. Deleted/recycled records are excluded automatically. Individual names, contact information, addresses, and person-level optional GAD responses are not displayed.</p><button onclick="print()">Print / Save PDF</button>`);w.document.close();};
  document.addEventListener('click',e=>{if(e.target?.dataset?.subtab==='analytics')setTimeout(refreshAnalytics,50)});
})();



/* ===== V43 GLOBAL CMS ENDPOINT RESOLVER =====
   Later certificate/admin enhancement blocks run outside the original QMS closure.
   Use this resolver there so Live Preview works on Live Server and GitHub Pages. */
window.skGetCmsEndpoint = window.skGetCmsEndpoint || function(){
  try {
    return String(window.SK_CMS_ENDPOINT ||
      localStorage.getItem('skCmsEndpoint') ||
      localStorage.getItem('sk_cms_endpoint') || '').trim();
  } catch (_) {
    return String(window.SK_CMS_ENDPOINT || '').trim();
  }
};


try {
  var __v44ep = getCmsEndpoint();
  if (__v44ep) {
    localStorage.setItem('skCmsEndpoint', __v44ep);
    localStorage.setItem('sk_cms_endpoint', __v44ep);
  }
} catch (_) {}

/* ===== V38 LIVE PREVIEW PERMANENT LAYOUT SAVE =====
   Called directly by certificate.html while the preview was opened from QMS.
   Saves one master set of coordinates per activity; participant content remains unique. */
window.skSaveCertificatePreviewLayout = async function(activityId, layout){
  const targetId=String(activityId||'master').trim()||'master';
  const incoming=Object.assign({},layout||{});
  if(typeof activeStudioTemplate==='undefined'||!activeStudioTemplate) throw new Error('Certificate Studio is not ready.');
  activeStudioTemplate.layout=Object.assign({},activeStudioTemplate.layout||{},incoming);
  if(typeof activityTemplates!=='undefined'){
    activityTemplates[targetId]=Object.assign({},activityTemplates[targetId]||{},activeStudioTemplate,{layout:Object.assign({},activeStudioTemplate.layout)});
    localStorage.setItem('sk_cert_templates',JSON.stringify(activityTemplates));
  }
  localStorage.setItem('sk_cert_preview_activity',targetId);
  localStorage.setItem('sk_cert_preview_template',JSON.stringify(activeStudioTemplate));
  const sel=document.getElementById('ctActivity')||document.getElementById('certActivity')||document.getElementById('activityTemplateSelect');
  let title=targetId;
  if(sel){
    if(sel.value!==targetId) sel.value=targetId;
    if(sel.options&&sel.selectedIndex>=0) title=sel.options[sel.selectedIndex].text||targetId;
  }
  const payload={password:currentAdminPassword,certificateBackground:activeStudioTemplate.backgroundUrl||'',certificateType:activeStudioTemplate.certType||'Certificate of Participation',...activeStudioTemplate.layout};
  let res;
  if(targetId==='master') res=await postApi({action:'save-certificate-settings',...payload});
  else res=await postApi({action:'save-certificate-template',activityId:targetId,title,backgroundUrl:activeStudioTemplate.backgroundUrl||'',certType:activeStudioTemplate.certType||'Certificate of Participation',...payload});
  if(res&&res.success===false) throw new Error(res.message||'Server did not save the layout.');
  try{ if(typeof applyStudioTemplateToUI==='function') applyStudioTemplateToUI(); }catch(_){}
  const m=document.getElementById('certStudioMsg')||document.getElementById('certificateStudioMessage')||document.getElementById('uploadStatus');
  if(m) m.textContent='✓ Live preview layout permanently saved for '+title+'.';
  return {success:true,activityId:targetId};
};


/* ===== V47 SAVED LAYOUT CACHE SYNC ===== */
window.addEventListener('message', function(ev){
  if(ev.origin !== location.origin || !ev.data || ev.data.type !== 'SK_CERT_LAYOUT_SAVED') return;
  try{
    var aid=String(ev.data.activityId||'').trim();
    if(!aid)return;
    var all=JSON.parse(localStorage.getItem('sk_cert_templates')||'{}');
    all[aid]=Object.assign({},all[aid]||{},{activityId:aid,layout:Object.assign({},(all[aid]||{}).layout||{},ev.data.layout||{})});
    localStorage.setItem('sk_cert_templates',JSON.stringify(all));
    var p=JSON.parse(localStorage.getItem('sk_cert_preview_template')||'{}');
    if(String(p.activityId||aid)===aid){
      p.activityId=aid;p.layout=Object.assign({},p.layout||{},ev.data.layout||{});
      localStorage.setItem('sk_cert_preview_template',JSON.stringify(p));
    }
  }catch(_){}
});


/* ===== CERTIFICATE TRACKER BUTTON CONTROLLER ===== */
(function(){
  if (window.__SK_CERT_TRACKER_BUTTONS_FIXED__) return;
  window.__SK_CERT_TRACKER_BUTTONS_FIXED__ = true;

  async function runRefresh(btn){
    const old=btn.textContent;
    try{
      btn.disabled=true; btn.textContent='Refreshing…';
      if(typeof fetchRemoteCertificates==='function'){
        await fetchRemoteCertificates();
      }else{
        const refresh=document.getElementById('btnAdminRefresh');
        if(refresh) refresh.click();
        else throw new Error('Certificate refresh function is unavailable.');
      }
    }catch(e){
      alert('Could not refresh the certificate list. '+(e.message||e));
    }finally{
      btn.disabled=false; btn.textContent=old;
    }
  }

  document.addEventListener('click', async function(e){
    const btn=e.target.closest('#btnCopyECertEmails,#btnDownloadECertZip,#btnCombinedHardCopyPdf,#btnRefreshCerts');
    if(!btn) return;
    e.preventDefault();
    e.stopPropagation();

    try{
      if(btn.id==='btnCopyECertEmails'){
        if(typeof window.copyECertificateEmails!=='function') throw new Error('Copy email function is unavailable.');
        await window.copyECertificateEmails();
      }else if(btn.id==='btnDownloadECertZip'){
        if(typeof window.downloadECertificatesZip!=='function') throw new Error('E-Certificate ZIP function is unavailable.');
        await window.downloadECertificatesZip(btn);
      }else if(btn.id==='btnCombinedHardCopyPdf'){
        if(typeof window.downloadHardCopyPdf!=='function') throw new Error('Hard-copy PDF function is unavailable.');
        await window.downloadHardCopyPdf(btn);
      }else if(btn.id==='btnRefreshCerts'){
        await runRefresh(btn);
      }
    }catch(err){
      alert('Certificate tool error: '+(err && err.message ? err.message : err));
    }
  }, true);
})();
