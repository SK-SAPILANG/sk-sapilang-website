const menuButton=document.getElementById("menuButton");
const navLinks=document.getElementById("navLinks");

if(menuButton&&navLinks){
    menuButton.addEventListener("click",()=>{
        const open=navLinks.classList.toggle("open");
        menuButton.setAttribute("aria-expanded",open?"true":"false");
        menuButton.textContent=open?"✕":"☰";
    });

    navLinks.querySelectorAll("a").forEach(link=>{
        link.addEventListener("click",()=>{
            navLinks.classList.remove("open");
            menuButton.setAttribute("aria-expanded","false");
            menuButton.textContent="☰";
        });
    });
}

const adminHeaderLogin=document.getElementById("adminHeaderLogin");

if(adminHeaderLogin){
    adminHeaderLogin.addEventListener("click",()=>{
        const adminTab=document.querySelector('.form-tab[data-form="admin"]');

        if(adminTab){
            adminTab.click();

            setTimeout(()=>{
                document.getElementById("qms-center").scrollIntoView({
                    behavior:"smooth",
                    block:"start"
                });

                const keyInput=document.getElementById("integratedAdminKey");

                if(keyInput){
                    setTimeout(()=>keyInput.focus(),450);
                }
            },50);
        }
    });
}

const tabs=document.querySelectorAll(".form-tab");
const panels={
    client:document.getElementById("clientPanel"),
    activity:document.getElementById("activityPanel"),
    suggestion:document.getElementById("suggestionPanel"),
    admin:document.getElementById("adminPanel")
};

tabs.forEach(tab=>{
    tab.addEventListener("click",()=>{
        tabs.forEach(t=>t.classList.remove("active"));
        Object.values(panels).forEach(p=>p.classList.remove("active"));
        tab.classList.add("active");
        panels[tab.dataset.form].classList.add("active");
    });
});

const QMS_WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbxG-b_P47JMJu-S8AvU-Az-tZFJiGhxs9IzKrPCZgxTJwdI7Se2bbyx0z6DKvYnZ90Jqg/exec";


function setSubmitting(button, submitting){
    if(!button) return;

    if(submitting){
        button.dataset.originalText=button.textContent;
        button.disabled=true;
        button.textContent="Saving Submission...";
        button.style.opacity=".65";
        button.style.cursor="wait";
    } else {
        button.disabled=false;
        button.textContent=button.dataset.originalText||"Submit";
        button.style.opacity="";
        button.style.cursor="";
    }
}


async function sendToQMS(type, form){
    const payload=new URLSearchParams();
    payload.append("type",type);

    const formData=new FormData(form);

    for(const [key,value] of formData.entries()){
        payload.append(key,value);
    }

    const response=await fetch(
        QMS_WEB_APP_URL,
        {
            method:"POST",
            body:payload,
            redirect:"follow"
        }
    );

    if(!response.ok){
        throw new Error("The QMS server returned an error.");
    }

    const data=await response.json();

    if(!data.success){
        throw new Error(
            data.message ||
            "The submission could not be saved."
        );
    }

    return data;
}


function showResult(el,reference,score,rating,type){
    el.innerHTML=`
        <div class="result-status">Saved to QMS Database</div>
        <h4>Thank you for your feedback.</h4>
        <p>
            Your ${type} has been successfully recorded in the
            SK Sapilang Quality Management System.
            Please keep your reference number for your records.
        </p>

        <div class="result-row">
            <div class="result-item">
                <small>Reference Number</small>
                <strong>${reference}</strong>
            </div>

            ${score!==null&&score!==undefined?`
            <div class="result-item">
                <small>Quality Score</small>
                <strong>${Number(score).toFixed(2)} / 5</strong>
            </div>

            <div class="result-item">
                <small>Quality Rating</small>
                <strong>${rating||""}</strong>
            </div>
            `:""}
        </div>
    `;

    el.removeAttribute("style");
    el.classList.add("show");
    el.scrollIntoView({behavior:"smooth",block:"center"});
}


function showSubmissionError(el,message){
    el.innerHTML=`
        <div class="result-status" style="color:#ff8d8d">
            Submission Not Saved
        </div>
        <h4>Unable to complete the submission.</h4>
        <p>${message}</p>
    `;

    el.style.borderColor="rgba(255,107,107,.35)";
    el.style.background="rgba(100,25,25,.12)";
    el.classList.add("show");
    el.scrollIntoView({behavior:"smooth",block:"center"});
}


