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
    activity:document.getElementById("activityPanel"),
    suggestion:document.getElementById("suggestionPanel"),
    visitor:document.getElementById("visitorPanel"),
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

function gadProfileMarkup(prefix,includeOrganization){
    const organization=includeOrganization?`
        <div class="form-group"><label for="${prefix}Organization">Organization / Office</label><input id="${prefix}Organization" name="organizationOffice" type="text" autocomplete="organization"></div>
        <div class="form-group"><label for="${prefix}Position">Position / Designation</label><input id="${prefix}Position" name="positionDesignation" type="text" autocomplete="organization-title"></div>`:"";
    return `<section class="gad-profile" aria-labelledby="${prefix}GadTitle">
        <h4 id="${prefix}GadTitle">GAD and Inclusion Profile</h4>
        <p>For sex-disaggregated statistics and inclusive program planning. Sensitive questions are voluntary, and “Prefer not to say” is available.</p>
        <div class="form-grid">
            <div class="form-group"><label for="${prefix}Sex">Sex Assigned at Birth</label><select id="${prefix}Sex" name="sexAssignedAtBirth"><option value="">Select an option</option><option>Female</option><option>Male</option><option>Intersex</option><option>Prefer not to say</option><option>Other</option></select><input class="gad-other" hidden data-other-for="${prefix}Sex" name="sexAssignedAtBirthOther" placeholder="Please specify"></div>
            <div class="form-group"><label for="${prefix}Gender">Gender Identity / Expression (Optional)</label><select id="${prefix}Gender" name="genderIdentity"><option value="">Select an option</option><option>Woman</option><option>Man</option><option>Non-binary / Gender-diverse</option><option>Transgender woman</option><option>Transgender man</option><option>Prefer not to say</option><option>Self-describe</option></select><input class="gad-other" hidden data-other-for="${prefix}Gender" name="genderIdentityOther" placeholder="Please self-describe"></div>
            <div class="form-group"><label for="${prefix}Pronouns">Preferred Pronouns (Optional)</label><select id="${prefix}Pronouns" name="preferredPronouns"><option value="">Select an option</option><option>She / Her</option><option>He / Him</option><option>They / Them</option><option>Use my name</option><option>Prefer not to say</option><option>Other</option></select><input class="gad-other" hidden data-other-for="${prefix}Pronouns" name="preferredPronounsOther" placeholder="Please specify"></div>
            ${organization}
            <div class="form-group full"><label>Sector / Inclusion Classification (Select all that apply)</label>
                <div class="sector-options">
                    <label class="sector-option"><input type="checkbox" name="sectorClassification" value="Youth (15–30)"><span>Youth (15–30)</span></label>
                    <label class="sector-option"><input type="checkbox" name="sectorClassification" value="Person with Disability (PWD)"><span>Person with Disability (PWD)</span></label>
                    <label class="sector-option"><input type="checkbox" name="sectorClassification" value="Senior Citizen"><span>Senior Citizen</span></label>
                    <label class="sector-option"><input type="checkbox" name="sectorClassification" value="Indigenous Cultural Community / Indigenous Peoples"><span>Indigenous Peoples</span></label>
                    <label class="sector-option"><input type="checkbox" name="sectorClassification" value="Solo Parent"><span>Solo Parent</span></label>
                    <label class="sector-option"><input type="checkbox" name="sectorClassification" value="Out-of-School Youth"><span>Out-of-School Youth</span></label>
                    <label class="sector-option"><input type="checkbox" name="sectorClassification" value="Student"><span>Student</span></label>
                    <label class="sector-option"><input type="checkbox" name="sectorClassification" value="Working Youth"><span>Working Youth</span></label>
                    <label class="sector-option"><input type="checkbox" name="sectorClassification" value="LGBTQIA+ Sector"><span>LGBTQIA+ Sector</span></label>
                    <label class="sector-option"><input type="checkbox" name="sectorClassification" value="4Ps Household Member"><span>4Ps Household Member</span></label>
                    <label class="sector-option"><input type="checkbox" name="sectorClassification" value="Prefer not to say"><span>Prefer not to say</span></label>
                    <label class="sector-option"><input type="checkbox" name="sectorClassification" value="Other" data-sector-other="${prefix}"><span>Other</span></label>
                </div>
                <input class="gad-other" hidden data-sector-other-input="${prefix}" name="sectorClassificationOther" placeholder="Please specify another sector or classification">
            </div>
        </div>
    </section>`;
}

