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

if(location.hash==="#admin"||new URLSearchParams(location.search).get("admin")==="1"){
    const adminTab=document.querySelector('.form-tab[data-form="admin"]');
    if(adminTab)setTimeout(()=>adminTab.click(),0);
}

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



async function issueDigitalCertificate(form,qmsReference){
    const endpoint=feedbackCmsEndpoint();
    if(!endpoint) throw new Error("Certificate endpoint is not configured.");
    const fd=new FormData(form);
    const body=new URLSearchParams();
    body.set("action","issue-certificate");
    body.set("participant",String(fd.get("participant")||"").trim());
    body.set("email",String(fd.get("email")||"").trim());
    body.set("activity",String(fd.get("activity")||"").trim());
    body.set("activityType",String(fd.get("activityType")||"Activity / Program").trim());
    body.set("date",String(fd.get("date")||"").trim());
    body.set("venue",String(fd.get("venue")||"").trim());
    body.set("speaker",String(fd.get("speaker")||"").trim());
    body.set("qmsReference",String(qmsReference||"").trim());
    const response=await fetch(endpoint,{method:"POST",body,redirect:"follow"});
    if(!response.ok) throw new Error("Certificate server returned an error.");
    const data=await response.json();
    if(!data.success) throw new Error(data.message||"Certificate could not be issued.");
    return data;
}