document.getElementById("clientForm").addEventListener("submit",async e=>{
    e.preventDefault();

    const form=e.currentTarget;
    const button=form.querySelector('button[type="submit"]');
    const resultBox=document.getElementById("clientResult");

    resultBox.classList.remove("show");

    try{
        setSubmitting(button,true);

        const data=await sendToQMS("client",form);

        showResult(
            resultBox,
            data.reference,
            data.score,
            data.rating,
            "client feedback"
        );

        form.reset();
    }catch(error){
        showSubmissionError(
            resultBox,
            error.message || "Unable to connect to the QMS database."
        );
    }finally{
        setSubmitting(button,false);
    }
});


document.getElementById("activityForm").addEventListener("submit",async e=>{
    e.preventDefault();

    const form=e.currentTarget;
    const button=form.querySelector('button[type="submit"]');
    const resultBox=document.getElementById("activityResult");

    resultBox.classList.remove("show");

    try{
        setSubmitting(button,true);

        const data=await sendToQMS("activity",form);

        showResult(
            resultBox,
            data.reference,
            data.score,
            data.rating,
            "seminar, training or activity evaluation"
        );

        form.reset();
    }catch(error){
        showSubmissionError(
            resultBox,
            error.message || "Unable to connect to the QMS database."
        );
    }finally{
        setSubmitting(button,false);
    }
});


document.getElementById("suggestionForm").addEventListener("submit",async e=>{
    e.preventDefault();

    const form=e.currentTarget;
    const button=form.querySelector('button[type="submit"]');
    const resultBox=document.getElementById("suggestionResult");

    resultBox.classList.remove("show");

    try{
        setSubmitting(button,true);

        const data=await sendToQMS("suggestion",form);

        showResult(
            resultBox,
            data.reference,
            null,
            null,
            "suggestion or recommendation"
        );

        form.reset();
    }catch(error){
        showSubmissionError(
            resultBox,
            error.message || "Unable to connect to the QMS database."
        );
    }finally{
        setSubmitting(button,false);
    }
});



/* =========================================================
   INTEGRATED QMS ADMIN DASHBOARD
========================================================= */

let INTEGRATED_ADMIN_KEY="";
let INTEGRATED_DASHBOARD_DATA=null;

const integratedAdminLoginArea=document.getElementById("adminLoginArea");
const integratedAdminDashboard=document.getElementById("integratedAdminDashboard");
const integratedAdminLoginForm=document.getElementById("adminLoginForm");
const integratedAdminLoginError=document.getElementById("integratedAdminLoginError");
const integratedAdminLoading=document.getElementById("integratedAdminLoading");

function integratedEscape(value){
    return String(value??"")
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
}

function integratedShowLoading(show){
    integratedAdminLoading.classList.toggle("show",show);
}

async function integratedAdminPost(params){
    const body=new URLSearchParams();

    Object.entries(params).forEach(([key,value])=>{
        body.append(key,value??"");
    });

    const response=await fetch(QMS_WEB_APP_URL,{
        method:"POST",
        body,
        redirect:"follow"
    });

    if(!response.ok){
        throw new Error("QMS server returned an error.");
    }

    const data=await response.json();

    if(!data.success){
        throw new Error(data.message||"Unable to complete the request.");
    }

    return data;
}

async function integratedLoadDashboard(){
    integratedShowLoading(true);

    try{
        const response=await integratedAdminPost({
            type:"admin-dashboard",
            adminKey:INTEGRATED_ADMIN_KEY
        });

        INTEGRATED_DASHBOARD_DATA=response.dashboard;
        integratedRenderDashboard(INTEGRATED_DASHBOARD_DATA);

        integratedAdminLoginArea.style.display="none";
        integratedAdminDashboard.classList.add("show");
        sessionStorage.setItem("skQmsAdminKey",INTEGRATED_ADMIN_KEY);
        integratedAdminLoginError.classList.remove("show");
    }catch(error){
        sessionStorage.removeItem("skQmsAdminKey");
        integratedAdminLoginArea.style.display="";
        integratedAdminDashboard.classList.remove("show");
        integratedAdminLoginError.textContent=error.message;
        integratedAdminLoginError.classList.add("show");
        throw error;
    }finally{
        integratedShowLoading(false);
    }
}