document.querySelectorAll("[data-gad-profile]").forEach(container=>{
    const prefix=container.dataset.prefix;
    container.innerHTML=gadProfileMarkup(prefix,container.dataset.organization==="yes");
    container.querySelectorAll("select").forEach(select=>select.addEventListener("change",()=>{
        const input=container.querySelector('[data-other-for="'+select.id+'"]');
        if(!input)return;
        const show=select.value==="Other"||select.value==="Self-describe";
        input.hidden=!show;if(!show)input.value="";
    }));
    const otherCheck=container.querySelector('[data-sector-other="'+prefix+'"]');
    const otherInput=container.querySelector('[data-sector-other-input="'+prefix+'"]');
    otherCheck.addEventListener("change",()=>{otherInput.hidden=!otherCheck.checked;if(!otherCheck.checked)otherInput.value="";});
});

function resetGadProfile(form){
    form.querySelectorAll(".gad-other").forEach(input=>{input.hidden=true;input.value="";});
}


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


const clientForm=document.getElementById("clientForm");
if(clientForm)clientForm.addEventListener("submit",async e=>{
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
        resetGadProfile(form);
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
        await sendGadProfile(form,"Activity / Program Evaluation",data.reference);

        showResult(
            resultBox,
            data.reference,
            data.score,
            data.rating,
            "seminar, training or activity evaluation"
        );

        form.reset();
        resetGadProfile(form);
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
        await sendGadProfile(form,"Suggestions & Recommendations",data.reference);

        showResult(
            resultBox,
            data.reference,
            null,
            null,
            "suggestion or recommendation"
        );

        form.reset();
        resetGadProfile(form);
    }catch(error){
        showSubmissionError(
            resultBox,
            error.message || "Unable to connect to the QMS database."
        );
    }finally{
        setSubmitting(button,false);
    }
});

function feedbackCmsEndpoint(){return window.SK_CMS_ENDPOINT||localStorage.getItem("skCmsEndpoint")||""}
function loadScheduledActivities(){
    const run=()=>{const endpoint=feedbackCmsEndpoint(),select=document.getElementById("scheduledActivitySelect");if(!endpoint){select.innerHTML='<option value="">No CMS endpoint configured</option>';return}const callback='skSchedule'+Date.now();window[callback]=data=>{const items=(data.items||[]).filter(item=>item.type==='Scheduled Activity / Evaluation');select.innerHTML='<option value="">Select Scheduled Activity</option>'+items.map(item=>`<option value="${integratedEscape(item.title)}" data-date="${integratedEscape(item.date)}" data-venue="${integratedEscape(item.venue)}" data-speaker="${integratedEscape(item.speaker)}">${integratedEscape(item.title)}${item.date?' — '+integratedEscape(item.date):''}</option>`).join('');select._scheduleItems=items;delete window[callback];script.remove()};const script=document.createElement('script');script.src=endpoint+'?action=public&page=feedback.html&callback='+callback+'&_='+Date.now();script.onerror=()=>{select.innerHTML='<option value="">Unable to load scheduled activities</option>'};document.head.appendChild(script)};
    if(window.SK_CMS_ENDPOINT||localStorage.getItem('skCmsEndpoint'))run();else{const config=document.createElement('script');config.src='cms-config.js?v=20260903-QMS';config.onload=run;document.head.appendChild(config)}
}
document.getElementById("scheduledActivitySelect").addEventListener("change",function(){const option=this.selectedOptions[0];document.getElementById("scheduledActivityDate").value=option?.dataset.date||"";document.getElementById("scheduledActivityVenue").value=option?.dataset.venue||"";document.getElementById("scheduledActivitySpeaker").value=option?.dataset.speaker||""});
loadScheduledActivities();

