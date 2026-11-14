(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var storageKey = 'servicelogg.maskiner.v1';
  var dealersKey = 'servicelogg.forhandlarar.v1';
  var machines = [];
  var dealers = [];
  var editingId = null;
  var highlightedId = null;
  var storageWorks = true;

  // Lokal ansattregister, utan serverbasert autentisering.
  // Merk: Alt nedanfor er berre klientside-kontroll; trygt fleirbrukarsystem krev server.
  var employeeKey = 'servicelogg.ansatte.v1';
  // Originale rolle-ID-ar er behaldne, slik at gamle tilsette ikkje blir endra.
  // Alle nye fagstillingar får lesetilgang som standard, og kan senda feilmeldingar.
  var employeeRoleCatalog = [
    {group:"Dei fire hovudstillingane",roles:[["administrator","Administrator"],["maskinforar","Maskinfører"],["lastebilsjafor","Lastebilsjåfør"],["servicefolk","Service folk"]]},
    {group:"Leiing og administrasjon",roles:[["dagleg_leiar","Dagleg leiar"],["prosjektleiar","Prosjektleiar"],["anleggsleiar","Anleggsleiar"],["driftsleiar","Driftsleiar"],["arbeidsleiar","Arbeidsleiar"],["bas","Bas / formann"],["avdelingsleiar","Avdelingsleiar"],["byggjeleiar","Byggjeleiar"],["produksjonsleiar","Produksjonsleiar"],["hms_ansvarleg","HMS-ansvarleg"],["ks_ansvarleg","KS-ansvarleg"],["verneombod","Verneombod"],["kontorleiar","Kontorleiar"],["personalansvarleg","Personalansvarleg"],["okonomiansvarleg","Økonomiansvarleg"],["rekneskapsforar","Rekneskapsførar"],["kontormedarbeidar","Kontormedarbeidar"],["innkjopar","Innkjøpar"],["planleggjar","Planleggjar"],["prosjektkoordinator","Prosjektkoordinator"],["driftskoordinator","Driftskoordinator"],["kontorassistent","Kontorassistent"],["lonnsmedarbeidar","Lønsmedarbeidar"],["anbodskalkulator","Anbodskalkulatør"],["kontraktsansvarleg","Kontraktsansvarleg"],["personalmedarbeidar","Personalmedarbeidar"]]},
    {group:"Maskin og anlegg",roles:[["gravemaskinforar","Gravemaskinførar"],["hjullastarforar","Hjullastarførar"],["dumperforar","Dumperførar"],["bulldosarforar","Bulldosarførar"],["veghovelforar","Veghøvelførar"],["valseforar","Valseførar"],["kranforar","Kranførar"],["truckforar","Truckførar"],["boreriggforar","Boreriggførar"],["anleggsarbeidar","Anleggsarbeidar"],["grunnarbeidar","Grunnarbeidar"],["fagarbeidar","Fagarbeidar"],["hjelpearbeidar","Hjelpearbeidar"],["veg_arbeidar","Vegarbeidar"],["asfaltarbeidar","Asfaltarbeidar"],["betongarbeidar","Betongarbeidar"],["tomrar","Tømrar"],["anleggsroyrleggjar","Anleggsrøyrleggjar"],["va_montor","VA-montør"],["landmalar","Landmålar"],["stikningsingenior","Stikningsingeniør"],["fjellsikrar","Fjellsikrar"],["sprengingsleiar","Sprengingsleiar"],["bergsprengar","Bergsprengar"],["sveiser","Sveiser"],["elektrikar","Elektrikar"],["maskinoperatoer","Maskinoperatør"],["minigravarforar","Minigravarførar"],["mobilkranforar","Mobilkranførar"],["tarnkranforar","Tårnkranførar"],["bergverksarbeidar","Bergverksarbeidar"],["knuseverksoperatoer","Knuseverksoperatør"],["steinleggjar","Steinleggjar"],["gartnar","Anleggsgartnar"],["rivingarbeidar","Rivingsarbeidar"]]},
    {group:"Transport og logistikk",roles:[["anleggssjafor","Anleggssjåfør"],["kranbilsjafor","Kranbilsjåfør"],["tippbilsjafor","Tippbilsjåfør"],["broytesjafor","Brøytesjåfør"],["trailersjafor","Trailersjåfør"],["transportleiar","Transportleiar"],["koyreleiar","Køyreleiar"],["logistikkmedarbeidar","Logistikkmedarbeidar"],["lagermedarbeidar","Lagermedarbeidar"],["lageransvarleg","Lageransvarleg"],["disponent","Disponent"],["langtransportsjafor","Langtransportsjåfør"],["varebilsjafor","Varebilsjåfør"],["distribusjonssjafor","Distribusjonssjåfør"],["tankbilsjafor","Tankbilsjåfør"],["renovasjonssjafor","Renovasjonssjåfør"],["spesialtransportsjafor","Spesialtransportsjåfør"],["transportkoordinator","Transportkoordinator"],["trafikkdirigent","Trafikkdirigent"],["terminalarbeidar","Terminalarbeidar"]]},
    {group:"Service, verkstad og vedlikehald",roles:[["mekanikar","Mekanikar"],["anleggsmekanikar","Anleggsmekanikar"],["maskinmekanikar","Maskinmekanikar"],["tungbilmekanikar","Tungbilmekanikar"],["bilmekanikar","Bilmekanikar"],["serviceteknikar","Serviceteknikar"],["verkstadleiar","Verkstadleiar"],["vedlikehaldsansvarleg","Vedlikehaldsansvarleg"],["kontrollor","Kontrollør"],["inspektor","Inspektør"],["verkstadmedarbeidar","Verkstadmedarbeidar"],["servicemekanikar","Servicemekanikar"],["hydraulikkmekanikar","Hydraulikkmekanikar"],["dekkmontor","Dekkmontør"],["deleansvarleg","Deleansvarleg"],["verkstadassistent","Verkstadassistent"],["serviceleiar","Serviceleiar"],["teknisk_leiar","Teknisk leiar"],["servicekoordinator","Servicekoordinator"],["feilsokingsteknikar","Feilsøkingsteknikar"]]},
    {group:"Andre stillingar",roles:[["larling","Lærling"],["praktikant","Praktikant"],["sesongarbeidar","Sesongarbeidar"],["renhaldar","Reinhaldar"],["vaktmeister","Vaktmeister"],["kundeansvarleg","Kundeansvarleg"],["kundemottakar","Kundemottakar"],["salsmedarbeidar","Salsmedarbeidar"],["it_ansvarleg","IT-ansvarleg"],["kvalitetskontrollor","Kvalitetskontrollør"],["sjoforassistent","Sjåførassistent"],["beredskapsvakt","Beredskapsvakt"]]}
  ];
  var employeeRoles = {tilsett:'Tilsett (tidlegare rolle)'};
  var employeeNewRoles = {};
  employeeRoleCatalog.forEach(function(category){category.roles.forEach(function(pair){employeeRoles[pair[0]]=pair[1];employeeNewRoles[pair[0]]=true;});});
  // Fem faste val. Gamle rolle-ID-ar over blir berre behaldne for tidlegare registrerte tilsette.
  employeeRoles.altmulig='Alt mulig';
  employeeRoles.lastebilsjafor='Lastebil sjåfør';
  employeeNewRoles.altmulig=true;
  var employeeChoiceRoles=[['administrator','Administrator'],['maskinforar','Maskinfører'],['servicefolk','Service folk'],['lastebilsjafor','Lastebil sjåfør'],['altmulig','Alt mulig']];
  var employeeChoiceIds=employeeChoiceRoles.map(function(pair){return pair[0];});
  function employeeIsCustomRole(role) { return typeof role==='string' && /^eigendefinert:[^<>\r\n]{1,80}$/.test(role); }
  function employeeIsStoredRole(role) { return Object.prototype.hasOwnProperty.call(employeeRoles,role) || employeeIsCustomRole(role); }
  function employeeRoleName(role) {
    if(employeeIsCustomRole(role)) return role.slice('eigendefinert:'.length);
    return employeeRoles[role] || 'Ukjend stilling';
  }
  function employeeSelectableRole(role) { return !!employeeNewRoles[role] || employeeIsCustomRole(role); }
  function employeeRoleActionName(role) { return String(employeeRoleName(role)).toLocaleLowerCase('nb-NO'); }
  function employeeLegacyReplacement(role) { return role==='tilsett' ? 'maskinforar' : (employeeIsCustomRole(role) ? 'eigendefinert' : role); }
  // Vis nøyaktig fem val i nedtrekkslistene. Kvar stilling får si mappe.
  function employeeFillRoleOptions(select) {
    select.replaceChildren();
    employeeChoiceRoles.forEach(function(pair){
      var option=document.createElement('option');
      option.value=pair[0];option.textContent=pair[1];select.appendChild(option);
    });
    select.value='administrator';
  }
  employeeFillRoleOptions($('employee-role'));
  employeeFillRoleOptions($('setup-role'));
  function employeeToggleCustomRole(selectId,fieldId) {
    $(fieldId).hidden=true;
    $(fieldId).querySelector('input').required=false;
  }
  $('setup-role').addEventListener('change',function(){employeeToggleCustomRole('setup-role','setup-custom-role-field');});
  function employeeChosenRole() { return $('employee-role').value; }
  // Ein eldre registrert stilling kan behaldast ved redigering, utan at ho blir eit nytt val.
  function employeeEditingRole(role) {
    var select=$('employee-role');
    select.querySelectorAll('option[data-legacy-role]').forEach(function(option){option.remove();});
    if(!employeeChoiceIds.includes(role)) {
      var previous=document.createElement('option');
      previous.value=role;previous.textContent='Tidlegare stilling: '+employeeRoleName(role);
      previous.hidden=true;previous.setAttribute('data-legacy-role','');select.appendChild(previous);
    }
    select.value=role;
  }
  var employeeRecords = [];
  var employeeCurrent = null;
  var employeeEditingId = null;
  var employeeRecentlyCreatedId = null;
  var employeeLastSavedName = "";
  var employeeLoginFailures = 0;
  var employeeOneTimeRecoveryCode = '';
  try {
    var employeeSaved = JSON.parse(localStorage.getItem(employeeKey) || '[]');
    if (Array.isArray(employeeSaved)) employeeRecords = employeeSaved.filter(function(e) {
      return e && typeof e === 'object' && e.id && e.email && employeeIsStoredRole(e.role) && e.pinHash && e.pinSalt;
    });
  } catch(error) { employeeRecords = []; }
  if (window.ServiceCloud && window.ServiceCloud.profile) {
    employeeRecords = window.ServiceCloud.staff.map(function(row){return {id:row.id,name:row.full_name,email:row.email,role:row.role,confirmed:row.confirmed,pinHash:'cloud-managed',pinSalt:'00',createdAt:row.created_at,confirmCode:window.ServiceCloud.tempCodes[row.id]||''};});
    employeeCurrent = employeeRecords.find(function(rec){return rec.id===window.ServiceCloud.profile.id;}) || null;
  }

  function employeeNormalEmail(value) { return String(value || '').trim().toLocaleLowerCase('nb-NO'); }
  function employeeValidPin(value) { return /^\d{4,8}$/.test(String(value || '')); }
  function employeePersist() {
    if(window.ServiceCloud) return false; // Kontoar skal aldri lagrast lokalt i nettutgåva.
    try { localStorage.setItem(employeeKey,JSON.stringify(employeeRecords)); return true; }
    catch(error) { return false; }
  }
  function employeeRandomHex(bytes) {
    var arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
  }
  function employeeNewCode() {
    var value = new Uint32Array(1);
    crypto.getRandomValues(value);
    return String(100000 + (value[0] % 900000));
  }
  async function employeePinDigest(pin,salt) {
    if (!window.crypto || !crypto.subtle || !window.TextEncoder) throw new Error('PIN kunne ikkje opprettast her. Last ned HTML-fila til PC-en og opna henne i Chrome eller Edge (ikkje i ChatGPT-førehandsvisinga).');
    var encoder = new TextEncoder();
    var key = await crypto.subtle.importKey('raw',encoder.encode(pin),'PBKDF2',false,['deriveBits']);
    var saltBytes = new Uint8Array((salt.match(/.{2}/g)||[]).map(function(b){return parseInt(b,16);}));
    var bits = await crypto.subtle.deriveBits({name:'PBKDF2',salt:saltBytes,iterations:150000,hash:'SHA-256'},key,256);
    return Array.from(new Uint8Array(bits)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
  }
  async function employeeGenerateRecovery(record) {
    var code=employeeNewCode()+employeeNewCode();
    record.recoverySalt=employeeRandomHex(16);
    record.recoveryHash=await employeePinDigest(code,record.recoverySalt);
    return code;
  }
  async function employeeSetPin(record,pin) {
    var salt = employeeRandomHex(16);
    var hash = await employeePinDigest(pin,salt);
    record.pinSalt=salt;
    record.pinHash=hash;
  }
  async function employeeCheckPin(record,pin) {
    if (!record || !employeeValidPin(pin)) return false;
    var digest = await employeePinDigest(pin,record.pinSalt);
    return digest === record.pinHash;
  }
  function employeeMsg(id,text,bad) {
    var el=$(id);
    if (!el) return;
    el.textContent=text;
    el.className='feedback '+(bad?'bad':'good');
  }
  function employeeNode(tag,cls,txt) {
    var el=document.createElement(tag);
    if(cls) el.className=cls;
    if(txt!==undefined) el.textContent=txt;
    return el;
  }
  function employeeButton(label,cls,callback) {
    var el=employeeNode('button',cls||'btn secondary',label);
    el.type='button';
    if(callback) el.addEventListener('click',callback);
    return el;
  }
  function employeeIsAdmin() { return !employeeRecords.length || !!(employeeCurrent && employeeCurrent.confirmed && employeeCurrent.role==='administrator'); }
  function employeeHasConfirmedAdmin() { return employeeRecords.some(function(e){return e.role==='administrator' && e.confirmed;}); }
  function employeeIsSetupOwner() {
    return !!(employeeRecords.length && employeeCurrent && employeeCurrent.confirmed && employeeRecords[0].id===employeeCurrent.id && !employeeHasConfirmedAdmin());
  }
  function employeeCanManageStaff() { return employeeIsAdmin() || employeeIsSetupOwner(); }
  function employeeCanMachines() { return !!(employeeCurrent && employeeCurrent.confirmed && ['administrator','servicefolk'].includes(employeeCurrent.role)); }
  function employeeCanService() { return !!(employeeCurrent && employeeCurrent.confirmed && ['administrator','servicefolk'].includes(employeeCurrent.role)); }
  // Sentral tilgangskontroll for sidene. Fleire stader kan kalla showPage(),
  // så skjulte menypunkt er ikkje nok i seg sjølve.
  function employeeCanOpenPage(page) {
    if(!employeeCurrent || !employeeCurrent.confirmed) return false;
    if(page==='oversikt' || page==='rapporter') return true;
    if(page==='ansatte') return employeeCanManageStaff();
    if(page==='servicebok' || page==='maskinregisteret') return employeeCanMachines();
    return false;
  }
  function employeeUpdateVisibleMenus() {
    document.querySelectorAll('[data-page]').forEach(function(link) {
      link.hidden=!employeeCanOpenPage(link.dataset.page);
    });
  }
  function employeeApplyRole() {
    var canMachines=employeeCanMachines();
    var canService=employeeCanService();
    var canManageServiceLists=canMachines;
    document.querySelectorAll('#maskinregisteret input, #maskinregisteret select, #maskinregisteret textarea, #maskinregisteret button').forEach(function(el){el.disabled=!canMachines;});
    document.querySelectorAll('#servicebok input, #servicebok select, #servicebok textarea, #servicebok button').forEach(function(el){
      if (el.closest('#fault-board')) {if(el.tagName==='BUTTON') el.disabled=!canService;return;}
      if (el.id==='service-search' || el.classList.contains('service-history-toggle')) {el.disabled=false;return;}
      if(el.tagName==='BUTTON' && el.closest('#service-list')) return; /* Dynamiske knappar blir kontrollert ved klikk. */
      el.disabled=el.closest('#service-form') ? !canService : !canManageServiceLists;
    });
  }
  function employeeDeny() {
    var warning=$('employee-access-warning');
    warning.textContent='Du har ikkje løyve til å gjera denne endringa med rolla di ('+employeeRoleName(employeeCurrent ? employeeCurrent.role : '')+').';
    warning.hidden=false;
    warning.scrollIntoView({block:'nearest'});
  }
  document.addEventListener('click',function(event){
    if(!employeeRecords.length || !employeeCurrent || !employeeCurrent.confirmed) return;
    var button=event.target.closest('button');
    if(!button) return;
    var blocked=false;
    if(button.closest('#maskinregisteret') && !employeeCanMachines()) blocked=true;
    if(button.closest('#servicebok') && !employeeCanMachines()) {
      if(button.closest('#fault-board')) {
        blocked=button.classList.contains('fault-manage-action') && !employeeCanService();
      } else {
      var isHistory=button.classList.contains('service-history-toggle');
      var isServiceForm=!!button.closest('#service-form');
      var isServiceEdit=button.textContent.trim()==='Rediger' && !!button.closest('.service-entry');
      if(employeeCanService()) blocked=!(isHistory||isServiceForm||isServiceEdit);
      else blocked=!isHistory;
      }
    }
    if(blocked) {event.preventDefault();event.stopImmediatePropagation();employeeDeny();}
  },true);

  function employeeRenderSession() {
    var active=!!(employeeCurrent && employeeCurrent.confirmed);
    $('employee-session').hidden=!active;
    $('employee-session-name').textContent=active ? employeeCurrent.name+' · '+employeeRoleName(employeeCurrent.role) : '';
    $('employee-access-warning').hidden=true;
  }
  function employeeRenderAuth() {
    var first=!employeeRecords.length;
    var pending=!first && !!employeeCurrent && !employeeCurrent.confirmed;
    $('auth-setup').hidden=!first;
    $('auth-login').hidden=first || pending;
    $('auth-confirm').hidden=!pending;
    if(pending) $('auth-pending-text').textContent='Hei '+employeeCurrent.name+'. Stillinga «'+employeeRoleName(employeeCurrent.role)+'» for '+employeeCurrent.email+' ventar på stadfesting. Skriv inn den sekssifra koden administrator har sendt deg.';
  }
  function employeeRoleHelp() {
    employeeToggleCustomRole('employee-role','employee-custom-role-field');
    var role=employeeChosenRole();
    var label=role ? employeeRoleActionName(role) : 'tilsett';
    $('employee-role-help').textContent='Vel ei av dei fem stillingane. Tilsette med same stilling blir samla i ei mappe.';
    $('employee-role-help').className='employee-role-help';
    if(!employeeEditingId) {
      $('employee-form-title').textContent='Opprett tilsett';
      $('employee-save').textContent='Opprett tilsett ↓';
    }
  }
  $('employee-role').addEventListener('change',employeeRoleHelp);
  function employeeResetForm(preferredRole) {
    employeeEditingId=null;
    $('employee-form').reset();
    $('employee-cancel').hidden=true;
    $('employee-pin-optional').textContent='';
    $('employee-initial-pin').placeholder='4–8 siffer';
    employeeEditingRole(preferredRole && employeeChoiceIds.includes(preferredRole) ? preferredRole : 'maskinforar');
    $('employee-custom-role').value='';
    $('employee-role').disabled=false;
    employeeRoleHelp();
  }

  // Gjenopprettingskodar blir berre lagra som salta kontrollverdiar.
  // Administrator kan derfor ikkje lesa ein gammal kode; ny kode erstattar den gamle.
  function employeeClearRecovery() {
    $('employee-recovery-admin-pin').value='';
    $('employee-recovery-code').textContent='';
    $('employee-recovery-result').hidden=true;
    employeeResetCopyButton($('employee-recovery-copy'),'Kopier koden');
    employeeMsg('employee-recovery-feedback','',false);
  }
  $('employee-recovery-details').addEventListener('toggle',function(){
    if(!$('employee-recovery-details').open) employeeClearRecovery();
  });
  $('employee-recovery-create-form').addEventListener('submit',async function(event){
    event.preventDefault();
    // Ikkje stol på at ein klientbasert meny er skjult: kontroller rolla igjen.
    var rec=employeeCurrent;
    if(!rec || !rec.confirmed || rec.role!=='administrator' || !$('employee-recovery-details').open || $('employee-recovery-panel').hidden) {
      employeeClearRecovery();return;
    }
    var pin=$('employee-recovery-admin-pin').value;
    if(!employeeValidPin(pin)) {
      employeeMsg('employee-recovery-feedback','Skriv inn din eigen PIN-kode (4–8 siffer).',true);return;
    }
    var btn=$('employee-recovery-create');
    btn.disabled=true;
    employeeClearRecovery();
    try {
      if(!await employeeCheckPin(rec,pin)) {
        employeeMsg('employee-recovery-feedback','Feil PIN-kode. Ingen ny kode vart laga.',true);return;
      }
      var oldSalt=rec.recoverySalt;
      var oldHash=rec.recoveryHash;
      var newCode=await employeeGenerateRecovery(rec);
      if(!employeePersist()) {
        rec.recoverySalt=oldSalt;
        rec.recoveryHash=oldHash;
        throw new Error('Kunne ikkje lagra koden i nettlesaren. Den gamle koden er framleis gyldig.');
      }
      $('employee-recovery-code').textContent=newCode;
      employeeResetCopyButton($('employee-recovery-copy'),'Kopier koden');
      $('employee-recovery-result').hidden=false;
      employeeMsg('employee-recovery-feedback','Ny kode er laga for '+rec.name+'. Den gamle koden verkar ikkje lenger.',false);
    } catch(err) {
      employeeMsg('employee-recovery-feedback',err.message || 'Kunne ikkje laga ny kode.',true);
    } finally {btn.disabled=false;}
  });
  function employeeResetCopyButton(button,label) {
    if(!button)return;
    button.classList.remove('copy-success');
    button.textContent=label;
    button.removeAttribute('aria-label');
  }
  function employeeMarkCodeCopied(button) {
    button.classList.add('copy-success');
    button.textContent='✓ Kopiert!';
    button.setAttribute('aria-label','Koden er kopiert');
  }
  async function employeeCopyCodeToClipboard(code) {
    // HTTP(S) med løyve kan bruka Clipboard API. Lokal HTML/file: kan trenga ein fallback.
    if(navigator.clipboard && typeof navigator.clipboard.writeText==='function') {
      try {await navigator.clipboard.writeText(code);return true;}
      catch(error) {/* Prøv eldre kopieringsmetode nedanfor. */}
    }
    var input=document.createElement('textarea');
    input.value=code;
    input.setAttribute('readonly','');
    input.style.position='fixed';input.style.left='-9999px';
    document.body.appendChild(input);
    input.select();input.setSelectionRange(0,input.value.length);
    var copied=false;
    try {copied=!!document.execCommand('copy');}
    catch(error) {copied=false;}
    input.remove();
    return copied;
  }
  $('employee-recovery-copy').addEventListener('click',async function(){
    if(!employeeCurrent || !employeeCurrent.confirmed || employeeCurrent.role!=='administrator' || $('employee-recovery-result').hidden) return;
    var code=$('employee-recovery-code').textContent;
    if(!/^\d{12}$/.test(code)) return;
    var button=$('employee-recovery-copy');
    if(await employeeCopyCodeToClipboard(code)) {
      employeeMarkCodeCopied(button);
      employeeMsg('employee-recovery-feedback','✓ Koden er kopiert. Oppbevar han trygt.',false);
    } else {
      employeeResetCopyButton(button,'Kopier koden');
      employeeMsg('employee-recovery-feedback','Automatisk kopiering er ikkje tilgjengeleg. Merk og kopier koden manuelt.',true);
    }
  });
  $('employee-recovery-hide').addEventListener('click',function(){employeeClearRecovery();$('employee-recovery-details').open=false;});

  function employeeMailto(record) {
    var subject='Bekreft stillinga di i Engelsen Anlegg ServiceLogg';
    var body='Hei '+record.name+'!\n\nDu er registrert som '+employeeRoleName(record.role)+' i Engelsen Anlegg ServiceLogg.\n\nStadfestingskoden din: '+record.confirmCode+'\n\nOpna ServiceLogg på ein PC eller mobil, logg inn med e-postadressa '+record.email+' og PIN-koden du får separat frå den som registrerte deg, og skriv inn koden ovanfor.\n\nPIN-koden blir ikkje sendt i denne e-posten. Dette er ei felles innlogging. Ikkje send PIN og stadfestingskode i same melding.\n\nHelsing Engelsen Anlegg';
    return 'mailto:'+encodeURIComponent(record.email)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
  }
  function employeeRender(revealRole,revealEmployeeId) {
    var first=!employeeRecords.length;
    var admin=employeeCanManageStaff();
    // Dette feltet er ikkje tilgjengeleg for oppsettsansvarleg eller andre roller.
    var fullAdministrator=!!(employeeCurrent && employeeCurrent.confirmed && employeeCurrent.role==='administrator');
    $('employee-recovery-panel').hidden=!!window.ServiceCloud || !fullAdministrator;
    if(!fullAdministrator) employeeClearRecovery();
    $('employee-setup-note').hidden=!first;
    $('employee-bootstrap-note').hidden=!employeeIsSetupOwner();
    $('employee-admin-panel').hidden=!admin;
    $('employee-access-note').hidden=admin;
    if(!admin) $('employee-access-note').textContent='Du kan sjå alle registrerte tilsette nedanfor. Berre ein administrator kan oppretta eller redigera tilsette. Logg inn som administrator for å leggja til fleire.';
    if(admin && !employeeEditingId) employeeResetForm(revealRole);
    $('employee-count').textContent=employeeRecords.length===1?'1 tilsett':employeeRecords.length+' tilsette';
    var list=$('employee-list');
    var openRoles=new Set(Array.from(list.querySelectorAll('.employee-role-folder[open]')).map(function(el){return el.getAttribute('data-employee-role');}));
    var openEmployees=new Set(Array.from(list.querySelectorAll('.employee-person-entry[open]')).map(function(el){return el.getAttribute('data-employee-id');}));
    list.replaceChildren();
    if(first) {list.appendChild(employeeNode('div','empty','Opprett den første brukaren ovanfor, og vel stilling i lista.'));return;}
    // Lag berre mapper for stillingar som faktisk har tilsette.
    var roleOrder=Object.keys(employeeNewRoles).filter(function(role){return employeeRecords.some(function(rec){return rec.role===role;});});
    employeeRecords.forEach(function(rec){if(!roleOrder.includes(rec.role)) roleOrder.push(rec.role);});
    roleOrder.forEach(function(role){
      var members=employeeRecords.filter(function(rec){return rec.role===role;}).sort(function(a,b){
        // Nyaste tilsette øvst, akkurat som nyaste føring i servicehistorikken.
        var at=Date.parse(a.createdAt || 0) || 0;
        var bt=Date.parse(b.createdAt || 0) || 0;
        return (bt-at) || String(a.name).localeCompare(String(b.name),'nb-NO');
      });
      var folder=employeeNode('details','employee-role-folder');
      folder.setAttribute('data-employee-role',role);
      // Vis alltid namna i alle mapper som faktisk har folk, også etter ny opning.
      // Mappa kan framleis lukkast manuelt.
      if(openRoles.has(role) || role===revealRole || members.length>0) folder.open=true;
      var summary=employeeNode('summary');
      summary.appendChild(employeeNode('span','employee-folder-title',employeeRoleName(role)));
      summary.appendChild(employeeNode('span','employee-folder-count',members.length===1?'1 tilsett':members.length+' tilsette'));
      folder.appendChild(summary);
      var folderContent=employeeNode('div','employee-folder-content');
      if(!members.length) folderContent.appendChild(employeeNode('div','employee-folder-empty','Ingen tilsette i denne stillinga enno.'));
      members.forEach(function(rec){
      var row=employeeNode('details','employee-row employee-person-entry');
      row.setAttribute('data-employee-id',rec.id);
      if(rec.id===employeeRecentlyCreatedId) row.classList.add('employee-newly-created');
      if(openEmployees.has(rec.id) || rec.id===revealEmployeeId) row.open=true;
      var personSummary=employeeNode('summary','employee-person-summary');
      var personTitle=employeeNode('span','employee-person-summary-text');
      personTitle.appendChild(employeeNode('strong','',rec.name));
      personTitle.appendChild(employeeNode('span','employee-person-summary-email',rec.email));
      personSummary.appendChild(personTitle);
      personSummary.appendChild(employeeNode('span','employee-person-summary-status'+(rec.confirmed?' confirmed':''),rec.confirmed?'✓ Stadfesta':'Ventar på stadfesting'));
      personSummary.appendChild(employeeNode('span','employee-person-chevron','❯'));
      row.appendChild(personSummary);
      var rowBody=employeeNode('div','employee-person-body');
      var top=employeeNode('div','employee-row-top');
      top.appendChild(employeeNode('strong','',rec.name));
      top.appendChild(employeeNode('span','employee-role-tag',employeeRoleName(rec.role)));
      rowBody.appendChild(top);
      rowBody.appendChild(employeeNode('p','',rec.email));
      rowBody.appendChild(employeeNode('span','employee-status'+(rec.confirmed?' confirmed':''),rec.confirmed?'✓ Stilling stadfesta':'⏳ Ventar på stadfesting'));
      if(!admin) {
        row.appendChild(rowBody);
        folderContent.appendChild(row);
        return;
      }
      var actions=employeeNode('div','actions');
      actions.appendChild(employeeButton('Rediger','btn secondary',function(){
        employeeEditingId=rec.id;
        $('employee-name').value=rec.name;
        $('employee-email').value=rec.email;
        employeeEditingRole(rec.role);
        $('employee-custom-role').value='';
        $('employee-role').disabled=false;
        employeeRoleHelp();
        $('employee-initial-pin').value='';
        $('employee-pin-optional').textContent='(valfritt ved redigering)';
        $('employee-form-title').textContent='Rediger '+rec.name;
        $('employee-save').textContent='Lagre endringar';
        $('employee-cancel').hidden=false;
        employeeMsg('employee-feedback',employeeSelectableRole(rec.role)?'':'Denne tilsette har ei eldre stilling. Du kan behalda den eller velja ei av dei fem nye stillingane.',!employeeSelectableRole(rec.role));
        $('employee-form-card').scrollIntoView({behavior:'smooth',block:'start'});
      }));
      var pinButton=employeeButton('Ny PIN','btn secondary');
      actions.appendChild(pinButton);
      var deleteButton=employeeButton('Slett','btn danger');
      actions.appendChild(deleteButton);
      rowBody.appendChild(actions);
      var pinPanel=employeeNode('div','employee-inline');pinPanel.hidden=true;
      var pinLabel=employeeNode('label','','Ny PIN (4–8 siffer)');
      var pinInput=employeeNode('input');pinInput.type='password';pinInput.inputMode='numeric';pinInput.maxLength=8;
      pinPanel.appendChild(pinLabel);pinPanel.appendChild(pinInput);
      var pinActions=employeeNode('div','actions');
      pinActions.appendChild(employeeButton('Lagre PIN','btn primary',async function(){
        if(!employeeValidPin(pinInput.value)) {employeeMsg('employee-feedback','PIN må vera 4–8 siffer.',true);return;}
        if(window.ServiceCloud) {await window.ServiceCloud.manageStaff('pin',{id:rec.id,pin:pinInput.value});pinPanel.hidden=true;pinInput.value='';employeeMsg('employee-feedback','✓ PIN er oppdatert.',false);return;}
        try {await employeeSetPin(rec,pinInput.value);if(!employeePersist()) throw new Error('Kunne ikkje lagra PIN på denne PC-en.');pinPanel.hidden=true;pinInput.value='';employeeMsg('employee-feedback','✓ PIN-koden til '+rec.name+' er endra. Del den nye PIN-koden separat.',false);}
        catch(err){employeeMsg('employee-feedback',err.message,true);}
      }));
      pinActions.appendChild(employeeButton('Avbryt','btn secondary',function(){pinPanel.hidden=true;pinInput.value='';}));
      pinPanel.appendChild(pinActions);rowBody.appendChild(pinPanel);
      pinButton.addEventListener('click',function(){pinPanel.hidden=!pinPanel.hidden;if(!pinPanel.hidden) pinInput.focus();});
      var deletePanel=employeeNode('div','employee-confirm-delete');deletePanel.hidden=true;
      deletePanel.appendChild(employeeNode('p','','Vil du sletta '+rec.name+'? Innlogginga blir fjerna, men gamle serviceføringar blir verande.'));
      var deleteActions=employeeNode('div','actions');
      deleteActions.appendChild(employeeButton('Ja, slett tilsett','btn danger',async function(){
        if(window.ServiceCloud){await window.ServiceCloud.manageStaff('delete',{id:rec.id});return;}
        var confirmedAdminCount=employeeRecords.filter(function(e){return e.role==='administrator' && e.confirmed;}).length;
        if(rec.role==='administrator' && rec.confirmed && confirmedAdminCount<=1) {employeeMsg('employee-feedback','Den siste administratoren kan ikkje slettast.',true);deletePanel.hidden=true;return;}
        if(employeeRecords[0].id===rec.id && !employeeHasConfirmedAdmin()) {employeeMsg('employee-feedback','Den første brukaren kan ikkje slettast før ein administrator er stadfesta.',true);deletePanel.hidden=true;return;}
        employeeRecords=employeeRecords.filter(function(e){return e.id!==rec.id;});
        if(!employeePersist()){employeeMsg('employee-feedback','Kunne ikkje lagra slettinga.',true);return;}
        if(employeeEditingId===rec.id) employeeEditingId=null;
        if(employeeCurrent && employeeCurrent.id===rec.id) employeeCurrent=null;
        employeeRender();showPage('ansatte');
        employeeMsg('employee-feedback','✓ '+rec.name+' er sletta frå Ansatte.',false);
      }));
      deleteActions.appendChild(employeeButton('Avbryt','btn secondary',function(){deletePanel.hidden=true;}));
      deletePanel.appendChild(deleteActions);rowBody.appendChild(deletePanel);
      deleteButton.addEventListener('click',function(){deletePanel.hidden=!deletePanel.hidden;});
      if(!rec.confirmed) {
        var invite=employeeNode('div','employee-invite');
        invite.appendChild(employeeNode('p','','Stadfestingskode (send via e-post):'));
        invite.appendChild(employeeNode('code','',rec.confirmCode || 'Mangler kode'));
        var inviteActions=employeeNode('div','actions');
        var link=employeeNode('a','btn primary','✉️ Lag e-post');
        link.href=employeeMailto(rec);
        link.title='Opnar e-postprogrammet. Du må sjølv senda meldinga.';
        inviteActions.appendChild(link);
        var copyConfirmButton=employeeButton('Kopier kode','btn secondary',async function(){
          if(await employeeCopyCodeToClipboard(rec.confirmCode)) {
            employeeMarkCodeCopied(copyConfirmButton);
            employeeMsg('employee-feedback','✓ Koden er kopiert. Send han til '+rec.email+'.',false);
          } else {
            employeeResetCopyButton(copyConfirmButton,'Kopier kode');
            employeeMsg('employee-feedback','Kopier koden manuelt: '+rec.confirmCode,true);
          }
        });
        inviteActions.appendChild(copyConfirmButton);
        inviteActions.appendChild(employeeButton('Lag ny kode','btn secondary',async function(){
          if(window.ServiceCloud){await window.ServiceCloud.manageStaff('rotate',{id:rec.id});return;}
          rec.confirmCode=employeeNewCode();
          if(!employeePersist()){employeeMsg('employee-feedback','Kunne ikkje lagra den nye koden.',true);return;}
          employeeRender();employeeMsg('employee-feedback','✓ Ny kode laga for '+rec.name+'. Den gamle koden verkar ikkje lenger.',false);
        }));
        invite.appendChild(inviteActions);
        invite.appendChild(employeeNode('p','', 'E-posten blir ikkje sendt automatisk. Del PIN-koden på ein annan måte.'));
        rowBody.appendChild(invite);
      }
      row.appendChild(rowBody);
      folderContent.appendChild(row);
      });
      folder.appendChild(folderContent);
      list.appendChild(folder);
    });
  }
  async function employeeSave(event) {
    event.preventDefault();
    if (window.ServiceCloud) return window.ServiceCloud.saveStaff({id:employeeEditingId,name:$('employee-name').value,email:$('employee-email').value,role:employeeChosenRole(),pin:$('employee-initial-pin').value});
    if(!employeeCanManageStaff()) {employeeMsg('employee-feedback','Berre administrator eller den mellombelse oppsettsansvarlege kan endra tilsette.',true);return;}
    var name=$('employee-name').value.trim().replace(/\s+/g,' ');
    var email=employeeNormalEmail($('employee-email').value);
    var role=employeeChosenRole();
    var pin=$('employee-initial-pin').value;
    var first=!employeeRecords.length;
    var editing=employeeRecords.find(function(e){return e.id===employeeEditingId;});
    if(!name || name.length>120) {employeeMsg('employee-feedback','Skriv inn namnet på den tilsette.',true);return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {employeeMsg('employee-feedback','Skriv inn ei gyldig e-postadresse.',true);return;}
    if(!employeeSelectableRole(role)) {employeeMsg('employee-feedback','Vel ei av dei fem stillingane.',true);return;}
    if(employeeRecords.some(function(e){return e.email===email && (!editing || e.id!==editing.id);})) {employeeMsg('employee-feedback','Denne e-postadressa er registrert frå før.',true);return;}
    if((!editing || pin) && !employeeValidPin(pin)) {employeeMsg('employee-feedback','PIN må vera 4–8 siffer.',true);return;}
    if(editing && employeeRecords[0].id===editing.id && !employeeHasConfirmedAdmin() && (email!==editing.email || role!==editing.role)) {employeeMsg('employee-feedback','Du må først oppretta og stadfesta ein administrator før du kan endra di eiga e-postadresse eller stilling.',true);return;}
    if(editing && editing.role==='administrator' && editing.confirmed && role!=='administrator' && employeeRecords.filter(function(e){return e.role==='administrator' && e.confirmed;}).length<=1) {employeeMsg('employee-feedback','Du kan ikkje endra rolla til den siste administratoren.',true);return;}
    if(editing && employeeCurrent && editing.id===employeeCurrent.id && (email!==editing.email || role!==editing.role) && employeeRecords.filter(function(e){return e.role==='administrator' && e.confirmed && e.id!==editing.id;}).length===0) {employeeMsg('employee-feedback','Du må ha ein annan administrator før du endrar di eiga e-postadresse eller rolle.',true);return;}
    $('employee-save').disabled=true;
    try {
      var rec=editing || {id:employeeRandomHex(12),createdAt:new Date().toISOString()};
      var changed=!!editing && (rec.email!==email || rec.role!==role);
      if(!editing || pin) await employeeSetPin(rec,pin);
      rec.name=name;rec.email=email;rec.role=role;
      if(first) {rec.confirmed=true;rec.confirmCode='';employeeOneTimeRecoveryCode=await employeeGenerateRecovery(rec);}
      else if(!editing || changed) {rec.confirmed=false;rec.confirmCode=employeeNewCode();}
      // Berre fullfør opprettinga dersom informasjonen faktisk er lagra.
      // Rull tilbake ved lagringsfeil, slik at inga føring forsvinn frå lista ved eit uhell.
      if(!editing) employeeRecords.push(rec);
      if(!employeePersist()) {
        if(!editing) employeeRecords=employeeRecords.filter(function(e){return e.id!==rec.id;});
        throw new Error('Tilsette kunne ikkje lagrast på denne PC-en. Last ned HTML-fila og opna henne direkte i Chrome eller Edge. Kontroller at nettlesaren tillèt lokal lagring.');
      }
      if(first) employeeCurrent=rec;
      employeeEditingId=null;
      employeeRecentlyCreatedId=rec.id;
      employeeLastSavedName=name;
      showPage('ansatte',role,rec.id); // Éi rendring, med riktig mappe og ny person open.
      var listNotice=$('employee-list-notice');
      listNotice.textContent=(editing?'✓ Oppdatert: ':'✓ OPPRETTA OG LAGRA: ')+name+' → '+employeeRoleName(role)+'. Du finn personen rett nedanfor.';
      listNotice.hidden=false;
      var savedRow=Array.from(document.querySelectorAll('#employee-list .employee-person-entry')).find(function(el){return el.getAttribute('data-employee-id')===rec.id;});
      if(savedRow) {
        var savedFolder=savedRow.closest('.employee-role-folder');
        if(savedFolder) savedFolder.open=true;
        savedRow.open=true;
        savedRow.setAttribute('tabindex','-1');
        $('employee-list-card').classList.add('employee-list-updated');
        // Den nye personen kan liggja langt nede (t.d. under Lastebilsjåfør).
        // Hoppa til personen, ikkje berre til overskrifta på heile lista.
        requestAnimationFrame(function(){
          savedRow.scrollIntoView({behavior:'smooth',block:'center'});
          savedRow.focus({preventScroll:true});
        });
      } else {
        employeeMsg('employee-feedback','Registreringa er lagra, men lista kunne ikkje oppdaterast. Opna Ansatte-menyen på nytt.',true);
      }
      if(savedRow) employeeMsg('employee-feedback',first?'✓ '+name+' er lagra under Registrerte tilsette → '+employeeRoleName(role)+'.':editing?'✓ '+name+' er oppdatert og vist under Registrerte tilsette.':'✓ '+name+' er oppretta og vist under Registrerte tilsette. Send stadfestingskoden frå opplysningane til personen.',false);
      if(first && employeeOneTimeRecoveryCode) {
        window.alert('VIKTIG: Ta vare på gjenopprettingskoden din!\n\n'+employeeOneTimeRecoveryCode+'\n\nDenne koden blir berre vist denne eine gongen. Skriv han ned før du lukkar meldinga. Du kan bruka han via «Gløymt PIN?» dersom du gløymer PIN-koden.');
      }
    } catch(err) {employeeMsg('employee-feedback',err.message,true);}
    finally {$('employee-save').disabled=false;}
  }
  $('auth-recovery-form').addEventListener('submit',async function(event){
    event.preventDefault();
    var email=employeeNormalEmail($('auth-recovery-email').value);
    var code=$('auth-recovery-code').value.trim();
    var newPin=$('auth-recovery-pin').value;
    var rec=employeeRecords.find(function(e){return e.email===email && e.recoverySalt && e.recoveryHash;});
    if(!rec || !rec.recoverySalt || !rec.recoveryHash || !/^\d{12}$/.test(code) || !employeeValidPin(newPin)) {
      employeeMsg('auth-recovery-feedback','Kontroller e-postadresse, gjenopprettingskode og ny PIN.',true);return;
    }
    try {
      if(await employeePinDigest(code,rec.recoverySalt)!==rec.recoveryHash) {
        employeeMsg('auth-recovery-feedback','Feil gjenopprettingskode.',true);return;
      }
      await employeeSetPin(rec,newPin);
      employeeOneTimeRecoveryCode=await employeeGenerateRecovery(rec);
      if(!employeePersist()) throw new Error('Kunne ikkje lagra den nye PIN-koden.');
      employeeCurrent=rec;
      $('auth-recovery-form').reset();
      showPage(rec.confirmed?'ansatte':'oversikt');
      employeeMsg('employee-feedback','✓ PIN er nullstilt. Ta vare på den nye gjenopprettingskoden.',false);
      window.alert('PIN er nullstilt. Her er den nye gjenopprettingskoden din:\n\n'+employeeOneTimeRecoveryCode+'\n\nSkriv ned koden og oppbevar han trygt. Den gamle gjenopprettingskoden fungerer ikkje lenger.');
    } catch(err){employeeMsg('auth-recovery-feedback',err.message,true);}
  });
  // Førstegongsoppsett på låst innloggingsside. Same verifiserte opprettingslogikk
  // som Ansatte-skjemaet, for å unngå to ulike kontoregister.
  $('auth-setup-form').addEventListener('submit',async function(event){
    event.preventDefault();
    if(employeeRecords.length) { showPage('oversikt'); return; }
    $('employee-name').value=$('setup-name').value;
    $('employee-email').value=$('setup-email').value;
    employeeEditingRole($('setup-role').value);
     $('employee-custom-role').value='';
    employeeRoleHelp();
    $('employee-initial-pin').value=$('setup-pin').value;
    var btn=$('auth-setup-button'); btn.disabled=true;
    try {
      await employeeSave({preventDefault:function(){}});
      if(employeeRecords.length && employeeCurrent && employeeCurrent.confirmed){
        $('auth-setup-form').reset();
        $('setup-pin').value='';
      } else {
        employeeMsg('auth-setup-feedback',$('employee-feedback').textContent || 'Kunne ikkje oppretta kontoen. Prøv igjen.',true);
      }
    } catch(err){employeeMsg('auth-setup-feedback',err.message || 'Kunne ikkje oppretta brukaren.',true);}
    finally {btn.disabled=false;}
  });
  $('employee-form').addEventListener('submit',employeeSave);
  $('employee-cancel').addEventListener('click',function(){employeeEditingId=null;employeeResetForm();employeeMsg('employee-feedback','',false);});
  $('auth-login-form').addEventListener('submit',async function(event){
    event.preventDefault();
    var email=employeeNormalEmail($('auth-email').value);
    var pin=$('auth-pin').value;
    var rec=employeeRecords.find(function(e){return e.email===email;});
    var btn=$('auth-login-button');btn.disabled=true;
    try {
      var correct=await employeeCheckPin(rec,pin);
      if(!correct) {employeeLoginFailures++;employeeMsg('auth-feedback','Feil e-postadresse eller PIN-kode.',true);return;}
      employeeLoginFailures=0;
      employeeCurrent=rec;
      $('auth-pin').value='';
      employeeMsg('auth-feedback','',false);
      employeeMsg('auth-confirm-feedback','',false);
      showPage(rec.confirmed ? 'oversikt' : 'ansatte');
    } catch(err){employeeMsg('auth-feedback',err.message,true);}
    finally {btn.disabled=false;}
  });
  $('auth-confirm-form').addEventListener('submit',function(event){
    event.preventDefault();
    if(!employeeCurrent || employeeCurrent.confirmed) return;
    var code=$('auth-confirm-code').value.trim();
    if(!/^\d{6}$/.test(code) || code!==employeeCurrent.confirmCode) {employeeMsg('auth-confirm-feedback','Feil stadfestingskode. Kontroller koden du fekk frå administrator.',true);return;}
    employeeCurrent.confirmed=true;
    employeeCurrent.confirmCode='';
    if(!employeePersist()) {employeeCurrent.confirmed=false;employeeCurrent.confirmCode=code;employeeMsg('auth-confirm-feedback','Kunne ikkje lagra stadfestinga på denne PC-en.',true);return;}
    $('auth-confirm-code').value='';
    showPage('oversikt');
  });
  function employeeLogout() {
    if(window.ServiceCloud) {window.ServiceCloud.signOut();return;}
    employeeClearRecovery();
    $('employee-recovery-details').open=false;
    employeeCurrent=null;
    employeeOneTimeRecoveryCode='';
    employeeEditingId=null;
    $('auth-pin').value='';
    $('auth-confirm-code').value='';
    employeeMsg('auth-feedback','',false);
    showPage('oversikt');
  }
  $('employee-logout').addEventListener('click',employeeLogout);
  $('auth-signout').addEventListener('click',employeeLogout);
  window.addEventListener('storage',function(event){
    if(event.key!==employeeKey) return;
    try {
      var updated=JSON.parse(event.newValue || '[]');
      if(!Array.isArray(updated)) return;
      employeeRecords=updated.filter(function(e){return e && e.id && e.email && employeeIsStoredRole(e.role) && e.pinHash && e.pinSalt;});
      employeeCurrent=null; // Ny innlogging når kontolista endrar seg i ei anna fane.
      showPage('oversikt');
    } catch(err){ employeeCurrent=null;showPage('oversikt'); }
  });


    var inputs = {name: $('name'), brand: $('brand'), model: $('model'), hours: $('hours'), by: $('by'), dealer: $('dealer'), machineFor: $('machineFor')};
  var feedback = $('feedback');
  var dealerFeedback = $('dealer-feedback');
  function tellDealer(message, bad) {
    dealerFeedback.textContent = message;
    dealerFeedback.className = 'feedback ' + (bad ? 'bad' : 'good');
  }
  function normaliseDealer(value) { return String(value || '').trim().replace(/\s+/g, ' '); }
  function findDealer(value) {
    var key = normaliseDealer(value).toLocaleLowerCase('nb-NO');
    return dealers.find(function (d) { return d.toLocaleLowerCase('nb-NO') === key; });
  }
  function persistDealers() {
    try { localStorage.setItem(dealersKey, JSON.stringify(dealers)); return true; }
    catch (error) { return false; }
  }
  function renderDealerSelect(selected) {
    var select = $('dealer');
    var previous = selected === undefined ? select.value : selected;
    select.replaceChildren();
    var empty = make('option','', 'Vel forhandlar (valfritt)');
    empty.value = '';
    select.appendChild(empty);
    dealers.forEach(function (dealer) {
      var option = make('option','', dealer);
      option.value = dealer;
      select.appendChild(option);
    });
    // Maskinar som brukar ein tidlegare forhandlar kan framleis redigerast.
    if (previous && !findDealer(previous)) {
      var old = make('option','', previous + ' (tidlegare forhandlar)');
      old.value = previous;
      select.appendChild(old);
    }
    select.value = previous || '';
  }
  function renderDealers() {
    var list = $('dealer-list');
    list.replaceChildren();
    if (!dealers.length) {
      list.appendChild(make('p','dealer-empty','Ingen forhandlarar lagde til enno.'));
      return;
    }
    dealers.forEach(function (dealer) {
      var entry = make('div','dealer-entry');
      var row = make('div','dealer-row');
      row.appendChild(make('span','',dealer));
      var remove = make('button','', 'Slett');
      remove.type = 'button';
      remove.setAttribute('aria-label','Slett forhandlar ' + dealer);
      row.appendChild(remove);
      entry.appendChild(row);

      // Stadfest sletting inne på sida, utan sprettoppvindauge som kan bli blokkert.
      var confirmation = make('div','dealer-confirm');
      confirmation.hidden = true;
      confirmation.appendChild(make('span','','Vil du sletta ' + dealer + ' frå forhandlarlista? Maskinane blir ikkje sletta.'));
      var yes = make('button','dealer-yes','Ja, slett');
      yes.type = 'button';
      yes.setAttribute('aria-label','Ja, slett forhandlar ' + dealer);
      var no = make('button','dealer-no','Avbryt');
      no.type = 'button';
      no.setAttribute('aria-label','Avbryt sletting av ' + dealer);
      confirmation.appendChild(yes);
      confirmation.appendChild(no);
      entry.appendChild(confirmation);

      remove.addEventListener('click',function () {
        confirmation.hidden = false;
        remove.disabled = true;
        tellDealer('Stadfest slettinga med «Ja, slett» under ' + dealer + '.',false);
        yes.focus();
      });
      no.addEventListener('click',function () {
        confirmation.hidden = true;
        remove.disabled = false;
        tellDealer('Slettinga vart avbroten. ' + dealer + ' står framleis i lista.',false);
        remove.focus();
      });
      yes.addEventListener('click',function () {
        var selectedDealer = $('dealer').value;
        dealers = dealers.filter(function (d) { return d !== dealer; });
        var persisted = persistDealers();
        renderDealerSelect(selectedDealer === dealer ? '' : selectedDealer);
        renderDealers();
        tellDealer(persisted ? '✓ ' + dealer + ' er sletta frå forhandlarlista og rullegardinmenyen.' : dealer + ' er fjerna frå lista, men nettlesaren kunne ikkje lagra slettinga.',!persisted);
      });
      list.appendChild(entry);
    });
  }
  function addDealer() {
    var value = normaliseDealer($('new-dealer').value);
    if (!value) { tellDealer('Skriv inn namnet på ein forhandlar først.',true); $('new-dealer').focus(); return; }
    var existing = findDealer(value);
    if (existing) {
      tellDealer('Denne forhandlaren finst allereie i lista.',true);
      renderDealerSelect(existing);
      return;
    }
    dealers.push(value);
    dealers.sort(function (a,b) { return a.localeCompare(b,'nb-NO'); });
    var persisted = persistDealers();
    renderDealerSelect(value);
    renderDealers();
    $('new-dealer').value = '';
    tellDealer(persisted ? '✓ ' + value + ' er lagt til. Du kan no velja han når du registrerer ei maskin.' : value + ' er lagt til i lista, men kunne ikkje lagrast på denne PC-en.', !persisted);
  }
  $('add-dealer').addEventListener('click',addDealer);
  $('new-dealer').addEventListener('keydown',function (event) {
    if (event.key === 'Enter') { event.preventDefault(); addDealer(); }
  });

  function tell(message, bad) {
    feedback.textContent = message;
    feedback.className = 'feedback ' + (bad ? 'bad' : 'good');
  }
  if(window.ServiceCloud) window.ServiceCloud.refreshStaffUI=function(rows,revealId){
    employeeRecords=rows.map(function(row){return {id:row.id,name:row.full_name,email:row.email,role:row.role,confirmed:row.confirmed,pinHash:'cloud-managed',pinSalt:'00',createdAt:row.created_at,confirmCode:window.ServiceCloud.tempCodes[row.id]||''};});
    employeeCurrent=employeeRecords.find(function(rec){return rec.id===window.ServiceCloud.profile.id;}) || null;
    employeeEditingId=null;
    if(revealId) employeeRecentlyCreatedId=revealId;
    showPage('ansatte', (employeeRecords.find(function(r){return r.id===revealId;})||{}).role, revealId);
    if(revealId) {
      var row=document.querySelector('[data-employee-id="'+revealId+'"]');
      if(row){row.open=true;var grp=row.closest('.employee-role-folder');if(grp)grp.open=true;row.scrollIntoView({block:'center'});}
    }
  };
  function showPage(page, revealRole, revealEmployeeId) {
    if (['oversikt','maskinregisteret','servicebok','rapporter','ansatte'].indexOf(page) === -1) page = 'oversikt';
    // Forsøk på direkte lenkjer, #hash eller programmatisk navigering blir òg stoppa.
    if(employeeCurrent && employeeCurrent.confirmed && !employeeCanOpenPage(page)) {
      page='oversikt';
      try {if(history.replaceState) history.replaceState(null,'','#oversikt');}catch(err){}
    }
    if(page!=='ansatte' || !employeeCurrent || !employeeCurrent.confirmed || employeeCurrent.role!=='administrator') {
      employeeClearRecovery();
      $('employee-recovery-details').open=false;
    }
    // Alle sider krev innlogging, også når det ikkje finst nokon konto på denne PC-en.
    var needsLogin = !employeeCurrent || !employeeCurrent.confirmed;
    document.body.classList.toggle('auth-required',needsLogin);
    $('employee-auth').hidden = !needsLogin;
    $('menu').hidden = needsLogin;
    employeeUpdateVisibleMenus();
    document.querySelectorAll('.page').forEach(function (section) { section.hidden = needsLogin || section.id !== page; });
    document.querySelectorAll('[data-page]').forEach(function (link) { link.classList.toggle('active', !needsLogin && link.dataset.page === page); });
    $('menu').open = false;
    employeeRenderSession();
    if (needsLogin) employeeRenderAuth();
    else { if (page === 'ansatte') employeeRender(revealRole,revealEmployeeId); if(page==='rapporter') faultChoices(); if(page==='servicebok') faultRender(); if(page==='maskinregisteret') render(); employeeApplyRole(); }
  }
  document.querySelectorAll('[data-page]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      var page = link.dataset.page;
      if(!employeeCanOpenPage(page)) {showPage('oversikt');return;}
      if (history.replaceState) history.replaceState(null, '', '#' + page);
      showPage(page);
    });
  });
  showPage(location.hash.slice(1) || 'oversikt');

  try {
    var existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(existing)) machines = existing.filter(function (m) { return m && typeof m === 'object' && m.id; }).map(function (m) {
      // Ta også med maskinar utan merke/modell. Tidlegare vart desse filtrerte bort ved ny opning.
      var hours=Number(m.hours);
      return {id:String(m.id),name:String(m.name||''),brand:String(m.brand||''),model:String(m.model||''),hours:Number.isFinite(hours)&&hours>=0?hours:0,registeredBy:String(m.registeredBy||''),dealer:String(m.dealer||''),machineFor:String(m.machineFor||'')};
    });
  } catch (err) { storageWorks = false; }
  var firstDealerLoad = false;
  try {
    var storedDealerText = localStorage.getItem(dealersKey);
    firstDealerLoad = storedDealerText === null;
    var storedDealers = JSON.parse(storedDealerText || '[]');
    if (Array.isArray(storedDealers)) storedDealers.forEach(function (d) {
      var clean = normaliseDealer(d);
      if (clean && !findDealer(clean)) dealers.push(clean);
    });
  } catch (error) { /* Appen kan framleis brukast utan lagra forhandlarar. */ }
  // Importer berre ein gong: sletta forhandlarar skal ikkje koma att ved neste opning.
  if (firstDealerLoad) machines.forEach(function (machine) {
    var dealer = normaliseDealer(machine.dealer);
    if (dealer && !findDealer(dealer)) dealers.push(dealer);
  });
  dealers.sort(function (a,b) { return a.localeCompare(b,'nb-NO'); });
  if (firstDealerLoad) persistDealers();
  renderDealerSelect();
  renderDealers();

  // Mekanikarregisteret er uavhengig av maskinar og forhandlarar.
  var mechanicsKey = 'servicelogg.mekanikarar.v1';
  // Behald den eksisterande namnelista uendra, slik at v16-data ikkje går tapt.
  var mechanicStatusesKey = 'servicelogg.mekanikarstatus.v1';
  var mechanics = [];
  var mechanicStatuses = {};
  try {
    var storedStatuses = JSON.parse(localStorage.getItem(mechanicStatusesKey) || '{}');
    if (storedStatuses && typeof storedStatuses === 'object' && !Array.isArray(storedStatuses)) mechanicStatuses = storedStatuses;
  } catch (error) { /* Status kan framleis endrast i denne økta. */ }
  var mechanicFeedback = $('mechanic-feedback');
  function normaliseMechanic(value) { return String(value || '').trim().replace(/\s+/g, ' '); }
  function mechanicStatusId(name) { return normaliseMechanic(name).toLocaleLowerCase('nb-NO'); }
  function persistMechanicStatuses() {
    try { localStorage.setItem(mechanicStatusesKey, JSON.stringify(mechanicStatuses)); return true; }
    catch (error) { return false; }
  }
  function findMechanic(value) {
    var key = normaliseMechanic(value).toLocaleLowerCase('nb-NO');
    return mechanics.find(function (name) { return name.toLocaleLowerCase('nb-NO') === key; });
  }
  function tellMechanic(message, bad) {
    mechanicFeedback.textContent = message;
    mechanicFeedback.className = 'feedback ' + (bad ? 'bad' : 'good');
  }
  function persistMechanics() {
    try { localStorage.setItem(mechanicsKey, JSON.stringify(mechanics)); return true; }
    catch (error) { return false; }
  }
  function renderMechanics() {
    var list = $('mechanic-list');
    list.replaceChildren();
    $('mechanic-count').textContent = mechanics.length === 1 ? '1 mekanikar' : mechanics.length + ' mekanikarar';
    if (!mechanics.length) {
      list.appendChild(make('p','dealer-empty','Ingen mekanikarar lagde til enno.'));
      return;
    }
    mechanics.forEach(function (name) {
      var entry = make('div','dealer-entry');
      var row = make('div','dealer-row mechanic-row');
      row.appendChild(make('span','mechanic-name',name));
      var controls = make('div','mechanic-controls');
      var statusLabel = make('label','mechanic-status');
      statusLabel.appendChild(make('span','','Status'));
      var statusSelect = make('select');
      statusSelect.setAttribute('aria-label','Status for ' + name);
      [['','Vel status'],['inne','Inne mekaniker'],['ute','Ute mekaniker'],['begge','Ute/Inne mekaniker']].forEach(function (choice) {
        var option = make('option','',choice[1]);
        option.value = choice[0];
        statusSelect.appendChild(option);
      });
      var statusId = mechanicStatusId(name);
      var storedStatus = mechanicStatuses[statusId];
      statusSelect.value = storedStatus === 'inne' || storedStatus === 'ute' || storedStatus === 'begge' ? storedStatus : '';
      statusSelect.addEventListener('change',function () {
        if (statusSelect.value) mechanicStatuses[statusId] = statusSelect.value;
        else delete mechanicStatuses[statusId];
        var saved = persistMechanicStatuses();
        tellMechanic(saved ? '✓ Status for ' + name + ' er lagra.' : 'Status for ' + name + ' er endra, men kunne ikkje lagrast på denne PC-en.',!saved);
      });
      statusLabel.appendChild(statusSelect);
      controls.appendChild(statusLabel);
      var remove = make('button','','Slett');
      remove.type = 'button';
      remove.setAttribute('aria-label','Slett mekanikar ' + name);
      controls.appendChild(remove);
      row.appendChild(controls);
      entry.appendChild(row);
      var confirmation = make('div','dealer-confirm');
      confirmation.hidden = true;
      confirmation.appendChild(make('span','','Vil du sletta ' + name + ' frå mekanikarlista?'));
      var yes = make('button','dealer-yes','Ja, slett');
      yes.type = 'button';
      yes.setAttribute('aria-label','Ja, slett mekanikar ' + name);
      var no = make('button','dealer-no','Avbryt');
      no.type = 'button';
      no.setAttribute('aria-label','Avbryt sletting av mekanikar ' + name);
      confirmation.appendChild(yes);
      confirmation.appendChild(no);
      entry.appendChild(confirmation);
      remove.addEventListener('click',function () {
        confirmation.hidden = false;
        remove.disabled = true;
        tellMechanic('Stadfest slettinga med «Ja, slett» under ' + name + '.',false);
        yes.focus();
      });
      no.addEventListener('click',function () {
        confirmation.hidden = true;
        remove.disabled = false;
        tellMechanic('Slettinga vart avbroten. ' + name + ' står framleis i lista.',false);
        remove.focus();
      });
      yes.addEventListener('click',function () {
        mechanics = mechanics.filter(function (m) { return m !== name; });
        delete mechanicStatuses[mechanicStatusId(name)];
        var saved = persistMechanics();
        var statusesSaved = persistMechanicStatuses();
        saved = saved && statusesSaved;
        renderMechanics();
        serviceChoices();
        tellMechanic(saved ? '✓ ' + name + ' er sletta frå mekanikarlista.' : name + ' er fjerna, men slettinga kunne ikkje lagrast på denne PC-en.',!saved);
      });
      list.appendChild(entry);
    });
  }
  function addMechanic() {
    var name = normaliseMechanic($('new-mechanic').value);
    if (!name) { tellMechanic('Skriv inn namnet på mekanikaren først.',true); $('new-mechanic').focus(); return; }
    if (findMechanic(name)) { tellMechanic('Denne mekanikaren finst allereie i lista.',true); return; }
    mechanics.push(name);
    mechanics.sort(function (a,b) { return a.localeCompare(b,'nb-NO'); });
    var saved = persistMechanics();
    renderMechanics();
    serviceChoices();
    $('new-mechanic').value = '';
    tellMechanic(saved ? '✓ ' + name + ' er lagt til i mekanikarlista.' : name + ' er lagt til, men kunne ikkje lagrast på denne PC-en.',!saved);
  }
  try {
    var savedMechanics = JSON.parse(localStorage.getItem(mechanicsKey) || '[]');
    if (Array.isArray(savedMechanics)) savedMechanics.forEach(function (name) {
      var clean = normaliseMechanic(name);
      if (clean && !findMechanic(clean)) mechanics.push(clean);
    });
  } catch (error) { /* Lista fungerer likevel i denne økta. */ }
  mechanics.sort(function (a,b) { return a.localeCompare(b,'nb-NO'); });
  renderMechanics();
  $('add-mechanic').addEventListener('click',addMechanic);
  $('new-mechanic').addEventListener('keydown',function (event) {
    if (event.key === 'Enter') { event.preventDefault(); addMechanic(); }
  });

  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(machines)); storageWorks = true; }
    catch (err) { storageWorks = false; }
  }
  function make(tag, cls, value) {
    var element = document.createElement(tag);
    if (cls) element.className = cls;
    if (value !== undefined) element.textContent = value;
    return element;
  }
  function detail(parent, label, value) {
    var p = make('p');
    p.appendChild(make('strong','',label + ':'));
    p.appendChild(document.createTextNode(' ' + (value === '' || value === null || value === undefined ? 'Ikkje oppgitt' : String(value))));
    parent.appendChild(p);
  }
  function resetForm() {
    editingId = null;
    ['name','brand','model','hours','by','dealer','machineFor'].forEach(function(id){ $(id).value=''; });
    $('form-title').textContent = 'Registrer maskin';
    $('save').textContent = '+ Legg til maskin';
    $('cancel').hidden = true;
    renderDealerSelect('');
  }
  // Samla høgaste FAKTISKE timetal på tvers av heile appen.
  // Namn samanliknast utan omsyn til små/store bokstavar eller ekstra mellomrom;
  // maskin-ID gjer at eldre føringar også tel når ei maskin har skifta namn.
  // Serviceintervall og «neste service ved» er prognosar og må ikkje takast med.
  function machineHourNumber(value) {
    if (value===null || value===undefined || String(value).trim()==='') return null;
    var parsed=Number(String(value).replace(/\s/g,'').replace(',','.'));
    return Number.isFinite(parsed) && parsed>=0 ? parsed : null;
  }
  function machineHourName(value) {
    return String(value||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('nb-NO');
  }
  function machineHighestHours(machine) {
    var visibleName=String(machine.name||((machine.brand||'')+' '+(machine.model||'')).trim()||'Maskin');
    var key=machineHourName(visibleName);
    var linkedIds=new Set([String(machine.id)]);
    var max=null;
    function consider(value) {
      var amount=machineHourNumber(value);
      if(amount!==null && (max===null || amount>max)) max=amount;
    }
    // Maskinar med same namn skal visa same høgaste timetal.
    (Array.isArray(machines)?machines:[]).forEach(function(m){
      var n=String(m.name||((m.brand||'')+' '+(m.model||'')).trim()||'Maskin');
      if(machineHourName(n)===key){linkedIds.add(String(m.id));consider(m.hours);}
    });
    function sameMachine(record) {
      return linkedIds.has(String(record.machineId||'')) ||
        (!!key && machineHourName(record.machineName)===key);
    }
    (Array.isArray(serviceEntries)?serviceEntries:[]).forEach(function(entry){
      if(sameMachine(entry)) consider(entry.hours);
      if(Array.isArray(entry.history)) entry.history.forEach(function(old){
        if(old && (sameMachine(old) || sameMachine(entry))) consider(old.hours);
      });
    });
    (Array.isArray(faultReports)?faultReports:[]).forEach(function(report){
      if(sameMachine(report)) consider(report.hours);
    });
    return max;
  }
  // Oppdater det FAKTISKE timetalet i Maskinregisteret, ikkje berre teksten på skjermen.
  // Ta med historiske serviceføringar, alle arbeidstypar og feilmeldingar.
  // Gå aldri ned når ei seinare avlesing er lågare. Same maskinnamn blir synkroniserte.
  function machineSyncRegisteredHours() {
    if (!machines.length) return false;
    // Les av alle maskinane fyrst, slik at to like namn får same maksimum.
    var readings=machines.map(function(m){return machineHighestHours(m);});
    var changed=false;
    machines.forEach(function(m,index){
      var found=readings[index],current=machineHourNumber(m.hours);
      if(found!==null && (current===null || found>current)){
        m.hours=found;
        changed=true;
      }
    });
    if(changed) persist();
    return changed;
  }
  function machineHoursText(hours) {
    return hours===null ? 'Ingen timetal registrert' :
      hours.toLocaleString('nb-NO',{maximumFractionDigits:2})+' timar';
  }
  function render() {
    var list = $('items');
    list.replaceChildren();
    $('count').textContent = machines.length === 1 ? '1 maskin' : machines.length + ' maskinar';
    if (!machines.length) { list.appendChild(make('div','empty','Ingen maskinar registrerte enno.')); return; }
    machines.forEach(function (m) {
      var wrapper = make('div','machine' + (m.id === highlightedId ? ' new' : ''));
      var top = make('div','machine-top');
      var card = make('details','machine-details');
      card.dataset.machineId=String(m.id);
      var summary = make('summary');
      var machineHours=machineHighestHours(m);
      var summaryMain=make('span','machine-summary-main');
      summaryMain.appendChild(make('span','machine-summary-name',m.name || (m.brand + ' ' + m.model) || 'Maskin'));
      var hoursLine=make('span','machine-summary-hours'+(machineHours===null?' missing':''));
      hoursLine.appendChild(make('span','machine-summary-hours-label','Timetal:'));
      hoursLine.appendChild(make('span','machine-summary-hours-number',machineHoursText(machineHours)));
      summaryMain.appendChild(hoursLine);
      summary.appendChild(summaryMain);
      summary.appendChild(make('span','arrow','❯'));
      card.appendChild(summary);
      var body = make('div','detailbox');
      detail(body,'Merke',m.brand); detail(body,'Modell',m.model);
      detail(body,'Timetal på maskina',machineHoursText(machineHourNumber(m.hours)));
      detail(body,'Høgaste registrerte timetal i appen',machineHoursText(machineHours));
      detail(body,'Registrert av',m.registeredBy || ''); detail(body,'Forhandlar',m.dealer || ''); detail(body,'Maskin til',m.machineFor || '');
      var actions = make('div','detailbuttons');
      var edit = make('button','btn secondary','Rediger'); edit.type = 'button';
      edit.addEventListener('click',function () {
        editingId = m.id;
        inputs.name.value = m.name || ''; inputs.brand.value = m.brand;
        inputs.model.value = m.model; inputs.hours.value = m.hours;
        inputs.by.value = m.registeredBy || ''; renderDealerSelect(m.dealer || ''); inputs.machineFor.value = m.machineFor || '';
        $('form-title').textContent = 'Rediger maskin';
        $('save').textContent = 'Lagre endringar'; $('cancel').hidden = false;
        tell('',false); $('form-card').scrollIntoView({behavior:'smooth',block:'start'});
      });
      actions.appendChild(edit);
      body.appendChild(actions); card.appendChild(body);
      top.appendChild(card);
      var del = make('button','delete-shortcut','Slett'); del.type = 'button';
      del.setAttribute('aria-label','Slett ' + (m.name || m.brand + ' ' + m.model));
      top.appendChild(del);
      wrapper.appendChild(top);
      var confirmation = make('div','confirm-box');
      confirmation.hidden = true;
      confirmation.appendChild(make('span','','Vil du sletta denne maskina?'));
      var yes = make('button','btn danger','Ja, slett'); yes.type = 'button';
      var no = make('button','btn secondary','Avbryt'); no.type = 'button';
      confirmation.appendChild(yes); confirmation.appendChild(no);
      wrapper.appendChild(confirmation);
      del.addEventListener('click',function () { confirmation.hidden = false; yes.focus(); });
      no.addEventListener('click',function () { confirmation.hidden = true; del.focus(); });
      yes.addEventListener('click',function () {
        machines = machines.filter(function (item) { return item.id !== m.id; });
        if (editingId === m.id) resetForm();
        if (highlightedId === m.id) highlightedId = null;
        persist();
        render();
        serviceChoices(); faultChoices(); faultRender();
        $('saved-message').hidden = false;
        $('saved-message').textContent = storageWorks ? '✓ Maskina er sletta frå Registrerte maskinar.' : 'Maskina er fjerna frå lista, men nettlesaren hindrar varig lagring.';
        tell(storageWorks ? 'Maskina er sletta.' : 'Maskina er fjerna, men slettinga er ikkje lagra på PC-en.',!storageWorks);
      });
      list.appendChild(wrapper);
    });
  }
  $('cancel').addEventListener('click',function () { resetForm(); tell('',false); });
  $('save').addEventListener('click',function () {
    try {
    // Skriv alltid ei melding når knappen blir trykt, også ved feil i felta.
    tell('Kontrollerer opplysningane …',false);
    var name = inputs.name.value.trim();
    var brand = inputs.brand.value.trim();
    var model = inputs.model.value.trim();
    var hoursText = inputs.hours.value.trim().replace(/\s/g,'').replace(',','.');
    var registeredBy = inputs.by.value.trim();
    var dealer = inputs.dealer.value.trim();
    var machineFor = inputs.machineFor.value.trim();
    // Knappen legg ALLTID maskina i lista, også om nokre felt er tomme.
    // Eit tomt timetal blir rekna som 0. Feil format blir òg 0.
    var hourNumber = Number(hoursText);
    if (!Number.isFinite(hourNumber) || hourNumber < 0) hourNumber = 0;
    if (!name && !brand && !model) name = 'Maskin ' + (machines.length + 1);
    var data = {name:name,brand:brand,model:model,hours:hourNumber,registeredBy:registeredBy,dealer:dealer,machineFor:machineFor};
    var wasEditing = !!editingId;
    if (wasEditing) {
      var found = machines.find(function (m) { return m.id === editingId; });
      if (found) { Object.assign(found,data); highlightedId = found.id; }
      else wasEditing = false;
    }
    if (!wasEditing) {
      data.id = String(Date.now()) + '-' + Math.random().toString(36).slice(2,8);
      machines.unshift(data); highlightedId = data.id;
    }
    machineSyncRegisteredHours();
    persist();
    render(); resetForm(); serviceChoices(); faultChoices(); faultRender();
    var title = name || ((brand + ' ' + model).trim()) || 'Maskin ' + machines.length;
    $('saved-message').hidden = false;
    $('saved-message').textContent = (wasEditing ? '✓ Oppdatert: ' : '✓ Lagt til under Registrerte maskinar: ') + title;
    tell(storageWorks ? '✓ Maskina er lagt til i Registrerte maskinar!' : '✓ Maskina er lagt til i lista, men nettlesaren hindrar varig lagring.',!storageWorks);
    $('registered').scrollIntoView({behavior:'smooth',block:'start'});
    } catch (error) { tell('Noko gjekk gale: ' + error.message, true); }
  });

  // Servicehistorikk. Eiga lagring; eksisterande maskinar, forhandlarar og mekanikarar blir ikkje endra.
  var serviceKey = 'servicelogg.service.v1';
  var serviceEntries = [];
  var editingServiceId = null;
  var serviceStorageWorks = true;
  var serviceFields = {
    date: $('service-date'), recordedTime: $('service-recorded-time'), type: $('service-type'), machine: $('service-machine'),
    mechanic: $('service-mechanic'), hours: $('service-hours'),
    nextHours: $('service-next-hours'),
    cost: $('service-cost'), work: $('service-work'), notes: $('service-notes')
  };
  try {
    var storedServices = JSON.parse(localStorage.getItem(serviceKey) || '[]');
    if (Array.isArray(storedServices)) serviceEntries = storedServices.filter(function(s){ return s && s.id && s.date && s.machineName; });
  } catch (error) { serviceStorageWorks = false; }
  // Eigen kalender: opnar alltid direkte på sida, også når nettlesaren blokkerer showPicker().
  var calendarPanel = $('service-calendar');
  var calendarButton = $('service-date-open');
  var calendarMonth = new Date().getMonth();
  var calendarYear = new Date().getFullYear();
  var calendarMonthNames = ['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember'];
  function calendarPad(number) { return String(number).padStart(2,'0'); }
  function calendarIso(year,month,day) { return year+'-'+calendarPad(month+1)+'-'+calendarPad(day); }
  function calendarParse(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    if (!match) return null;
    var year = Number(match[1]), month = Number(match[2])-1, day = Number(match[3]);
    var date = new Date(year,month,day);
    return date.getFullYear()===year && date.getMonth()===month && date.getDate()===day ? date : null;
  }
  function calendarClose() {
    calendarPanel.hidden = true;
    calendarButton.setAttribute('aria-expanded','false');
  }
  function calendarChoose(value) {
    serviceFields.date.value = value;
    serviceFields.date.dispatchEvent(new Event('input',{bubbles:true}));
    serviceFields.date.dispatchEvent(new Event('change',{bubbles:true}));
    var selected = calendarParse(value);
    if (selected) $('service-date-help').textContent = 'Vald dato: '+selected.toLocaleDateString('nb-NO',{day:'numeric',month:'long',year:'numeric'})+'.';
    calendarClose();
    calendarButton.focus();
  }
  function calendarDraw() {
    $('service-calendar-month').textContent = calendarMonthNames[calendarMonth]+' '+calendarYear;
    var days = $('service-calendar-days');
    days.replaceChildren();
    var firstDay = new Date(calendarYear,calendarMonth,1).getDay();
    var blanks = (firstDay+6)%7; // måndag er fyrste dag i veka
    for (var blank=0;blank<blanks;blank++) days.appendChild(make('span','calendar-blank',''));
    var totalDays = new Date(calendarYear,calendarMonth+1,0).getDate();
    var today = new Date();
    var todayIso = calendarIso(today.getFullYear(),today.getMonth(),today.getDate());
    for (var day=1;day<=totalDays;day++) {
      (function(dayNumber) {
        var iso = calendarIso(calendarYear,calendarMonth,dayNumber);
        var dayButton = make('button','',String(dayNumber));
        dayButton.type = 'button';
        dayButton.setAttribute('aria-label','Vel '+new Date(calendarYear,calendarMonth,dayNumber).toLocaleDateString('nb-NO',{day:'numeric',month:'long',year:'numeric'}));
        if (iso===todayIso) dayButton.classList.add('is-today');
        if (iso===serviceFields.date.value) {
          dayButton.classList.add('is-selected');
          dayButton.setAttribute('aria-current','date');
        }
        dayButton.addEventListener('click',function(){calendarChoose(iso);});
        days.appendChild(dayButton);
      })(day);
    }
  }
  calendarButton.addEventListener('click',function() {
    if (!calendarPanel.hidden) { calendarClose(); return; }
    var selected = calendarParse(serviceFields.date.value) || new Date();
    calendarMonth = selected.getMonth();
    calendarYear = selected.getFullYear();
    calendarDraw();
    calendarPanel.hidden = false;
    calendarButton.setAttribute('aria-expanded','true');
  });
  $('service-calendar-prev').addEventListener('click',function() {
    var previous = new Date(calendarYear,calendarMonth-1,1);
    calendarYear = previous.getFullYear(); calendarMonth = previous.getMonth(); calendarDraw();
  });
  $('service-calendar-next').addEventListener('click',function() {
    var next = new Date(calendarYear,calendarMonth+1,1);
    calendarYear = next.getFullYear(); calendarMonth = next.getMonth(); calendarDraw();
  });
  $('service-calendar-today').addEventListener('click',function() {
    var today = new Date();
    calendarChoose(calendarIso(today.getFullYear(),today.getMonth(),today.getDate()));
  });
  $('service-calendar-close').addEventListener('click',function() {calendarClose();calendarButton.focus();});
  document.addEventListener('keydown',function(event) {
    if (event.key==='Escape' && !calendarPanel.hidden) {calendarClose();calendarButton.focus();}
  });
  serviceFields.date.addEventListener('change',function() {
    if (!calendarPanel.hidden) {
      var selected = calendarParse(serviceFields.date.value);
      if (selected) {calendarMonth=selected.getMonth();calendarYear=selected.getFullYear();}
      calendarDraw();
    }
  });
  function serviceToday() {
    var d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0,10);
  }
  // Tidspunkt ført er faktisk klokkeslett då registreringa blir lagra, ikkje servicedatoen.
  // Bruk lokal tid i visinga og ISO-tid i lagringa slik at historikken er eintydig.
  function serviceClockTime(date) {
    return date.toLocaleTimeString('nb-NO',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
  }
  function serviceRecordedFull(value) {
    if (!value) return '';
    var d = new Date(value);
    if (!Number.isFinite(d.getTime())) return '';
    return d.toLocaleDateString('nb-NO',{day:'2-digit',month:'2-digit',year:'numeric'})+' kl. '+serviceClockTime(d);
  }
  function serviceRefreshClock() {
    if (editingServiceId) return;
    serviceFields.recordedTime.value=serviceClockTime(new Date());
  }
  // Oppdater klokkeslettet kontinuerleg utan at brukaren må trykkja på feltet.
  // Les alltid systemklokka på nytt, slik at visinga også rettar seg etter søvn/oppvakning.
  window.addEventListener('focus',serviceRefreshClock);
  document.addEventListener('visibilitychange',function(){
    if (!document.hidden) serviceRefreshClock();
  });
  setInterval(serviceRefreshClock,1000);
  function serviceTell(message,bad) {
    $('service-feedback').textContent = message;
    $('service-feedback').className = 'feedback ' + (bad ? 'bad' : 'good');
    // Feil og kvitteringar er alltid synlege utan å måtte leite i skjemaet.
    var toast=$('service-toast');
    toast.textContent=message;
    toast.className='service-toast '+(bad ? 'bad' : 'good');
    toast.hidden=!message;
  }
  function servicePersist() {
    try { localStorage.setItem(serviceKey,JSON.stringify(serviceEntries)); serviceStorageWorks=true; machineSyncRegisteredHours(); render(); return true; }
    catch(error) { serviceStorageWorks=false; return false; }
  }
  function serviceSnapshot(entry) {
    // A history entry contains a complete snapshot, but never another nested history.
    var snapshot=Object.assign({},entry);
    delete snapshot.history;
    return snapshot;
  }
  function serviceHistoryFor(entry) {
    return Array.isArray(entry.history) ? entry.history.filter(function(old){return old && typeof old==='object';}).map(serviceSnapshot) : [];
  }
  var serviceWorkTypes=['Service','Reparasjon','Vedlikehald','Kontroll / inspeksjon'];
  function serviceWorkCategory(type) {
    // Historiske 'Anna'-føringar blir framleis viste under Service.
    return serviceWorkTypes.indexOf(type)!==-1 ? type : 'Service';
  }
  function serviceSameMachine(a,b) {
    var aId=String(a.machineId||''), bId=String(b.machineId||'');
    if (aId && bId) return aId===bId;
    var aName=String(a.machineName||'').trim().toLocaleLowerCase('nb-NO');
    var bName=String(b.machineName||'').trim().toLocaleLowerCase('nb-NO');
    return !!aName && aName===bName;
  }
  function serviceSameBucket(a,b) {
    // Kvar maskin har ein eigen gjeldande logg for KVAR arbeidstype.
    return serviceSameMachine(a,b) && serviceWorkCategory(a.type)===serviceWorkCategory(b.type);
  }
  function serviceOrder(a,b) {
    return String(b.recordedAt||b.date||'').localeCompare(String(a.recordedAt||a.date||''))
      || String(b.id||'').localeCompare(String(a.id||''));
  }
  function serviceConsolidateExisting() {
    // Eldre versjonar samla alle arbeidstypar i ein logg per maskin.
    // Fordel både gjeldande og arkiverte føringar på maskin + arbeidstype,
    // slik at ein reparasjon ALDRI kan erstatta ein service (eller omvendt).
    var originalData=JSON.stringify(serviceEntries);
    var allRecords=[];
    serviceEntries.forEach(function(entry) {
      allRecords.push(serviceSnapshot(entry));
      Array.prototype.push.apply(allRecords,serviceHistoryFor(entry));
    });
    allRecords.sort(serviceOrder);
    var consolidated=[];
    allRecords.forEach(function(record) {
      var existing=consolidated.find(function(item){return serviceSameBucket(item,record);});
      if (!existing) {
        var current=serviceSnapshot(record);
        current.history=[];
        consolidated.push(current);
      } else {
        existing.history.push(serviceSnapshot(record));
      }
    });
    serviceEntries=consolidated;
    if (JSON.stringify(consolidated)!==originalData) {
      // Ta tryggleikskopi av v43-strukturen før første migrering.
      try {
        if (!localStorage.getItem('servicelogg.service.v43.backup'))
          localStorage.setItem('servicelogg.service.v43.backup',originalData);
      } catch(error) { /* Halde fram i minnet dersom lagring er blokkert. */ }
      servicePersist();
    }
  }
  serviceConsolidateExisting();
  function serviceName(machine) { return (machine.name || ((machine.brand || '')+' '+(machine.model || '')).trim() || 'Maskin'); }
  function serviceOption(select,value,label) {
    var option = make('option','',label); option.value=value; select.appendChild(option);
  }
  function serviceChoices() {
    var oldMachine=serviceFields.machine.value, oldMechanic=serviceFields.mechanic.value;
    serviceFields.machine.replaceChildren();
    serviceOption(serviceFields.machine,'',machines.length ? 'Vel maskin frå Maskinregisteret' : 'Ingen maskinar registrerte');
    machines.forEach(function(m){ serviceOption(serviceFields.machine,m.id,serviceName(m)); });
    serviceFields.machine.value=(oldMachine && machines.some(function(m){return m.id===oldMachine;})) ? oldMachine : '';
    serviceFields.machine.disabled=!machines.length;
    $('service-machine-hint').textContent=machines.length
      ? 'Viser '+machines.length+(machines.length===1?' maskin':' maskinar')+' frå Maskinregisteret. Lista blir oppdatert når du registrerer, redigerer eller slettar ei maskin.'
      : 'Ingen maskinar er registrerte. Legg til ei maskin under Maskinregisteret først.';
    // Hent alltid namna direkte frå mekanikarregisteret. Ikkje skriv inn namn på nytt.
    serviceFields.mechanic.replaceChildren();
    serviceOption(serviceFields.mechanic,'',mechanics.length ? 'Vel mekanikar frå lista ovanfor' : 'Ingen mekanikarar registrerte');
    mechanics.forEach(function(name){ serviceOption(serviceFields.mechanic,name,name); });
    // Behald historiske serviceføringar dersom ein tidlegare mekanikar er sletta.
    var olderEntry=editingServiceId ? serviceEntries.find(function(item){return item.id===editingServiceId;}) : null;
    var oldName=olderEntry ? String(olderEntry.mechanic||'').trim() : '';
    if (oldName && mechanics.indexOf(oldName)===-1) {
      serviceOption(serviceFields.mechanic,oldName,oldName+' (tidlegare mekanikar)');
    }
    if (oldMechanic && Array.from(serviceFields.mechanic.options).some(function(option){return option.value===oldMechanic;})) {
      serviceFields.mechanic.value=oldMechanic;
    }
    serviceFields.mechanic.disabled=!mechanics.length && !oldName;
    $('service-mechanic-hint').textContent=mechanics.length
      ? 'Viser '+mechanics.length+(mechanics.length===1?' mekanikar':' mekanikarar')+' frå lista «Mekanikarar» ovanfor. Lista blir oppdatert automatisk.'
      : 'Ingen mekanikarar lagde til enno. Legg til ein mekanikar i lista ovanfor, så kjem namnet automatisk her.';
  }
  function serviceUpdateNextHours() {
    // Neste service-timetal gjeld berre ved typen Service.
    // Reparasjon, Vedlikehald og Kontroll / inspeksjon har eigne timetal-labels og ikkje neste service.
    var next = serviceFields.nextHours;
    var hint = $('service-next-hours-hint');
    var workType = serviceFields.type.value;
    var isRepair = workType === 'Reparasjon';
    var isMaintenance = workType === 'Vedlikehald';
    var isInspection = workType === 'Kontroll / inspeksjon';
    $('service-hours-label').textContent = isRepair ? 'Timetal ved reparasjon' : (isMaintenance ? 'Timetal ved vedlikehald' : (isInspection ? 'Timetal ved kontroll/inspeksjon' : 'Timetal ved service'));
    $('service-next-hours-field').hidden = isRepair || isMaintenance || isInspection;
    if (isRepair || isMaintenance || isInspection) { next.value = ''; return; }
    var hours = serviceNumber(serviceFields.hours.value);
    var current = (typeof selectedInterval === 'number' && intervals.indexOf(selectedInterval) !== -1)
      ? selectedInterval : null;
    next.value = '';
    if (current === null) {
      hint.textContent = 'Vel kva serviceintervall som gjeld under «Serviceintervall» lenger nede.';
      return;
    }
    if (hours === '') {
      hint.textContent = 'Gjeldande intervall: ' + current + ' timar. Skriv inn «Timetal ved service» for å rekna ut neste service.';
      return;
    }
    if (hours === null) {
      hint.textContent = 'Skriv eit gyldig timetal ved service.';
      return;
    }
    var calculated = Math.round((hours + current) * 100) / 100;
    if (!Number.isFinite(calculated)) {
      hint.textContent = 'Timetalet er for stort. Skriv eit mindre tal.';
      return;
    }
    next.value = String(calculated);
    var fmt = function(n) { return n.toLocaleString('nb-NO', {maximumFractionDigits:2}); };
    hint.textContent = fmt(hours) + ' + ' + fmt(current) + ' = ' + fmt(calculated) + ' timar.';
  }
  function serviceReset() {
    calendarClose();
    $('service-date-help').textContent = 'Trykk «Vel dato» for å velja dato i kalenderen.';
    editingServiceId=null;
    $('service-form').reset();
    serviceFields.date.value=serviceToday();
    serviceRefreshClock();
    $('service-recorded-hint').textContent='Klokka går automatisk og oppdaterer seg kvart sekund. Tidspunktet blir lagra når du trykkjer «Lagre service».';
    serviceFields.machine.value='';
    $('service-form-title').textContent='Registrer service';
    $('service-save').textContent='+ Lagre service';
    $('service-cancel').hidden=true;
    serviceChoices();
    serviceUpdateNextHours();
    serviceTell('',false);
  }
  function serviceNumber(value) {
    var raw=String(value||'').trim().replace(/\s/g,'').replace(',','.');
    if (!raw) return '';
    var num=Number(raw);
    return Number.isFinite(num) && num>=0 ? num : null;
  }
  function serviceDetail(parent,label,value) {
    if (value === '' || value === undefined || value === null) return;
    detail(parent,label,value);
  }
  function serviceHistoryDetails(parent,entry) {
    serviceDetail(parent,'Dato',entry.date);
    serviceDetail(parent,'Tidspunkt ført',serviceRecordedFull(entry.recordedAt));
    serviceDetail(parent,'Maskin',entry.machineName);
    serviceDetail(parent,'Mekanikar',entry.mechanic);
    serviceDetail(parent,'Type arbeid',entry.type);
    serviceDetail(parent,entry.type === 'Reparasjon' ? 'Timetal ved reparasjon' : (entry.type === 'Vedlikehald' ? 'Timetal ved vedlikehald' : (entry.type === 'Kontroll / inspeksjon' ? 'Timetal ved kontroll/inspeksjon' : 'Timetal ved service')),entry.hours);
    serviceDetail(parent,'Arbeid som er utført',entry.work);
    if (entry.type !== 'Reparasjon' && entry.type !== 'Vedlikehald' && entry.type !== 'Kontroll / inspeksjon') serviceDetail(parent,'Neste service ved timetal',entry.nextHours);
    serviceDetail(parent,'Kostnad (kr)',entry.cost);
    serviceDetail(parent,'Merknader',entry.notes);
  }
  // Vis den sist REGISTRERTE timeavlesinga, ikkje det høgaste timetalet.
  // Ta med alle arbeidstypar og eldre loggar, slik at den nyaste føringa vinn.
  function serviceLatestMachineHours(records,linkedMachine) {
    var withHours=records.filter(function(record){
      if (record.hours===null || record.hours===undefined || String(record.hours).trim()==='') return false;
      var hours=Number(String(record.hours).replace(/\s/g,'').replace(',','.'));
      return Number.isFinite(hours) && hours>=0;
    }).sort(serviceOrder);
    if (withHours.length) {
      var last=withHours[0];
      return {hours:Number(String(last.hours).replace(/\s/g,'').replace(',','.')),
        type:serviceWorkCategory(last.type),date:last.date||'',source:'logg'};
    }
    // Har ingen ført timetal på arbeid, kan starttalet frå maskinregisteret visast.
    if (linkedMachine && Number.isFinite(Number(linkedMachine.hours)) && Number(linkedMachine.hours)>0) {
      return {hours:Number(linkedMachine.hours),source:'register'};
    }
    return null;
  }
  // Sletting krev alltid ei stadfesting inne på sida. Ingen popupvindauge.
  function serviceAddDeleteConfirmation(container,trigger,question,callback,yesLabel) {
    var confirm=make('div','confirm-box'); confirm.hidden=true;
    confirm.appendChild(make('span','',question));
    var yes=make('button','btn danger',yesLabel||'Ja, slett'); yes.type='button';
    var no=make('button','btn secondary','Avbryt'); no.type='button';
    confirm.appendChild(yes); confirm.appendChild(no);
    container.appendChild(confirm);
    trigger.addEventListener('click',function(){confirm.hidden=false;yes.focus();});
    no.addEventListener('click',function(){confirm.hidden=true;trigger.focus();});
    yes.addEventListener('click',callback);
  }
  function serviceDeleteArchivedRecord(parentId,historyIndex,type) {
    // Historiske føringar frå eldre versjonar kan ha same ID som gjeldande føring.
    // Bruk difor posisjonen i forelderen si historikkliste, ikkje historikk-ID.
    var parent=serviceEntries.find(function(entry){return entry.id===parentId;});
    if (!parent || !Array.isArray(parent.history) ||
        historyIndex<0 || historyIndex>=parent.history.length || !parent.history[historyIndex]) {
      serviceTell('Fann ikkje den tidlegare føringa. Opna historikken på nytt.',true);
      return;
    }
    parent.history.splice(historyIndex,1);
    var saved=servicePersist();
    serviceRender(null,parent,type);
    serviceTell(saved
      ? '✓ Den tidlegare '+type.toLocaleLowerCase('nb-NO')+'-føringa er sletta. Andre føringar er uendra.'
      : 'Føringa er fjerna frå visinga, men slettinga kunne ikkje lagrast på PC-en.',!saved);
  }
  function serviceRender(justSavedId,openMachine,openType) {
    var list=$('service-list'); list.replaceChildren();
    if (typeof justSavedId !== 'string') justSavedId=null;
    var totalServiceRecords=serviceEntries.reduce(function(count,entry){return count+1+serviceHistoryFor(entry).length;},0);
    $('service-count').textContent=totalServiceRecords===1 ? '1 loggføring' : totalServiceRecords+' loggføringar';
    var query=$('service-search').value.trim().toLocaleLowerCase('nb-NO');
    function recordMatches(record) {
      if (!query) return true;
      return [record.date,record.machineName,record.mechanic,record.type,record.work,record.notes,record.hours]
        .join(' ').toLocaleLowerCase('nb-NO').includes(query);
    }
    // Øvste nivå er maskina, sjølv om ho har fleire aktive arbeidstypar.
    // Kvar arbeidstype har si eiga gjeldande føring og si eiga historikk.
    if (!serviceEntries.length) {
      list.appendChild(make('div','empty','Ingen arbeid registrert enno.'));
      return;
    }
    var machineGroups=[];
    serviceEntries.slice().sort(serviceOrder).forEach(function(entry) {
      var group=machineGroups.find(function(g){return serviceSameMachine(g.entries[0],entry);});
      if (!group) {group={entries:[]};machineGroups.push(group);}
      group.entries.push(entry);
    });
    var visibleMachines=0;
    machineGroups.forEach(function(machineData) {
      var machineParent=machineData.entries[0];
      var allMachineRecords=[];
      machineData.entries.forEach(function(entry){
        allMachineRecords.push(entry);
        Array.prototype.push.apply(allMachineRecords,serviceHistoryFor(entry));
      });
      var matchingMachineRecords=allMachineRecords.filter(recordMatches);
      if (query && !matchingMachineRecords.length) return;
      visibleMachines++;
      var linkedMachine=machines.find(function(m){return String(m.id)===String(machineParent.machineId||'');});
      var machineTitle=linkedMachine ? serviceName(linkedMachine) : String(machineParent.machineName||'Ukjend maskin');
      var machineGroup=make('details','service-machine-group');
      machineGroup.setAttribute('data-machine-id',String(machineParent.machineId||''));
      if ((justSavedId && machineData.entries.some(function(e){return e.id===justSavedId;})) || (query && matchingMachineRecords.length) || (openMachine && serviceSameMachine(machineParent,openMachine))) machineGroup.open=true;
      var machineHeading=make('summary');
      var machineHeadingLabels=make('span');
      machineHeadingLabels.appendChild(make('span','service-machine-name',machineTitle));
      machineHeadingLabels.appendChild(make('span','service-machine-count',
        (query ? matchingMachineRecords.length+' treff' : allMachineRecords.length+(allMachineRecords.length===1?' loggføring':' loggføringar'))));
      machineHeading.appendChild(machineHeadingLabels);
      machineHeading.appendChild(make('span','arrow','❯'));
      machineGroup.appendChild(machineHeading);
      var machineContents=make('div','service-machine-types');
      serviceWorkTypes.forEach(function(type) {
      var current=machineData.entries.filter(function(entry){return serviceWorkCategory(entry.type)===type;});
      // Arkiverte føringar er ALLTID knytte til same type som gjeldande føring.
      var archived=[];
      current.forEach(function(parent){
        (Array.isArray(parent.history) ? parent.history : []).forEach(function(old,index){
          if (old && typeof old==='object' && serviceWorkCategory(old.type)===type)
            archived.push({entry:serviceSnapshot(old),parent:parent,historyIndex:index});
        });
      });
      archived.sort(function(a,b){return serviceOrder(a.entry,b.entry);});
      var visibleCurrent=current.filter(recordMatches);
      var visibleArchived=archived.filter(function(item){return recordMatches(item.entry);});
      var group=make('details','service-type-group');
      group.setAttribute('data-work-type',type);
      // Etter lagring: opna rett arbeidstype og den nyaste føringa.
      if ((justSavedId && current.some(function(s){return s.id===justSavedId;})) ||
          (query && (visibleCurrent.length || visibleArchived.length)) ||
          (openMachine && serviceSameMachine(machineParent,openMachine) && openType===type)) group.open=true;
      var heading=make('summary');
      var headingLabels=make('span');
      headingLabels.appendChild(make('span','service-type-title',type));
      var totalVisible=visibleCurrent.length+visibleArchived.length;
      var totalEntries=current.length+archived.length;
      headingLabels.appendChild(make('span','service-type-count',
        (query ? totalVisible+' treff' : totalEntries+(totalEntries===1?' loggføring':' loggføringar'))));
      heading.appendChild(headingLabels);
      heading.appendChild(make('span','arrow','❯'));
      group.appendChild(heading);
      var groupList=make('div','service-type-entries');
      if (!visibleCurrent.length && !visibleArchived.length) {
        groupList.appendChild(make('div','empty',query ? 'Ingen føringar passar søket i denne kategorien.' : 'Ingen føringar i denne kategorien enno.'));
      }
      visibleCurrent.forEach(function(s){
      var entry=make('details','service-entry');
      if (justSavedId && s.id===justSavedId) {entry.open=true;entry.classList.add('new');}
      var summary=make('summary');
      var labels=make('span','service-summary');
      labels.appendChild(make('strong','',s.date+' · '+(s.hours!=='' && s.hours!=null ? s.hours+' timar' : 'Ukjent timetal')));
      labels.appendChild(make('small','',s.date+(s.mechanic ? ' · '+s.mechanic : '')+(s.hours!=='' && s.hours!=null ? ' · '+s.hours+' timar' : '')+' · Gjeldande føring'));
      if (serviceHistoryFor(s).length) labels.appendChild(make('span','history-count',serviceHistoryFor(s).length+' tidlegare '+type.toLocaleLowerCase('nb-NO')+'-føringar'));
      summary.appendChild(labels); summary.appendChild(make('span','arrow','❯'));
      entry.appendChild(summary);
      var body=make('div','service-body');
      serviceHistoryDetails(body,s);
      var actions=make('div','service-controls');
      var edit=make('button','btn secondary','Rediger'); edit.type='button';
      edit.addEventListener('click',function(){
        editingServiceId=s.id;
        serviceChoices();
        serviceFields.date.value=s.date;
        serviceFields.recordedTime.value=s.recordedAt ? serviceClockTime(new Date(s.recordedAt)) : 'Ikkje registrert';
        $('service-recorded-hint').textContent='Tidspunktet då serviceføringa opphavleg vart lagra. Det blir ikkje endra ved redigering.';
        serviceFields.type.value=s.type||'Service';
        var linkedMachine=machines.find(function(m){return m.id===s.machineId;}) || machines.find(function(m){
          return serviceName(m).toLocaleLowerCase('nb-NO')===String(s.machineName||'').toLocaleLowerCase('nb-NO');
        });
        serviceFields.machine.value=linkedMachine ? linkedMachine.id : '';
        serviceFields.mechanic.value=s.mechanic||'';
        serviceFields.hours.value=s.hours==null?'':s.hours;
        serviceUpdateNextHours();
        serviceFields.cost.value=s.cost==null?'':s.cost;
        serviceFields.work.value=s.work||'';
        serviceFields.notes.value=s.notes||'';
        $('service-form-title').textContent='Rediger service';
        $('service-save').textContent='Lagre endringar';
        $('service-cancel').hidden=false;
        serviceTell(linkedMachine ? 'Du redigerer serviceføringa frå '+s.date+'.' : 'Denne serviceføringa er ikkje kopla til ei registrert maskin. Vel ei maskin frå Maskinregisteret før du lagrar.',!linkedMachine);
        $('service-manager').scrollIntoView({behavior:'smooth',block:'start'});
      });
      actions.appendChild(edit);
      var history=serviceHistoryFor(s);
      var historyButton=make('button','btn secondary service-history-toggle','Historikk ('+history.length+')');
      historyButton.type='button';
      historyButton.setAttribute('aria-expanded','false');
      var remove=make('button','btn secondary','Slett'); remove.type='button';
      actions.appendChild(historyButton);
      actions.appendChild(remove);
      body.appendChild(actions);
      var historyPanel=make('div','service-history-panel');
      historyPanel.hidden=true;
      historyPanel.appendChild(make('h4','','Tidlegare '+type.toLocaleLowerCase('nb-NO')+' på '+s.machineName));
      historyPanel.appendChild(make('p','history-explanation','Her ligg berre tidlegare føringar av typen «'+type+'». Andre arbeidstypar ligg i sine eigne menyar.'));
      if (!history.length) {
        historyPanel.appendChild(make('p','dealer-empty','Ingen tidlegare '+type.toLocaleLowerCase('nb-NO')+'-føringar på denne maskina enno.'));
      } else {
        (Array.isArray(s.history) ? s.history : []).map(function(old,index){
          return {entry:old,historyIndex:index};
        }).filter(function(item){return item.entry && typeof item.entry==='object';})
          .sort(function(a,b){return serviceOrder(a.entry,b.entry);}).forEach(function(item){
          var old=item.entry;
          var oldCard=make('details','service-history-record');
          var oldSummary=make('summary','',String(old.hours==null || old.hours==='' ? 'Service' : old.hours+' timar')+' · '+(old.date||'Ukjend dato')+' · '+(old.type||'Service'));
          oldCard.appendChild(oldSummary);
          var oldBody=make('div','history-body');
          serviceHistoryDetails(oldBody,old);
          var oldActions=make('div','service-controls');
          var removeOld=make('button','btn danger','Slett tidlegare føring'); removeOld.type='button';
          oldActions.appendChild(removeOld);oldBody.appendChild(oldActions);
          serviceAddDeleteConfirmation(oldBody,removeOld,
            'Vil du sletta denne tidlegare '+type.toLocaleLowerCase('nb-NO')+'-føringa frå '+(old.date||'ukjend dato')+'? Dette kan ikkje angrast.',
            function(){serviceDeleteArchivedRecord(s.id,item.historyIndex,type);});
          oldCard.appendChild(oldBody);
          historyPanel.appendChild(oldCard);
        });
      }
      historyButton.addEventListener('click',function(){
        historyPanel.hidden=!historyPanel.hidden;
        historyButton.setAttribute('aria-expanded',String(!historyPanel.hidden));
        historyButton.textContent=(historyPanel.hidden?'Historikk (':'Lukk historikk (')+history.length+')';
      });
      body.appendChild(historyPanel);
      var confirm=make('div','confirm-box'); confirm.hidden=true;
      confirm.appendChild(make('span','',history.length
        ? 'Vil du sletta den nyaste '+type.toLocaleLowerCase('nb-NO')+'-føringa? Den førre føringa av same type blir gjeldande igjen.'
        : 'Vil du sletta denne '+type.toLocaleLowerCase('nb-NO')+'-føringa?')); 
      var yes=make('button','btn danger','Ja, slett'); yes.type='button';
      var no=make('button','btn secondary','Avbryt'); no.type='button';
      confirm.appendChild(yes); confirm.appendChild(no);
      remove.addEventListener('click',function(){confirm.hidden=false;yes.focus();});
      no.addEventListener('click',function(){confirm.hidden=true;remove.focus();});
      yes.addEventListener('click',function(){
        var index=serviceEntries.findIndex(function(item){return item.id===s.id;});
        if (index!==-1) {
          if (history.length) {
            var previous=serviceSnapshot(history[0]);
            previous.id=s.id;
            previous.history=history.slice(1);
            serviceEntries[index]=previous;
          } else serviceEntries.splice(index,1);
        }
        if (editingServiceId===s.id) serviceReset();
        var saved=servicePersist();
        serviceRender(null,s,type);
        serviceTell(saved
          ? (history.length?'✓ Nyaste '+type.toLocaleLowerCase('nb-NO')+' er sletta. Førre føring av same type er no gjeldande.':'✓ Føringa er sletta.')
          : 'Serviceføringa er fjerna, men slettinga kunne ikkje lagrast på PC-en.',!saved);
      });
      entry.appendChild(body); entry.appendChild(confirm); groupList.appendChild(entry);
      });
      // Vis kvar tidlegare loggføring som si eiga opne/lukke-rad direkte i rett type-meny.
      // Ikkje legg dei i ein ekstra «Tidlegare føringar»-meny.
      visibleArchived.forEach(function(item){
        var old=item.entry;
        var oldCard=make('details','service-entry is-archived');
        var oldSummary=make('summary');
        var oldLabels=make('span','service-summary');
        oldLabels.appendChild(make('strong','',(old.date||'Ukjend dato')+' · '+(old.hours!=='' && old.hours!=null ? old.hours+' timar' : 'Ukjent timetal')));
        oldLabels.appendChild(make('small','',(old.date||'Ukjend dato')+
          (old.mechanic ? ' · '+old.mechanic : '')+
          (old.hours!=='' && old.hours!=null ? ' · '+old.hours+' timar' : '')));
        oldLabels.appendChild(make('span','archive-tag','Tidlegare føring'));
        oldSummary.appendChild(oldLabels);
        oldSummary.appendChild(make('span','arrow','❯'));
        oldCard.appendChild(oldSummary);
        var oldBody=make('div','service-body');
        serviceHistoryDetails(oldBody,old);
        var oldActions=make('div','service-controls');
        var removeOld=make('button','btn danger','Slett tidlegare føring');removeOld.type='button';
        oldActions.appendChild(removeOld);oldBody.appendChild(oldActions);
        serviceAddDeleteConfirmation(oldBody,removeOld,
          'Vil du sletta denne tidlegare '+type.toLocaleLowerCase('nb-NO')+'-føringa frå '+(old.date||'ukjend dato')+'? Dette kan ikkje angrast.',
          function(){serviceDeleteArchivedRecord(item.parent.id,item.historyIndex,type);});
        oldCard.appendChild(oldBody);
        groupList.appendChild(oldCard);
      });
      group.appendChild(groupList);
      machineContents.appendChild(group);
      });
      // Statusfeltet kjem ETTER dei fire arbeidsmenyane for denne maskina.
      var latestHours=serviceLatestMachineHours(allMachineRecords,linkedMachine);
      var hourBox=make('div','service-machine-hours');
      hourBox.setAttribute('aria-label','Sist registrerte timetal på '+machineTitle);
      var hourInfo=make('div');
      hourInfo.appendChild(make('span','service-machine-hours-label','Sist registrerte timetal på maskina'));
      if (latestHours) {
        hourInfo.appendChild(make('span','service-machine-hours-source',latestHours.source==='logg'
          ? 'Frå '+latestHours.type+(latestHours.date ? ' · '+latestHours.date : '')
          : 'Frå Maskinregisteret (ingen timetal ført på arbeid enno)'));
      } else {
        hourInfo.appendChild(make('span','service-machine-hours-source','Ingen timetal registrerte enno'));
      }
      hourBox.appendChild(hourInfo);
      hourBox.appendChild(make('strong','service-machine-hours-value',latestHours
        ? latestHours.hours.toLocaleString('nb-NO',{maximumFractionDigits:2})+' timar'
        : 'Ikkje registrert'));
      machineContents.appendChild(hourBox);
      // Fjern heile maskina frå SERVICEHISTORIKKEN, men ikkje frå Maskinregisteret.
      var machineDeleteArea=make('div','service-machine-delete-area');
      var removeMachineHistory=make('button','btn danger','Slett maskina frå servicehistorikken');
      removeMachineHistory.type='button';
      machineDeleteArea.appendChild(removeMachineHistory);
      machineDeleteArea.appendChild(make('p','service-machine-delete-note',
        'Slettar alle loggføringar for denne maskina. Maskina blir verande i Maskinregisteret.'));
      serviceAddDeleteConfirmation(machineDeleteArea,removeMachineHistory,
        'Vil du sletta ALLE '+allMachineRecords.length+' loggføringar for '+machineTitle+
        '? Alle arbeidstypar og tidlegare føringar blir sletta. Dette kan ikkje angrast. Maskina blir verande i Maskinregisteret.',
        function(){
          var removedEntries=machineData.entries;
          serviceEntries=serviceEntries.filter(function(entry){return removedEntries.indexOf(entry)===-1;});
          if (editingServiceId && removedEntries.some(function(entry){return entry.id===editingServiceId;})) serviceReset();
          var saved=servicePersist();
          serviceRender();
          serviceTell(saved
            ? '✓ All servicehistorikk for '+machineTitle+' er sletta ('+allMachineRecords.length+' føringar). Maskina ligg framleis i Maskinregisteret.'
            : 'Historikken er fjerna frå visinga, men slettinga kunne ikkje lagrast på PC-en.',!saved);
        },'Ja, slett all historikk');
      machineContents.appendChild(machineDeleteArea);
      machineGroup.appendChild(machineContents);
      list.appendChild(machineGroup);
    });
    if (!visibleMachines) list.appendChild(make('div','empty','Ingen loggføringar passar søket.'));
  }
  window.addEventListener('storage',function(event){
    if(event.key===mechanicsKey) {
      try {
        var updated=JSON.parse(event.newValue||'[]');
        if (!Array.isArray(updated)) return;
        mechanics=[];
        updated.forEach(function(name){
          var clean=normaliseMechanic(name);
          if (clean && !findMechanic(clean)) mechanics.push(clean);
        });
        mechanics.sort(function(a,b){return a.localeCompare(b,'nb-NO');});
        renderMechanics();
        serviceChoices();
      } catch(error) { /* Ignorer ugyldig mekanikarliste. */ }
      return;
    }
    if(event.key!==storageKey) return;
    try {
      var stored=JSON.parse(event.newValue||'[]');
      if(!Array.isArray(stored)) return;
      machines=stored.filter(function(m){return m && typeof m==='object' && m.id;}).map(function(m){
        var hours=Number(m.hours);
        return {id:String(m.id),name:String(m.name||''),brand:String(m.brand||''),model:String(m.model||''),hours:Number.isFinite(hours)&&hours>=0?hours:0,registeredBy:String(m.registeredBy||''),dealer:String(m.dealer||''),machineFor:String(m.machineFor||'')};
      });
      render();
      serviceChoices();
    } catch(error) { /* Ignorer ugyldig lagringsinnhald. */ }
  });
  serviceFields.machine.addEventListener('focus',serviceChoices);
  function serviceUpdateMachineHint() {
    var chosen=machines.find(function(m){return String(m.id)===String(serviceFields.machine.value);});
    if (!chosen) return;
    var chosenType=serviceFields.type.value;
    var existing=serviceEntries.find(function(s){
      return serviceSameBucket(s,{machineId:chosen.id,machineName:serviceName(chosen),type:chosenType});
    });
    if (existing && existing.id!==editingServiceId) {
      $('service-machine-hint').textContent='Denne maskina har allereie «'+chosenType+'» registrert ('+
        (existing.hours==null || existing.hours==='' ? 'ukjent timetal' : existing.hours+' timar')+
        '). Ny føring av SAME arbeidstype erstattar berre denne føringa. Andre arbeidstypar blir ikkje endra.';
    } else {
      $('service-machine-hint').textContent='Du registrerer «'+chosenType+'» på '+serviceName(chosen)+
        '. Føringa blir lagra i sin eigen arbeidsmeny, utan å endra andre arbeidstypar.';
    }
  }
  serviceFields.machine.addEventListener('change',serviceUpdateMachineHint);
  serviceFields.mechanic.addEventListener('focus',serviceChoices);
  document.querySelectorAll('[data-page="servicebok"]').forEach(function(link){link.addEventListener('click',serviceChoices);});
  serviceFields.hours.addEventListener('input',serviceUpdateNextHours);
  serviceFields.type.addEventListener('change',function(){serviceUpdateNextHours();serviceUpdateMachineHint();});
  $('service-search').addEventListener('input',serviceRender);
  $('service-cancel').addEventListener('click',serviceReset);
  function saveService(event) {
    if (event) event.preventDefault();
    try {
      // Hent den nyaste lista, og lat ei einsleg registrert maskin bli vald automatisk.
      var date=serviceFields.date.value;
      if (!date) { date=serviceToday(); serviceFields.date.value=date; }
      var machineId=serviceFields.machine.value;
      var machine=machines.find(function(m){return String(m.id)===String(machineId);});
      if (!machine && machines.length===1) {
        machine=machines[0];
        serviceFields.machine.value=machine.id;
      }
      if (!machine) {
        serviceTell(machines.length
          ? 'Vel ei maskin i feltet «Maskin» før du lagrar service.'
          : 'Du må først leggja inn ei maskin under «Maskinregisteret» før du kan lagra service.',true);
        if (machines.length) serviceFields.machine.focus();
        return;
      }
      var machineName=serviceName(machine);
      var workTypeName=serviceFields.type.value;
      var mechanic=serviceFields.mechanic.value;
      serviceUpdateNextHours();
      var hours=serviceNumber(serviceFields.hours.value);
      var nextHours=(serviceFields.type.value === 'Reparasjon' || serviceFields.type.value === 'Vedlikehald' || serviceFields.type.value === 'Kontroll / inspeksjon') ? '' : serviceNumber(serviceFields.nextHours.value);
      var cost=serviceNumber(serviceFields.cost.value);
      if (hours===null) {
        serviceTell((serviceFields.type.value === 'Reparasjon' ? 'Timetal ved reparasjon' : (serviceFields.type.value === 'Vedlikehald' ? 'Timetal ved vedlikehald' : (serviceFields.type.value === 'Kontroll / inspeksjon' ? 'Timetal ved kontroll/inspeksjon' : 'Timetal ved service'))) + ' må vera eit positivt tal, eller stå tomt.',true);
        serviceFields.hours.focus(); return;
      }
      if (nextHours===null) {
        serviceTell('Neste service ved timetal er ugyldig. Kontroller timetal og serviceintervall.',true);
        serviceFields.hours.focus(); return;
      }
      if (cost===null) {
        serviceTell('Kostnad må vera eit positivt tal, eller stå tomt.',true);
        serviceFields.cost.focus(); return;
      }
      var original=editingServiceId ? serviceEntries.find(function(s){return s.id===editingServiceId;}) : null;
      var now=new Date().toISOString();
      var item={
        id:editingServiceId||String(Date.now())+'-'+Math.random().toString(36).slice(2,9),
        date:date,recordedAt:now,type:serviceFields.type.value,
        machineId:machine.id,machineName:machineName,
        mechanic:mechanic,hours:hours,nextHours:nextHours,
        cost:cost,work:serviceFields.work.value.trim(),notes:serviceFields.notes.value.trim(),history:[]
      };
      var wasEditing=!!original;
      var archivedPrevious=false;
      if (original) {
        var oldIndex=serviceEntries.findIndex(function(s){return s.id===original.id;});
        var sameBucket=serviceSameBucket(original,item);
        if (sameBucket) {
          // Ei ny timeføring innan same arbeidstype legg førre føring i historikken.
          var changedHours=String(original.hours)!==String(item.hours);
          item.id=original.id;
          item.recordedAt=changedHours ? now : (original.recordedAt||now);
          item.history=serviceHistoryFor(original);
          if (changedHours) {item.history.unshift(serviceSnapshot(original));archivedPrevious=true;}
          serviceEntries[oldIndex]=item;
        } else {
          // Endring av maskin/arbeidstype: ikkje bland historikk mellom kategoriane.
          // Gamle historiske føringar blir verande i den gamle kategorien.
          var oldHistory=serviceHistoryFor(original);
          if (oldHistory.length) {
            var previous=serviceSnapshot(oldHistory[0]);
            previous.id=original.id;
            previous.history=oldHistory.slice(1);
            serviceEntries[oldIndex]=previous;
          } else serviceEntries.splice(oldIndex,1);
          var targetIndex=serviceEntries.findIndex(function(s){return serviceSameBucket(s,item);});
          if (targetIndex!==-1) {
            var target=serviceEntries[targetIndex];
            item.id=target.id;
            item.history=[serviceSnapshot(target)].concat(serviceHistoryFor(target));
            serviceEntries[targetIndex]=item;
            archivedPrevious=true;
          } else serviceEntries.unshift(item);
        }
      } else {
        var existingIndex=serviceEntries.findIndex(function(s){return serviceSameBucket(s,item);});
        if (existingIndex!==-1) {
          var existing=serviceEntries[existingIndex];
          item.id=existing.id;
          item.history=[serviceSnapshot(existing)].concat(serviceHistoryFor(existing));
          serviceEntries[existingIndex]=item;
          archivedPrevious=true;
        } else serviceEntries.unshift(item);
      }
      var saved=servicePersist();
      serviceReset();
      $('service-search').value='';
      serviceRender(item.id);
      var historyMessage=$('service-history-message');
      historyMessage.hidden=false;
      historyMessage.className=saved ? 'notice ok' : 'notice warning';
      historyMessage.textContent=(saved ? '✓ ' : '⚠ ')+(archivedPrevious
        ? 'Ny «'+workTypeName+'»-føring er gjeldande for '+machineName+'. Førre føring av same type ligg under «Historikk». Andre arbeidstypar er uendra.'
        : (wasEditing ? '«'+workTypeName+'» er oppdatert for '+machineName+'.' : '«'+workTypeName+'» er registrert for '+machineName+'.'))
        + (saved ? '' : ' Endringa er synleg no, men kunne ikkje lagrast varig i nettlesaren.');
      serviceTell(saved
        ? (archivedPrevious ? '✓ «'+workTypeName+'» er lagra. Førre føring av same type ligg under Historikk!' : (wasEditing ? '✓ Føringa er oppdatert.' : '✓ «'+workTypeName+'» er lagra!'))
        : 'Føringa er oppdatert, men nettlesaren hindrar varig lagring.',!saved);
      try { historyMessage.scrollIntoView({behavior:'smooth',block:'start'}); }
      catch (ignored) { /* Service er allereie lagra og synleg. */ }
    } catch(error) {
      serviceTell('Kunne ikkje lagra service: '+(error && error.message ? error.message : String(error)),true);
    }
  }
  // Direkte klikklyttar: lagringa fungerer også om nettlesaren ikkje sender submit-hendinga.
  $('service-save').addEventListener('click',saveService);
  $('service-form').addEventListener('submit',saveService);

  // Serviceintervall: eigen liste og eigen lagring, utan kopling til registreringsskjemaet.
  var intervalKey = 'servicelogg.serviceintervall.v1';
  var intervalSelectedKey = 'servicelogg.serviceintervall.gjeld.v1';
  var intervals = [];
  var selectedInterval = null;
  var intervalStorageWorks = true;
  function normaliseInterval(value) {
    var raw = String(value == null ? '' : value).trim();
    if (!/^\d+$/.test(raw)) return null;
    var number = Number(raw);
    return Number.isSafeInteger(number) && number >= 1 && number <= 1000000 ? number : null;
  }
  function intervalTell(message, bad) {
    $('interval-feedback').textContent = message;
    $('interval-feedback').className = 'feedback ' + (bad ? 'bad' : 'good');
  }
  function intervalPersist() {
    try {
      localStorage.setItem(intervalKey, JSON.stringify(intervals));
      intervalStorageWorks = true;
      return true;
    } catch (error) {
      intervalStorageWorks = false;
      return false;
    }
  }
  function intervalPersistSelection() {
    try {
      if (selectedInterval === null) localStorage.removeItem(intervalSelectedKey);
      else localStorage.setItem(intervalSelectedKey, String(selectedInterval));
      return true;
    } catch (error) { return false; }
  }
  function intervalRender() {
    var list = $('interval-list');
    list.replaceChildren();
    $('interval-count').textContent = intervals.length === 1 ? '1 intervall' : intervals.length + ' intervall';
    var hasSelection = selectedInterval !== null && intervals.indexOf(selectedInterval) !== -1;
    $('interval-current').classList.toggle('has-selection', hasSelection);
    $('interval-current-text').textContent = hasSelection
      ? '✓ Gjeldande serviceintervall: ' + selectedInterval + ' timar'
      : 'Ingen serviceintervall valt enno.';
    $('interval-clear').hidden = !hasSelection;
    serviceUpdateNextHours();
    if (!intervals.length) {
      list.appendChild(make('p','dealer-empty','Ingen serviceintervall lagde til enno.'));
      return;
    }
    intervals.forEach(function (hours) {
      var active = hours === selectedInterval;
      var entry = make('div','interval-entry');
      var row = make('div','dealer-row interval-row' + (active ? ' is-current' : ''));
      row.appendChild(make('span','interval-label',hours + ' timar'));
      var choose = make('button','interval-select' + (active ? ' is-current' : ''),active ? '✓ Gjeld no' : 'Vel');
      choose.type = 'button';
      choose.disabled = active;
      choose.setAttribute('aria-pressed',active ? 'true' : 'false');
      choose.setAttribute('aria-label',active ? 'Serviceintervall ' + hours + ' timar gjeld no' : 'Vel serviceintervall ' + hours + ' timar');
      choose.addEventListener('click',function () {
        selectedInterval = hours;
        var saved = intervalPersistSelection();
        intervalRender();
        intervalTell(saved ? '✓ Serviceintervallet på ' + hours + ' timar gjeld no.' : 'Intervallet er valt, men valet kunne ikkje lagrast på denne PC-en.',!saved);
      });
      row.appendChild(choose);
      var remove = make('button','interval-delete','Slett');
      remove.type = 'button';
      remove.setAttribute('aria-label','Slett serviceintervall ' + hours + ' timar');
      row.appendChild(remove);
      entry.appendChild(row);
      var confirm = make('div','dealer-confirm');
      confirm.hidden = true;
      confirm.appendChild(make('span','','Vil du sletta serviceintervallet på ' + hours + ' timar?'));
      var yes = make('button','dealer-yes','Ja, slett');
      yes.type = 'button';
      var no = make('button','dealer-no','Avbryt');
      no.type = 'button';
      confirm.appendChild(yes);
      confirm.appendChild(no);
      entry.appendChild(confirm);
      remove.addEventListener('click',function () {
        confirm.hidden = false;
        remove.disabled = true;
        yes.focus();
      });
      no.addEventListener('click',function () {
        confirm.hidden = true;
        remove.disabled = false;
        remove.focus();
      });
      yes.addEventListener('click',function () {
        intervals = intervals.filter(function (value) { return value !== hours; });
        var selectionSaved = true;
        if (selectedInterval === hours) {
          selectedInterval = null;
          selectionSaved = intervalPersistSelection();
        }
        var saved = intervalPersist() && selectionSaved;
        intervalRender();
        intervalTell(saved ? '✓ Serviceintervallet på ' + hours + ' timar er sletta.' : 'Serviceintervallet er fjerna frå lista, men kunne ikkje lagrast på denne PC-en.',!saved);
      });
      list.appendChild(entry);
    });
  }
  function intervalAdd() {
    var hours = normaliseInterval($('interval-hours').value);
    if (hours === null) {
      intervalTell('Skriv eit gyldig heiltal mellom 1 og 1 000 000 timar.',true);
      $('interval-hours').focus();
      return;
    }
    if (intervals.indexOf(hours) !== -1) {
      intervalTell('Serviceintervallet på ' + hours + ' timar finst allereie i lista.',true);
      return;
    }
    intervals.push(hours);
    intervals.sort(function (a,b) { return a-b; });
    var saved = intervalPersist();
    intervalRender();
    $('interval-hours').value = '';
    intervalTell(saved ? '✓ Serviceintervall på ' + hours + ' timar er lagt til.' : 'Serviceintervallet er lagt til i lista, men kunne ikkje lagrast på denne PC-en.',!saved);
  }
  try {
    var storedIntervals = JSON.parse(localStorage.getItem(intervalKey) || '[]');
    if (Array.isArray(storedIntervals)) {
      storedIntervals.forEach(function (item) {
        var hours = normaliseInterval(item);
        if (hours !== null && intervals.indexOf(hours) === -1) intervals.push(hours);
      });
      intervals.sort(function (a,b) { return a-b; });
    }
    var storedSelection = normaliseInterval(localStorage.getItem(intervalSelectedKey));
    if (storedSelection !== null && intervals.indexOf(storedSelection) !== -1) selectedInterval = storedSelection;
  } catch (error) { intervalStorageWorks = false; }
  $('interval-clear').addEventListener('click',function () {
    selectedInterval = null;
    var saved = intervalPersistSelection();
    intervalRender();
    intervalTell(saved ? '✓ Ingen serviceintervall er valt no.' : 'Valet er fjerna, men endringa kunne ikkje lagrast på denne PC-en.',!saved);
  });
  $('interval-add').addEventListener('click',intervalAdd);
  $('interval-hours').addEventListener('keydown',function (event) {
    if (event.key === 'Enter') { event.preventDefault(); intervalAdd(); }
  });
  window.addEventListener('storage',function (event) {
    if (event.key !== intervalKey && event.key !== intervalSelectedKey) return;
    try {
      if (event.key === intervalSelectedKey) {
        var selected = normaliseInterval(event.newValue);
        selectedInterval = selected !== null && intervals.indexOf(selected) !== -1 ? selected : null;
      } else {
        var updated = JSON.parse(event.newValue || '[]');
        if (!Array.isArray(updated)) return;
        intervals = [];
        updated.forEach(function (item) {
          var hours = normaliseInterval(item);
          if (hours !== null && intervals.indexOf(hours) === -1) intervals.push(hours);
        });
        intervals.sort(function (a,b) { return a-b; });
        if (selectedInterval !== null && intervals.indexOf(selectedInterval) === -1) selectedInterval = null;
      }
      intervalRender();
    } catch (error) { /* Ignorer ugyldige data frå ei anna fane. */ }
  });
  intervalRender();


  // Feilmeldingar er eigne føringar, ikkje servicehistorikk. Lokal lagring med same opphav som resten av appen.
  var faultKey='servicelogg.feilmeldingar.v1';
  var faultReports=[];
  var faultEditingId=null;
  var faultAllowedPriorities={normal:true,hastar:true,akutt:true};
  var faultPriorityLabels={normal:'Vanleg',hastar:'Hastar',akutt:'Kritisk – bør stoppast'};
  var faultStatusChoices=[
    {id:'open',label:'Open',badge:'open'},
    {id:'under_behandling',label:'Under behandling',badge:'processing'},
    {id:'vente_verksted',label:'I ventekø til verkstad',badge:'queued'},
    {id:'inne_verksted',label:'Inne på verkstad',badge:'workshop'},
    {id:'ferdig',label:'Ferdig',badge:'finished'}
  ];
  // Eldre v63–v67 brukte 'fixed' for utbetra. Vis desse som Ferdig utan datatap.
  function faultStatusId(status) {
    if(status==='fixed')return 'ferdig';
    return faultStatusChoices.some(function(choice){return choice.id===status;}) ? status : 'open';
  }
  function faultStatusChoice(status) {
    var id=faultStatusId(status);
    return faultStatusChoices.find(function(choice){return choice.id===id;});
  }
  var faultPersistOk=true;
  try {
    var rawFaults=JSON.parse(localStorage.getItem(faultKey)||'[]');
    if(Array.isArray(rawFaults)) faultReports=rawFaults.filter(function(f){return f && typeof f==='object' && f.id && f.machineId && f.subject;});
  } catch(error) {faultReports=[];faultPersistOk=false;}
  function faultPersist() {
    try {localStorage.setItem(faultKey,JSON.stringify(faultReports));faultPersistOk=true;machineSyncRegisteredHours();render();return true;}
    catch(error) {faultPersistOk=false;return false;}
  }
  function faultDateToday() {
    var d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function faultCurrentMachine(f) {return machines.find(function(m){return String(m.id)===String(f.machineId);});}
  function faultMachineName(f) {var m=faultCurrentMachine(f);return m?serviceName(m):String(f.machineName||'Tidlegare maskin');}
  function faultChoices() {
    var select=$('fault-machine');
    var selected=select.value;
    select.replaceChildren();
    serviceOption(select,'',machines.length?'Vel maskin frå Maskinregisteret':'Ingen maskinar registrerte');
    machines.forEach(function(m){serviceOption(select,String(m.id),serviceName(m));});
    select.value=selected && machines.some(function(m){return String(m.id)===selected;}) ? selected : '';
    if(!select.value && machines.length===1) select.value=String(machines[0].id);
    select.disabled=!machines.length;
    $('fault-machine-hint').textContent=machines.length?'Vel maskina der feilen har oppstått.':'Registrer først ei maskin i Maskinregisteret.';
    $('fault-creator').textContent=employeeCurrent && employeeCurrent.confirmed ? employeeCurrent.name+' · '+employeeRoleName(employeeCurrent.role) : 'Innlogga brukar';
  }
  function faultTell(message,bad) {
    var el=$('fault-feedback');el.textContent=message;el.className='feedback '+(bad?'bad':'good');
  }
  function faultReset() {
    faultEditingId=null;
    $('fault-form').reset();
    $('fault-date').value=faultDateToday();
    $('fault-form-title').textContent='Feilmelding';
    $('fault-save').textContent='+ Send inn feilmelding';
    $('fault-cancel').hidden=true;
    faultChoices();
  }
  function faultInfo(parent,label,value) {
    var p=make('p');p.appendChild(make('strong','',label+':'));
    p.appendChild(document.createTextNode(' '+(value===null || value===undefined || value===''?'Ikkje oppgitt':String(value))));
    parent.appendChild(p);
  }
  function faultBadge(text,extra) {return make('span','fault-badge '+(extra||''),text);}
  function faultUpdateOverview() {
    var counts={open:0,under_behandling:0,vente_verksted:0,inne_verksted:0,ferdig:0};
    var machineIds=new Set();
    faultReports.forEach(function(f){
      counts[faultStatusId(f.status)]++;
      machineIds.add(String(f.machineId));
    });
    var total=faultReports.length,finished=counts.ferdig,pending=total-finished;
    [
      ['fault-stats-total',total],['fault-stats-pending',pending],['fault-stats-finished',finished],['fault-stats-machines',machineIds.size],
      ['overview-fault-total',total],['overview-fault-pending',pending],['overview-fault-finished',finished],['overview-fault-machines',machineIds.size],
      ['overview-fault-open',counts.open],['overview-fault-processing',counts.under_behandling],
      ['overview-fault-queued',counts.vente_verksted],['overview-fault-workshop',counts.inne_verksted]
    ].forEach(function(item){$(item[0]).textContent=String(item[1]);});
  }
  function faultRender(openMachine,openFault) {
    faultUpdateOverview();
    var board=$('fault-board-list'),openGroups=new Set(),openCards=new Set();
    var query=$('fault-search').value.trim().toLocaleLowerCase('nb-NO');
    $('fault-search-clear').hidden=!query;
    board.querySelectorAll('.fault-machine-group[open]').forEach(function(el){openGroups.add(el.dataset.machineId);});
    board.querySelectorAll('.fault-entry[open]').forEach(function(el){openCards.add(el.dataset.faultId);});
    board.replaceChildren();
    var pending=faultReports.filter(function(f){return faultStatusId(f.status)!=='ferdig';}).length;
    $('fault-board-count').textContent=faultReports.length+' '+(faultReports.length===1?'feilmelding':'feilmeldingar')+' · '+pending+' ikkje ferdige';
    if(!faultReports.length){
      $('fault-search-hint').textContent='Ingen feilmeldingar registrerte enno.';
      board.appendChild(make('div','empty','Ingen feilmeldingar registrerte enno.'));
      return;
    }
    var grouped=new Map();
    faultReports.forEach(function(f){
      var key=String(f.machineId);
      if(!grouped.has(key)) grouped.set(key,[]);
      grouped.get(key).push(f);
    });
    var sortedGroups=Array.from(grouped.entries()).sort(function(a,b){
      return faultMachineName(a[1][0]).localeCompare(faultMachineName(b[1][0]),'nb-NO');
    });
    if(query){
      sortedGroups=sortedGroups.filter(function(pair){
        return pair[1].some(function(f){
          var searchable=[faultMachineName(f),f.machineName||'',f.subject||''].join(' ').toLocaleLowerCase('nb-NO');
          return searchable.includes(query);
        });
      });
      if(!sortedGroups.length){
        $('fault-search-hint').textContent='Ingen treff på «'+$('fault-search').value.trim()+'».';
        board.appendChild(make('div','empty','Ingen maskinar eller feilmeldingar passar med søket. Prøv eit anna namn.'));
        return;
      }
      $('fault-search-hint').textContent='Fann '+sortedGroups.length+' '+(sortedGroups.length===1?'maskinmappe':'maskinmapper')+' som passar med søket.';
    } else {
      $('fault-search-hint').textContent='Viser '+sortedGroups.length+' '+(sortedGroups.length===1?'maskinmappe':'maskinmapper')+'. Skriv for å filtrera lista.';
    }
    sortedGroups.forEach(function(pair){
      var machineId=pair[0],records=pair[1].slice().sort(function(a,b){return (b.createdAt||'').localeCompare(a.createdAt||'') || (b.date||'').localeCompare(a.date||'');});
      var group=make('details','fault-machine-group');group.dataset.machineId=machineId;
      group.open=!!query || String(openMachine)===machineId || openGroups.has(machineId);
      var summary=make('summary');var title=make('span');
      title.appendChild(make('span','fault-machine-title',faultMachineName(records[0])));
      var numPending=records.filter(function(f){return faultStatusId(f.status)!=='ferdig';}).length;
      title.appendChild(make('small','fault-machine-count',records.length+' '+(records.length===1?'feilmelding':'feilmeldingar')+' · '+numPending+' ikkje ferdige'));
      summary.appendChild(title);summary.appendChild(make('span','arrow','❯'));
      group.appendChild(summary);
      var inner=make('div','fault-machine-inner');
      records.forEach(function(f){
        var card=make('details','fault-entry');card.dataset.faultId=String(f.id);
        card.open=String(openFault)===String(f.id)||openCards.has(String(f.id));
        var row=make('summary'),left=make('div','fault-summary-main');
        left.appendChild(make('strong','',f.subject));
        left.appendChild(make('small','',(f.date||'Ukjend dato')+' · Meldt av '+(f.reportedBy||'Ukjend')));
        var badges=make('div','fault-badges');
        var statusChoice=faultStatusChoice(f.status);
        badges.appendChild(faultBadge(statusChoice.label,statusChoice.badge));
        if(f.priority==='hastar' || f.priority==='akutt') badges.appendChild(faultBadge(faultPriorityLabels[f.priority], 'urgent'));
        left.appendChild(badges);row.appendChild(left);row.appendChild(make('span','arrow','❯'));card.appendChild(row);
        var body=make('div','fault-details');
        faultInfo(body,'Dato',f.date);
        faultInfo(body,'Prioritet',faultPriorityLabels[f.priority]||'Vanleg');
        if(f.hours!=='' && f.hours!==null && f.hours!==undefined) faultInfo(body,'Timetal ved feilen',f.hours+' timar');
        faultInfo(body,'Meldt av',f.reportedBy||'Ukjend');
        faultInfo(body,'Beskriving',f.description);
        faultInfo(body,'Status',statusChoice.label);
        if(f.statusUpdatedAt) {
          faultInfo(body,'Status sist endra',new Date(f.statusUpdatedAt).toLocaleString('nb-NO')+(f.statusUpdatedBy?' av '+f.statusUpdatedBy:''));
        }
        if(faultStatusId(f.status)==='ferdig') {
          faultInfo(body,'Ferdigmeldt av',f.fixedBy||'Ikkje oppgitt');
          faultInfo(body,'Ferdigmeldt',f.fixedAt?new Date(f.fixedAt).toLocaleString('nb-NO'):'Ikkje oppgitt');
        }
        {
          var controls=make('div','fault-controls');
          var statusField=make('div','fault-status-field');
          var statusLabel=make('label','','Status for feilmeldinga');
          var statusSelect=make('select','fault-status-select fault-manage-status');
          statusSelect.id='fault-status-'+String(f.id).replace(/[^a-zA-Z0-9_-]/g,'-');
          statusLabel.setAttribute('for',statusSelect.id);
          statusSelect.setAttribute('aria-label','Endre status for '+f.subject);
          faultStatusChoices.forEach(function(choice){
            var option=make('option','',choice.label);option.value=choice.id;statusSelect.appendChild(option);
          });
          statusSelect.value=faultStatusId(f.status);
          statusSelect.disabled=!employeeCanService();
          statusSelect.addEventListener('change',function(){
            if(!employeeCanService()) {employeeDeny();statusSelect.value=faultStatusId(f.status);return;}
            var next=statusSelect.value;
            if(next===faultStatusId(f.status))return;
            f.status=next;
            f.statusUpdatedBy=employeeCurrent?employeeCurrent.name:'';
            f.statusUpdatedAt=new Date().toISOString();
            if(next==='ferdig') {f.fixedBy=f.statusUpdatedBy;f.fixedAt=f.statusUpdatedAt;}
            else {f.fixedBy='';f.fixedAt='';}
            var ok=faultPersist();faultRender(machineId,f.id);
            $('fault-board-feedback').textContent=ok?'✓ Status er endra til «'+faultStatusChoice(next).label+'».':'Status er endra, men kunne ikkje lagrast i nettlesaren.';
            $('fault-board-feedback').hidden=false;
          });
          statusField.appendChild(statusLabel);
          statusField.appendChild(statusSelect);
          statusField.appendChild(make('span','fault-status-hint','Statusen blir lagra automatisk når du vel eit alternativ.'));
          controls.appendChild(statusField);
          if(employeeCanService()) {
          var edit=make('button','btn secondary fault-manage-action','Rediger');edit.type='button';
          edit.addEventListener('click',function(){
            if(!employeeCanService()) {employeeDeny();return;}
            var current=faultCurrentMachine(f);
            if(!current){$('fault-board-feedback').textContent='Denne maskina er ikkje lenger i Maskinregisteret og kan ikkje redigerast. Feilmeldinga er bevart.';$('fault-board-feedback').hidden=false;return;}
            faultEditingId=String(f.id);
            showPage('rapporter');faultChoices();
            $('fault-machine').value=String(f.machineId);
            $('fault-date').value=f.date||faultDateToday();
            $('fault-title').value=f.subject||'';
            $('fault-priority').value=f.priority||'normal';
            $('fault-hours').value=f.hours==null?'':String(f.hours);
            $('fault-description').value=f.description||'';
            $('fault-form-title').textContent='Rediger feilmelding';
            $('fault-save').textContent='Lagre endringar';
            $('fault-cancel').hidden=false;
            faultTell('Du redigerer feilmeldinga «'+f.subject+'».',false);
            $('fault-form-title').scrollIntoView({block:'start'});
          });controls.appendChild(edit);
          var del=make('button','btn secondary fault-manage-action','Slett');del.type='button';controls.appendChild(del);
          var confirmBox=make('div','fault-confirm');confirmBox.hidden=true;
          confirmBox.appendChild(make('p','','Vil du sletta denne feilmeldinga permanent?'));
          var yes=make('button','btn danger fault-manage-action','Ja, slett');yes.type='button';
          var no=make('button','btn secondary','Avbryt');no.type='button';
          var actions=make('div','actions');actions.appendChild(yes);actions.appendChild(no);confirmBox.appendChild(actions);body.appendChild(confirmBox);
          del.addEventListener('click',function(){confirmBox.hidden=false;yes.focus();});
          no.addEventListener('click',function(){confirmBox.hidden=true;del.focus();});
          yes.addEventListener('click',function(){
            if(!employeeCanService()){employeeDeny();return;}
            faultReports=faultReports.filter(function(item){return String(item.id)!==String(f.id);});
            if(faultEditingId===String(f.id)) faultReset();
            var ok=faultPersist();faultRender(machineId);
            $('fault-board-feedback').textContent=ok?'✓ Feilmeldinga er sletta.':'Feilmeldinga er fjerna, men kunne ikkje lagrast i nettlesaren.';
            $('fault-board-feedback').hidden=false;
          });
          }
          body.appendChild(controls);
        }
        card.appendChild(body);inner.appendChild(card);
      });
      group.appendChild(inner);board.appendChild(group);
    });
  }
  function faultSave(event) {
    if(event)event.preventDefault();
    if(!employeeCurrent || !employeeCurrent.confirmed){faultTell('Du må vera logga inn for å melda feil.',true);return;}
    if(faultEditingId && !employeeCanService()){employeeDeny();return;}
    var machine=machines.find(function(m){return String(m.id)===String($('fault-machine').value);});
    if(!machine){faultTell('Vel ei maskin frå Maskinregisteret først.',true);$('fault-machine').focus();return;}
    var date=$('fault-date').value,title=$('fault-title').value.trim(),desc=$('fault-description').value.trim();
    var priority=$('fault-priority').value;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){faultTell('Vel dato for feilen.',true);$('fault-date').focus();return;}
    if(!title){faultTell('Skriv kort kva som er gale.',true);$('fault-title').focus();return;}
    if(!desc){faultTell('Skriv ei beskriving av feilen og kva som må fiksast.',true);$('fault-description').focus();return;}
    var hourInput=$('fault-hours').value.trim().replace(/\s/g,'').replace(',','.');
    var hours='';
    if(hourInput!==''){
      var hourNum=Number(hourInput);
      if(!Number.isFinite(hourNum) || hourNum<0 || hourNum>100000000){faultTell('Timetal må vera eit positivt tal, eller stå tomt.',true);$('fault-hours').focus();return;}
      hours=String(hourNum);
    }
    var f;
    if(faultEditingId){
      f=faultReports.find(function(item){return String(item.id)===faultEditingId;});
      if(!f){faultReset();faultTell('Feilmeldinga finst ikkje lenger.',true);return;}
      Object.assign(f,{machineId:String(machine.id),machineName:serviceName(machine),date:date,subject:title,description:desc,priority:faultAllowedPriorities[priority]?priority:'normal',hours:hours});
    } else {
      f={id:String(Date.now())+'-'+Math.random().toString(36).slice(2,10),machineId:String(machine.id),machineName:serviceName(machine),
        date:date,createdAt:new Date().toISOString(),subject:title,description:desc,priority:faultAllowedPriorities[priority]?priority:'normal',hours:hours,
        reportedBy:employeeCurrent.name,reportedEmail:employeeCurrent.email,status:'open',statusUpdatedAt:'',statusUpdatedBy:'',fixedAt:'',fixedBy:''};
      faultReports.unshift(f);
    }
    var editing=!!faultEditingId;
    var saved=faultPersist(),machineId=f.machineId,id=f.id;
    faultReset();
    showPage('servicebok');
    faultRender(machineId,id);
    $('fault-board-feedback').textContent=(saved?'✓ ':'⚠ ') +(editing?'Feilmeldinga er oppdatert':'Feilmeldinga er registrert')+' på '+faultMachineName(f)+(saved?'.':' – men kunne ikkje lagrast på denne PC-en.');
    $('fault-board-feedback').hidden=false;
    $('fault-board').scrollIntoView({block:'start'});
  }
  $('fault-search').addEventListener('input',function(){faultRender();});
  $('fault-search-clear').addEventListener('click',function(){
    $('fault-search').value='';
    faultRender();
    $('fault-search').focus();
  });
  $('fault-form').addEventListener('submit',faultSave);
  $('fault-cancel').addEventListener('click',function(){faultReset();faultTell('',false);});
  window.addEventListener('storage',function(event){
    if(event.key!==faultKey)return;
    try {
      var updates=JSON.parse(event.newValue||'[]');
      if(!Array.isArray(updates))return;
      faultReports=updates.filter(function(f){return f && f.id && f.machineId && f.subject;});
      machineSyncRegisteredHours(); faultRender(); render();
    } catch(error) {/* Ignorer ugyldige data frå ei anna fane. */}
  });
  window.addEventListener('storage',function(event){
    if(event.key===serviceKey) {
      try {
        var current=JSON.parse(event.newValue||'[]');
        if(Array.isArray(current)) {
          serviceEntries=current.filter(function(record){return record && record.id && record.date && record.machineName;});
          machineSyncRegisteredHours(); serviceRender(); render();
        }
      } catch(error) {/* Ignorer ugilde data. */}
    }
    if(event.key===storageKey) {
      try {
        var currentMachines=JSON.parse(event.newValue||'[]');
        if(Array.isArray(currentMachines)) {
          machines=currentMachines.filter(function(m){return m && m.id;}).map(function(m){
            var hours=machineHourNumber(m.hours);
            return {id:String(m.id),name:String(m.name||''),brand:String(m.brand||''),model:String(m.model||''),hours:hours===null?0:hours,registeredBy:String(m.registeredBy||''),dealer:String(m.dealer||''),machineFor:String(m.machineFor||'')};
          });
          machineSyncRegisteredHours();render();serviceChoices();faultChoices();serviceRender();faultRender();
        }
      } catch(error) {/* Ignorer ugilde data. */}
    }
  });
  machineSyncRegisteredHours();
  faultReset();
  faultRender();

  serviceReset();
  serviceRender();

  $('service-script-warning').hidden = true;
  $('not-running').hidden = true;
  $('ready').hidden = false;
  render();
})();