integratedAdminLoginForm.addEventListener("submit",async event=>{
    event.preventDefault();
    INTEGRATED_ADMIN_KEY=document.getElementById("integratedAdminKey").value.trim();
    if(!INTEGRATED_ADMIN_KEY)return;
    try{await integratedLoadDashboard()}catch(error){}
});

document.getElementById("integratedRefreshBtn").addEventListener("click",async()=>{
    if(!INTEGRATED_ADMIN_KEY)return;
    try{await integratedLoadDashboard()}catch(error){}
});

document.getElementById("integratedPrintBtn").addEventListener("click",()=>integratedPrintReport());
document.getElementById("integratedGeneratePrintBtn").addEventListener("click",()=>integratedPrintReport());
document.getElementById("integratedPrintScope").addEventListener("change",function(){
    document.getElementById("integratedPrintActivity").disabled=this.value!=="activity";
});

document.getElementById("integratedLogoutBtn").addEventListener("click",()=>{
    INTEGRATED_ADMIN_KEY="";
    INTEGRATED_DASHBOARD_DATA=null;
    sessionStorage.removeItem("skQmsAdminKey");
    document.getElementById("integratedAdminKey").value="";
    integratedAdminDashboard.classList.remove("show");
    integratedAdminLoginArea.style.display="";
});

document.querySelectorAll(".admin-tab-btn").forEach(button=>{
    button.addEventListener("click",()=>{
        document.querySelectorAll(".admin-tab-btn").forEach(btn=>btn.classList.remove("active"));
        document.querySelectorAll(".admin-tab-content").forEach(tab=>tab.classList.remove("active"));

        button.classList.add("active");
        document.getElementById("integrated"+button.dataset.adminTab.charAt(0).toUpperCase()+button.dataset.adminTab.slice(1)+"Tab").classList.add("active");
    });
});

function integratedMetric(label,value,sub){
    return `
        <article class="admin-metric">
            <small>${integratedEscape(label)}</small>
            <strong>${integratedEscape(value)}</strong>
            <span>${integratedEscape(sub)}</span>
        </article>
    `;
}

function integratedRenderDashboard(data){
    const s=data.summary;

    document.getElementById("integratedGeneratedText").textContent=
        "Live QMS data generated "+integratedFormatDateTime(data.generatedAt)+".";

    document.getElementById("integratedSummaryGrid").innerHTML=`
        ${integratedMetric("Client Feedback",s.clientResponses,s.averageClientSatisfaction.toFixed(2)+" / 5 • "+s.clientQuality)}
        ${integratedMetric("Activity Evaluations",s.activityEvaluations,s.averageActivityScore.toFixed(2)+" / 5 • "+s.activityQuality)}
        ${integratedMetric("Speaker Evaluations",s.speakerEvaluations,s.averageSpeakerScore.toFixed(2)+" / 5 • "+s.speakerQuality)}
        ${integratedMetric("Suggestions / Concerns",s.suggestions,s.newSuggestions+" New • "+s.inProgressSuggestions+" In Progress")}
    `;

    integratedRenderBars("integratedActivityTypeBars",data.activityTypes);
    integratedRenderBars("integratedDevelopmentBars",data.developmentAreas);
    integratedRenderBars("integratedClientQualityBars",data.qualityDistribution.client);
    integratedRenderBars("integratedActivityQualityBars",data.qualityDistribution.activity);

    document.getElementById("integratedSuggestionStatusCards").innerHTML=
        data.suggestionStatuses.length
        ? data.suggestionStatuses.map(item=>`
            <div class="admin-detail-card">
                <small>${integratedEscape(item.label)}</small>
                <strong>${item.value}</strong>
                <span>Submission${item.value===1?"":"s"}</span>
            </div>
        `).join("")
        : `<div class="admin-empty">No suggestion records yet.</div>`;

    integratedPopulateActivityTypeFilter(data.activityTypes);
    integratedPopulatePrintActivities(data.activities||[]);
    integratedRenderClients(data.clients);
    integratedRenderActivities(data.activities);
    integratedRenderSpeakers(data.activities,s);
    integratedRenderSuggestions(data.suggestions);
}