function sendVisitorLog(form){
    return new Promise((resolve,reject)=>{
        const endpoint=feedbackCmsEndpoint();
        if(!endpoint){reject(new Error("The visitor logbook is not configured."));return;}
        const target="visitorLogFrame"+Date.now(),frame=document.createElement("iframe"),post=document.createElement("form");
        frame.name=target;frame.hidden=true;post.method="POST";post.action=endpoint;post.target=target;
        new FormData(form).forEach((value,name)=>{const input=document.createElement("input");input.type="hidden";input.name=name;input.value=value;post.appendChild(input);});
        const action=document.createElement("input");action.type="hidden";action.name="action";action.value="visitor-log";post.appendChild(action);
        const timer=setTimeout(()=>finish(new Error("The visitor logbook request timed out.")),25000);
        function receive(event){if(event.data?.source!=="sk-visitor-log")return;event.data.success?finish(null,event.data):finish(new Error(event.data.message||"Unable to record visit."));}
        function finish(error,data){clearTimeout(timer);window.removeEventListener("message",receive);frame.remove();post.remove();error?reject(error):resolve(data);}
        window.addEventListener("message",receive);document.body.append(frame,post);post.submit();
    });
}

function sendGadProfile(form,formType,reference){
    return new Promise((resolve,reject)=>{
        const endpoint=feedbackCmsEndpoint();
        if(!endpoint){reject(new Error("The GAD monitoring database is not configured."));return;}
        const target="gadLogFrame"+Date.now(),frame=document.createElement("iframe"),post=document.createElement("form");
        frame.name=target;frame.hidden=true;post.method="POST";post.action=endpoint;post.target=target;
        new FormData(form).forEach((value,name)=>{const input=document.createElement("input");input.type="hidden";input.name=name;input.value=value;post.appendChild(input);});
        [["action","gad-profile-log"],["formType",formType],["reference",reference||""],["consent","yes"]].forEach(([name,value])=>{const input=document.createElement("input");input.type="hidden";input.name=name;input.value=value;post.appendChild(input);});
        const timer=setTimeout(()=>finish(new Error("The GAD monitoring request timed out.")),25000);
        function receive(event){if(event.data?.source!=="sk-gad-profile-log")return;event.data.success?finish(null,event.data):finish(new Error(event.data.message||"Unable to save the GAD profile."));}
        function finish(error,data){clearTimeout(timer);window.removeEventListener("message",receive);frame.remove();post.remove();error?reject(error):resolve(data);}
        window.addEventListener("message",receive);document.body.append(frame,post);post.submit();
    });
}

document.getElementById("visitorServiceDate").value=new Date().toISOString().slice(0,10);
document.getElementById("visitorForm").addEventListener("submit",async function(event){
    event.preventDefault();
    const form=event.currentTarget,result=document.getElementById("visitorResult"),button=form.querySelector('button[type="submit"]');
    result.classList.remove("show");setSubmitting(button,true);
    try{
        const hasRating=Boolean(form.querySelector('input[name="rating"]:checked'));
        const visitorPromise=sendVisitorLog(form);
        const qmsPromise=hasRating?sendToQMS("client",form):Promise.resolve(null);
        const [visitor,qms]=await Promise.all([visitorPromise,qmsPromise]);
        await sendGadProfile(form,"Visitor Logbook / Service Feedback",qms?.reference||visitor.reference);
        showResult(result,qms?.reference||visitor.reference,qms?.score??null,qms?.rating??null,hasRating?"visitor logbook and service feedback":"visitor logbook entry");
        form.reset();resetGadProfile(form);document.getElementById("visitorServiceDate").value=new Date().toISOString().slice(0,10);
    }catch(error){showSubmissionError(result,error.message||"Unable to record the visit.");}
    finally{setSubmitting(button,false);}
});



/* =========================================================
   INTEGRATED QMS ADMIN DASHBOARD
========================================================= */

let INTEGRATED_ADMIN_KEY="";
let INTEGRATED_DASHBOARD_DATA=null;
let INTEGRATED_SCHEDULE_EDIT_ID="";
let INTEGRATED_SCHEDULE_ITEMS=[];

