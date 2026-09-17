const CMS_SHEET_NAME = 'WEBSITE_CONTENT';
const CMS_ITEMS_SHEET = 'WEBSITE_ITEMS';

function cmsSpreadsheet_(){
  const active=SpreadsheetApp.getActiveSpreadsheet();
  if(active)return active;
  const raw=String(PropertiesService.getScriptProperties().getProperty('CMS_SPREADSHEET_ID')||'').trim();
  const match=raw.match(/[-\w]{25,}/);
  if(!match)throw new Error('CMS spreadsheet is not configured. Run setupWebsiteCMS once.');
  return SpreadsheetApp.openById(match[0]);
}

function setupWebsiteCMS() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CMS_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CMS_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID','PAGE','SELECTOR','PROPERTY','VALUE','UPDATED_AT']);
    sheet.setFrozenRows(1);
  }
  let items=ss.getSheetByName(CMS_ITEMS_SHEET);
  if(!items) items=ss.insertSheet(CMS_ITEMS_SHEET);
  if(items.getLastRow()===0){
    items.appendRow(['ID','PAGE','TYPE','TITLE','DESCRIPTION','STATUS','EVENT_DATE','MEDIA_URL','LINK_URL','UPDATED_AT','VENUE','RESOURCE_SPEAKER']);
    items.setFrozenRows(1);
  }
  if(items.getLastColumn()<12){items.getRange(1,11,1,2).setValues([['VENUE','RESOURCE_SPEAKER']]);}
  PropertiesService.getScriptProperties().setProperty('CMS_SPREADSHEET_ID', ss.getId());
  cmsVisitorSheet_();
  cmsGadSheet_();
  qmsActivitySheet_();
  qmsSuggestionSheet_();
  cmsCertificatesSheet_();
  qmsRecycleSheet_();
  cmsCertificateSettingsSheet_();
}

function setWebsiteCMSPassword() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Set SK Website Administrator Password',
    'Enter the private password that you will use for the CMS and QMS administrator page:',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return;
  const password = response.getResponseText().trim();
  if (password.length < 8) {
    ui.alert('Password not saved. Use at least 8 characters.');
    return;
  }
  PropertiesService.getScriptProperties().setProperty('CMS_ADMIN_PASSWORD', password);
  ui.alert('Administrator password saved successfully.');
}

function doGet(e) {
  try {
    const p=e.parameter||{};
    const action=String(p.action||'public');
    let result;
    if(action==='public') result={success:true,changes:cmsList_(String(p.page||'')),items:cmsItems_(String(p.page||''))};
    else if(action==='visitor-status') result=cmsVisitorStatus_(String(p.reference||''));
    else if(action==='verify-certificate') result=cmsVerifyCertificate_(String(p.id||''));
    else if(action==='certificate-settings') result=cmsCertificateSettings_();
    else {
      if(!cmsAuthorized_(p.password)) throw new Error('Incorrect administrator password.');
      if(action==='login') result={success:true};
      else if(action==='qms-dashboard') result=cmsQmsDashboard_();
      else if(action==='certificate-list') result=cmsCertificateList_();
      else if(action==='list') result={success:true,changes:cmsList_(String(p.page||''))};
      else if(action==='save') result=cmsSave_(p);
      else if(action==='delete') result=cmsDelete_(String(p.id||''));
      else if(action==='list-items') result={success:true,items:cmsItems_(String(p.page||''))};
      else if(action==='save-item') result=cmsSaveItem_(p);
      else if(action==='delete-item') result=cmsDeleteItem_(String(p.id||''));
      else if(action==='certificate-settings') result=cmsCertificateSettings_();
      else if(action==='recycle-list') result=qmsRecycleList_();
      else if(action==='qms-backup') result=qmsBackupToDrive_();
      else throw new Error('Invalid request.');
    }
    return cmsJsonp_(result,p.callback);
  } catch (error) { return cmsJsonp_({success:false,message:error.message},(e.parameter||{}).callback); }
}

function doPost(e) {
  try {
    const p=e.parameter||{};
    if(p.type==='activity') return cmsJson_(qmsSaveActivity_(p,e.parameters||{}));
    if(p.type==='client') return cmsJson_(qmsSaveClient_(p));
    if(p.type==='suggestion') return cmsJson_(qmsSaveSuggestion_(p));
    if(p.type==='admin-update-suggestion') return cmsJson_(qmsUpdateSuggestion_(p));
    if(p.type==='admin-update-certificate') return cmsJson_(cmsUpdateCertificateStatus_(p));
    if(p.action==='visitor-log') return cmsVisitorLog_(p,e.parameters||{});
    if(p.action==='gad-profile-log') return cmsGadProfileLog_(p,e.parameters||{});
    if(p.action==='issue-certificate') return cmsJson_(cmsIssueCertificate_(p));
    if(!cmsAuthorized_(p.password)) throw new Error('Incorrect administrator password.');
    if(p.action==='admin-issue-certificate') return cmsJson_(cmsIssueCertificate_(p));
    if(p.action==='upload-frame') return cmsUploadFrame_(p);
    if(p.action==='upload-certificate-background') return cmsJson_(cmsUpload_(p));
    let result;
    if(p.action==='login') result={success:true};
    else if(p.action==='qms-dashboard') result=cmsQmsDashboard_();
    else if(p.action==='certificate-list') result=cmsCertificateList_();
    else if(p.action==='list') result={success:true,changes:cmsList_(String(p.page||''))};
    else if(p.action==='save') result=cmsSave_(p);
    else if(p.action==='delete') result=cmsDelete_(String(p.id||''));
    else if(p.action==='list-items') result={success:true,items:cmsItems_(String(p.page||''))};
    else if(p.action==='save-item') result=cmsSaveItem_(p);
    else if(p.action==='delete-item') result=cmsDeleteItem_(String(p.id||''));
    else if(p.action==='certificate-settings') result=cmsCertificateSettings_();
    else if(p.action==='save-certificate-settings') result=cmsSaveCertificateSettings_(p);
    else if(p.action==='qms-delete-record') result=qmsMoveToRecycle_(String(p.recordType||''),String(p.reference||''));
    else if(p.action==='recycle-list') result=qmsRecycleList_();
    else if(p.action==='recycle-restore') result=qmsRestore_(String(p.reference||''));
    else if(p.action==='qms-backup') result=qmsBackupToDrive_();
    else if(p.action==='resend-certificate') result=qmsResendCertificate_(String(p.certificateId||''));
    else throw new Error('Invalid request.');
    return p.transport==='frame'?cmsFrame_(result,p.requestId):cmsJson_(result);
  } catch(error) {
    const p=e.parameter||{};
    const result={success:false,message:error.message};
    return p.transport==='frame'?cmsFrame_(result,p.requestId):cmsJson_(result);
  }
}