document.getElementById("activityForm").addEventListener("submit",async e=>{
    e.preventDefault();

    const form=e.currentTarget;
    const button=form.querySelector('button[type="submit"]');
    const resultBox=document.getElementById("activityResult");

    resultBox.classList.remove("show");

    try{
        setSubmitting(button,true);

        const data=await sendToQMS("activity",form);
        // GAD fields are saved together with the activity evaluation by the backend.
        // Do not make certificate issuance depend on a second iframe request.

        showResult(
            resultBox,
            data.reference,
            data.score,
            data.rating,
            "seminar, training or activity evaluation"
        );

        // After a successful QMS evaluation, request a digital certificate record.
        // The certificate is stored in the CMS spreadsheet and can later be verified by QR/reference number.
        try{
            const cert=data.certificateId?{success:true,certificateId:data.certificateId}:await issueDigitalCertificate(form,data.reference);
            if(cert&&cert.success&&cert.certificateId){
                const url="certificate.html?id="+encodeURIComponent(cert.certificateId);
                resultBox.insertAdjacentHTML("beforeend",`
                    <div class="result-row" style="margin-top:16px">
                        <div class="result-item" style="width:100%">
                            <small>Digital Certificate</small>
                            <strong>${integratedEscape(cert.certificateId)}</strong>
                            <p style="margin:8px 0 12px">Your Certificate of Participation is ready.</p>
                            <a class="primary-button" href="${url}" target="_blank" rel="noopener">View / Print Digital Certificate</a>
                        </div>
                    </div>`);
            }
        }catch(certError){
            resultBox.insertAdjacentHTML("beforeend",`<p class="form-help" style="margin-top:12px">Your evaluation was saved, but the certificate service could not be reached. Keep your QMS reference number and contact SK Sapilang for certificate assistance.</p>`);
        }

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
        sendGadProfile(form,"Suggestions & Recommendations",data.reference).catch(()=>{});

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
    const run=()=>{const endpoint=feedbackCmsEndpoint(),select=document.getElementById("scheduledActivitySelect");if(!endpoint){select.innerHTML='<option value="">No CMS endpoint configured</option>';return}const callback='skSchedule'+Date.now();window[callback]=data=>{const items=unifiedActivityDedupe(data.items||[]).filter(item=>item.status!=='Completed');select.innerHTML='<option value="">Select Activity / Program</option>'+items.map(item=>`<option value="${integratedEscape(item.title)}" data-date="${integratedEscape(item.date)}" data-venue="${integratedEscape(item.venue)}" data-speaker="${integratedEscape(item.speaker)}">${integratedEscape(item.title)}${item.date?' — '+integratedEscape(item.date):''}</option>`).join('');select._scheduleItems=items;delete window[callback];script.remove()};const script=document.createElement('script');script.src=endpoint+'?action=public&page=events.html&callback='+callback+'&_='+Date.now();script.onerror=()=>{select.innerHTML='<option value="">Unable to load scheduled activities</option>'};document.head.appendChild(script)};
    if(window.SK_CMS_ENDPOINT||localStorage.getItem('skCmsEndpoint'))run();else{const config=document.createElement('script');config.src='cms-config.js?v=20260903-QMS';config.onload=run;document.head.appendChild(config)}
}
function setAdaptiveEvalField(groupId,labelId,helpId,label,help,visible=true){
    const group=document.getElementById(groupId);
    const labelEl=document.getElementById(labelId);
    const helpEl=document.getElementById(helpId);
    if(labelEl&&label)labelEl.textContent=label;
    if(helpEl&&help)helpEl.textContent=help;
    if(group){
        group.style.display=visible?"":"none";
        group.querySelectorAll("select,input,textarea").forEach(el=>{
            el.disabled=!visible;
            // Detailed questions support Not Applicable. Only the overall activity rating remains mandatory.
            if(el.tagName==="SELECT") el.required=false;
            if(!visible)el.value="";
        });
    }
}
function inferActivityFormat(title,speaker){
    const t=String(title||"").toLowerCase();
    if(speaker)return "Seminar / Training / Workshop";
    if(/basketball|pickleball|volleyball|sports|tournament|zumba|plogging|laro ng lahi|game/.test(t))return "Sports / Recreation";
    if(/assembly|mass|movie night|community event|celebration/.test(t))return "Assembly / Community Event";
    if(/distribution|exchange|kabotehan|kaBOTEhan|supply|seedling|punla|binhi|pawsitive|feeding/.test(t))return "Community Program / Distribution / Exchange";
    if(/seminar|training|workshop|orientation|education|nutriwise|wastewise|wildwise|awareness/.test(t))return "Seminar / Training / Workshop";
    return "Other SK Program";
}
function updateActivityEvaluationMode(){
    const format=document.getElementById("activityProgramFormat")?.value||"Other SK Program";
    const speaker=document.getElementById("scheduledActivitySpeaker")?.value.trim()||"";
    const hasSpeaker=Boolean(speaker);
    const speakerSection=document.getElementById("speakerEvaluationSection");
    const facilitatorGroup=document.getElementById("facilitatorRatingGroup");

    // Speaker questions only appear when the selected activity actually has a named speaker/facilitator.
    [speakerSection,facilitatorGroup].forEach(section=>{
        if(!section)return;
        section.style.display=hasSpeaker?(section.id==="speakerEvaluationSection"?"contents":""):"none";
        section.querySelectorAll("select,textarea,input").forEach(el=>{
            el.disabled=!hasSpeaker;
            if(!hasSpeaker)el.value="";
        });
    });

    const profiles={
        "Seminar / Training / Workshop":{
            title:"Learning Session / Training Evaluation",
            help:"Rate the learning experience. Speaker questions appear only when the activity has a resource speaker, trainer or facilitator.",
            relevance:["Relevance of Topic / Learning Session *","How useful and appropriate the topic or learning session was to participants."],
            objectives:["Achievement of Learning Objectives *","How well the session achieved its intended learning outcomes."],
            organization:["Organization & Facilitation *","How smoothly registration, instructions, coordination and the flow of the session were managed."],
            venue:["Venue / Learning Environment *","How suitable, accessible, comfortable and safe the learning environment was."],
            materials:["Learning Materials / Equipment *","Quality and usefulness of presentations, handouts, equipment or learning resources used."],
            time:["Time Management *","Whether the schedule allowed enough time for learning activities, discussion and questions."],
            engagement:["Participant Engagement *","How well the session encouraged participation, interaction and involvement."],
            learning:"What did you learn or benefit from?"
        },
        "Community Program / Distribution / Exchange":{
            title:"Community Program Evaluation",help:"Rate the implementation, accessibility and benefit of the community program. Speaker-related questions are not shown when there is no speaker.",
            relevance:["Relevance / Community Need *","How responsive the program was to an actual need or priority of participants/community."],
            objectives:["Program Benefit / Achievement of Purpose *","How well the program delivered its intended assistance, service or community benefit."],
            organization:["Organization & Service Process *","How orderly, clear and efficient registration, queuing, distribution/exchange and assistance were."],
            venue:["Accessibility & Safety of Venue *","How accessible, orderly and safe the program area was."],
            materials:["Quality / Availability of Items or Resources *","Availability, condition and usefulness of supplies, food, materials or resources provided/used."],
            time:["Timeliness & Waiting Time *","How efficiently the activity was conducted and whether waiting time was reasonable."],
            engagement:["Participant Experience & Inclusiveness *","How welcoming, fair and responsive the program was to participants."],
            learning:"What benefit did you receive from the program?"
        },
        "Sports / Recreation":{
            title:"Sports / Recreation Evaluation",help:"Rate the organization, safety, fairness and participant experience of the sports or recreational activity.",
            relevance:["Relevance / Enjoyment of Activity *","How appropriate, enjoyable and beneficial the activity was for participants."],
            objectives:["Achievement of Sports / Recreation Objectives *","How well the activity promoted participation, recreation, sportsmanship or youth engagement."],
            organization:["Tournament / Activity Organization *","How clear and organized registration, mechanics, scheduling, officiating and coordination were."],
            venue:["Playing Area / Venue Safety *","Suitability, accessibility and safety of the court, field or activity area."],
            materials:["Sports Equipment / Activity Resources *","Availability, condition and suitability of equipment and other resources used."],
            time:["Schedule & Time Management *","How well game/activity schedules and waiting times were managed."],
            engagement:["Fairness, Sportsmanship & Participation *","How well the activity encouraged fair play, inclusion, teamwork and active participation."],
            learning:"What did you enjoy, learn or gain from the activity?"
        },
        "Assembly / Community Event":{
            title:"Assembly / Community Event Evaluation",help:"Rate the relevance, organization, accessibility and participation of the assembly or community event.",
            relevance:["Relevance of Agenda / Event *","How relevant the agenda, information or event was to participants/community."],
            objectives:["Achievement of Event Objectives *","How well the assembly/event achieved its intended purpose."],
            organization:["Organization & Program Flow *","How clear and orderly registration, announcements, program flow and coordination were."],
            venue:["Venue / Accessibility *","How accessible, comfortable, appropriate and safe the venue was."],
            materials:["Information / Materials / Resources *","Quality and usefulness of information, materials, equipment or resources used, when applicable."],
            time:["Time Management *","How well the event followed its schedule and used participants’ time."],
            engagement:["Participation & Inclusiveness *","How well the event encouraged participation, representation and involvement."],
            learning:"What was the most useful or meaningful part of the event?"
        },
        "Other SK Program":{
            title:"Activity / Program Evaluation",help:"Rate the parts of the activity that apply to your experience. Speaker questions appear only when a speaker is recorded for the activity.",
            relevance:["Relevance / Usefulness *","How useful and appropriate the activity was to participants."],
            objectives:["Achievement of Purpose *","How well the activity achieved its intended purpose."],
            organization:["Organization & Implementation *","How organized, clear and smoothly implemented the activity was."],
            venue:["Venue / Accessibility / Safety *","How suitable, accessible and safe the venue or activity area was."],
            materials:["Materials / Equipment / Resources *","Quality and usefulness of materials, equipment or resources used in the activity."],
            time:["Time Management *","How effectively the activity schedule and participant time were managed."],
            engagement:["Participation / Engagement *","How effectively the activity encouraged participation and involvement."],
            learning:"What did you learn, enjoy or benefit from?"
        }
    };
    const p=profiles[format]||profiles["Other SK Program"];
    const title=document.getElementById("adaptiveEvaluationTitle"),help=document.getElementById("adaptiveEvaluationHelp");
    if(title)title.textContent=p.title;if(help)help.textContent=p.help;
    setAdaptiveEvalField("evalRelevanceGroup","evalRelevanceLabel","evalRelevanceHelp",...p.relevance,true);
    setAdaptiveEvalField("evalObjectivesGroup","evalObjectivesLabel","evalObjectivesHelp",...p.objectives,true);
    setAdaptiveEvalField("evalOrganizationGroup","evalOrganizationLabel","evalOrganizationHelp",...p.organization,true);
    setAdaptiveEvalField("evalVenueGroup","evalVenueLabel","evalVenueHelp",...p.venue,true);
    setAdaptiveEvalField("evalMaterialsGroup","evalMaterialsLabel","evalMaterialsHelp",...p.materials,true);
    setAdaptiveEvalField("evalTimeGroup","evalTimeLabel","evalTimeHelp",...p.time,true);
    setAdaptiveEvalField("evalEngagementGroup","evalEngagementLabel","evalEngagementHelp",...p.engagement,true);
    const learningLabel=document.getElementById("evalLearningLabel");if(learningLabel)learningLabel.innerHTML=p.learning+' <span>(Optional)</span>';
    const learning=document.getElementById("evalLearningInput");if(learning)learning.placeholder=p.learning;
}
document.getElementById("scheduledActivitySelect").addEventListener("change",function(){
    const option=this.selectedOptions[0];
    document.getElementById("scheduledActivityDate").value=option?.dataset.date||"";
    document.getElementById("scheduledActivityVenue").value=option?.dataset.venue||"";
    document.getElementById("scheduledActivitySpeaker").value=option?.dataset.speaker||"";
    const formatSelect=document.getElementById("activityProgramFormat");
    if(formatSelect&&option?.value) formatSelect.value=inferActivityFormat(option.value,option?.dataset.speaker||"");
    updateActivityEvaluationMode();
});
document.getElementById("activityProgramFormat")?.addEventListener("change",updateActivityEvaluationMode);
loadScheduledActivities();
setTimeout(()=>notifyPopulateActivities(),1200);

function sendVisitorLog(form){
    return new Promise((resolve,reject)=>{
        const endpoint=feedbackCmsEndpoint();
        if(!endpoint){reject(new Error("The visitor logbook is not configured."));return;}
        const reference="VIS-"+Date.now().toString(36).toUpperCase()+"-"+Math.random().toString(36).slice(2,8).toUpperCase();
        const target="visitorLogFrame"+Date.now(),frame=document.createElement("iframe"),post=document.createElement("form");
        frame.name=target;frame.hidden=true;post.method="POST";post.action=endpoint;post.target=target;
        new FormData(form).forEach((value,name)=>{const input=document.createElement("input");input.type="hidden";input.name=name;input.value=value;post.appendChild(input);});
        [["action","visitor-log"],["clientReference",reference]].forEach(([name,value])=>{const input=document.createElement("input");input.type="hidden";input.name=name;input.value=value;post.appendChild(input);});
        let attempts=0,done=false;
        function finish(error,data){if(done)return;done=true;frame.remove();post.remove();error?reject(error):resolve(data);}
        function check(){
            if(done)return;
            attempts++;
            const callback="skVisitorStatus"+Date.now()+Math.random().toString(36).slice(2);
            const script=document.createElement("script");
            window[callback]=data=>{delete window[callback];script.remove();if(data?.found)finish(null,{success:true,reference});else if(attempts<30)setTimeout(check,1500);else finish(new Error("The visitor logbook could not confirm the saved record."));};
            script.onerror=()=>{delete window[callback];script.remove();if(attempts<30)setTimeout(check,1500);else finish(new Error("Unable to confirm the visitor logbook record."));};
            script.src=endpoint+"?action=visitor-status&reference="+encodeURIComponent(reference)+"&callback="+callback+"&_="+Date.now();
            document.head.appendChild(script);
        }
        document.body.append(frame,post);post.submit();setTimeout(check,1500);
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
        const selectedRating=form.querySelector('input[name="rating"]:checked');
        const visitor=await sendVisitorLog(form);
        const ratingLabels={1:"Very Dissatisfied",2:"Dissatisfied",3:"Satisfactory",4:"Very Satisfied",5:"Excellent"};
        const score=selectedRating?Number(selectedRating.value):null;
        showResult(result,visitor.reference,score,score?ratingLabels[score]:null,selectedRating?"visitor logbook and service feedback":"visitor logbook entry");
        form.reset();resetGadProfile(form);document.getElementById("visitorServiceDate").value=new Date().toISOString().slice(0,10);
    }catch(error){showSubmissionError(result,error.message||"Unable to record the visit.");}
    finally{setSubmitting(button,false);}
});




/* =========================================================
   CONSENT-BASED FUTURE ACTIVITY COMMUNICATIONS
========================================================= */
let NOTIFY_CONTACTS=[];
function notifyPopulateActivities(){
    const target=document.getElementById('notifyActivity'); if(!target)return;
    const src=document.getElementById('scheduledActivitySelect');
    const vals=src?Array.from(src.options).filter(o=>o.value).map(o=>o.value):[];
    const unique=[...new Set(vals)];
    target.innerHTML='<option value="">All activities</option>'+unique.map(v=>`<option value="${integratedEscape(v)}">${integratedEscape(v)}</option>`).join('');
}
async function notifyLoadContacts(){
    const status=document.getElementById('notifyStatus'); if(status)status.textContent='Loading consented contacts...';
    try{
        const r=await integratedCmsApi({action:'notification-subscribers',password:integratedCmsPassword()});
        NOTIFY_CONTACTS=r.items||[];
        const email=NOTIFY_CONTACTS.filter(x=>x.emailConsent&&x.email).length;
        const sms=NOTIFY_CONTACTS.filter(x=>x.smsConsent&&x.contact).length;
        const box=document.getElementById('notifySummary');
        if(box)box.innerHTML=`<div class="admin-detail-card"><small>Email Consent</small><strong>${email}</strong><span>contacts</span></div><div class="admin-detail-card"><small>SMS Consent</small><strong>${sms}</strong><span>contacts</span></div><div class="admin-detail-card"><small>Total Consent Records</small><strong>${NOTIFY_CONTACTS.length}</strong><span>participants</span></div>`;
        if(status)status.textContent='Consent list refreshed. Only opted-in contacts are eligible.';
    }catch(e){if(status)status.textContent=e.message||'Unable to load consented contacts.';}
}
document.getElementById('notifyRefresh')?.addEventListener('click',notifyLoadContacts);
document.getElementById('notifySend')?.addEventListener('click',async()=>{
    const status=document.getElementById('notifyStatus');
    const channel=document.getElementById('notifyChannel').value;
    const group=document.getElementById('notifyGroup').value;
    const activity=document.getElementById('notifyActivity').value;
    const subject=document.getElementById('notifySubject').value.trim();
    const message=document.getElementById('notifyMessage').value.trim();
    if(!message){status.textContent='Write the announcement message first.';return;}
    if(group==='activity'&&!activity){status.textContent='Select an activity for the participant group.';return;}
    if(!confirm(`Send this ${channel==='sms'?'text/SMS':'email'} announcement to the selected consented group?`))return;
    status.textContent='Sending announcement...';
    try{
        const r=await integratedAdminPost({action:'send-notification-broadcast',password:integratedCmsPassword(),channel,group,activity,subject,message});
        status.textContent=`Finished: ${r.sent||0} sent, ${r.failed||0} failed, ${r.skipped||0} skipped. ${r.note||''}`;
        notifyLoadContacts();
    }catch(e){status.textContent=e.message||'Unable to send announcement.';}
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
    const cert=document.getElementById("certAdminPassword");
    const cms=document.getElementById("integratedCmsPassword");
    return (cert&&cert.value.trim())||(cms&&cms.value.trim())||INTEGRATED_ADMIN_KEY||sessionStorage.getItem("skQmsAdminKey")||"";
}
function certSyncAdminState(message){
    const input=document.getElementById("certAdminPassword"), status=document.getElementById("certAdminStatus");
    const saved=INTEGRATED_ADMIN_KEY||sessionStorage.getItem("skQmsAdminKey")||"";
    if(input&&saved&&!input.value) input.value=saved;
    if(status) status.textContent=message||(saved?"Administrator authenticated. Certificate tools are unlocked.":"Enter the same administrator password used for the QMS.");
}
document.getElementById("certAdminUnlock")?.addEventListener("click",async()=>{
    const input=document.getElementById("certAdminPassword"),status=document.getElementById("certAdminStatus"),btn=document.getElementById("certAdminUnlock");
    const key=(input?.value||"").trim();
    if(!key){if(status)status.textContent="Enter the QMS administrator password first.";return;}
    btn.disabled=true;if(status)status.textContent="Verifying administrator access...";
    try{await integratedCmsApi({action:"login",password:key});INTEGRATED_ADMIN_KEY=key;sessionStorage.setItem("skQmsAdminKey",key);const cms=document.getElementById("integratedCmsPassword");if(cms&&!cms.value)cms.value=key;certSyncAdminState("Administrator authenticated. Certificate Center unlocked.");}
    catch(e){if(status)status.textContent=e.message||"Incorrect administrator password.";}finally{btn.disabled=false;}
});

function integratedCmsApi(params,attempt=0){
    return new Promise((resolve,reject)=>{
        const endpoint=feedbackCmsEndpoint();
        if(!endpoint){reject(new Error("The website CMS address is not configured."));return;}
        const callback="skQmsCms"+Date.now()+Math.floor(Math.random()*10000);
        const script=document.createElement("script");
        const timer=setTimeout(()=>{cleanup();if(attempt<1){setTimeout(()=>integratedCmsApi(params,attempt+1).then(resolve).catch(reject),700);}else reject(new Error("The certificate/CMS server is taking too long to respond. Your unsaved certificate layout is still kept on this device. Try Refresh once, then check the Apps Script deployment if it continues."));},45000);
        function cleanup(){clearTimeout(timer);try{delete window[callback]}catch(_){window[callback]=undefined}script.remove();}
        window[callback]=response=>{cleanup();response&&response.success?resolve(response):reject(new Error(response&&response.message||"Website CMS request failed."));};
        script.onerror=()=>{cleanup();if(attempt<1){setTimeout(()=>integratedCmsApi(params,attempt+1).then(resolve).catch(reject),700);}else reject(new Error("Unable to connect to the website CMS. Your certificate edits on this device were not erased."));};
        script.src=endpoint+"?"+new URLSearchParams({...params,callback,_:Date.now()}).toString();
        document.head.appendChild(script);
    });
}

function integratedLoadSchedules(){ return typeof webActLoad==='function'?webActLoad():Promise.resolve(); }

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
        const response=await integratedCmsApi({
            action:"qms-dashboard",
            password:INTEGRATED_ADMIN_KEY
        });

        INTEGRATED_DASHBOARD_DATA=response.dashboard;
        integratedRenderDashboard(INTEGRATED_DASHBOARD_DATA);

        integratedAdminLoginArea.style.display="none";
        integratedAdminDashboard.classList.add("show");
        integratedLoadSchedules();
        sessionStorage.setItem("skQmsAdminKey",INTEGRATED_ADMIN_KEY);
        certSyncAdminState();
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
    const selectedReferences=new Set([...activities,...clients,...suggestions].map(row=>row.reference).filter(Boolean));
    const gadProfiles=(data.gadProfiles||[]).filter(row=>scope==="all"||selectedReferences.has(row.reference));
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
      @page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{font:10px Arial,sans-serif;color:#102a40;margin:0}h1{font-size:22px;margin:0 0 4px}h2{font-size:15px;border-bottom:2px solid #f59e0b;padding-bottom:6px;margin-top:20px}.head{border-bottom:4px solid #f59e0b;padding-bottom:10px}.meta{color:#526d7d}.confidential{margin-top:7px;padding:6px 8px;background:#fff1d2;border-left:4px solid #f59e0b;font-weight:700}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0}.metric{border:1px solid #b9cbd6;padding:8px}.metric strong{display:block;font-size:17px}table{width:100%;border-collapse:collapse;margin-top:8px;page-break-inside:auto}tr{page-break-inside:avoid}th,td{border:1px solid #b9cbd6;padding:5px;text-align:left;vertical-align:top;overflow-wrap:anywhere}td{white-space:pre-line}th{background:#0b2545;color:#fff}.break{break-before:page}.empty{color:#647b88;font-style:italic}ol{padding-left:20px}footer{margin-top:20px;border-top:1px solid #b9cbd6;padding-top:8px;color:#526d7d}@media print{button{display:none}}
    </style></head><body><header class="head"><h1>SK Sapilang Quality Management System</h1><strong>${integratedEscape(reportTitle)}</strong><div class="meta">Generated ${integratedEscape(new Date().toLocaleString())}</div><div class="confidential">CONFIDENTIAL — Contains personal and GAD-related information. For authorized official use only and subject to the Data Privacy Act of 2012.</div></header>
    <div class="summary"><div class="metric">Activity Evaluations<strong>${activities.length}</strong></div><div class="metric">Client Feedback<strong>${clients.length}</strong></div><div class="metric">Suggestions<strong>${suggestions.length}</strong></div></div>
    ${activities.length?`<h2>Average Rating per Question</h2><table><thead><tr><th>Evaluation Question</th><th>Average / 5</th></tr></thead><tbody>${ratings.map(item=>row([item[0],integratedAverage(activities,item[1])])).join("")}</tbody></table><h2>Common Suggestions and Learning</h2>${common.length?`<ol>${common.map(item=>`<li>${integratedEscape(item[0])}${item[1]>1?` <strong>(${item[1]} responses)</strong>`:""}</li>`).join("")}</ol>`:'<p class="empty">No written suggestions available.</p>'}<h2>Individual Activity Evaluations</h2><table><thead><tr><th>Date</th><th>Reference</th><th>Activity</th><th>Rating</th><th>Learning / Improvement</th></tr></thead><tbody>${activities.map(item=>row([item.timestamp,item.reference,item.activity,integratedAverage([item],"averageScore"),[item.learning,item.improvement,item.future].filter(Boolean).join(" | ")])).join("")}</tbody></table>`:""}
    ${clients.length?`<h2>Visitor Logbook and Client / Service Feedback</h2><table><thead><tr><th>Date / Reference</th><th>Personal Details</th><th>Contact / Address</th><th>Office / Classification</th><th>Visit and Service Details</th><th>Feedback</th></tr></thead><tbody>${clients.map(item=>row([[item.timestamp,item.reference].filter(Boolean).join("\n"),[item.name,"Age: "+(item.age||"—"),"Birthdate: "+(item.birthdate||"—")].join("\n"),[item.contact||"No contact",item.address||"No address"].join("\n"),[item.office||"No office",item.position||"No position",item.clientType||"No classification"].join("\n"),["Purpose: "+(item.purpose||"—"),"Service: "+(item.service||"—"),"Service date: "+(item.serviceDate||"—")].join("\n"),[item.rating?item.rating+" / 5 — "+item.quality:"No rating",item.comments||"No comments"].join("\n")])).join("")}</tbody></table>`:""}
    ${gadProfiles.length?`<h2>GAD and Inclusion Profiles</h2><table><thead><tr><th>Reference / Form</th><th>Sex Assigned at Birth</th><th>Gender Identity / Expression</th><th>Preferred Pronouns</th><th>Organization / Position</th><th>Sector / Inclusion Classification</th></tr></thead><tbody>${gadProfiles.map(item=>row([[item.reference,item.formType].filter(Boolean).join("\n"),[item.sexAssignedAtBirth,item.sexOther].filter(Boolean).join(" — ")||"Not provided",[item.genderIdentity,item.genderOther].filter(Boolean).join(" — ")||"Not provided",[item.preferredPronouns,item.pronounsOther].filter(Boolean).join(" — ")||"Not provided",[item.organizationOffice,item.positionDesignation].filter(Boolean).join(" — ")||"Not provided",[item.sectors,item.sectorOther].filter(Boolean).join(" | ")||"Not provided"])).join("")}</tbody></table>`:""}
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
setTimeout(()=>certSyncAdminState(),0);

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

/* 2026-09 Canva certificate + direct visual certificate editor */
let CERT_STATE={nameX:50,nameY:49,nameSize:44,qrX:83,qrY:78,qrSize:96,noX:7,noY:91,noSize:14};
const certNum=v=>Number(v)||0;
function certPersistLocal(){try{localStorage.setItem('skCertLayoutDraft',JSON.stringify(CERT_STATE))}catch(_){}}
function certRestoreLocal(){try{const x=JSON.parse(localStorage.getItem('skCertLayoutDraft')||'null');if(x&&typeof x==='object')CERT_STATE={...CERT_STATE,...x}}catch(_){}}
function certApplyVisual(){
 const stage=document.getElementById('certVisualStage'),name=document.getElementById('certDragName'),qr=document.getElementById('certDragQr'),no=document.getElementById('certDragNo');if(!stage||!name)return;
 name.style.left=CERT_STATE.nameX+'%';name.style.top=CERT_STATE.nameY+'%';name.style.fontSize=CERT_STATE.nameSize+'px';
 qr.style.left=CERT_STATE.qrX+'%';qr.style.top=CERT_STATE.qrY+'%';qr.style.width=CERT_STATE.qrSize+'px';qr.style.height=CERT_STATE.qrSize+'px';
 no.style.left=CERT_STATE.noX+'%';no.style.top=CERT_STATE.noY+'%';no.style.fontSize=CERT_STATE.noSize+'px';
}
function certSetBackground(url){const st=document.getElementById('certVisualStage');if(!st)return;st.style.backgroundImage=url?`url("${String(url).replaceAll('"','%22')}")`:'';document.getElementById('certVisualEmpty').style.display=url?'none':'grid'}
function certSelect(el){document.querySelectorAll('.cert-edit-item').forEach(x=>x.classList.toggle('cert-selected',x===el));const i=document.getElementById('certSelectedInfo');if(el&&i)i.textContent=(el.dataset.kind==='name'?'Participant Name':el.dataset.kind==='qr'?'QR Code':'Certificate Number')+' selected — drag to move; drag the orange corner to resize.'}
function certEnableDirectEditor(){
 const stage=document.getElementById('certVisualStage');if(!stage)return;
 stage.querySelectorAll('.cert-edit-item').forEach(el=>{
  el.addEventListener('pointerdown',e=>{certSelect(el);if(e.target.classList.contains('cert-resize-handle'))return;e.preventDefault();el.setPointerCapture(e.pointerId);const r=stage.getBoundingClientRect(),kind=el.dataset.kind,startX=e.clientX,startY=e.clientY,x0=CERT_STATE[kind+'X'],y0=CERT_STATE[kind+'Y'];
   const move=ev=>{CERT_STATE[kind+'X']=Math.max(0,Math.min(100,x0+(ev.clientX-startX)/r.width*100));CERT_STATE[kind+'Y']=Math.max(0,Math.min(100,y0+(ev.clientY-startY)/r.height*100));certApplyVisual()};
   const up=()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up)};el.addEventListener('pointermove',move);el.addEventListener('pointerup',up)
  });
  const h=el.querySelector('.cert-resize-handle');h?.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();h.setPointerCapture(e.pointerId);const kind=el.dataset.kind,start=e.clientX,size0=kind==='name'?CERT_STATE.nameSize:kind==='qr'?CERT_STATE.qrSize:CERT_STATE.noSize;
   const move=ev=>{const d=ev.clientX-start;if(kind==='name')CERT_STATE.nameSize=Math.max(18,Math.min(90,size0+d*.25));else if(kind==='qr')CERT_STATE.qrSize=Math.max(55,Math.min(180,size0+d));else CERT_STATE.noSize=Math.max(9,Math.min(32,size0+d*.12));certApplyVisual()};
   const up=()=>{h.removeEventListener('pointermove',move);h.removeEventListener('pointerup',up)};h.addEventListener('pointermove',move);h.addEventListener('pointerup',up)
  })
 });
 stage.addEventListener('pointerdown',e=>{if(e.target===stage)certSelect(null)})
}
async function certLoadDesign(){
 try{const r=await integratedCmsApi({action:'certificate-settings'}),x=r.settings||{};document.getElementById('certCanvaUrl').value=x.canvaEditUrl||'';document.getElementById('certBackgroundUrl').value=x.certificateBackground||'';CERT_STATE={nameX:certNum(x.nameX)||50,nameY:certNum(x.nameY)||49,nameSize:certNum(x.nameSize)||44,qrX:certNum(x.qrX)||83,qrY:certNum(x.qrY)||78,qrSize:certNum(x.qrSize)||96,noX:certNum(x.noX)||7,noY:certNum(x.noY)||91,noSize:certNum(x.noSize)||14};certRestoreLocal();certApplyVisual();certSetBackground(x.certificateBackground||'');const a=document.getElementById('certOpenCanva');a.href=x.canvaEditUrl||'#';document.getElementById('certDesignMsg').textContent=x.certificateBackground?'Master certificate loaded. Drag the personalized fields directly on the preview.':'Choose your Canva PNG/JPG above to begin.'}catch(e){document.getElementById('certDesignMsg').textContent=e.message}
}
document.getElementById('certMasterFile')?.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;if(window.CERT_LOCAL_PREVIEW)URL.revokeObjectURL(window.CERT_LOCAL_PREVIEW);window.CERT_LOCAL_PREVIEW=URL.createObjectURL(f);certSetBackground(window.CERT_LOCAL_PREVIEW);document.getElementById('certDesignMsg').textContent='Preview ready. Drag the name, QR and certificate number into position, then upload and save.'});
document.getElementById('certCanvaUrl')?.addEventListener('input',e=>{document.getElementById('certOpenCanva').href=e.target.value.trim()||'#'});
async function certUploadDesign(){const file=document.getElementById('certMasterFile').files[0],msg=document.getElementById('certDesignMsg');if(!file){msg.textContent='Choose your exported Canva PNG/JPG first.';return}if(file.size>10*1024*1024){msg.textContent='Image must be 10 MB or smaller.';return}msg.textContent='Uploading certificate background...';try{const data=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>no(new Error('Unable to read image.'));r.readAsDataURL(file)}),x=await integratedAdminPost({action:'upload-certificate-background',password:integratedCmsPassword(),name:file.name,data});document.getElementById('certBackgroundUrl').value=x.url||'';certSetBackground(x.url||window.CERT_LOCAL_PREVIEW||'');msg.textContent='Background uploaded. Now click SAVE POSITIONS & MASTER CERTIFICATE.'}catch(e){msg.textContent=e.message}}
async function certSaveDesign(){const msg=document.getElementById('certDesignMsg'),canva=document.getElementById('certCanvaUrl').value.trim(),bg=document.getElementById('certBackgroundUrl').value.trim();if(!bg){msg.textContent='Upload / Replace Background first so the certificate image is saved online.';return}msg.textContent='Saving certificate design and positions...';try{await integratedAdminPost({action:'save-certificate-settings',password:integratedCmsPassword(),title:'Certificate of Participation',body:'',logo1:'',logo2:'',signatory1:'',position1:'',signatory2:'',position2:'',design:'canva',adminEmail:'',certificateBackground:bg,canvaEditUrl:canva,...CERT_STATE});certPersistLocal();document.getElementById('certOpenCanva').href=canva||'#';msg.textContent='Saved. Every certificate will use this design and these exact positions, with a unique name, certificate number and QR.'}catch(e){msg.textContent=e.message}}
document.getElementById('certUploadDesign')?.addEventListener('click',certUploadDesign);document.getElementById('certSaveDesign')?.addEventListener('click',certSaveDesign);document.getElementById('certResetPositions')?.addEventListener('click',()=>{CERT_STATE={nameX:50,nameY:49,nameSize:44,qrX:83,qrY:78,qrSize:96,noX:7,noY:91,noSize:14};certApplyVisual();document.getElementById('certDesignMsg').textContent='Positions reset in preview. Click Save to keep the reset.'});certEnableDirectEditor();

