const CMS_SHEET_NAME = 'WEBSITE_CONTENT';
const CMS_ITEMS_SHEET = 'WEBSITE_ITEMS';

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
    else {
      if(!cmsAuthorized_(p.password)) throw new Error('Incorrect administrator password.');
      if(action==='login') result={success:true};
      else if(action==='qms-dashboard') result=cmsQmsDashboard_();
      else if(action==='list') result={success:true,changes:cmsList_(String(p.page||''))};
      else if(action==='save') result=cmsSave_(p);
      else if(action==='delete') result=cmsDelete_(String(p.id||''));
      else if(action==='list-items') result={success:true,items:cmsItems_(String(p.page||''))};
      else if(action==='save-item') result=cmsSaveItem_(p);
      else if(action==='delete-item') result=cmsDeleteItem_(String(p.id||''));
      else throw new Error('Invalid request.');
    }
    return cmsJsonp_(result,p.callback);
  } catch (error) { return cmsJsonp_({success:false,message:error.message},(e.parameter||{}).callback); }
}

function doPost(e) {
  try {
    const p=e.parameter||{};
    if(p.action==='visitor-log') return cmsVisitorLog_(p,e.parameters||{});
    if(p.action==='gad-profile-log') return cmsGadProfileLog_(p,e.parameters||{});
    if(!cmsAuthorized_(p.password)) throw new Error('Incorrect administrator password.');
    if(p.action==='upload-frame') return cmsUploadFrame_(p);
    let result;
    if(p.action==='login') result={success:true};
    else if(p.action==='list') result={success:true,changes:cmsList_(String(p.page||''))};
    else if(p.action==='save') result=cmsSave_(p);
    else if(p.action==='delete') result=cmsDelete_(String(p.id||''));
    else if(p.action==='list-items') result={success:true,items:cmsItems_(String(p.page||''))};
    else if(p.action==='save-item') result=cmsSaveItem_(p);
    else if(p.action==='delete-item') result=cmsDeleteItem_(String(p.id||''));
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
  const id=PropertiesService.getScriptProperties().getProperty('CMS_SPREADSHEET_ID');
  const sheet=SpreadsheetApp.openById(id).getSheetByName(CMS_ITEMS_SHEET);
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

function cmsQmsDashboard_(){
  const sheet=cmsVisitorSheet_();
  const allValues=sheet.getDataRange().getDisplayValues();
  const rows=allValues.length>1?allValues.slice(1).map(row=>{
    const normalized=row.slice(0,16);
    while(normalized.length<16)normalized.push('');
    return normalized;
  }):[];
  const clients=rows.slice(-100).reverse().map(r=>({
    timestamp:r[0],reference:r[1],name:r[2],email:'',service:r[11],
    rating:Number(r[13])||0,quality:cmsQualityLabel_(r[13]),comments:r[14]
  }));
  const rated=clients.filter(r=>r.rating>0);
  const average=rated.length?rated.reduce((sum,r)=>sum+r.rating,0)/rated.length:0;
  const distribution=[1,2,3,4,5].map(value=>({label:String(value)+' / 5',value:rated.filter(r=>Math.round(r.rating)===value).length}));
  return {success:true,dashboard:{
    generatedAt:new Date().toISOString(),
    summary:{clientResponses:clients.length,averageClientSatisfaction:average,clientQuality:cmsQualityLabel_(average),activityEvaluations:0,averageActivityScore:0,activityQuality:'No ratings yet',speakerEvaluations:0,averageSpeakerScore:0,speakerQuality:'No ratings yet',suggestions:0,newSuggestions:0,inProgressSuggestions:0},
    activityTypes:[],developmentAreas:[],qualityDistribution:{client:distribution,activity:[]},
    suggestionStatuses:[],clients:clients,activities:[],suggestions:[]
  }};
}

function cmsVisitorSheet_(){
  const headers=['TIMESTAMP','REFERENCE','FULL_NAME','AGE','BIRTHDATE','ADDRESS','CONTACT_NUMBER','OFFICE_OR_ORGANIZATION','POSITION_OR_DESIGNATION','VISITOR_TYPE','PURPOSE_OF_VISIT','SERVICE_AVAILED','DATE_OF_SERVICE','RATING','COMMENTS','CONSENT'];
  const ss=SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('CMS_SPREADSHEET_ID'));
  let sheet=ss.getSheetByName('VISITOR_LOGBOOK');
  if(!sheet){sheet=ss.insertSheet('VISITOR_LOGBOOK');sheet.getRange(1,1,1,headers.length).setValues([headers]);sheet.setFrozenRows(1);return sheet;}
  const width=Math.max(sheet.getLastColumn(),1);
  const oldHeaders=sheet.getRange(1,1,1,width).getDisplayValues()[0];
  if(oldHeaders.join('|')!==headers.join('|')){
    const oldRows=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,width).getValues():[];
    const aliases={
      FULL_NAME:['FULL_NAME','NAME'],CONTACT_NUMBER:['CONTACT_NUMBER','CONTACT'],
      PURPOSE_OF_VISIT:['PURPOSE_OF_VISIT','PURPOSE'],SERVICE_AVAILED:['SERVICE_AVAILED','SERVICE_OR_OFFICE']
    };
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
  const ss=SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('CMS_SPREADSHEET_ID'));
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
  const props=PropertiesService.getScriptProperties();
  const id=props.getProperty('CMS_SPREADSHEET_ID');
  if(!id) throw new Error('Run setupWebsiteCMS first.');
  const sheet=SpreadsheetApp.openById(id).getSheetByName(CMS_SHEET_NAME);
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
