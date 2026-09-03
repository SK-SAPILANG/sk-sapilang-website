const CMS_SHEET_NAME = 'WEBSITE_CONTENT';

function setupWebsiteCMS() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CMS_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CMS_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID','PAGE','SELECTOR','PROPERTY','VALUE','UPDATED_AT']);
    sheet.setFrozenRows(1);
  }
  PropertiesService.getScriptProperties().setProperty('CMS_SPREADSHEET_ID', ss.getId());
}

function setWebsiteCMSPassword() {
  PropertiesService.getScriptProperties().setProperty('CMS_ADMIN_PASSWORD', 'CHANGE-THIS-PASSWORD');
}

function doGet(e) {
  try {
    const action = String((e.parameter||{}).action||'public');
    if (action === 'public') return cmsJson_({success:true,changes:cmsList_(String(e.parameter.page||''))});
    return cmsJson_({success:false,message:'Invalid request.'});
  } catch (error) { return cmsJson_({success:false,message:error.message}); }
}

function doPost(e) {
  try {
    const p=e.parameter||{};
    if(!cmsAuthorized_(p.password)) throw new Error('Incorrect administrator password.');
    if(p.action==='login') return cmsJson_({success:true});
    if(p.action==='list') return cmsJson_({success:true,changes:cmsList_(String(p.page||''))});
    if(p.action==='save') return cmsJson_(cmsSave_(p));
    if(p.action==='delete') return cmsJson_(cmsDelete_(String(p.id||'')));
    if(p.action==='upload') return cmsJson_(cmsUpload_(p));
    throw new Error('Invalid request.');
  } catch(error) { return cmsJson_({success:false,message:error.message}); }
}

function cmsUpload_(p){
  const match=String(p.data||'').match(/^data:([^;]+);base64,(.+)$/);
  if(!match) throw new Error('Invalid image file.');
  const bytes=Utilities.base64Decode(match[2]);
  if(bytes.length>5*1024*1024) throw new Error('Image must be 5 MB or smaller.');
  const props=PropertiesService.getScriptProperties();
  let folderId=props.getProperty('CMS_IMAGE_FOLDER_ID');
  let folder;
  if(folderId){folder=DriveApp.getFolderById(folderId)}else{folder=DriveApp.createFolder('SK Sapilang Website Images');props.setProperty('CMS_IMAGE_FOLDER_ID',folder.getId())}
  const safeName=String(p.name||'website-image').replace(/[^a-zA-Z0-9._-]/g,'-');
  const file=folder.createFile(Utilities.newBlob(bytes,match[1],Date.now()+'-'+safeName));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  return {success:true,url:'https://drive.google.com/uc?export=view&id='+file.getId()};
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