function isUnifiedActivityItem(x){
 const t=String(x?.type||'').trim();
 return ['Website Activity / Program','Scheduled Activity / Evaluation','Upcoming Event','Finished Activity','Project / Program','Activity / Program'].includes(t);
}
function unifiedActivityStatus(x){
 const raw=String(x?.status||'').trim();
 if(raw==='Completed'||x?.type==='Finished Activity')return 'Completed';
 if(raw==='Ongoing')return 'Ongoing';
 return 'Upcoming';
}
function unifiedActivityDedupe(items){
 const seen=new Set();
 return (items||[]).filter(isUnifiedActivityItem).map(x=>({...x,status:unifiedActivityStatus(x)})).filter(x=>{
   const k=String(x.id||'')||[String(x.title||'').trim().toLowerCase(),String(x.date||'')].join('|');
   if(seen.has(k))return false;seen.add(k);return true;
 });
}
let WEB_ACTIVITY_ITEMS=[];
let WEB_ACTIVITY_EDIT_ID='';
let WEB_ACTIVITY_FILTER='all';
function webActMsg(t){const e=document.getElementById("webActMsg");if(e)e.textContent=t||""}
function webActClear(){WEB_ACTIVITY_EDIT_ID="";const f=document.getElementById("webActivityForm");if(f)f.reset();const st=document.getElementById("webActStatus");if(st)st.value="Upcoming";["webActShowUpdates","webActShowPrograms","webActEvaluation","webActCertificates"].forEach(id=>{const e=document.getElementById(id);if(e)e.checked=true});const b=document.getElementById("webActSave");if(b)b.textContent="Add Activity / Program";webActMsg("")}
function webActVisible(items){return WEB_ACTIVITY_FILTER==='all'?items:items.filter(x=>(x.status||'Upcoming')===WEB_ACTIVITY_FILTER)}
function webActRender(items){WEB_ACTIVITY_ITEMS=unifiedActivityDedupe(items);items=WEB_ACTIVITY_ITEMS;if(typeof ctSyncActivitySelects==='function')ctSyncActivitySelects(WEB_ACTIVITY_ITEMS);const box=document.getElementById("webActList");if(!box)return;const show=webActVisible(items);box.innerHTML=show.length?show.map(x=>`<article class="admin-schedule-card"><div>${x.mediaUrl?`<img src="${integratedEscape(x.mediaUrl)}" alt="" style="width:88px;height:64px;object-fit:cover;border-radius:8px;float:left;margin-right:12px">`:""}<strong>${integratedEscape(x.title)}</strong><span>${integratedEscape(x.status||"Upcoming")} • ${integratedEscape(x.date||"No date")}<br>${integratedEscape(x.venue||"")} ${x.speaker?'• '+integratedEscape(x.speaker):''}</span></div><div class="admin-schedule-card-actions"><button type="button" class="admin-action-btn" data-wa-edit="${integratedEscape(x.id)}">Edit</button><button type="button" class="admin-action-btn danger" data-wa-delete="${integratedEscape(x.id)}">Delete</button></div></article>`).join(""):'<div class="admin-empty">No activities in this view.</div>';box.querySelectorAll('[data-wa-edit]').forEach(b=>b.onclick=()=>webActEdit(b.dataset.waEdit));box.querySelectorAll('[data-wa-delete]').forEach(b=>b.onclick=()=>webActDelete(b.dataset.waDelete))}
async function webActLoad(){
 try{
  // Show the last successful activity list instantly while the server refreshes it.
  if(!WEB_ACTIVITY_ITEMS.length){try{const cached=JSON.parse(sessionStorage.getItem('skUnifiedActivities')||'[]');if(Array.isArray(cached)&&cached.length){webActRender(cached);INTEGRATED_SCHEDULE_ITEMS=WEB_ACTIVITY_ITEMS;webActSyncEvaluationSelect();webActMsg(`${WEB_ACTIVITY_ITEMS.length} activities ready. Refreshing in background...`)}}catch(_){}}
  if(!WEB_ACTIVITY_ITEMS.length)webActMsg("Loading all activities...");
  const pages=["news-events.html","feedback.html","events.html"];
  const results=await Promise.all(pages.map(page=>integratedCmsApi({action:"list-items",password:integratedCmsPassword(),page}).catch(()=>({items:[]}))));
  const merged=[]; results.forEach((r,i)=>(r.items||[]).forEach(x=>merged.push({...x,_sourcePage:pages[i]})));
  webActRender(unifiedActivityDedupe(merged));
  try{sessionStorage.setItem('skUnifiedActivities',JSON.stringify(WEB_ACTIVITY_ITEMS))}catch(_){}
  INTEGRATED_SCHEDULE_ITEMS=WEB_ACTIVITY_ITEMS;
  webActSyncEvaluationSelect();
  webActMsg(`${WEB_ACTIVITY_ITEMS.length} activit${WEB_ACTIVITY_ITEMS.length===1?'y':'ies'} loaded. One Activity Manager now reads your existing and new records.`);
  if(typeof ctSyncActivitySelects==='function')ctSyncActivitySelects(WEB_ACTIVITY_ITEMS);
 }catch(e){webActMsg(e.message)}
}
function webActSyncEvaluationSelect(){
 const select=document.getElementById("scheduledActivitySelect");if(!select)return;
 const items=(WEB_ACTIVITY_ITEMS||[]).filter(x=>x.status!=="Completed");
 const keep=select.value;
 select.innerHTML='<option value="">Select Activity / Program</option>'+items.map(item=>`<option value="${integratedEscape(item.title)}" data-date="${integratedEscape(item.date)}" data-venue="${integratedEscape(item.venue)}" data-speaker="${integratedEscape(item.speaker)}">${integratedEscape(item.title)}${item.date?' — '+integratedEscape(item.date):''}</option>`).join('');
 select._scheduleItems=items;if([...select.options].some(o=>o.value===keep))select.value=keep;
}
function webActEdit(id){const x=WEB_ACTIVITY_ITEMS.find(v=>v.id===id);if(!x)return;WEB_ACTIVITY_EDIT_ID=id;document.getElementById("webActTitle").value=x.title||"";document.getElementById("webActDate").value=x.date||"";document.getElementById("webActStatus").value=x.status||"Upcoming";document.getElementById("webActDescription").value=x.description||"";document.getElementById("webActVenue").value=x.venue||"";document.getElementById("webActSpeaker").value=x.speaker||"";document.getElementById("webActPubmat").value=x.mediaUrl||"";document.getElementById("webActFacebook").value=x.linkUrl||"";document.getElementById("webActPhotos").value="";document.getElementById("webActSave").textContent="Save Activity Update";webActMsg("Editing "+x.title);document.getElementById("webActTitle").focus()}
async function webActDelete(id){const x=WEB_ACTIVITY_ITEMS.find(v=>v.id===id);if(!x||!confirm('Delete “'+x.title+'”? This removes it from Activity Manager, evaluation choices and certificate activity choices.'))return;try{await integratedCmsApi({action:"delete-item",password:integratedCmsPassword(),id});webActClear();await webActLoad();loadScheduledActivities()}catch(e){webActMsg(e.message)}}
document.getElementById("webActivityForm")?.addEventListener("submit",async e=>{e.preventDefault();const b=document.getElementById("webActSave");b.disabled=true;try{const status=document.getElementById("webActStatus").value;await integratedCmsApi({action:"save-item",password:integratedCmsPassword(),id:WEB_ACTIVITY_EDIT_ID,page:(WEB_ACTIVITY_ITEMS.find(v=>v.id===WEB_ACTIVITY_EDIT_ID)?._sourcePage||"news-events.html"),itemType:"Activity / Program",title:document.getElementById("webActTitle").value.trim(),description:document.getElementById("webActDescription").value.trim(),status,eventDate:document.getElementById("webActDate").value,venue:document.getElementById("webActVenue").value.trim(),speaker:document.getElementById("webActSpeaker").value.trim(),mediaUrl:document.getElementById("webActPubmat").value.trim(),linkUrl:document.getElementById("webActFacebook").value.trim()});webActClear();await webActLoad();loadScheduledActivities();webActMsg(status==='Completed'?"Saved. This activity is now shown as Completed / Finished and remains available for certificates.":"Saved. This upcoming/ongoing activity is now available for evaluations, certificates, and the public Updates & Programs feed.")}catch(err){webActMsg(err.message)}finally{b.disabled=false}});
document.getElementById("webActClear")?.addEventListener("click",webActClear);document.getElementById("webActReload")?.addEventListener("click",webActLoad);
document.querySelectorAll('[data-activity-filter]').forEach(b=>b.addEventListener('click',()=>{WEB_ACTIVITY_FILTER=b.dataset.activityFilter;webActRender(WEB_ACTIVITY_ITEMS)}));
// FAST START: begin independent requests immediately instead of waiting 700 ms.
Promise.allSettled([certLoadDesign(),webActLoad()]);