function integratedPopulatePrintActivities(rows){
    const select=document.getElementById("integratedPrintActivity");
    const names=[...new Set(rows.map(row=>String(row.activity||"").trim()).filter(Boolean))].sort();
    select.innerHTML='<option value="">Select Project / Activity</option>'+names.map(name=>`<option value="${integratedEscape(name)}">${integratedEscape(name)}</option>`).join("");
}

function integratedAverage(rows,key){
    const values=rows.map(row=>Number(row[key])).filter(value=>Number.isFinite(value)&&value>0);
    return values.length?(values.reduce((sum,value)=>sum+value,0)/values.length).toFixed(2):"—";
}

function integratedCommonEntries(rows,keys,limit=10){
    const counts=new Map();
    rows.forEach(row=>keys.forEach(key=>{
        const value=String(row[key]||"").trim();
        if(value&&value.toLowerCase()!=="not applicable") counts.set(value,(counts.get(value)||0)+1);
    }));
    return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit);
}

function integratedPrintReport(){
    if(!INTEGRATED_DASHBOARD_DATA){alert("Load the QMS dashboard before printing.");return;}
    const data=INTEGRATED_DASHBOARD_DATA;
    const scope=document.getElementById("integratedPrintScope").value;
    const activityName=document.getElementById("integratedPrintActivity").value;
    if(scope==="activity"&&!activityName){alert("Please select a project or activity.");return;}

    const activities=(data.activities||[]).filter(row=>scope!=="activity"||row.activity===activityName);
    const clients=scope==="activity"||scope==="suggestions"?[]:(data.clients||[]);
    const suggestions=scope==="activity"||scope==="clients"?[]:(data.suggestions||[]);
    const ratings=[
        ["Overall Rating","averageScore"],["Relevance of Topic / Activity","relevance"],
        ["Achievement of Objectives","objectives"],["Resource Speaker / Facilitator","facilitatorRating"],
        ["Organization & Facilitation","organization"],["Venue / Facilities","venueRating"],
        ["Materials / Equipment","materials"],["Time Management","timeManagement"],
        ["Participation / Engagement","engagement"],["Speaker Knowledge","speakerKnowledge"],
        ["Speaker Clarity","speakerClarity"],["Speaker Engagement","speakerEngagement"],
        ["Speaker Responsiveness","speakerResponsiveness"]
    ];
    const common=integratedCommonEntries(activities,["improvement","future","learning"]).concat(integratedCommonEntries(suggestions,["message","solution"])).slice(0,12);
    const reportTitle=scope==="activity"?activityName+" — Evaluation Report":scope==="clients"?"Client Feedback Report":scope==="suggestions"?"Suggestions Report":"Complete QMS Report";
    const row=(cells)=>`<tr>${cells.map(cell=>`<td>${integratedEscape(cell)}</td>`).join("")}</tr>`;
    const popup=window.open("","_blank");
    if(!popup){alert("Please allow pop-ups to print the report.");return;}
    popup.document.write(`<!doctype html><html><head><title>${integratedEscape(reportTitle)}</title><style>
      @page{size:A4;margin:15mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#102a40;margin:0}h1{font-size:24px;margin:0 0 4px}h2{font-size:16px;border-bottom:2px solid #f59e0b;padding-bottom:6px;margin-top:24px}.head{border-bottom:4px solid #f59e0b;padding-bottom:12px}.meta{color:#526d7d}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0}.metric{border:1px solid #b9cbd6;padding:10px}.metric strong{display:block;font-size:18px}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #b9cbd6;padding:6px;text-align:left;vertical-align:top}th{background:#0b2545;color:#fff}.break{break-before:page}.empty{color:#647b88;font-style:italic}ol{padding-left:20px}footer{margin-top:24px;border-top:1px solid #b9cbd6;padding-top:8px;color:#526d7d}@media print{button{display:none}}
    </style></head><body><header class="head"><h1>SK Sapilang Quality Management System</h1><strong>${integratedEscape(reportTitle)}</strong><div class="meta">Generated ${integratedEscape(new Date().toLocaleString())}</div></header>
    <div class="summary"><div class="metric">Activity Evaluations<strong>${activities.length}</strong></div><div class="metric">Client Feedback<strong>${clients.length}</strong></div><div class="metric">Suggestions<strong>${suggestions.length}</strong></div></div>
    ${activities.length?`<h2>Average Rating per Question</h2><table><thead><tr><th>Evaluation Question</th><th>Average / 5</th></tr></thead><tbody>${ratings.map(item=>row([item[0],integratedAverage(activities,item[1])])).join("")}</tbody></table><h2>Common Suggestions and Learning</h2>${common.length?`<ol>${common.map(item=>`<li>${integratedEscape(item[0])}${item[1]>1?` <strong>(${item[1]} responses)</strong>`:""}</li>`).join("")}</ol>`:'<p class="empty">No written suggestions available.</p>'}<h2>Individual Activity Evaluations</h2><table><thead><tr><th>Date</th><th>Reference</th><th>Activity</th><th>Rating</th><th>Learning / Improvement</th></tr></thead><tbody>${activities.map(item=>row([item.timestamp,item.reference,item.activity,integratedAverage([item],"averageScore"),[item.learning,item.improvement,item.future].filter(Boolean).join(" | ")])).join("")}</tbody></table>`:""}
    ${clients.length?`<h2>Client Feedback</h2><table><thead><tr><th>Date</th><th>Reference</th><th>Service</th><th>Rating</th><th>Comments</th></tr></thead><tbody>${clients.map(item=>row([item.timestamp,item.reference,item.service,item.rating,item.comments])).join("")}</tbody></table>`:""}
    ${suggestions.length?`<h2>Suggestions, Recommendations and Concerns</h2><table><thead><tr><th>Date</th><th>Reference</th><th>Category / Area</th><th>Message</th><th>Status / Action</th></tr></thead><tbody>${suggestions.map(item=>row([item.timestamp,item.reference,[item.category,item.area].filter(Boolean).join(" / "),[item.message,item.solution].filter(Boolean).join(" | Proposed: "),[item.status,item.actionTaken].filter(Boolean).join(" — ")])).join("")}</tbody></table>`:""}
    <footer>Official QMS report of the Sangguniang Kabataan of Barangay Sapilang, Bacnotan, La Union</footer></body></html>`);
    popup.document.close();
    setTimeout(()=>{popup.focus();popup.print();},350);
}