const integratedAdminLoginArea=document.getElementById("adminLoginArea");
const integratedAdminDashboard=document.getElementById("integratedAdminDashboard");
const integratedAdminLoginForm=document.getElementById("adminLoginForm");
const integratedAdminLoginError=document.getElementById("integratedAdminLoginError");
const integratedAdminLoading=document.getElementById("integratedAdminLoading");

function integratedCmsPassword(){
    return document.getElementById("integratedCmsPassword").value.trim()||INTEGRATED_ADMIN_KEY;
}

function integratedCmsApi(params){
    return new Promise((resolve,reject)=>{
        const endpoint=feedbackCmsEndpoint();
        if(!endpoint){reject(new Error("The website CMS address is not configured."));return;}
        const callback="skQmsCms"+Date.now()+Math.floor(Math.random()*10000);
        const script=document.createElement("script");
        const timer=setTimeout(()=>{cleanup();reject(new Error("The website CMS request timed out."));},20000);
        function cleanup(){clearTimeout(timer);delete window[callback];script.remove();}
        window[callback]=response=>{cleanup();response&&response.success?resolve(response):reject(new Error(response&&response.message||"Website CMS request failed."));};
        script.onerror=()=>{cleanup();reject(new Error("Unable to connect to the website CMS."));};
        script.src=endpoint+"?"+new URLSearchParams({...params,callback,_:Date.now()}).toString();
        document.head.appendChild(script);
    });
}

function integratedScheduleMessage(message,error=false){
    const el=document.getElementById("integratedScheduleMessage");
    el.textContent=message;
    el.style.color=error?"#ffaaaa":"";
}

function integratedClearScheduleForm(){
    const cmsPassword=document.getElementById("integratedCmsPassword").value;
    INTEGRATED_SCHEDULE_EDIT_ID="";
    document.getElementById("integratedScheduleForm").reset();
    document.getElementById("integratedCmsPassword").value=cmsPassword;
    document.getElementById("integratedScheduleSave").textContent="Add Scheduled Activity";
    integratedScheduleMessage("");
}

function integratedRenderSchedules(items){
    INTEGRATED_SCHEDULE_ITEMS=items;
    const list=document.getElementById("integratedScheduleList");
    list.innerHTML=items.length?items.map(item=>`
        <article class="admin-schedule-card">
            <div><strong>${integratedEscape(item.title)}</strong><span>${integratedEscape(item.date||"No date")} • ${integratedEscape(item.venue||"No venue")}<br>${integratedEscape(item.speaker||"No resource speaker listed")}</span></div>
            <div class="admin-schedule-card-actions"><button class="admin-action-btn" type="button" data-schedule-edit="${integratedEscape(item.id)}">Edit</button><button class="admin-action-btn danger" type="button" data-schedule-delete="${integratedEscape(item.id)}">Delete</button></div>
        </article>`).join(""):'<div class="admin-empty">No scheduled activities yet. Add the first activity above.</div>';
    list.querySelectorAll("[data-schedule-edit]").forEach(button=>button.addEventListener("click",()=>integratedEditSchedule(button.dataset.scheduleEdit)));
    list.querySelectorAll("[data-schedule-delete]").forEach(button=>button.addEventListener("click",()=>integratedDeleteSchedule(button.dataset.scheduleDelete)));
}

async function integratedLoadSchedules(){
    integratedScheduleMessage("Loading scheduled activities...");
    try{
        const response=await integratedCmsApi({action:"list-items",password:integratedCmsPassword(),page:"feedback.html"});
        integratedRenderSchedules((response.items||[]).filter(item=>item.type==="Scheduled Activity / Evaluation"));
        integratedScheduleMessage("Scheduled activities are up to date.");
    }catch(error){
        integratedScheduleMessage(error.message+" If your CMS password differs from the QMS code, enter it above.",true);
    }
}