/* MULTI-ACTIVITY CERTIFICATE CENTER */
let CERT_TEMPLATES=[];
let CERT_ACTIVITY_ITEMS=[];
let CT_EDIT='';
function ctMsg(t){const e=document.getElementById('ctMsg');if(e)e.textContent=t}
function ctParse(x){try{return JSON.parse(x.description||'{}')}catch{return {}}}
function ctActivityKey(x){return String((x&&x.id)||'')}
function ctActivityLabel(x){return `${x.title||'Untitled Activity'}${x.date?' — '+x.date:''}`}
function ctSyncActivitySelects(items){
 CERT_ACTIVITY_ITEMS=unifiedActivityDedupe(items||[]).map(x=>({...x,_source:x._source||'Activity Manager'}));
 ['ctActivity','ciActivity'].forEach(id=>{const sel=document.getElementById(id);if(!sel)return;const keep=sel.value;sel.innerHTML='<option value="">Select an activity...</option>'+CERT_ACTIVITY_ITEMS.map(x=>`<option value="${integratedEscape(ctActivityKey(x))}">${integratedEscape(ctActivityLabel(x))}</option>`).join('');if([...sel.options].some(o=>o.value===keep))sel.value=keep});
 const count=document.getElementById('certActivityCount');if(count)count.textContent=CERT_ACTIVITY_ITEMS.length?`${CERT_ACTIVITY_ITEMS.length} activities available`:'No activities found yet';
 const empty=document.getElementById('certActivityEmpty');if(empty)empty.style.display=CERT_ACTIVITY_ITEMS.length?'none':'block';
}
async function ctLoadActivities(){
  const all=[];
  const add=(items,source,type)=>{(items||[]).filter(x=>type?x.type===type:isUnifiedActivityItem(x)).forEach(x=>all.push({...x,status:unifiedActivityStatus(x),_source:source}))};
  // FIRST: use activities already loaded elsewhere in this same QMS page.
  // This makes the Certificate Center usable even if a second CMS request is slow.
  add(typeof WEB_ACTIVITY_ITEMS!=='undefined'?WEB_ACTIVITY_ITEMS:[],'Activity Manager');
  // SECOND: refresh from the backend and merge the results.
  try{const rs=await Promise.all(['news-events.html','feedback.html','events.html'].map(page=>integratedCmsApi({action:'list-items',password:integratedCmsPassword(),page}).catch(()=>({items:[]}))));rs.forEach(r=>add(unifiedActivityDedupe(r.items||[]),'Activity Manager'))}catch(_){ }
  const seen=new Set();
  CERT_ACTIVITY_ITEMS=all.filter(x=>{const k=String(x.id||'')||((x.title||'')+'|'+(x.date||''));if(seen.has(k))return false;seen.add(k);return true});
  ['ctActivity','ciActivity'].forEach(id=>{const sel=document.getElementById(id);if(!sel)return;const keep=sel.value;sel.innerHTML='<option value="">Select an activity...</option>'+CERT_ACTIVITY_ITEMS.map(x=>`<option value="${integratedEscape(ctActivityKey(x))}">${integratedEscape(ctActivityLabel(x))} · ${integratedEscape(x._source)}</option>`).join('');if([...sel.options].some(o=>o.value===keep))sel.value=keep});
  const count=document.getElementById('certActivityCount');if(count)count.textContent=CERT_ACTIVITY_ITEMS.length?`${CERT_ACTIVITY_ITEMS.length} activities available`:'No activities found yet';
  const empty=document.getElementById('certActivityEmpty');if(empty)empty.style.display=CERT_ACTIVITY_ITEMS.length?'none':'block';
  return CERT_ACTIVITY_ITEMS;
}
async function ctLoad(){
  try{
    await ctLoadActivities();
    const r=await integratedCmsApi({action:'list-items',password:integratedCmsPassword(),page:'certificate-templates'});
    CERT_TEMPLATES=(r.items||[]).filter(x=>x.type==='Certificate Template');
    const list=document.getElementById('ctList'),sel=document.getElementById('ciTemplate');
    if(list)list.innerHTML=CERT_TEMPLATES.length?CERT_TEMPLATES.map(x=>{const d=ctParse(x);return `<div style="border:1px solid #d8e1e6;border-radius:10px;padding:10px;display:flex;justify-content:space-between;gap:10px;align-items:center"><div><strong>${integratedEscape(x.title)}</strong><div style="font-size:12px;color:#6a7c87">${integratedEscape(d.certType||'Certificate')} • ${integratedEscape(d.heading||'')} ${d.activityId?'• Linked to activity':''}</div></div><button class="admin-action-btn" type="button" onclick="ctEdit('${x.id}')">Edit</button></div>`}).join(''):'No saved activity certificate designs yet.';
    if(sel)sel.innerHTML='<option value="">Auto-select from Activity / Use Master</option>'+CERT_TEMPLATES.map(x=>`<option value="${x.id}">${integratedEscape(x.title)} — ${integratedEscape(ctParse(x).certType||'Certificate')}</option>`).join('');
  }catch(e){ctMsg(e.message)}
}
const CT_DEFAULT_LAYOUT={
 header:{x:50,y:10,w:58,h:5,fontSize:15,fontFamily:'Arial',color:'#08284a',align:'center',bold:true,italic:false,letterSpacing:0,lineHeight:1.2,opacity:100,rotate:0,z:2},logo1:{x:15,y:13,w:9,h:13,z:2,opacity:100},logo2:{x:85,y:13,w:9,h:13,z:2,opacity:100},
 heading:{x:50,y:30,w:60,h:8,fontSize:30,fontFamily:'Georgia',color:'#08284a',align:'center',bold:true,italic:false,letterSpacing:0,lineHeight:1.2,opacity:100,rotate:0,z:2},name:{x:50,y:46,w:62,h:9,fontSize:34,fontFamily:'Georgia',color:'#08284a',align:'center',bold:true,italic:false,letterSpacing:1,lineHeight:1.1,opacity:100,rotate:0,z:2},citation:{x:50,y:59,w:66,h:18,fontSize:13,fontFamily:'Arial',color:'#08284a',align:'center',bold:false,italic:false,letterSpacing:0,lineHeight:1.45,opacity:100,rotate:0,z:2},
 signature:{x:50,y:79,w:28,h:12,fontSize:12,fontFamily:'Arial',color:'#08284a',align:'center',bold:false,italic:false,letterSpacing:0,lineHeight:1.2,opacity:100,rotate:0,z:2},qr:{x:84,y:82,w:11,h:16,z:2,opacity:100},no:{x:18,y:92,w:28,h:5,fontSize:12,fontFamily:'Arial',color:'#08284a',align:'left',bold:true,italic:false,letterSpacing:0,lineHeight:1.2,opacity:100,rotate:0,z:2}
};
let CT_LAYOUT=JSON.parse(JSON.stringify(CT_DEFAULT_LAYOUT)),CT_SELECTED=null,CT_HISTORY=[],CT_FUTURE=[],CT_LOCAL_BG='';
const ctLabel=k=>({header:'HEADER',logo1:'SK LOGO',logo2:'BARANGAY LOGO',heading:'CERTIFICATE TITLE',name:'RECIPIENT NAME',citation:'CITATION / CONTENT',signature:'SIGNATURE BLOCK',qr:'QR CODE',no:'CERTIFICATE NUMBER'}[k]||'CUSTOM ELEMENT');
function ctSnapshot(){CT_HISTORY.push(JSON.stringify(CT_LAYOUT));if(CT_HISTORY.length>40)CT_HISTORY.shift();CT_FUTURE=[]}
function ctRestore(raw){try{CT_LAYOUT=JSON.parse(raw);ctBuildCustomElements();ctApplyLayout()}catch(_){}}
function ctUndo(){if(!CT_HISTORY.length)return;CT_FUTURE.push(JSON.stringify(CT_LAYOUT));ctRestore(CT_HISTORY.pop())}
function ctRedo(){if(!CT_FUTURE.length)return;CT_HISTORY.push(JSON.stringify(CT_LAYOUT));ctRestore(CT_FUTURE.pop())}
function ctBuildCustomElements(){const ed=document.getElementById('ctEditor');if(!ed)return;ed.querySelectorAll('[data-custom="1"]').forEach(e=>e.remove());Object.entries(CT_LAYOUT).forEach(([k,v])=>{if(!v.custom)return;const e=document.createElement('div');e.className='ct-edit-item';e.dataset.key=k;e.dataset.custom='1';if(v.type==='image'){e.innerHTML='<img style="width:100%;height:100%;object-fit:contain;pointer-events:none"><div class="ct-resize"></div>';e.querySelector('img').src=v.src||''}else if(v.type==='line'){e.innerHTML='<div style="width:100%;height:100%;border-top:3px solid currentColor"></div><div class="ct-resize"></div>'}else{e.append(document.createTextNode(v.text||'Double-click to edit text'));const h=document.createElement('div');h.className='ct-resize';e.append(h);e.addEventListener('dblclick',()=>{const t=prompt('Edit text:',v.text||'');if(t!==null){ctSnapshot();v.text=t;ctApplyLayout()}})}ed.append(e)});ctWireElements()}
function ctHiddenStatus(){const e=document.getElementById('ctHiddenStatus');if(!e)return;const hidden=Object.entries(CT_LAYOUT).filter(([k,v])=>v&&v.hidden).map(([k])=>ctLabel(k));e.textContent=hidden.length?'Hidden: '+hidden.join(', ')+' — use Restore Elements to bring them back.':'All certificate elements are currently visible.'}
function ctApplyLayout(){const ed=document.getElementById('ctEditor');if(!ed)return;Object.entries(CT_LAYOUT).forEach(([k,v])=>{const el=ed.querySelector(`[data-key="${k}"]`);if(!el)return;el.style.left=v.x+'%';el.style.top=v.y+'%';el.style.width=v.w+'%';el.style.height=v.h+'%';el.style.fontSize=(v.fontSize||12)+'px';el.style.textAlign=v.align||'center';el.style.fontWeight=v.bold?'700':'400';el.style.fontStyle=v.italic?'italic':'normal';el.style.fontFamily=v.fontFamily||'Arial';el.style.color=v.color||'#08284a';el.style.letterSpacing=(v.letterSpacing||0)+'px';el.style.lineHeight=v.lineHeight||1.2;el.style.opacity=(v.opacity??100)/100;el.style.transform=`translate(-50%,-50%) rotate(${v.rotate||0}deg)`;el.style.zIndex=v.z||2;el.style.display=v.hidden?'none':'';el.style.whiteSpace=v.wrap===false?'nowrap':'pre-wrap';el.style.overflowWrap=v.wrap===false?'normal':'normal';el.style.wordBreak='normal';const im=el.querySelector('img');if(im&&v.custom&&v.type==='image')im.src=v._previewSrc||v.src||''});const bg=CT_LOCAL_BG||document.getElementById('ctBg')?.value||'';ed.style.backgroundImage=bg?`url("${String(bg).replaceAll('"','%22')}")`:'';const setText=(k,t)=>{const e=ed.querySelector(`[data-key="${k}"]`);if(e&&e.childNodes[0])e.childNodes[0].nodeValue=t||''};setText('header',document.getElementById('ctHeaderText')?.value||'');setText('heading',document.getElementById('ctHeading')?.value||'Certificate');setText('citation',document.getElementById('ctCitation')?.value||'Certificate citation / content appears here.');const l1=ed.querySelector('[data-key="logo1"] img'),l2=ed.querySelector('[data-key="logo2"] img');if(l1)l1.src=document.getElementById('ctLogo1')?.value||'';if(l2)l2.src=document.getElementById('ctLogo2')?.value||'';const sn=ed.querySelector('.ct-sign-name'),sp=ed.querySelector('.ct-sign-pos'),si=ed.querySelector('[data-key="signature"] img');if(sn)sn.textContent=document.getElementById('ctSignatory')?.value||'';if(sp)sp.textContent=document.getElementById('ctSignatoryPosition')?.value||'';if(si){const u=document.getElementById('ctSignatureUrl')?.value||'';si.src=u;si.style.display=u?'block':'none'}ctSyncFormatBar();ctHiddenStatus()}
function ctSelectItem(el){document.querySelectorAll('#ctEditor .ct-edit-item').forEach(x=>x.classList.remove('ct-selected'));CT_SELECTED=el||null;if(el)el.classList.add('ct-selected');const n=document.getElementById('ctSelectedItem');if(n)n.textContent=el?`Editing ${ctLabel(el.dataset.key)} — drag, resize, or use the formatting toolbar.`:'Select any certificate element above, then drag or resize it.';ctSyncFormatBar()}
function ctWireElements(){const ed=document.getElementById('ctEditor');if(!ed)return;ed.querySelectorAll('.ct-edit-item').forEach(el=>{if(el.dataset.wired)return;el.dataset.wired='1';el.addEventListener('pointerdown',e=>{if(e.target.classList.contains('ct-resize'))return;ctSelectItem(el);e.preventDefault();ctSnapshot();const r=ed.getBoundingClientRect(),startX=e.clientX,startY=e.clientY,v=CT_LAYOUT[el.dataset.key],sx=v.x,sy=v.y;el.setPointerCapture(e.pointerId);const move=ev=>{v.x=Math.max(0,Math.min(100,sx+(ev.clientX-startX)/r.width*100));v.y=Math.max(0,Math.min(100,sy+(ev.clientY-startY)/r.height*100));ctApplyLayout()};const up=()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up)};el.addEventListener('pointermove',move);el.addEventListener('pointerup',up)});const h=el.querySelector('.ct-resize');h?.addEventListener('pointerdown',e=>{ctSelectItem(el);e.stopPropagation();e.preventDefault();ctSnapshot();const r=ed.getBoundingClientRect(),v=CT_LAYOUT[el.dataset.key],startX=e.clientX,startY=e.clientY,sw=v.w,sh=v.h,sf=v.fontSize||12;h.setPointerCapture(e.pointerId);const move=ev=>{const dx=(ev.clientX-startX)/r.width*100,dy=(ev.clientY-startY)/r.height*100;v.w=Math.max(2,Math.min(95,sw+dx*2));v.h=Math.max(1,Math.min(80,sh+dy*2));if(!['qr','logo1','logo2'].includes(el.dataset.key)&&v.type!=='image')v.fontSize=Math.max(6,Math.min(120,sf+dx*r.width/100*.7));ctApplyLayout()};const up=()=>{h.removeEventListener('pointermove',move);h.removeEventListener('pointerup',up)};h.addEventListener('pointermove',move);h.addEventListener('pointerup',up)})})}
function ctInitVisualEditor(){const ed=document.getElementById('ctEditor');if(!ed)return;ctBuildCustomElements();ctWireElements();if(!ed.dataset.stagewired){ed.dataset.stagewired='1';ed.addEventListener('pointerdown',e=>{if(e.target===ed)ctSelectItem(null)})}ctApplyLayout()}
function ctSyncFormatBar(){if(!CT_SELECTED)return;const v=CT_LAYOUT[CT_SELECTED.dataset.key]||{};const set=(id,val)=>{const e=document.getElementById(id);if(e&&val!==undefined)e.value=val};set('ctFontFamily',v.fontFamily||'Arial');set('ctFontSize',v.fontSize||12);set('ctTextColor',v.color||'#08284a');set('ctOpacity',v.opacity??100);set('ctAlign',v.align||'center');set('ctLetterSpacing',v.letterSpacing||0);set('ctLineHeight',v.lineHeight||1.2);set('ctRotate',v.rotate||0)}
function ctFormat(prop,val){if(!CT_SELECTED)return;ctSnapshot();const v=CT_LAYOUT[CT_SELECTED.dataset.key];v[prop]=val;ctApplyLayout()}
function ctNewKey(){return 'custom_'+Date.now()+'_'+Math.random().toString(36).slice(2,6)}
function ctAddCustom(type,data={}){ctSnapshot();const k=ctNewKey();CT_LAYOUT[k]={custom:true,type,x:50,y:50,w:type==='line'?30:25,h:type==='line'?2:8,fontSize:20,fontFamily:'Arial',color:'#08284a',align:'center',bold:false,italic:false,letterSpacing:0,lineHeight:1.2,opacity:100,rotate:0,z:5,...data};ctBuildCustomElements();ctSelectItem(document.querySelector(`#ctEditor [data-key="${k}"]`));ctApplyLayout()}
function ctSetLocalBackground(file){if(!file)return;if(CT_LOCAL_BG&&CT_LOCAL_BG.startsWith('blob:'))URL.revokeObjectURL(CT_LOCAL_BG);CT_LOCAL_BG=URL.createObjectURL(file);ctApplyLayout();ctMsg('Background preview loaded. You can move/resize elements without losing it. Click Upload Design, then Save Activity Certificate.')}
window.ctEdit=id=>{const x=CERT_TEMPLATES.find(v=>v.id===id);if(!x)return;CT_LOCAL_BG='';const d=ctParse(x);CT_EDIT=id;const a=document.getElementById('ctActivity');a.value=d.activityId||'';document.getElementById('ctCustomActivity').value=d.activityId?'':(x.title||'');document.getElementById('ctType').value=d.certType||'Participation';document.getElementById('ctHeading').value=d.heading||'';document.getElementById('ctCitation').value=d.citation||'';document.getElementById('ctCanva').value=x.linkUrl||'';document.getElementById('ctBg').value=x.mediaUrl||'';document.getElementById('ctHeaderText').value=d.headerText||'SANGGUNIANG KABATAAN OF BARANGAY SAPILANG';document.getElementById('ctLogo1').value=d.logo1||'images/sk-logo.svg';document.getElementById('ctLogo2').value=d.logo2||'images/barangay-logo.svg';document.getElementById('ctSignatory').value=d.signatory||'DANDY F. NILLO';document.getElementById('ctSignatoryPosition').value=d.signatoryPosition||'SK Chairperson';document.getElementById('ctSignatureUrl').value=d.signatureUrl||'';CT_LAYOUT=d.layout?{...JSON.parse(JSON.stringify(CT_DEFAULT_LAYOUT)),...JSON.parse(JSON.stringify(d.layout))}:JSON.parse(JSON.stringify(CT_DEFAULT_LAYOUT));CT_HISTORY=[];CT_FUTURE=[];ctInitVisualEditor();ctApplyLayout();ctMsg('Editing '+x.title+' — '+(d.certType||'Certificate')+'. Canva-style editor is ready below.')}
function ctClear(){CT_EDIT='';CT_LOCAL_BG='';CT_LAYOUT=JSON.parse(JSON.stringify(CT_DEFAULT_LAYOUT));CT_HISTORY=[];CT_FUTURE=[];['ctCitation','ctCanva','ctBg','ctCustomActivity'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});document.getElementById('ctActivity').value='';document.getElementById('ctType').value='Participation';document.getElementById('ctHeading').value='Certificate of Participation';document.getElementById('ctHeaderText').value='SANGGUNIANG KABATAAN OF BARANGAY SAPILANG';document.getElementById('ctLogo1').value='images/sk-logo.svg';document.getElementById('ctLogo2').value='images/barangay-logo.svg';document.getElementById('ctSignatory').value='DANDY F. NILLO';document.getElementById('ctSignatoryPosition').value='SK Chairperson';document.getElementById('ctSignatureUrl').value='';const f=document.getElementById('ctFile');if(f)f.value='';ctBuildCustomElements();ctApplyLayout();ctMsg('Ready. Select the activity this certificate belongs to.')}
document.getElementById('ctNew')?.addEventListener('click',ctClear);document.getElementById('ctFile')?.addEventListener('change',e=>ctSetLocalBackground(e.target.files?.[0]));['ctHeading','ctCitation','ctHeaderText','ctLogo1','ctLogo2','ctSignatory','ctSignatoryPosition','ctSignatureUrl'].forEach(id=>document.getElementById(id)?.addEventListener('input',ctApplyLayout));document.querySelectorAll('[data-ct-select]').forEach(b=>b.addEventListener('click',()=>{const e=document.querySelector(`#ctEditor [data-key="${b.dataset.ctSelect}"]`);if(e){ctSelectItem(e);e.scrollIntoView({block:'nearest'})}}));
async function ctUploadCoreAsset(file,inputId,label){if(!file)return;const input=document.getElementById(inputId);const data=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(file)});if(input){input.value=data;ctApplyLayout()}ctMsg(label+' preview loaded. Uploading permanent copy...');const x=await integratedAdminPost({action:'upload-certificate-background',password:integratedCmsPassword(),name:file.name,data});if(input)input.value=x.url||data;ctApplyLayout();ctMsg(label+' uploaded. It will remain linked after you Save Activity Certificate.')}[['ctUploadLogo1','ctLogo1File','ctLogo1','SK logo'],['ctUploadLogo2','ctLogo2File','ctLogo2','Barangay logo'],['ctUploadSignature','ctSignatureFile','ctSignatureUrl','E-signature']].forEach(([b,f,i,l])=>{document.getElementById(b)?.addEventListener('click',()=>document.getElementById(f)?.click());document.getElementById(f)?.addEventListener('change',async e=>{try{await ctUploadCoreAsset(e.target.files?.[0],i,l)}catch(err){ctMsg(l+' upload failed: '+err.message)}e.target.value=''})});
document.getElementById('ctUndo')?.addEventListener('click',ctUndo);document.getElementById('ctRedo')?.addEventListener('click',ctRedo);document.getElementById('ctAddText')?.addEventListener('click',()=>ctAddCustom('text',{text:'New text'}));document.getElementById('ctAddLine')?.addEventListener('click',()=>ctAddCustom('line',{color:'#08284a'}));document.getElementById('ctAddImage')?.addEventListener('click',()=>document.getElementById('ctAssetFile')?.click());document.getElementById('ctAssetFile')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;let data='';try{data=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)});ctAddCustom('image',{src:'',_previewSrc:data,w:15,h:15});const key=CT_SELECTED?.dataset.key;ctMsg('Image visible. Uploading a permanent copy...');const x=await integratedAdminPost({action:'upload-certificate-background',password:integratedCmsPassword(),name:f.name,data});if(key&&CT_LAYOUT[key]){CT_LAYOUT[key].src=x.url||'';CT_LAYOUT[key]._previewSrc=data;ctApplyLayout()}ctMsg('Image added and saved for this design. Drag or resize it anywhere, then Save Activity Certificate.')}catch(err){ctMsg('Image preview added, but permanent upload failed: '+err.message)}e.target.value=''});
document.getElementById('ctDuplicate')?.addEventListener('click',()=>{if(!CT_SELECTED)return;const v=JSON.parse(JSON.stringify(CT_LAYOUT[CT_SELECTED.dataset.key]));v.custom=true;v.x=Math.min(95,v.x+3);v.y=Math.min(95,v.y+3);ctAddCustom(v.type||'text',v)});document.getElementById('ctHide')?.addEventListener('click',()=>{if(!CT_SELECTED)return ctMsg('Select an element first.');const k=CT_SELECTED.dataset.key;if(k==='qr'||k==='no')return ctMsg('QR Code and Certificate Number are protected verification fields and stay on every issued certificate.');ctSnapshot();CT_LAYOUT[k].hidden=true;CT_SELECTED=null;ctApplyLayout();ctMsg(ctLabel(k)+' hidden from this certificate design. Save Activity Certificate to keep this choice.')});document.getElementById('ctDelete')?.addEventListener('click',()=>{if(!CT_SELECTED)return ctMsg('Select a custom element first.');const k=CT_SELECTED.dataset.key;if(!CT_LAYOUT[k]?.custom)return ctMsg('Built-in elements use Hide from Certificate so they can be restored later. QR Code and Certificate Number are protected.');ctSnapshot();delete CT_LAYOUT[k];CT_SELECTED=null;ctBuildCustomElements();ctApplyLayout();ctMsg('Custom element deleted. Save Activity Certificate to keep the change.')});document.getElementById('ctBlankMode')?.addEventListener('click',()=>{ctSnapshot();['header','logo1','logo2','heading','citation','signature'].forEach(k=>{if(CT_LAYOUT[k])CT_LAYOUT[k].hidden=true});['name','qr','no'].forEach(k=>{if(CT_LAYOUT[k])CT_LAYOUT[k].hidden=false});CT_SELECTED=null;ctApplyLayout();ctMsg('Blank Design Mode enabled: your uploaded background + Participant Name + QR Code + Certificate Number. Save Activity Certificate to keep it.')});document.getElementById('ctRestoreElements')?.addEventListener('click',()=>{ctSnapshot();Object.values(CT_LAYOUT).forEach(v=>{if(v)v.hidden=false});ctApplyLayout();ctMsg('All hidden elements restored. You can hide individual elements again if needed.')});document.getElementById('ctForward')?.addEventListener('click',()=>{if(CT_SELECTED)ctFormat('z',(CT_LAYOUT[CT_SELECTED.dataset.key].z||2)+1)});document.getElementById('ctBackward')?.addEventListener('click',()=>{if(CT_SELECTED)ctFormat('z',Math.max(1,(CT_LAYOUT[CT_SELECTED.dataset.key].z||2)-1))});
[['ctFontFamily','fontFamily',String],['ctFontSize','fontSize',Number],['ctTextColor','color',String],['ctOpacity','opacity',Number],['ctAlign','align',String],['ctLetterSpacing','letterSpacing',Number],['ctLineHeight','lineHeight',Number],['ctRotate','rotate',Number]].forEach(([id,p,cast])=>document.getElementById(id)?.addEventListener('change',e=>ctFormat(p,cast(e.target.value))));document.getElementById('ctBold')?.addEventListener('click',()=>{if(CT_SELECTED)ctFormat('bold',!CT_LAYOUT[CT_SELECTED.dataset.key].bold)});document.getElementById('ctItalic')?.addEventListener('click',()=>{if(CT_SELECTED)ctFormat('italic',!CT_LAYOUT[CT_SELECTED.dataset.key].italic)});document.getElementById('ctWrap')?.addEventListener('click',()=>{if(!CT_SELECTED)return;const v=CT_LAYOUT[CT_SELECTED.dataset.key];ctFormat('wrap',v.wrap===false?true:false);ctMsg(CT_LAYOUT[CT_SELECTED.dataset.key].wrap===false?'Text wrapping OFF — stays on one line.':'Text wrapping ON — make the box narrower to place the next word on the line below.')});document.getElementById('ctNewLine')?.addEventListener('click',()=>{if(!CT_SELECTED)return;const k=CT_SELECTED.dataset.key,v=CT_LAYOUT[k];ctSnapshot();if(v.custom&&v.type==='text'){v.text=(v.text||'')+'\nNew line';ctBuildCustomElements();ctSelectItem(document.querySelector(`#ctEditor [data-key="${k}"]`));ctApplyLayout();return}const map={header:'ctHeaderText',heading:'ctHeading',citation:'ctCitation'};const id=map[k];if(id){const f=document.getElementById(id);f.value=(f.value||'')+'\n';ctApplyLayout();f.focus();ctMsg('Line break added. Type the next words on the new line.')}else{v.wrap=true;ctApplyLayout();ctMsg('Wrapping enabled. Resize this text box narrower and words will continue on the next line automatically.')}});
document.getElementById('ctResetLayout')?.addEventListener('click',()=>{ctSnapshot();CT_LAYOUT=JSON.parse(JSON.stringify(CT_DEFAULT_LAYOUT));ctBuildCustomElements();ctApplyLayout();ctMsg('Layout reset. Click Save Activity Certificate to keep it.')});document.getElementById('ctPreviewFull')?.addEventListener('click',()=>{const ed=document.getElementById('ctEditor'),wrap=document.getElementById('ctEditorWrap');if(!ed||!wrap)return;const large=ed.dataset.large==='1';ed.dataset.large=large?'0':'1';ed.style.width=large?'min(100%,1000px)':'1120px';wrap.scrollIntoView({behavior:'smooth',block:'center'});document.getElementById('ctPreviewFull').textContent=large?'Enlarge Preview':'Fit Preview'});setTimeout(()=>{ctInitVisualEditor();ctApplyLayout()},50);
document.getElementById('ctUpload')?.addEventListener('click',async()=>{const f=document.getElementById('ctFile').files[0];if(!f)return ctMsg('Choose the Canva PNG/JPG first.');try{ctMsg('Uploading activity certificate design...');const data=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)}),x=await integratedAdminPost({action:'upload-certificate-background',password:integratedCmsPassword(),name:f.name,data});document.getElementById('ctBg').value=x.url||'';ctApplyLayout();ctMsg('Design uploaded. Your preview will stay visible while editing. Click Save Activity Certificate.')}catch(e){ctMsg(e.message)}});
document.getElementById('ctSave')?.addEventListener('click',async()=>{const activityId=document.getElementById('ctActivity').value,linked=CERT_ACTIVITY_ITEMS.find(x=>x.id===activityId),custom=document.getElementById('ctCustomActivity').value.trim(),activity=linked?.title||custom,type=document.getElementById('ctType').value;if(!activity)return ctMsg('Select the activity this certificate belongs to, or enter a Custom Activity.');try{await integratedCmsApi({action:'save-item',password:integratedCmsPassword(),id:CT_EDIT,page:'certificate-templates',itemType:'Certificate Template',title:activity,description:JSON.stringify({activityId:linked?.id||'',activitySource:linked?._source||'Custom',activityDate:linked?.date||'',certType:type,heading:document.getElementById('ctHeading').value.trim(),citation:document.getElementById('ctCitation').value.trim(),headerText:document.getElementById('ctHeaderText').value.trim(),logo1:document.getElementById('ctLogo1').value.trim(),logo2:document.getElementById('ctLogo2').value.trim(),signatory:document.getElementById('ctSignatory').value.trim(),signatoryPosition:document.getElementById('ctSignatoryPosition').value.trim(),signatureUrl:document.getElementById('ctSignatureUrl').value.trim(),layout:JSON.parse(JSON.stringify(CT_LAYOUT,(k,v)=>k==='_previewSrc'?undefined:v))}),status:'ACTIVE',mediaUrl:document.getElementById('ctBg').value.trim(),linkUrl:document.getElementById('ctCanva').value.trim()});ctMsg('Saved and linked to '+activity+'.');CT_EDIT='';await ctLoad()}catch(e){ctMsg(e.message)}});
function ciApplyActivity(activityId){
  const activity=CERT_ACTIVITY_ITEMS.find(x=>x.id===activityId);if(!activity)return;
  const matches=CERT_TEMPLATES.filter(t=>{const d=ctParse(t);return d.activityId===activityId || (!d.activityId && String(t.title||'').toLowerCase()===String(activity.title||'').toLowerCase())});
  const t=matches[0];
  if(t){const d=ctParse(t);document.getElementById('ciTemplate').value=t.id;document.getElementById('ciType').value=d.certType||'Participation';document.getElementById('ciCitation').value=d.citation||''}
  else{document.getElementById('ciTemplate').value='';document.getElementById('ciCitation').value=''}
  if(activity.date)document.getElementById('ciDate').value=String(activity.date).slice(0,10);
  const msg=document.getElementById('ciMsg');if(msg)msg.textContent=t?'Activity linked. Its saved certificate design and content were selected automatically.':'Activity selected. No special design is saved yet, so the Master Certificate will be used.';
}
document.getElementById('ciActivity')?.addEventListener('change',e=>ciApplyActivity(e.target.value));
document.getElementById('ciTemplate')?.addEventListener('change',e=>{const x=CERT_TEMPLATES.find(v=>v.id===e.target.value);if(!x)return;const d=ctParse(x);if(d.activityId && [...document.getElementById('ciActivity').options].some(o=>o.value===d.activityId))document.getElementById('ciActivity').value=d.activityId;document.getElementById('ciType').value=d.certType||'Participation';document.getElementById('ciCitation').value=d.citation||'';if(d.activityDate)document.getElementById('ciDate').value=String(d.activityDate).slice(0,10)});
document.getElementById('ciIssue')?.addEventListener('click',async()=>{const msg=document.getElementById('ciMsg'),name=document.getElementById('ciName').value.trim(),activityId=document.getElementById('ciActivity').value,activityObj=CERT_ACTIVITY_ITEMS.find(x=>x.id===activityId),template=CERT_TEMPLATES.find(x=>x.id===document.getElementById('ciTemplate').value),activity=activityObj?.title||template?.title||'';if(!name||!activity){msg.textContent='Recipient and linked activity are required.';return}msg.textContent='Issuing unique certificate...';try{const x=await integratedAdminPost({action:'admin-issue-certificate',password:integratedCmsPassword(),participant:name,recipientType:document.getElementById('ciRecipientType').value,certificateType:document.getElementById('ciType').value,activity,activityId,activitySource:activityObj?._source||'',date:document.getElementById('ciDate').value,citation:document.getElementById('ciCitation').value.trim(),certificatePreference:document.getElementById('ciDelivery').value,email:document.getElementById('ciEmail').value.trim(),templateId:document.getElementById('ciTemplate').value});msg.innerHTML=`Issued successfully: <strong>${integratedEscape(x.certificateId||'')}</strong> — <a href="certificate.html?id=${encodeURIComponent(x.certificateId)}" target="_blank">Open Certificate</a>`;document.getElementById('integratedCertificateRefresh')?.click()}catch(e){msg.textContent=e.message}});
document.getElementById('certReloadActivities')?.addEventListener('click',async()=>{ctMsg('Refreshing activities...');await ctLoadActivities();ctMsg(CERT_ACTIVITY_ITEMS.length?`${CERT_ACTIVITY_ITEMS.length} activities loaded. Choose one below.`:'No activities were returned. Add an activity in Manage Activities, then click Refresh Activities.')});
function certCenterShow(panel){
 document.querySelectorAll('[data-cert-panel]').forEach(x=>x.style.display=x.dataset.certPanel===panel?'block':'none');
 document.querySelectorAll('[data-cert-nav]').forEach(x=>x.classList.toggle('primary',x.dataset.certNav===panel));
 try{localStorage.setItem('skCertCenterPanel',panel)}catch(_){}
 if(panel==='designs')ctLoad();
 if(panel==='issue')ctLoadActivities();
}
document.querySelectorAll('[data-cert-nav]').forEach(b=>b.addEventListener('click',()=>certCenterShow(b.dataset.certNav)));
// FAST START: restore the last Certificate Center panel immediately. certCenterShow() loads only what that panel needs.
(()=>{let p='designs';try{p=localStorage.getItem('skCertCenterPanel')||'designs'}catch(_){}certCenterShow(p)})();