function integratedRenderBars(id,items){
    const el=document.getElementById(id);

    if(!items||!items.length){
        el.innerHTML=`<div class="admin-empty">No data available yet.</div>`;
        return;
    }

    const max=Math.max(...items.map(item=>Number(item.value)||0),1);

    el.innerHTML=items.map(item=>{
        const width=((Number(item.value)||0)/max)*100;

        return `
            <div class="admin-bar-item">
                <div class="admin-bar-label" title="${integratedEscape(item.label)}">${integratedEscape(item.label)}</div>
                <div class="admin-bar-track"><div class="admin-bar-fill" style="width:${width}%"></div></div>
                <div class="admin-bar-value">${integratedEscape(item.value)}</div>
            </div>
        `;
    }).join("");
}

function integratedRenderClients(rows){
    document.getElementById("integratedClientRows").innerHTML=rows.length
    ? rows.map(row=>`
        <tr>
            <td>${integratedEscape(row.timestamp)}</td>
            <td class="admin-ref">${integratedEscape(row.reference)}</td>
            <td><strong>${integratedEscape(row.name||"Anonymous")}</strong><br><span class="admin-muted">${integratedEscape(row.email)}</span></td>
            <td>${integratedEscape(row.service)}</td>
            <td class="admin-rating">${Number(row.rating).toFixed(2)} / 5<br>${integratedEscape(row.quality)}</td>
            <td>${integratedEscape(row.comments)}</td>
        </tr>
    `).join("")
    : `<tr><td colspan="6" class="admin-empty">No client feedback records yet.</td></tr>`;

    integratedFilterClients();
}

function integratedRenderActivities(rows){
    document.getElementById("integratedActivityRows").innerHTML=rows.length
    ? rows.map(row=>`
        <tr data-type="${integratedEscape(row.activityType)}">
            <td>${integratedEscape(row.timestamp)}</td>
            <td class="admin-ref">${integratedEscape(row.reference)}</td>
            <td><strong>${integratedEscape(row.activity)}</strong><br><span class="admin-muted">${integratedEscape(row.activityType)} • ${integratedEscape(row.venue)}</span></td>
            <td>${integratedEscape(row.participant||"Anonymous")}<br><span class="admin-muted">${integratedEscape(row.classification)}</span></td>
            <td>${integratedEscape(row.speaker||"N/A")}</td>
            <td class="admin-rating">${Number(row.averageScore).toFixed(2)} / 5<br>${integratedEscape(row.quality)}</td>
            <td><strong>Learning:</strong> ${integratedEscape(row.learning)}<br><br><strong>Improve:</strong> ${integratedEscape(row.improvement)}</td>
        </tr>
    `).join("")
    : `<tr><td colspan="7" class="admin-empty">No activity evaluations yet.</td></tr>`;

    integratedFilterActivities();
}

