// Explicit decision models; no network requests, real credentials, or home-grown cryptography.
export const escapeHTML=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export function trustDecision(source,validated){return source==='Verified server session'||validated;}
export const permissionSets={
 'Shared administrator':['Read orders','Update orders','Export customers','Delete backups'],
 'Order worker':['Read orders','Update orders'],
 'Read-only worker':['Read orders']
};
export function attackPaths(s){return [
 {name:'Another user → object API → private record',blocked:s.objectCheck,control:'Object authorization'},
 {name:'Public bucket → exported records',blocked:s.privateStorage,control:'Private storage policy'},
 {name:'Build credential → production export',blocked:s.scopedBuild,control:'Scoped build identity'}
];}
export function passwordCost(ms,accounts,uniqueSalt,lanes){
 const guesses=1000000,work=guesses*(uniqueSalt?accounts:1);
 return {work,seconds:work*ms/1000/lanes,perSecond:lanes*1000/ms};
}
export function factorResult(kind,lookalike,fresh){
 if(!fresh)return {accepted:false,reason:'Challenge or code is stale.'};
 if(kind==='Origin-bound passkey'&&lookalike)return {accepted:false,reason:'This origin cannot use the real site’s credential.'};
 return {accepted:true,reason:lookalike?'A fresh phished password and OTP can be relayed.':'The modeled proof is accepted.'};
}
export function sessionAccept(s,id){return s.loggedIn&&!s.revoked&&s.now<s.expires&&id===s.currentId;}
export function oauthChecks(s){return [
 ['Registered redirect URI',s.redirect],['Callback bound to this browser transaction',s.correlated],
 ['Code redemption permitted',codeRedemption(s.stolen,s.pkce)],
 ];}
// For an intercepted code, PKCE blocks redemption because the interceptor lacks the verifier.
export function codeRedemption(stolen,pkce){return !stolen||!pkce;}
export function objectAccess({authenticated,owner,action,role}){
 if(!authenticated||!['Viewer','Editor','Admin'].includes(role)||!['Read','Edit'].includes(action))return false;
 if(role==='Admin')return true;
 return owner&&(action==='Read'||role==='Editor');
}
export function tenantRead({cacheHit,cacheScoped,queryScoped,enforceTenant}){
 const returnedTenant=cacheHit?(cacheScoped?'A':'B'):(queryScoped?'A':'B');
 return {returnedTenant,allowed:!enforceTenant||returnedTenant==='A',leak:!enforceTenant&&returnedTenant==='B'};
}
export function policyDecision(role,action,owns,locked){
 const known=['Viewer','Editor','Admin'].includes(role)&&['Read','Edit','Delete'].includes(action);
 const roleAllows=known&&(role==='Admin'||action==='Read'||role==='Editor'&&action==='Edit');
 const relationAllows=role==='Admin'||owns;
 const restriction=locked&&action!=='Read';
 return {roleAllows,relationAllows,restriction,allowed:roleAllows&&relationAllows&&!restriction};
}
export function tokenChecks(profile,now){return [
 ['Signature verifies under trusted key',profile!=='Bad signature'],
 ['Algorithm is explicitly permitted',profile!=='Unapproved algorithm'],
 ['Issuer is expected',profile!=='Wrong issuer'],
 ['Audience includes this API',profile!=='Wrong audience'],
 ['Current time is before expiry',now<60]
];}
export function injectionOutcome(bound,malicious){return {structureChanged:!bound&&malicious,rows:!bound&&malicious?3:malicious?0:1};}
export function csrfModel(s){
 // Cross-site simple credentialed fetch POST; cookie SameSite=None requires Secure, assumed HTTPS.
 const cookie=s.sameSite==='None';
 const rejected=s.originCheck||s.tokenCheck;
 return {sent:true,cookie,changed:cookie&&!rejected,responseReadable:s.cors};
}
export function ssrfModel(destination,validateEachHop,egress){
 const redirected=destination==='Allowed host redirects inward',direct=destination==='Direct internal address';
 const appBlocked=direct||(redirected&&validateEachHop);
 const internal=direct||redirected;
 return {appBlocked,networkBlocked:internal&&egress,internalReached:internal&&!appBlocked&&!egress};
}
export function tlsModel({hostname,chain,expired,edgeOnly}){
 const authenticated=hostname&&chain&&!expired;
 return {authenticated,clientToEdge:authenticated,edgeToService:authenticated&&!edgeOnly};
}
export function aeadModel({tamper,aadChanged,wrongKey,reuseNonce}){
 return {verified:!tamper&&!aadChanged&&!wrongKey,secureUse:!reuseNonce};
}
export function keyRotation(s){
 return {oldReadable:s.oldKeyPresent||s.rewrapped,newWritesKey:s.rotated?'K2':s.oldKeyPresent?'K1':'Unavailable'};
}
export function retainedCopies(days,deleteRequested){return [
 {name:'Primary record',present:!deleteRequested},
 {name:'Search index',present:!deleteRequested||days<1},
 {name:'Analytics export',present:!deleteRequested||days<7},
 {name:'Backup snapshot',present:!deleteRequested||days<30}
];}
export function provenanceChecks(s){return [
 ['Artifact digest matches attestation',s.digest],['Signature / attestation authenticated',s.signature],
 ['Builder is approved',s.builder],['Source revision is approved',s.source]
];}
export function secretState(s){return {legitimateWorks:s.clientNew?s.newIssued:!s.oldRevoked,stolenWorks:!s.oldRevoked};}
export function hardening(s){return [
 {name:'Host control socket',reachable:s.hostSocket},
 {name:'Writable application files',reachable:!s.readonly},
 {name:'Root-only files in container',reachable:s.root},
 {name:'Outbound internal service',reachable:!s.egress}
];}
export function assurance(s){return [
 ['Own-object positive path',true],['Other user’s object denied',s.object],
 ['Other tenant denied',s.tenant],['New action denied by default',s.defaultDeny],
 ['Expired credential rejected',s.expiry]
];}
export function abuseBudget(requests,cost,limit,weighted){
 const admitted=Math.min(requests,Math.floor(limit/(weighted?cost:1)));
 return {admitted,rejected:requests-admitted,work:admitted*cost};
}
export function auditEvent(includeSecret,structured){
 const event={time:'2026-10-06T12:00:00Z',actor:'user-17',action:'export',resource:'tenant-A/report-8',decision:'deny',requestId:'req-42'};
 if(includeSecret)event.authorization='Bearer DEMO_EXPOSED_TOKEN';
 const userText='display-name\nresult=allow';
 return {event,representation:structured?JSON.stringify({...event,untrustedLabel:userText},null,2):Object.entries(event).map(([k,v])=>`${k}=${v}`).join(' ')+` label=${userText}`};
}
export function responseState(s){
 return {activeAccess:!s.revoked&&!s.isolated,persistence:!s.rebuilt,evidence:s.preserved,
 recovered:s.revoked&&s.rebuilt&&s.validated,readyToReconnect:s.revoked&&s.rebuilt&&s.validated};
}