function integratedEditSchedule(id){
    const item=INTEGRATED_SCHEDULE_ITEMS.find(row=>row.id===id);
    if(!item)return;
    INTEGRATED_SCHEDULE_EDIT_ID=id;
    document.getElementById("integratedScheduleTitle").value=item.title||"";
    document.getElementById("integratedScheduleDate").value=item.date||"";
    document.getElementById("integratedScheduleVenue").value=item.venue||"";
    document.getElementById("integratedScheduleSpeaker").value=item.speaker||"";
    document.getElementById("integratedScheduleDescription").value=item.description||"";
    document.getElementById("integratedScheduleSave").textContent="Save Activity Update";
    integratedScheduleMessage("Editing "+item.title+".");
    document.getElementById("integratedScheduleTitle").focus();
}

async function integratedDeleteSchedule(id){
    const item=INTEGRATED_SCHEDULE_ITEMS.find(row=>row.id===id);
    if(!item||!confirm("Delete “"+item.title+"” from the evaluation choices?"))return;
    integratedScheduleMessage("Deleting activity...");
    try{
        await integratedCmsApi({action:"delete-item",password:integratedCmsPassword(),id});
        integratedClearScheduleForm();
        await integratedLoadSchedules();
        loadScheduledActivities();
    }catch(error){integratedScheduleMessage(error.message,true);}
}

document.getElementById("integratedScheduleForm").addEventListener("submit",async event=>{
    event.preventDefault();
    const button=document.getElementById("integratedScheduleSave");
    button.disabled=true;
    integratedScheduleMessage("Saving scheduled activity...");
    try{
        await integratedCmsApi({
            action:"save-item",password:integratedCmsPassword(),id:INTEGRATED_SCHEDULE_EDIT_ID,page:"feedback.html",
            itemType:"Scheduled Activity / Evaluation",title:document.getElementById("integratedScheduleTitle").value.trim(),
            description:document.getElementById("integratedScheduleDescription").value.trim(),status:"Upcoming",
            eventDate:document.getElementById("integratedScheduleDate").value,venue:document.getElementById("integratedScheduleVenue").value.trim(),
            speaker:document.getElementById("integratedScheduleSpeaker").value.trim(),mediaUrl:"",linkUrl:""
        });
        integratedClearScheduleForm();
        await integratedLoadSchedules();
        loadScheduledActivities();
        integratedScheduleMessage("Activity saved. It is now available in the evaluation form.");
    }catch(error){integratedScheduleMessage(error.message,true);}finally{button.disabled=false;}
});

document.getElementById("integratedScheduleClear").addEventListener("click",integratedClearScheduleForm);
document.getElementById("integratedScheduleReload").addEventListener("click",integratedLoadSchedules);

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
        integratedLoadSchedules();
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
    document.getElementById("integratedPrintService").disabled=this.value!=="service";
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
    integratedPopulatePrintServices(data.clients||[]);
    integratedRenderClients(data.clients);
    integratedRenderActivities(data.activities);
    integratedRenderSpeakers(data.activities,s);
    integratedRenderSuggestions(data.suggestions);
}

function integratedPopulatePrintServices(rows){const select=document.getElementById('integratedPrintService');const services=[...new Set(rows.map(row=>String(row.service||'').trim()).filter(Boolean))].sort();select.innerHTML='<option value="">Select Service Availed</option>'+services.map(service=>`<option>${integratedEscape(service)}</option>`).join('')}

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
    const serviceName=document.getElementById("integratedPrintService").value;
    if(scope==="activity"&&!activityName){alert("Please select a project or activity.");return;}
    if(scope==="service"&&!serviceName){alert("Please select a service availed.");return;}

    const activities=(data.activities||[]).filter(row=>scope!=="activity"||row.activity===activityName);
    const clients=scope==="activity"||scope==="suggestions"?[]:(data.clients||[]).filter(row=>scope!=="service"||row.service===serviceName);
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
    const reportTitle=scope==="activity"?activityName+" — Evaluation Report":scope==="service"?serviceName+" — Service Feedback Report":scope==="clients"?"Client Feedback Report":scope==="suggestions"?"Suggestions Report":"Complete QMS Report";
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