function integratedRenderSpeakers(rows,summary){
    document.getElementById("integratedSpeakerSummary").innerHTML=`
        <div class="admin-detail-card"><small>Speaker Evaluations</small><strong>${summary.speakerEvaluations}</strong><span>Responses with speaker ratings</span></div>
        <div class="admin-detail-card"><small>Average Speaker Score</small><strong>${Number(summary.averageSpeakerScore).toFixed(2)}</strong><span>${integratedEscape(summary.speakerQuality)}</span></div>
        <div class="admin-detail-card"><small>Activities With Named Speaker</small><strong>${rows.filter(row=>row.speaker).length}</strong><span>Latest stored records</span></div>
        <div class="admin-detail-card"><small>Quality Target</small><strong>4.50+</strong><span>Excellent</span></div>
    `;

    const speakerRows=rows.filter(row=>
        row.speaker ||
        row.speakerKnowledge!=="" ||
        row.speakerClarity!=="" ||
        row.speakerEngagement!=="" ||
        row.speakerResponsiveness!==""
    );

    document.getElementById("integratedSpeakerRows").innerHTML=speakerRows.length
    ? speakerRows.map(row=>`
        <tr>
            <td><strong>${integratedEscape(row.activity)}</strong><br><span class="admin-muted">${integratedEscape(row.reference)}</span></td>
            <td>${integratedEscape(row.speaker||"Not specified")}</td>
            <td class="admin-rating">${integratedScoreOrDash(row.speakerKnowledge)}</td>
            <td class="admin-rating">${integratedScoreOrDash(row.speakerClarity)}</td>
            <td class="admin-rating">${integratedScoreOrDash(row.speakerEngagement)}</td>
            <td class="admin-rating">${integratedScoreOrDash(row.speakerResponsiveness)}</td>
            <td>${integratedEscape(row.speakerComments)}</td>
        </tr>
    `).join("")
    : `<tr><td colspan="7" class="admin-empty">No resource speaker evaluations yet.</td></tr>`;
}

function integratedRenderSuggestions(rows){
    document.getElementById("integratedSuggestionRows").innerHTML=rows.length
    ? rows.map(row=>`
        <tr data-status="${integratedEscape(row.status)}">
            <td>${integratedEscape(row.timestamp)}</td>
            <td class="admin-ref">${integratedEscape(row.reference)}</td>
            <td><strong>${integratedEscape(row.subject)}</strong><br><span class="admin-muted">${integratedEscape(row.category)} • ${integratedEscape(row.area)}${row.name?" • "+integratedEscape(row.name):""}</span></td>
            <td>${integratedEscape(row.message)}${row.solution?`<br><br><strong>Proposed:</strong> ${integratedEscape(row.solution)}`:""}</td>
            <td>${integratedStatusBadge(row.status)}${row.dateResolved?`<br><span class="admin-muted">${integratedEscape(row.dateResolved)}</span>`:""}</td>
            <td>
                <div class="admin-action-area">
                    <select data-integrated-status="${integratedEscape(row.reference)}">${integratedStatusOptions(row.status)}</select>
                    <textarea data-integrated-action="${integratedEscape(row.reference)}" placeholder="Record action taken, follow-up, response or resolution...">${integratedEscape(row.actionTaken)}</textarea>
                    <button type="button" class="admin-update-btn" data-integrated-update="${integratedEscape(row.reference)}">Save Administrative Action</button>
                </div>
            </td>
        </tr>
    `).join("")
    : `<tr><td colspan="6" class="admin-empty">No suggestions or recommendations yet.</td></tr>`;

    document.querySelectorAll("[data-integrated-update]").forEach(button=>{
        button.addEventListener("click",()=>integratedUpdateSuggestion(button.dataset.integratedUpdate));
    });

    integratedFilterSuggestions();
}