/* Certificate & feedback delivery tracker */
async function integratedLoadCertificateTracker(){
 const body=document.getElementById('integratedCertificateRows');if(!body)return;
 body.innerHTML='<tr><td colspan="8">Loading delivery records...</td></tr>';
 try{
  const r=await integratedCmsApi({action:'certificate-list',password:integratedCmsPassword()});
  const items=r.certificates||[];
  body.innerHTML=items.length?items.map(c=>`<tr data-cert-track="${integratedEscape(c.certificateId||'')}"><td><strong>${integratedEscape(c.certificateId||'')}</strong><br><small>${integratedEscape(c.qmsReference||'')}</small></td><td>${integratedEscape(c.participant||'')}<br><small>${integratedEscape(c.email||'No email')}</small></td><td>${integratedEscape(c.activity||'')}</td><td>${integratedEscape(c.deliveryPreference||'')}<br><small>Certificate email: ${integratedEscape(c.emailStatus||'')}</small></td><td>${integratedEscape(c.responseEmailStatus||'Not linked / manual issue')}</td><td>${integratedEscape(c.printStatus||'')}</td><td>${integratedEscape(c.status||'')}</td><td><a class="admin-action-btn" target="_blank" href="certificate.html?id=${encodeURIComponent(c.certificateId||'')}">Open</a>${c.email?` <button class="admin-action-btn" type="button" onclick="integratedResendCert('${String(c.certificateId||'').replaceAll("'",'')}')">Resend</button>`:''}</td></tr>`).join(''):'<tr><td colspan="8">No certificate records yet.</td></tr>';
 }catch(e){body.innerHTML=`<tr><td colspan="8">${integratedEscape(e.message)}</td></tr>`}
}
window.integratedResendCert=async id=>{try{await integratedAdminPost({action:'resend-certificate',password:integratedCmsPassword(),certificateId:id});await integratedLoadCertificateTracker()}catch(e){alert(e.message)}};
document.getElementById('integratedCertificateRefresh')?.addEventListener('click',integratedLoadCertificateTracker);
document.getElementById('integratedCertificateSearch')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('#integratedCertificateRows tr').forEach(r=>r.style.display=!q||r.textContent.toLowerCase().includes(q)?'':'none')});