function cmsUploadFrame_(p){
  try{
    const result=cmsUpload_(p);
    return cmsHtmlFrame_('<script>parent.postMessage('+JSON.stringify({source:'sk-cms-upload',success:true,url:result.url})+',"*");</script>');
  }catch(error){
    return cmsHtmlFrame_('<script>parent.postMessage('+JSON.stringify({source:'sk-cms-upload',success:false,message:error.message})+',"*");</script>');
  }
}

function cmsFrame_(result,requestId){
  const message={source:'sk-cms-response',requestId:String(requestId||''),data:result};
  return cmsHtmlFrame_('<script>parent.postMessage('+JSON.stringify(message)+',"*");</script>');
}

function cmsHtmlFrame_(html){
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function cmsUpload_(p){
  const match=String(p.data||'').match(/^data:([^;]+);base64,(.+)$/);
  if(!match) throw new Error('Invalid image file.');
  const bytes=Utilities.base64Decode(match[2]);
  if(bytes.length>10*1024*1024) throw new Error('File must be 10 MB or smaller.');
  const props=PropertiesService.getScriptProperties();
  let folderId=props.getProperty('CMS_IMAGE_FOLDER_ID');
  let folder;
  if(folderId){folder=DriveApp.getFolderById(folderId)}else{folder=DriveApp.createFolder('SK Sapilang Website Images');props.setProperty('CMS_IMAGE_FOLDER_ID',folder.getId())}
  const safeName=String(p.name||'website-image').replace(/[^a-zA-Z0-9._-]/g,'-');
  const file=folder.createFile(Utilities.newBlob(bytes,match[1],Date.now()+'-'+safeName));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  const isImage=match[1].indexOf('image/')===0;
  return {success:true,url:isImage?'https://drive.google.com/uc?export=view&id='+file.getId():'https://drive.google.com/file/d/'+file.getId()+'/view',mimeType:match[1]};
}

function cmsItemsSheet_(){
  const sheet=cmsSpreadsheet_().getSheetByName(CMS_ITEMS_SHEET);
  if(!sheet) throw new Error('Run setupWebsiteCMS again to create WEBSITE_ITEMS.');
  return sheet;
}

function cmsItems_(page){
  const values=cmsItemsSheet_().getDataRange().getDisplayValues();
  return values.slice(1).filter(r=>!page||r[1]===page).map(r=>({id:r[0],page:r[1],type:r[2],title:r[3],description:r[4],status:r[5],date:r[6],mediaUrl:r[7],linkUrl:r[8],updatedAt:r[9],venue:r[10],speaker:r[11]}));
}

function cmsSaveItem_(p){
  const sheet=cmsItemsSheet_();
  const id=String(p.id||Utilities.getUuid());
  const row=[id,String(p.page||''),String(p.itemType||'content'),String(p.title||''),String(p.description||''),String(p.status||''),String(p.eventDate||''),String(p.mediaUrl||''),String(p.linkUrl||''),new Date(),String(p.venue||''),String(p.speaker||'')];
  if(!row[1]||!row[3]) throw new Error('Page and title are required.');
  const ids=sheet.getRange(2,1,Math.max(sheet.getLastRow()-1,1),1).getDisplayValues().flat();
  const index=ids.indexOf(id);
  if(index>=0) sheet.getRange(index+2,1,1,row.length).setValues([row]); else sheet.appendRow(row);
  return {success:true,id:id};
}

function cmsVisitorLog_(p,parameters){
  if(String(p.consent||'')!=='yes') return cmsHtmlFrame_('<script>parent.postMessage({source:"sk-visitor-log",success:false,message:"Consent is required."},"*");</script>');
  const sheet=cmsVisitorSheet_();
  const suppliedReference=String(p.clientReference||'');
  const reference=/^VIS-[A-Z0-9-]{8,40}$/.test(suppliedReference)?suppliedReference:'VIS-'+Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Manila','yyyyMMdd-HHmmss');
  sheet.appendRow([
    new Date(),reference,String(p.name||''),String(p.age||''),String(p.birthdate||''),
    String(p.address||''),String(p.contact||''),String(p.office||''),String(p.position||''),
    String(p.clientType||''),String(p.purpose||''),String(p.service||''),String(p.date||''),
    String(p.rating||''),String(p.comments||''),'YES'
  ]);
  const sectors=(parameters.sectorClassification||[]).map(String).join(' | ');
  cmsGadSheet_().appendRow([
    new Date(),reference,'Visitor Logbook / Service Feedback',String(p.sexAssignedAtBirth||''),
    String(p.sexAssignedAtBirthOther||''),String(p.genderIdentity||''),String(p.genderIdentityOther||''),
    String(p.preferredPronouns||''),String(p.preferredPronounsOther||''),String(p.office||''),
    String(p.position||''),sectors,String(p.sectorClassificationOther||'')
  ]);
  return cmsHtmlFrame_('<script>parent.postMessage('+JSON.stringify({source:'sk-visitor-log',success:true,reference:reference})+',"*");</script>');
}

function cmsVisitorStatus_(reference){
  if(!/^VIS-[A-Z0-9-]{8,40}$/.test(reference)) return {success:true,found:false};
  const sheet=cmsVisitorSheet_();
  if(sheet.getLastRow()<2) return {success:true,found:false};
  const references=sheet.getRange(2,2,sheet.getLastRow()-1,1).getDisplayValues().flat();
  return {success:true,found:references.indexOf(reference)>=0,reference:reference};
}

function cmsQualityLabel_(score){
  score=Number(score)||0;
  if(score>=4.5)return 'Excellent';
  if(score>=3.5)return 'Very Good';
  if(score>=2.5)return 'Satisfactory';
  if(score>=1.5)return 'Needs Improvement';
  return score?'Poor':'No ratings yet';
}

function qmsRef_(prefix){
  return prefix+'-'+Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Manila','yyyyMMdd-HHmmss')+'-'+Utilities.getUuid().slice(0,6).toUpperCase();
}
function qmsActivitySheet_(){
  const headers=['TIMESTAMP','REFERENCE','ACTIVITY','ACTIVITY_TYPE','DATE','VENUE','PARTICIPANT','CLASSIFICATION','SPEAKER','RATING','RELEVANCE','OBJECTIVES','FACILITATOR_RATING','ORGANIZATION','VENUE_RATING','MATERIALS','TIME_MANAGEMENT','ENGAGEMENT','SPEAKER_KNOWLEDGE','SPEAKER_CLARITY','SPEAKER_ENGAGEMENT','SPEAKER_RESPONSIVENESS','SPEAKER_COMMENTS','LEARNING','LIKED_MOST','IMPROVEMENT','FUTURE','AVERAGE_SCORE','EMAIL','PROGRAM_FORMAT','CERTIFICATE_PREFERENCE','RESPONSE_EMAIL_STATUS','CERTIFICATE_ID','CERTIFICATE_EMAIL_STATUS','DELIVERY_STATUS','LAST_EMAIL_AT'];
  const ss=cmsSpreadsheet_();let sh=ss.getSheetByName('ACTIVITY_EVALUATIONS');
  if(!sh){sh=ss.insertSheet('ACTIVITY_EVALUATIONS');sh.getRange(1,1,1,headers.length).setValues([headers]);sh.setFrozenRows(1);}
  else if(sh.getLastColumn()<headers.length){sh.getRange(1,sh.getLastColumn()+1,1,headers.length-sh.getLastColumn()).setValues([headers.slice(sh.getLastColumn())]);}
  return sh;
}
function qmsSuggestionSheet_(){
  const headers=['TIMESTAMP','REFERENCE','NAME','EMAIL','CATEGORY','AREA','SUBJECT','MESSAGE','SOLUTION','STATUS','ACTION_TAKEN','DATE_RESOLVED'];
  const ss=cmsSpreadsheet_();let sh=ss.getSheetByName('SUGGESTIONS_RECOMMENDATIONS');
  if(!sh){sh=ss.insertSheet('SUGGESTIONS_RECOMMENDATIONS');sh.getRange(1,1,1,headers.length).setValues([headers]);sh.setFrozenRows(1);}return sh;
}
function qmsSaveActivity_(p,parameters){
  const required=['activity','participant','programFormat','certificatePreference','rating','relevance','objectives','facilitatorRating','organization','venueRating','materials','timeManagement','engagement'];
  required.forEach(k=>{if(!String(p[k]||'').trim())throw new Error('Please complete all fields marked Required.');});
  const email=String(p.email||'').trim();
  if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Please enter a valid email address or leave the optional email field blank.');
  const reference=qmsRef_('ACT');
  const scoreKeys=['rating','relevance','objectives','facilitatorRating','organization','venueRating','materials','timeManagement','engagement'];
  const nums=scoreKeys.map(k=>Number(p[k])).filter(n=>n>=1&&n<=5);const avg=nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:0;
  qmsActivitySheet_().appendRow([new Date(),reference,p.activity||'',p.activityType||'',p.date||'',p.venue||'',p.participant||'',p.classification||'',p.speaker||'',p.rating||'',p.relevance||'',p.objectives||'',p.facilitatorRating||'',p.organization||'',p.venueRating||'',p.materials||'',p.timeManagement||'',p.engagement||'',p.speakerKnowledge||'',p.speakerClarity||'',p.speakerEngagement||'',p.speakerResponsiveness||'',p.speakerComments||'',p.learning||'',p.likedMost||'',p.improvement||'',p.future||'',avg,email,p.programFormat||'',p.certificatePreference||'Digital Certificate','','','','','']);

  // Save GAD/inclusion information in the same request. This removes the second
  // browser request that previously caused the “GAD monitoring request timed out” error.
  const sectors=((parameters&&parameters.sectorClassification)||[]).map(String).join(' | ');
  cmsGadSheet_().appendRow([new Date(),reference,'Activity / Program Evaluation',String(p.sexAssignedAtBirth||''),String(p.sexAssignedAtBirthOther||''),String(p.genderIdentity||''),String(p.genderIdentityOther||''),String(p.preferredPronouns||''),String(p.preferredPronounsOther||''),String(p.organizationOffice||''),String(p.positionDesignation||''),sectors,String(p.sectorClassificationOther||'')]);

  const cert=cmsIssueCertificate_({participant:p.participant,email:email,activity:p.activity,activityType:p.programFormat||p.activityType,date:p.date,venue:p.venue,speaker:p.speaker,qmsReference:reference,certificatePreference:p.certificatePreference||'Digital Certificate'});
  let responseStatus='NOT PROVIDED';
  if(email){try{qmsSendResponseCopy_(p,reference,avg,cert);responseStatus='SENT';}catch(err){responseStatus='FAILED: '+String(err.message||err).slice(0,100);}}
  const row=qmsActivitySheet_().getLastRow();qmsActivitySheet_().getRange(row,32,1,5).setValues([[responseStatus,cert.certificateId||'',cert.emailStatus||'',cert.certificatePreference||'',new Date()]]);
  return {success:true,reference:reference,score:avg,rating:cmsQualityLabel_(avg),certificateId:cert.certificateId,emailSent:cert.emailSent,responseEmailStatus:responseStatus,certificatePreference:cert.certificatePreference,hardCopyAvailableOn:cert.hardCopyAvailableOn};
}

function qmsSendResponseCopy_(p,reference,avg,cert){
  const email=String(p.email||'').trim();if(!email)return;
  const certUrl='https://sk-sapilang.github.io/sk-sapilang-website/certificate.html?id='+encodeURIComponent(cert.certificateId||'');
  const rows=[['Activity / Program',p.activity],['Participant',p.participant],['Date',p.date],['Venue',p.venue],['Program Format',p.programFormat||p.activityType],['Overall Rating',p.rating],['Relevance',p.relevance],['Objectives',p.objectives],['Facilitator',p.facilitatorRating],['Organization',p.organization],['Venue / Platform',p.venueRating],['Materials',p.materials],['Time Management',p.timeManagement],['Engagement',p.engagement],['Learning / Takeaway',p.learning],['What you liked most',p.likedMost],['Suggested improvement',p.improvement],['Future activities',p.future]];
  const table=rows.filter(r=>String(r[1]||'').trim()).map(r=>'<tr><td style="padding:6px 10px;border:1px solid #ddd"><strong>'+cmsEscapeHtml_(r[0])+'</strong></td><td style="padding:6px 10px;border:1px solid #ddd">'+cmsEscapeHtml_(r[1])+'</td></tr>').join('');
  const adminCopy=(cmsCertificateSettings_().settings||{}).adminEmail||'';
  MailApp.sendEmail({to:email,bcc:adminCopy||undefined,subject:'Copy of your SK Sapilang Activity Evaluation – '+String(p.activity||''),htmlBody:'<p>Good day, <strong>'+cmsEscapeHtml_(p.participant)+'</strong>.</p><p>Thank you for completing the SK Sapilang activity evaluation. Below is a copy of the responses you submitted.</p><table style="border-collapse:collapse;width:100%;max-width:720px">'+table+'</table><p><strong>QMS Reference:</strong> '+cmsEscapeHtml_(reference)+'<br><strong>Average Score:</strong> '+Number(avg||0).toFixed(2)+' / 5</p><p><strong>Your digital certificate:</strong> <a href="'+certUrl+'">Open / Save E-Copy</a><br><strong>Certificate No.:</strong> '+cmsEscapeHtml_(cert.certificateId||'')+'</p><p>This email intentionally excludes optional demographic/GAD monitoring fields.</p><p>Sangguniang Kabataan of Barangay Sapilang</p>'});
}

function qmsSaveClient_(p){
  const reference=qmsRef_('CLI');const rating=Number(p.rating)||0;
  cmsVisitorSheet_().appendRow([new Date(),reference,p.name||'',p.age||'',p.birthdate||'',p.address||'',p.contact||'',p.office||'',p.position||'',p.clientType||'',p.purpose||'',p.service||'',p.date||'',p.rating||'',p.comments||'','YES']);
  return {success:true,reference:reference,score:rating,rating:cmsQualityLabel_(rating)};
}
function qmsSaveSuggestion_(p){
  if(!String(p.category||'').trim()||!String(p.subject||'').trim()||!String(p.message||'').trim())throw new Error('Category, subject and message are required.');
  const reference=qmsRef_('SUG');qmsSuggestionSheet_().appendRow([new Date(),reference,p.name||'',p.email||'',p.category||'',p.area||'',p.subject||'',p.message||'',p.solution||'','NEW','','']);
  return {success:true,reference:reference,score:0,rating:'Received'};
}
function qmsUpdateSuggestion_(p){
  if(!cmsAuthorized_(p.adminKey))throw new Error('Incorrect administrator password.');
  const sh=qmsSuggestionSheet_();if(sh.getLastRow()<2)throw new Error('Suggestion not found.');
  const refs=sh.getRange(2,2,sh.getLastRow()-1,1).getDisplayValues().flat();const i=refs.indexOf(String(p.reference||''));if(i<0)throw new Error('Suggestion not found.');
  const row=i+2;sh.getRange(row,10).setValue(String(p.status||'NEW'));sh.getRange(row,11).setValue(String(p.actionTaken||''));
  if(/RESOLVED|CLOSED/i.test(String(p.status||'')))sh.getRange(row,12).setValue(new Date());else sh.getRange(row,12).clearContent();return {success:true};
}
function cmsCertificatesSheet_(){
  const headers=['CERTIFICATE_ID','QMS_REFERENCE','PARTICIPANT','ACTIVITY','ACTIVITY_TYPE','DATE_CONDUCTED','VENUE','RESOURCE_SPEAKER','ISSUED_AT','STATUS','EMAIL','EMAIL_STATUS','DELIVERY_PREFERENCE','HARD_COPY_AVAILABLE_ON','PRINT_STATUS','CERTIFICATE_TYPE','RECIPIENT_TYPE','CITATION','TEMPLATE_ID','LAST_EMAIL_AT'];
  const ss=cmsSpreadsheet_();let sheet=ss.getSheetByName('DIGITAL_CERTIFICATES');
  if(!sheet){sheet=ss.insertSheet('DIGITAL_CERTIFICATES');sheet.getRange(1,1,1,headers.length).setValues([headers]);sheet.setFrozenRows(1);}
  else if(sheet.getLastColumn()<headers.length){sheet.getRange(1,sheet.getLastColumn()+1,1,headers.length-sheet.getLastColumn()).setValues([headers.slice(sheet.getLastColumn())]);}
  return sheet;
}
function cmsIssueCertificate_(p){
  const participant=String(p.participant||'').trim(),email=String(p.email||'').trim(),activity=String(p.activity||'').trim(),qmsReference=String(p.qmsReference||qmsRef_('CERT')).trim(),preference=String(p.certificatePreference||'Digital / E-Copy').trim();
  if(!participant||!activity)throw new Error('Recipient and activity are required.');
  const sheet=cmsCertificatesSheet_();
  if(sheet.getLastRow()>1){const rows=sheet.getRange(2,1,sheet.getLastRow()-1,15).getDisplayValues();const ex=rows.find(r=>r[1]===qmsReference);if(ex)return {success:true,certificateId:ex[0],existing:true,emailSent:/SENT/i.test(ex[11]||''),certificatePreference:ex[12]||'Digital Certificate',hardCopyAvailableOn:ex[13]||''};}
  const year=Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Manila','yyyy');const seq=String(Math.max(sheet.getLastRow(),1)).padStart(6,'0');const id='SKSAP-'+year+'-'+seq;
  const certificateUrl='https://sk-sapilang.github.io/sk-sapilang-website/certificate.html?id='+encodeURIComponent(id);
  const hardCopyRequested=/Hard Copy|Printed/i.test(preference);
  const hardCopyDate=new Date(); hardCopyDate.setDate(hardCopyDate.getDate()+3);
  const hardCopyAvailableOn=hardCopyRequested?Utilities.formatDate(hardCopyDate,Session.getScriptTimeZone()||'Asia/Manila','MMMM d, yyyy'):'';
  let emailStatus='NOT PROVIDED',emailSent=false;
  if(email){
    try{
      const adminCopy=(cmsCertificateSettings_().settings||{}).adminEmail||'';
      MailApp.sendEmail({to:email,bcc:adminCopy||undefined,subject:'Your SK Sapilang Digital Certificate – '+activity,htmlBody:'<p>Good day, <strong>'+cmsEscapeHtml_(participant)+'</strong>.</p><p>Thank you for participating in <strong>'+cmsEscapeHtml_(activity)+'</strong> and completing the activity evaluation.</p><p>Your SK Sapilang Certificate of Participation is now available digitally. SK Sapilang highly recommends digital certificates to help reduce unnecessary paper use.</p><p><a href="'+certificateUrl+'">View / Print Digital Certificate</a></p><p>Certificate No.: <strong>'+id+'</strong><br>QMS Reference: <strong>'+cmsEscapeHtml_(qmsReference)+'</strong></p><p>Sangguniang Kabataan of Barangay Sapilang</p>'});
      emailStatus='SENT';emailSent=true;
    }catch(err){emailStatus='FAILED: '+String(err.message||err).slice(0,120);}
  }
  sheet.appendRow([id,qmsReference,participant,activity,String(p.activityType||''),String(p.date||''),String(p.venue||''),String(p.speaker||''),new Date(),'ACTIVE',email,emailStatus,preference,hardCopyAvailableOn,hardCopyRequested?'PRINT REQUESTED':'DIGITAL / E-COPY',String(p.certificateType||'Participation'),String(p.recipientType||'Individual'),String(p.citation||''),String(p.templateId||''),emailSent?new Date():'']);
  return {success:true,certificateId:id,existing:false,emailSent:emailSent,emailStatus:emailStatus,certificatePreference:preference,hardCopyAvailableOn:hardCopyAvailableOn};
}
function cmsEscapeHtml_(value){return String(value||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function cmsVerifyCertificate_(id){
  id=String(id||'').trim().toUpperCase();if(!/^SKSAP-\d{4}-\d{6}$/.test(id))return {success:true,found:false};const sh=cmsCertificatesSheet_();if(sh.getLastRow()<2)return {success:true,found:false};
  const rows=sh.getRange(2,1,sh.getLastRow()-1,19).getDisplayValues(),r=rows.find(x=>String(x[0]).toUpperCase()===id);if(!r)return {success:true,found:false};return {success:true,found:true,certificate:{certificateId:r[0],qmsReference:r[1],participant:r[2],activity:r[3],activityType:r[4],date:r[5],venue:r[6],speaker:r[7],issuedAt:r[8],status:r[9]||'ACTIVE',email:r[10],deliveryPreference:r[12]||'Digital Certificate',hardCopyAvailableOn:r[13]||'',printStatus:r[14]||'',certificateType:r[15]||'Participation',recipientType:r[16]||'Individual',citation:r[17]||'',templateId:r[18]||''}};
}
function cmsQmsDashboard_(){
  const av=qmsActivitySheet_().getDataRange().getDisplayValues(),sv=qmsSuggestionSheet_().getDataRange().getDisplayValues(),cv=cmsVisitorSheet_().getDataRange().getDisplayValues();
  const activities=av.slice(1).slice(-300).reverse().map(r=>({timestamp:r[0],reference:r[1],activity:r[2],activityType:r[3],date:r[4],venue:r[5],participant:r[6],classification:r[7],speaker:r[8],rating:r[9],relevance:r[10],objectives:r[11],facilitatorRating:r[12],organization:r[13],venueRating:r[14],materials:r[15],timeManagement:r[16],engagement:r[17],speakerKnowledge:r[18],speakerClarity:r[19],speakerEngagement:r[20],speakerResponsiveness:r[21],speakerComments:r[22],learning:r[23],likedMost:r[24],improvement:r[25],future:r[26],averageScore:Number(r[27])||0,quality:cmsQualityLabel_(r[27])}));
  const clients=cv.slice(1).slice(-100).reverse().map(r=>({timestamp:r[0],reference:r[1],name:r[2],age:r[3],birthdate:r[4],address:r[5],contact:r[6],office:r[7],position:r[8],clientType:r[9],purpose:r[10],service:r[11],serviceDate:r[12],rating:Number(r[13])||0,quality:cmsQualityLabel_(r[13]),comments:r[14],consent:r[15]}));
  const suggestions=sv.slice(1).slice(-300).reverse().map(r=>({timestamp:r[0],reference:r[1],name:r[2],email:r[3],category:r[4],area:r[5],subject:r[6],message:r[7],solution:r[8],status:r[9]||'NEW',actionTaken:r[10],dateResolved:r[11]}));
  const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0,as=avg(activities.map(x=>x.averageScore).filter(Boolean)),cr=clients.map(x=>x.rating).filter(Boolean),ca=avg(cr);
  const sp=[];activities.forEach(x=>['speakerKnowledge','speakerClarity','speakerEngagement','speakerResponsiveness'].forEach(k=>{const n=Number(x[k]);if(n)sp.push(n);}));const sa=avg(sp);
  const types={};activities.forEach(x=>{if(x.activityType)types[x.activityType]=(types[x.activityType]||0)+1});const areas={};suggestions.forEach(x=>{if(x.area)areas[x.area]=(areas[x.area]||0)+1});
  return {success:true,dashboard:{generatedAt:new Date().toISOString(),summary:{clientResponses:clients.length,averageClientSatisfaction:ca,clientQuality:cmsQualityLabel_(ca),activityEvaluations:activities.length,averageActivityScore:as,activityQuality:cmsQualityLabel_(as),speakerEvaluations:sp.length,averageSpeakerScore:sa,speakerQuality:cmsQualityLabel_(sa),suggestions:suggestions.length,newSuggestions:suggestions.filter(x=>x.status==='NEW').length,inProgressSuggestions:suggestions.filter(x=>/PROGRESS/i.test(x.status)).length},activityTypes:Object.entries(types).map(([label,value])=>({label,value})),developmentAreas:Object.entries(areas).map(([label,value])=>({label,value})),qualityDistribution:{client:[1,2,3,4,5].map(v=>({label:v+' / 5',value:cr.filter(n=>Math.round(n)===v).length})),activity:[1,2,3,4,5].map(v=>({label:v+' / 5',value:activities.filter(x=>Math.round(x.averageScore)===v).length}))},suggestionStatuses:['NEW','IN PROGRESS','RESOLVED','CLOSED'].map(label=>({label,value:suggestions.filter(x=>x.status===label).length})),clients,activities,suggestions,gadProfiles:[]}};
}

function cmsVisitorSheet_(){
  const headers=['TIMESTAMP','REFERENCE','FULL_NAME','AGE','BIRTHDATE','ADDRESS','CONTACT_NUMBER','OFFICE_OR_ORGANIZATION','POSITION_OR_DESIGNATION','VISITOR_TYPE','PURPOSE_OF_VISIT','SERVICE_AVAILED','DATE_OF_SERVICE','RATING','COMMENTS','CONSENT'];
  const ss=cmsSpreadsheet_();
  let sheet=ss.getSheetByName('VISITOR_LOGBOOK');
  if(!sheet){sheet=ss.insertSheet('VISITOR_LOGBOOK');sheet.getRange(1,1,1,headers.length).setValues([headers]);sheet.setFrozenRows(1);return sheet;}
  const width=Math.max(sheet.getLastColumn(),1);
  const oldHeaders=sheet.getRange(1,1,1,width).getDisplayValues()[0];
  if(oldHeaders.join('|')!==headers.join('|')){
    const oldRows=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,width).getValues():[];
    const aliases = {};
    aliases['FULL_NAME'] = ['FULL_NAME', 'NAME'];
    aliases['CONTACT_NUMBER'] = ['CONTACT_NUMBER', 'CONTACT'];
    aliases['PURPOSE_OF_VISIT'] = ['PURPOSE_OF_VISIT', 'PURPOSE'];
    aliases['SERVICE_AVAILED'] = ['SERVICE_AVAILED', 'SERVICE_OR_OFFICE'];
    const migrated=oldRows.map(row=>headers.map(header=>{
      const candidates=aliases[header]||[header];
      for(let i=0;i<candidates.length;i++){const index=oldHeaders.indexOf(candidates[i]);if(index>=0)return row[index];}
      return '';
    }));
    sheet.clearContents();
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    if(migrated.length)sheet.getRange(2,1,migrated.length,headers.length).setValues(migrated);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function cmsGadSheet_(){
  const headers=['TIMESTAMP','REFERENCE','FORM_TYPE','SEX_ASSIGNED_AT_BIRTH','SEX_OTHER','GENDER_IDENTITY_EXPRESSION','GENDER_OTHER','PREFERRED_PRONOUNS','PRONOUNS_OTHER','ORGANIZATION_OFFICE','POSITION_DESIGNATION','SECTOR_CLASSIFICATIONS','SECTOR_OTHER'];
  const ss=cmsSpreadsheet_();
  let sheet=ss.getSheetByName('GAD_INCLUSION_DATA');
  if(!sheet){sheet=ss.insertSheet('GAD_INCLUSION_DATA');sheet.getRange(1,1,1,headers.length).setValues([headers]);sheet.setFrozenRows(1);}
  return sheet;
}

function cmsGadProfileLog_(p,parameters){
  if(String(p.consent||'')!=='yes') return cmsHtmlFrame_('<script>parent.postMessage({source:"sk-gad-profile-log",success:false,message:"Consent is required."},"*");</script>');
  const sectors=(parameters.sectorClassification||[]).map(String).join(' | ');
  cmsGadSheet_().appendRow([
    new Date(),String(p.reference||''),String(p.formType||''),String(p.sexAssignedAtBirth||''),
    String(p.sexAssignedAtBirthOther||''),String(p.genderIdentity||''),String(p.genderIdentityOther||''),
    String(p.preferredPronouns||''),String(p.preferredPronounsOther||''),String(p.organizationOffice||p.office||''),
    String(p.positionDesignation||p.position||''),sectors,String(p.sectorClassificationOther||'')
  ]);
  return cmsHtmlFrame_('<script>parent.postMessage({source:"sk-gad-profile-log",success:true},"*");</script>');
}

function cmsDeleteItem_(id){
  const sheet=cmsItemsSheet_();
  const ids=sheet.getRange(2,1,Math.max(sheet.getLastRow()-1,1),1).getDisplayValues().flat();
  const index=ids.indexOf(id);if(index>=0)sheet.deleteRow(index+2);return {success:true};
}

function cmsSheet_(){
  const sheet=cmsSpreadsheet_().getSheetByName(CMS_SHEET_NAME);
  if(!sheet) throw new Error('CMS sheet is missing.');
  return sheet;
}

function cmsAuthorized_(password){
  const expected=PropertiesService.getScriptProperties().getProperty('CMS_ADMIN_PASSWORD');
  return Boolean(expected)&&String(password)===expected;
}

function cmsList_(page){
  const values=cmsSheet_().getDataRange().getDisplayValues();
  return values.slice(1).filter(r=>!page||r[1]===page).map(r=>({id:r[0],page:r[1],selector:r[2],property:r[3],value:r[4],updatedAt:r[5]}));
}

function cmsSave_(p){
  const sheet=cmsSheet_();
  const id=String(p.id||Utilities.getUuid());
  const row=[id,String(p.page||''),String(p.selector||''),String(p.property||'text'),String(p.value||''),new Date()];
  if(!row[1]||!row[2]) throw new Error('Page and selected element are required.');
  const ids=sheet.getRange(2,1,Math.max(sheet.getLastRow()-1,1),1).getDisplayValues().flat();
  const index=ids.indexOf(id);
  if(index>=0) sheet.getRange(index+2,1,1,row.length).setValues([row]); else sheet.appendRow(row);
  return {success:true,id:id};
}

function cmsDelete_(id){
  const sheet=cmsSheet_();
  const ids=sheet.getRange(2,1,Math.max(sheet.getLastRow()-1,1),1).getDisplayValues().flat();
  const index=ids.indexOf(id);
  if(index>=0) sheet.deleteRow(index+2);
  return {success:true};
}

function cmsJson_(data){
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function cmsJsonp_(data,callback){
  const safe=String(callback||'').replace(/[^a-zA-Z0-9_.$]/g,'');
  if(!safe)return cmsJson_(data);
  return ContentService.createTextOutput(safe+'('+JSON.stringify(data)+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function cmsCertificateList_(){
  const sh=cmsCertificatesSheet_();
  if(sh.getLastRow()<2)return {success:true,certificates:[]};
  const rows=sh.getRange(2,1,sh.getLastRow()-1,20).getDisplayValues().reverse();
  const responseMap={};try{const ev=qmsActivitySheet_();if(ev.getLastRow()>1){ev.getRange(2,1,ev.getLastRow()-1,36).getDisplayValues().forEach(x=>{responseMap[x[1]]=x[31]||'';});}}catch(_){} return {success:true,certificates:rows.map(r=>({certificateId:r[0],qmsReference:r[1],participant:r[2],activity:r[3],activityType:r[4],date:r[5],venue:r[6],speaker:r[7],issuedAt:r[8],status:r[9]||'ACTIVE',email:r[10],emailStatus:r[11],deliveryPreference:r[12]||'Digital Certificate',hardCopyAvailableOn:r[13],printStatus:r[14]||'',certificateType:r[15]||'Participation',recipientType:r[16]||'Individual',citation:r[17]||'',templateId:r[18]||'',lastEmailAt:r[19]||'',responseEmailStatus:responseMap[r[1]]||''}))};
}
function cmsUpdateCertificateStatus_(p){
  if(!cmsAuthorized_(p.adminKey||p.password))throw new Error('Incorrect administrator password.');
  const id=String(p.certificateId||'').trim().toUpperCase(); const sh=cmsCertificatesSheet_();
  if(sh.getLastRow()<2)throw new Error('Certificate not found.');
  const ids=sh.getRange(2,1,sh.getLastRow()-1,1).getDisplayValues().flat(); const i=ids.indexOf(id); if(i<0)throw new Error('Certificate not found.');
  const row=i+2;
  if(p.status)sh.getRange(row,10).setValue(String(p.status));
  if(p.printStatus)sh.getRange(row,15).setValue(String(p.printStatus));
  return {success:true};
}

// ===== QMS ADMIN SAFETY, TEMPLATE & DRIVE BACKUP EXTENSION =====
function qmsRecycleSheet_(){
  const h=['DELETED_AT','RECORD_TYPE','REFERENCE','DATA_JSON']; const ss=cmsSpreadsheet_(); let sh=ss.getSheetByName('QMS_RECYCLE_BIN');
  if(!sh){sh=ss.insertSheet('QMS_RECYCLE_BIN');sh.appendRow(h);sh.setFrozenRows(1);} return sh;
}
function cmsCertificateSettingsSheet_(){
  const ss=cmsSpreadsheet_(); let sh=ss.getSheetByName('CERTIFICATE_SETTINGS');
  if(!sh){sh=ss.insertSheet('CERTIFICATE_SETTINGS');sh.appendRow(['KEY','VALUE']);[['title','Certificate of Participation'],['body','for successfully participating in'],['logo1','images/sk-logo.svg'],['logo2','images/barangay-logo.svg'],['signatory1','DANDY F. NILLO'],['position1','SK Chairperson'],['signatory2','SANGGUNIANG KABATAAN'],['position2','Barangay Sapilang'],['design','canva'],['adminEmail',''],['certificateBackground',''],['canvaEditUrl',''],['nameY','49'],['nameSize','44'],['qrX','83'],['qrY','78'],['noX','7'],['noY','91']].forEach(r=>sh.appendRow(r));} return sh;
}
function cmsCertificateSettings_(){const v=cmsCertificateSettingsSheet_().getDataRange().getDisplayValues().slice(1),x={};v.forEach(r=>x[r[0]]=r[1]);return {success:true,settings:x};}
function cmsSaveCertificateSettings_(p){const sh=cmsCertificateSettingsSheet_(),keys=['title','body','logo1','logo2','signatory1','position1','signatory2','position2','design','adminEmail','certificateBackground','canvaEditUrl','nameX','nameY','nameSize','qrX','qrY','qrSize','noX','noY','noSize'],vals=sh.getDataRange().getDisplayValues();keys.forEach(k=>{let i=vals.findIndex((r,n)=>n>0&&r[0]===k);if(i>0)sh.getRange(i+1,2).setValue(String(p[k]||''));else sh.appendRow([k,String(p[k]||'')]);});return {success:true};}
function qmsMoveToRecycle_(type,reference){
  const map={activity:'ACTIVITY_EVALUATIONS',client:'VISITOR_LOGBOOK',suggestion:'SUGGESTIONS_RECOMMENDATIONS'}; const name=map[type]; if(!name)throw new Error('Invalid QMS record type.');
  const sh=cmsSpreadsheet_().getSheetByName(name); if(!sh||sh.getLastRow()<2)throw new Error('Record not found.'); const vals=sh.getDataRange().getDisplayValues(),headers=vals[0],refCol=headers.indexOf('REFERENCE'); const i=vals.findIndex((r,n)=>n>0&&r[refCol]===reference); if(i<1)throw new Error('Record not found.');
  const obj={};headers.forEach((h,j)=>obj[h]=vals[i][j]);qmsRecycleSheet_().appendRow([new Date(),type,reference,JSON.stringify(obj)]);sh.deleteRow(i+1);return {success:true};
}
function qmsRecycleList_(){const sh=qmsRecycleSheet_();if(sh.getLastRow()<2)return {success:true,records:[]};return {success:true,records:sh.getRange(2,1,sh.getLastRow()-1,4).getDisplayValues().reverse().map(r=>({deletedAt:r[0],type:r[1],reference:r[2],data:r[3]}))};}
function qmsRestore_(reference){
 const bin=qmsRecycleSheet_();if(bin.getLastRow()<2)throw new Error('Recycle record not found.');const vals=bin.getRange(2,1,bin.getLastRow()-1,4).getDisplayValues(),i=vals.findIndex(r=>r[2]===reference);if(i<0)throw new Error('Recycle record not found.');const type=vals[i][1],obj=JSON.parse(vals[i][3]),map={activity:'ACTIVITY_EVALUATIONS',client:'VISITOR_LOGBOOK',suggestion:'SUGGESTIONS_RECOMMENDATIONS'},sh=cmsSpreadsheet_().getSheetByName(map[type]);const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];sh.appendRow(headers.map(h=>obj[h]||''));bin.deleteRow(i+2);return {success:true};
}
function qmsBackupToDrive_(){
 const ss=cmsSpreadsheet_(),props=PropertiesService.getScriptProperties();let folderId=props.getProperty('QMS_BACKUP_FOLDER_ID'),folder;
 try{folder=folderId?DriveApp.getFolderById(folderId):null;}catch(e){folder=null;} if(!folder){folder=DriveApp.createFolder('SK Sapilang QMS Backups');props.setProperty('QMS_BACKUP_FOLDER_ID',folder.getId());}
 const stamp=Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Manila','yyyy-MM-dd HHmm');const copy=DriveApp.getFileById(ss.getId()).makeCopy('SK Sapilang QMS Backup '+stamp,folder);return {success:true,name:copy.getName(),url:copy.getUrl()};
}
function qmsResendCertificate_(id){const sh=cmsCertificatesSheet_(),vals=sh.getDataRange().getDisplayValues(),i=vals.findIndex((r,n)=>n>0&&r[0]===id);if(i<1)throw new Error('Certificate not found.');const r=vals[i],email=String(r[10]||'').trim();if(!email)throw new Error('This participant did not provide an email address.');const url='https://sk-sapilang.github.io/sk-sapilang-website/certificate.html?id='+encodeURIComponent(id);const adminCopy=(cmsCertificateSettings_().settings||{}).adminEmail||'';MailApp.sendEmail({to:email,bcc:adminCopy||undefined,subject:'Your SK Sapilang Digital Certificate – '+r[3],htmlBody:'<p>Good day, <strong>'+cmsEscapeHtml_(r[2])+'</strong>.</p><p>Your SK Sapilang digital certificate is available here:</p><p><a href="'+url+'">View / Print Certificate</a></p><p>Certificate No.: <strong>'+id+'</strong></p>'});sh.getRange(i+1,12).setValue('SENT / RESENT '+new Date());return {success:true};}