async function integratedUpdateSuggestion(reference){
    const esc=CSS.escape(reference);
    const status=document.querySelector(`[data-integrated-status="${esc}"]`).value;
    const actionTaken=document.querySelector(`[data-integrated-action="${esc}"]`).value;

    integratedShowLoading(true);

    try{
        await integratedAdminPost({
            type:"admin-update-suggestion",
            adminKey:INTEGRATED_ADMIN_KEY,
            reference,
            status,
            actionTaken
        });

        await integratedLoadDashboard();
    }catch(error){
        alert(error.message);
    }finally{
        integratedShowLoading(false);
    }
}

function integratedStatusOptions(current){
    const statuses=["NEW","UNDER REVIEW","IN PROGRESS","RESOLVED","CLOSED"];

    return statuses.map(status=>
        `<option ${status===String(current).toUpperCase()?"selected":""}>${status}</option>`
    ).join("");
}

function integratedStatusBadge(status){
    const normalized=String(status||"NEW").toUpperCase();
    let klass="";

    if(normalized==="RESOLVED"||normalized==="CLOSED")klass="resolved";
    else if(normalized==="IN PROGRESS"||normalized==="UNDER REVIEW")klass="progress";

    return `<span class="admin-status-badge ${klass}">${integratedEscape(normalized)}</span>`;
}

function integratedScoreOrDash(value){
    if(value===""||value===null||value===undefined)return"—";
    return `${Number(value).toFixed(2)} / 5`;
}

function integratedPopulateActivityTypeFilter(items){
    const select=document.getElementById("integratedActivityTypeFilter");
    const current=select.value;

    select.innerHTML=`<option value="">All Activity Types</option>`+
        items.map(item=>`<option>${integratedEscape(item.label)}</option>`).join("");

    if([...select.options].some(option=>option.value===current)){
        select.value=current;
    }
}

function integratedFilterClients(){
    const q=document.getElementById("integratedClientSearch").value.trim().toLowerCase();
    document.querySelectorAll("#integratedClientRows tr").forEach(row=>{
        row.style.display=!q||row.textContent.toLowerCase().includes(q)?"":"none";
    });
}

function integratedFilterActivities(){
    const q=document.getElementById("integratedActivitySearch").value.trim().toLowerCase();
    const type=document.getElementById("integratedActivityTypeFilter").value;

    document.querySelectorAll("#integratedActivityRows tr").forEach(row=>{
        const matchSearch=!q||row.textContent.toLowerCase().includes(q);
        const matchType=!type||row.dataset.type===type;
        row.style.display=matchSearch&&matchType?"":"none";
    });
}

function integratedFilterSuggestions(){
    const q=document.getElementById("integratedSuggestionSearch").value.trim().toLowerCase();
    const status=document.getElementById("integratedSuggestionStatusFilter").value;

    document.querySelectorAll("#integratedSuggestionRows tr").forEach(row=>{
        const matchSearch=!q||row.textContent.toLowerCase().includes(q);
        const matchStatus=!status||String(row.dataset.status||"").toUpperCase()===status;
        row.style.display=matchSearch&&matchStatus?"":"none";
    });
}

document.getElementById("integratedClientSearch").addEventListener("input",integratedFilterClients);
document.getElementById("integratedActivitySearch").addEventListener("input",integratedFilterActivities);
document.getElementById("integratedActivityTypeFilter").addEventListener("change",integratedFilterActivities);
document.getElementById("integratedSuggestionSearch").addEventListener("input",integratedFilterSuggestions);
document.getElementById("integratedSuggestionStatusFilter").addEventListener("change",integratedFilterSuggestions);

function integratedFormatDateTime(value){
    if(!value)return"";
    const date=new Date(value);
    return Number.isNaN(date.getTime())?String(value):date.toLocaleString();
}

const integratedSavedKey=sessionStorage.getItem("skQmsAdminKey");

if(integratedSavedKey){
    INTEGRATED_ADMIN_KEY=integratedSavedKey;
    document.getElementById("integratedAdminKey").value=integratedSavedKey;
}


const revealItems=document.querySelectorAll(".reveal");
if("IntersectionObserver" in window){
    const observer=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
            if(entry.isIntersecting){
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    },{threshold:.10});
    revealItems.forEach(item=>observer.observe(item));
}else{
    revealItems.forEach(item=>item.classList.add("visible"));
}

document.getElementById("year").textContent=new Date().getFullYear();
