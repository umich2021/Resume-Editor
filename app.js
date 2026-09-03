"use strict";
const $ = s => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);
const clone = o => JSON.parse(JSON.stringify(o));
const STORE_KEY = "resume-studio:store";   // { v, currentId, order:[id], docs:{ id:{id,name,updated,data} } }
const OLD_KEY = "resume-studio:v1";        // pre-versioning single résumé
const THEME_KEY = "resume-studio:theme";

/* ---------------- default résumé (extracted from HealthCareResume.pdf) ---------------- */
const DEFAULT = {
  name: "Jimson Yang",
  email: "jimson@umich.edu",
  phone: "(269) 883-0074",
  location: "",
  links: [],
  site: { label: "Personal projects", url: "", show: false },
  sections: [
    {
      id: uid(), title: "EDUCATION", kind: "entries",
      entries: [{
        id: uid(),
        org: "University of Michigan",
        location: "Ann Arbor, MI",
        date: "May 2025",
        subtitle: "Stephen M. Ross School of Business",
        extra: "Bachelor of Business Administration",
        bullets: [
          "GPA 3.93/4.00",
          "Member of Michigan Research and Discovery Scholars (MRADS)",
          "Handball Club — Interim President"
        ]
      }],
      bullets: []
    },
    {
      id: uid(), title: "EXPERIENCE", kind: "entries",
      entries: [
        {
          id: uid(), org: "Arboretum Ventures", location: "Ann Arbor, MI", date: "2023",
          subtitle: "Intern", extra: "",
          bullets: [
            "Revised market size of current investment by conducting comprehensive analysis of Inflammatory Bowel Disease (IBD) population, outlining reasons behind discrepancy between market size projections and actual potential, producing detailed 1-page report",
            "Actively engaged in learning about different classifications and pathways for medical device approvals, such as 510(k) clearance process and pre-market approval (PMA) requirements, enhancing knowledge of regulatory space",
            "Utilized diverse research methods, including market analysis, industry reports, and targeted searches, to gather relevant information on strategic matters for managing director, varying in topics from high net worth individuals to market size of CT angiograms",
            "Projected potential ownership stakes, dilution, and valuation scenarios, enabling informed investment decision-making, and collaborated with investment team to provide insights and recommendations based on the analysis of a hypothetical cap table"
          ]
        },
        {
          id: uid(), org: "Invest Detroit Ventures", location: "Detroit, MI", date: "2022",
          subtitle: "Summer Intern", extra: "",
          bullets: [
            "Collaborated with colleagues to procure market analysis of advantages, disadvantages, trends, and summary for diagnostic device market for a startup in the investment pipeline",
            "Handled exit analysis for a diagnostic start-up in the investment pipeline by evaluating competition, exits, and market trends, finishing the market analysis in less than 2 days"
          ]
        },
        {
          id: uid(), org: "Sling Health", location: "Ann Arbor, MI", date: "2021–2022",
          subtitle: "Team Member", extra: "",
          bullets: [
            "Reached out to 16 surgeons to assess feasibility of finding solutions for head fixation devices, leading to the realization that the neck fixation market was the best fit for the project and to a doctor willing to be our team mentor",
            "Evaluated research reports and market analyses to estimate total U.S. spinal surgeries that require head fixation devices and created a SWOT analysis, resulting in excellent reviews in the business portion of our design review",
            "Recorded meeting notes with doctors and communicated with team members to validate the problem need and identify critical criteria for our solution, creating priorities of necessary features and functions for the device",
            "Researched materials the device could be made of to be safe yet cheap, choosing the best material to prototype from 13 candidates ranging from stainless steel to various ceramics"
          ]
        },
        {
          id: uid(), org: "Ross School of Business", location: "Ann Arbor, MI", date: "2021–2022",
          subtitle: "Research Assistant", extra: "",
          bullets: [
            "Collaborated with researchers to collect survey responses about management and worker-leader relationships from leaders at F300 companies, leading to over 220 responses from executives, managers, and their employees",
            "Reached out to CEOs and senior managers for interviews about leadership and challenge, resulting in over 20 interviews from executives and senior managers at F100 companies",
            "Facilitated group lab sessions of gig contractors analyzing the hierarchy of how people interact based on sociability and discussion topic, moderating 6 one-hour sessions each week"
          ]
        }
      ],
      bullets: []
    },
    {
      id: uid(), title: "ADDITIONAL", kind: "list", entries: [],
      bullets: [
        "Hobbies include cooking, watching movies, and completing my bucket list",
        "Fun fact: it's my goal to make dishes from 100 nations",
        "Proficient in Excel, Word, PowerPoint, and Notion"
      ]
    }
  ]
};

const mkBullet = t => ({ text: t || "", on: true });
const emptyEntry = () => ({ id: uid(), org:"", location:"", date:"", subtitle:"", extra:"", on:true, bullets:[mkBullet("")] });
const BLANK = {
  name:"", email:"", phone:"", location:"", links:[],
  site:{ label:"Personal projects", url:"", show:false },
  sections:[
    { id: uid(), title:"EDUCATION", kind:"entries", on:true, entries:[emptyEntry()], bullets:[] },
    { id: uid(), title:"EXPERIENCE", kind:"entries", on:true, entries:[emptyEntry()], bullets:[] },
    { id: uid(), title:"SKILLS", kind:"list", on:true, entries:[], bullets:[mkBullet("")] }
  ]
};

// bring any stored / imported / default shape up to the current model:
// every section + entry + bullet carries an `on` flag (include in the résumé); bullets are {text,on}
function normalizeState(s){
  if(!s || typeof s !== "object") s = clone(DEFAULT);
  if(!s.site || typeof s.site !== "object") s.site = { label:"Personal projects", url:"", show:false };
  if(typeof s.site.show !== "boolean") s.site.show = false;
  s.name = s.name || ""; s.email = s.email || ""; s.phone = s.phone || ""; s.location = s.location || "";
  if(!Array.isArray(s.links)) s.links = [];
  if(!Array.isArray(s.sections) || !s.sections.length) s.sections = clone(DEFAULT.sections);
  const fixB = arr => (Array.isArray(arr) ? arr : []).map(b =>
    typeof b === "string" ? mkBullet(b) : { text: (b && b.text) || "", on: !(b && b.on === false) });
  s.sections.forEach(sec => {
    if(!sec.id) sec.id = uid();
    sec.title = sec.title || "SECTION";
    sec.kind = sec.kind === "list" ? "list" : "entries";
    sec.on = !(sec.on === false);
    sec.entries = Array.isArray(sec.entries) ? sec.entries : [];
    sec.bullets = fixB(sec.bullets);
    sec.entries.forEach(e => {
      if(!e.id) e.id = uid();
      e.on = !(e.on === false);
      ["org","location","date","subtitle","extra"].forEach(k => e[k] = e[k] || "");
      e.bullets = fixB(e.bullets);
    });
  });
  return s;
}

/* ---------------- résumé store (multiple named versions, all local) ---------------- */
function loadStore(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw){
      const s = JSON.parse(raw);
      if(s && s.docs && s.currentId && s.docs[s.currentId]){
        if(!Array.isArray(s.order) || !s.order.length) s.order = Object.keys(s.docs);
        return s;
      }
    }
  }catch(e){}
  let seed = null;
  try{ const o = localStorage.getItem(OLD_KEY); if(o) seed = JSON.parse(o); }catch(e){}
  const id = uid();
  return { v:2, currentId:id, order:[id],
    docs:{ [id]:{ id, name:"My résumé", updated:Date.now(), data: seed || clone(DEFAULT) } } };
}
function persistStore(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(store)); }catch(e){} }
function curDoc(){ return store.docs[store.currentId]; }

let store = loadStore();
let state = normalizeState(curDoc().data);
curDoc().data = state;

let collapsed = {};        // block id -> bool  (section blocks + "bul:<entryId>" bullet groups)
let focusEntry = null;     // entry id being edited
let focusRequest = null;   // data-fid to focus after editor render

let saveTimer;
function save(now){
  clearTimeout(saveTimer);
  const flag = $("#saveflag");
  flag.classList.add("busy"); flag.querySelector("span").textContent = "Saving…";
  const doWrite = () => {
    const d = curDoc();
    if(d){ d.data = state; d.updated = Date.now(); }
    persistStore();
    flag.classList.remove("busy"); flag.querySelector("span").textContent = "Saved";
    updateDocLabel();
  };
  if(now) doWrite(); else saveTimer = setTimeout(doWrite, 500);
}

function updateDocLabel(){
  const lbl = $("#docLabel");
  if(lbl) lbl.textContent = curDoc() ? curDoc().name : "";
}
function switchDoc(id){
  if(!store.docs[id] || id === store.currentId) return;
  save(true);
  store.currentId = id;
  state = normalizeState(store.docs[id].data);
  store.docs[id].data = state;
  collapsed = {}; focusEntry = null;
  persistStore(); render(); updateDocLabel(); renderDocs();
  toast('Now editing "' + store.docs[id].name + '"');
}
function addDoc(name, data){
  const id = uid();
  store.docs[id] = { id, name: name || "Untitled", updated: Date.now(), data: normalizeState(data || clone(BLANK)) };
  store.order.push(id);
  return id;
}
function newDoc(){
  const id = addDoc("Résumé " + (store.order.length + 1), clone(BLANK));
  persistStore(); switchDoc(id);
}
function duplicateDoc(id){
  const src = store.docs[id]; if(!src) return;
  const nid = addDoc(src.name.replace(/ copy( \d+)?$/i, "") + " copy", clone(src.data));
  persistStore(); switchDoc(nid);
}
function renameDoc(id, name){
  if(!store.docs[id]) return;
  store.docs[id].name = (name || "").trim() || store.docs[id].name;
  persistStore(); updateDocLabel(); renderDocs();
}
function deleteDoc(id){
  if(!store.docs[id] || store.order.length <= 1) return;
  if(!confirm('Delete "' + store.docs[id].name + '"? This can\'t be undone.')) return;
  delete store.docs[id];
  store.order = store.order.filter(x => x !== id);
  if(store.currentId === id){
    store.currentId = store.order[0];
    state = normalizeState(curDoc().data); curDoc().data = state;
    collapsed = {}; focusEntry = null; render();
  }
  persistStore(); updateDocLabel(); renderDocs();
}
function timeAgo(ts){
  const s = Math.max(1, (Date.now() - ts) / 1000);
  if(s < 60) return "just now";
  if(s < 3600) return Math.floor(s / 60) + " min ago";
  if(s < 86400) return Math.floor(s / 3600) + " hr ago";
  if(s < 604800) return Math.floor(s / 86400) + " d ago";
  return new Date(ts).toLocaleDateString();
}
function renderDocs(){
  const list = $("#docsList");
  if(!list) return;
  list.innerHTML = "";
  store.order.filter(id => store.docs[id]).forEach(id => {
    const d = store.docs[id];
    const cur = id === store.currentId;
    const row = el("div", { class:"docrow" + (cur ? " cur" : "") });
    const nameEl = el("b", { text: d.name });
    const pick = el("button", { class:"pick", type:"button", onclick: () => { if(!cur){ switchDoc(id); } } },
      nameEl, el("small", { text: (cur ? "editing now · " : "") + "saved " + timeAgo(d.updated) }));
    const rename = el("button", { class:"mini", title:"Rename", onclick: () => {
      const inp = el("input", { type:"text", value: d.name });
      pick.replaceChild(inp, pick.firstChild);
      inp.focus(); inp.select();
      let done = false;
      const commit = () => { if(done) return; done = true; renameDoc(id, inp.value); };
      inp.addEventListener("keydown", e => {
        if(e.key === "Enter"){ e.preventDefault(); commit(); }
        else if(e.key === "Escape"){ done = true; renderDocs(); }
      });
      inp.addEventListener("blur", commit);
    }}, ico(I.pen));
    const dup = el("button", { class:"mini", title:"Duplicate (for a role-specific version)", onclick: () => duplicateDoc(id) }, ico(I.copy));
    const del = el("button", { class:"mini del", title:"Delete", disabled: store.order.length <= 1, onclick: () => deleteDoc(id) }, ico(I.del));
    row.append(pick, el("div", { class:"acts" }, rename, dup, del));
    list.append(row);
  });
}

/* ---------------- dom helper ---------------- */
function el(tag, props, ...kids){
  const n = document.createElement(tag);
  for(const [k, v] of Object.entries(props || {})){
    if(v == null || v === false) continue;
    if(k === "class") n.className = v;
    else if(k === "text") n.textContent = v;
    else if(k === "html") n.innerHTML = v;
    else if(k.slice(0,2) === "on") n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  for(const kid of kids.flat()){
    if(kid == null || kid === false) continue;
    n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return n;
}
const ico = d => el("span", { html:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>` });
function checkbox(on, onToggle, title){
  const c = el("input", { type:"checkbox", class:"chk", title: title || "Include in the résumé" });
  c.checked = on !== false;
  c.addEventListener("change", () => onToggle(c.checked));
  return c;
}
const I = {
  up:'<path d="M12 19V5M6 11l6-6 6 6"/>',
  down:'<path d="M12 5v14M6 13l6 6 6-6"/>',
  del:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  chev:'<path d="M6 9l6 6 6-6"/>',
  pen:'<path d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3z"/><path d="M13.5 6.5l3 3"/>',
  copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'
};

/* ---------------- editor render ---------------- */
function grow(t){ t.style.height = "auto"; t.style.height = (t.scrollHeight + 2) + "px"; }
function growAll(){ document.querySelectorAll(".editor textarea").forEach(grow); }

function bindInput(node, apply){
  node.addEventListener("input", () => {
    apply(node.value);
    if(node.tagName === "TEXTAREA") grow(node);
    renderPreview();
    save();
  });
}

function fieldText(label, value, apply, opts){
  opts = opts || {};
  const input = opts.area
    ? el("textarea", { rows:2, placeholder: opts.ph || "" })
    : el("input", { type:"text", placeholder: opts.ph || "", value });
  if(opts.area) input.value = value || "";
  if(opts.fid) input.setAttribute("data-fid", opts.fid);
  bindInput(input, apply);
  return el("div", { class:"f" }, el("label", { text: label }), input);
}

function moveCtl(list, idx, after){
  const wrap = el("span", { style:"display:flex; gap:3px" });
  const mk = (dir, dis, dd) => {
    const b = el("button", { class:"mini", title: dir, disabled: dis, onclick: () => {
      const [x] = list.splice(idx, 1); list.splice(idx + dd, 0, x); after();
    }}, ico(dir === "Move up" ? I.up : I.down));
    return b;
  };
  wrap.append(mk("Move up", idx === 0, -1), mk("Move down", idx === list.length - 1, 1));
  const d = el("button", { class:"mini del", title:"Delete", onclick: () => { list.splice(idx, 1); after(); }}, ico(I.del));
  wrap.append(d);
  return wrap;
}

function renderEntry(sec, entry, idx){
  const edu = /EDUC/i.test(sec.title);
  const card = el("div", { class: "entry" + (focusEntry === entry.id ? " focused" : "") + (entry.on === false ? " off" : "") });
  card.addEventListener("focusin", () => {
    if(focusEntry !== entry.id){ focusEntry = entry.id; document.querySelectorAll(".entry").forEach(e => e.classList.remove("focused")); card.classList.add("focused"); }
  });

  const head = el("div", { class:"entry-head" },
    checkbox(entry.on, v => { entry.on = v; render(); save(); }, "Include this entry in the résumé"),
    el("span", { class:"tag", text: edu ? "School" : "Role" }),
    entry.on === false ? el("span", { class:"exflag", text:"hidden" }) : null,
    moveCtl(sec.entries, idx, () => { render(); save(); })
  );

  const org = fieldText(edu ? "Institution" : "Organization", entry.org, v => entry.org = v, { fid: "e-" + entry.id });
  const loc = fieldText("Location", entry.location, v => entry.location = v, { ph:"City, ST" });
  const date = fieldText("Dates", entry.date, v => entry.date = v, { ph: edu ? "May 2025" : "2023–2024" });
  const sub = fieldText(edu ? "Program / school" : "Title", entry.subtitle, v => entry.subtitle = v);
  const extra = fieldText(edu ? "Degree / detail" : "Detail (optional)", entry.extra, v => entry.extra = v);

  const ckey = "bul:" + entry.id;
  const bcol = !!collapsed[ckey];
  const shown = entry.bullets.filter(b => b.on !== false).length;
  const bar = el("div", { class:"bullbar" },
    el("label", { text:"Bullet points" }),
    el("span", {},
      el("span", { class:"tot", text: `${shown}/${entry.bullets.length} shown  ` }),
      entry.bullets.length ? el("button", { class:"linkbtn", type:"button",
        onclick: () => { collapsed[ckey] = !bcol; render(); } }, bcol ? "Show bullets" : "Hide bullets") : null
    )
  );
  card.append(head, el("div", { class:"duo" }, org, loc), el("div", { class:"duo" }, date, sub), extra, bar);

  if(!bcol){
    const bullets = el("div", { class:"bullets" });
    entry.bullets.forEach((b, bi) => bullets.append(renderBullet(entry.bullets, bi, () => { render(); save(); })));
    const addBul = el("button", { class:"add", onclick: () => {
      entry.bullets.push(mkBullet("")); focusRequest = mkBid(entry.bullets, entry.bullets.length - 1);
      render(); save();
    }}, ico(I.plus), "Add bullet");
    card.append(bullets, el("div", { class:"addline" }, addBul));
  }
  return card;
}

function renderBullet(list, i, after){
  const b = list[i];
  const ta = el("textarea", { rows:2, "data-fid": mkBid(list, i) });
  ta.value = b.text;
  bindInput(ta, v => b.text = v);
  const row = el("div", { class:"bul" + (b.on === false ? " off" : "") });
  const chk = checkbox(b.on, v => { b.on = v; row.classList.toggle("off", !v); renderPreview(); save(); updateBarCounts(row); }, "Include this bullet in the résumé");
  const ctl = el("div", { class:"bul-ctl" },
    el("button", { class:"mini", title:"Move up", disabled: i === 0, onclick: () => { const [x] = list.splice(i,1); list.splice(i-1,0,x); after(); }}, ico(I.up)),
    el("button", { class:"mini", title:"Move down", disabled: i === list.length - 1, onclick: () => { const [x] = list.splice(i,1); list.splice(i+1,0,x); after(); }}, ico(I.down)),
    el("button", { class:"mini del", title:"Delete", onclick: () => { list.splice(i,1); after(); }}, ico(I.del))
  );
  row.append(chk, ta, ctl);
  return row;
}
// keep the "N/M shown" label live when a bullet is toggled without a full re-render
function updateBarCounts(fromRow){
  const card = fromRow.closest(".entry, .block-body");
  if(!card) return;
  const rows = card.querySelectorAll(".bul");
  const shown = [...rows].filter(r => !r.classList.contains("off")).length;
  const tot = card.querySelector(".bullbar .tot");
  if(tot) tot.textContent = `${shown}/${rows.length} shown  `;
}
// stable-ish id so we can restore focus to a freshly added bullet
let _bidMap = new WeakMap();
function mkBid(list, i){
  if(!_bidMap.has(list)) _bidMap.set(list, uid());
  return "b-" + _bidMap.get(list) + "-" + i;
}

function block(id, titleNode, count, bodyNodes, cls){
  const isCol = !!collapsed[id];
  const b = el("div", { class:"block" + (isCol ? " collapsed" : "") + (cls ? " " + cls : "") });
  const chev = el("span", { class:"chev", html:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${I.chev}</svg>` });
  const header = el("header", { onclick: (e) => {
    if(e.target.closest("input,select,button")) return;
    collapsed[id] = !collapsed[id]; b.classList.toggle("collapsed");
  }}, chev, titleNode, count != null ? el("span", { class:"count", text: count }) : null);
  b.append(header, el("div", { class:"block-body" }, ...bodyNodes));
  return b;
}

function renderEditor(){
  const root = $("#editorInner");
  root.innerHTML = "";

  /* contact block */
  const cName = fieldText("Full name", state.name, v => state.name = v);
  const cEmail = fieldText("Email", state.email, v => state.email = v);
  const cPhone = fieldText("Phone", state.phone, v => state.phone = v);
  const cLoc = fieldText("Location (optional)", state.location, v => state.location = v, { ph:"Ann Arbor, MI" });
  const links = el("div", { class:"linklist" });
  state.links.forEach((lk, i) => {
    const inp = el("input", { type:"text", value: lk, placeholder:"linkedin.com/in/…" });
    bindInput(inp, v => state.links[i] = v);
    links.append(el("div", { class:"linkrow" }, inp,
      el("button", { class:"mini del", title:"Remove", onclick: () => { state.links.splice(i,1); render(); save(); }}, ico(I.del))));
  });
  const addLink = el("button", { class:"add", onclick: () => { state.links.push(""); render(); save(); }}, ico(I.plus), "Add link");

  // personal website — hidden from the résumé until switched on
  const siteToggle = el("input", { type:"checkbox", "aria-label":"Show personal website on résumé" });
  siteToggle.checked = !!state.site.show;
  const siteLabel = el("input", { type:"text", value: state.site.label || "", placeholder:"Portfolio (label, optional)" });
  const siteUrl = el("input", { type:"text", value: state.site.url || "", placeholder:"myproject.com", "data-fid":"site-url" });
  const siteWrap = el("div", { class:"site-row " + (state.site.show ? "on" : "off") });
  bindInput(siteLabel, v => state.site.label = v);
  bindInput(siteUrl, v => state.site.url = v);
  siteToggle.addEventListener("change", () => {
    state.site.show = siteToggle.checked;
    siteWrap.classList.toggle("off", !siteToggle.checked);
    siteWrap.classList.toggle("on", siteToggle.checked);
    if(siteToggle.checked && !state.site.url) siteUrl.focus();
    renderPreview(); save();
  });
  siteWrap.append(
    el("div", { class:"top" },
      el("span", { text:"Personal website" }),
      el("label", { class:"switch" }, siteToggle, el("span", { class:"track" }), el("span", { text:"Show on résumé" }))
    ),
    el("div", { class:"duo3" }, siteLabel, siteUrl)
  );

  root.append(block("contact",
    el("h2", { text:"Contact" }), null,
    [ el("div", { class:"duo" }, cName, cEmail), el("div", { class:"duo" }, cPhone, cLoc),
      siteWrap,
      el("div", { class:"f" }, el("label", { text:"Other links" }), links), el("div", { class:"addline" }, addLink) ]
  ));

  /* section blocks */
  state.sections.forEach((sec, si) => {
    const nameInput = el("input", { type:"text", value: sec.title });
    bindInput(nameInput, v => sec.title = v.toUpperCase());
    const kindSel = el("select", {}, el("option", { value:"entries", text:"Entries" }), el("option", { value:"list", text:"Bulleted list" }));
    kindSel.value = sec.kind;
    kindSel.addEventListener("change", () => { sec.kind = kindSel.value; render(); save(); });
    const secCtl = moveCtl(state.sections, si, () => { render(); save(); });
    const secChk = checkbox(sec.on, v => { sec.on = v; render(); save(); }, "Include this whole section in the résumé");
    const titleNode = el("div", { class:"sect-name-row" }, secChk, nameInput, kindSel, secCtl);

    const body = [];
    if(sec.kind === "entries"){
      sec.entries.forEach((entry, ei) => body.push(renderEntry(sec, entry, ei)));
      const noun = /EXPER|EMPLOY|INTERN|\bWORK\b/i.test(sec.title) ? "experience"
        : /EDUC|SCHOOL/i.test(sec.title) ? "school"
        : /PROJECT/i.test(sec.title) ? "project"
        : /LEAD|ACTIVIT|VOLUNTEER/i.test(sec.title) ? "role"
        : /RESEARCH/i.test(sec.title) ? "position"
        : "entry";
      body.push(el("div", { class:"addline" }, el("button", { class:"add strong sect-add", onclick: () => {
        const ne = emptyEntry();
        sec.entries.push(ne); focusEntry = ne.id; focusRequest = "e-" + ne.id; render(); save();
      }}, ico(I.plus), "Add " + noun)));
    }else{
      const shownN = sec.bullets.filter(b => b.on !== false).length;
      const list = el("div", { class:"bullets" });
      sec.bullets.forEach((b, bi) => list.append(renderBullet(sec.bullets, bi, () => { render(); save(); })));
      body.push(el("div", { class:"bullbar" }, el("label", { text:"Items" }),
        el("span", { class:"tot", text: `${shownN}/${sec.bullets.length} shown  ` })));
      body.push(list);
      body.push(el("div", { class:"addline" }, el("button", { class:"add", onclick: () => {
        sec.bullets.push(mkBullet("")); focusRequest = mkBid(sec.bullets, sec.bullets.length - 1); render(); save();
      }}, ico(I.plus), "Add item")));
    }
    const on = a => a.filter(x => x.on !== false).length;
    const count = sec.kind === "entries"
      ? `${on(sec.entries)}/${sec.entries.length} shown`
      : `${on(sec.bullets)}/${sec.bullets.length} shown`;
    root.append(block("sec-" + sec.id, titleNode, count, body, sec.on === false ? "sec-off" : ""));
  });

  /* add section */
  root.append(el("div", { class:"addline" },
    el("button", { class:"add", onclick: () => {
      state.sections.push(normalizeState({ sections:[{ id: uid(), title:"NEW SECTION", kind:"entries", on:true, entries:[emptyEntry()], bullets:[] }] }).sections[0]);
      render(); save();
    }}, ico(I.plus), "Add section"),
    el("button", { class:"add", onclick: () => {
      state.sections.push({ id: uid(), title:"SKILLS", kind:"list", on:true, entries:[], bullets:[mkBullet("")] });
      render(); save();
    }}, ico(I.plus), "Add skills list"),
    el("button", { class:"add", onclick: resetResume }, "Restore original résumé")
  ));

  growAll();
  if(focusRequest){
    const t = document.querySelector(`[data-fid="${CSS.escape(focusRequest)}"]`);
    if(t){ t.focus(); if(t.tagName === "TEXTAREA") grow(t); }
    focusRequest = null;
  }
}

function resetResume(){
  if(!confirm("Restore the original résumé (Jimson Yang, from HealthCareResume.pdf)? This clears the current edits.")) return;
  state = normalizeState(clone(DEFAULT)); collapsed = {}; focusEntry = null;
  render(); save(true); toast("Original résumé restored");
}

/* ---------------- preview render ---------------- */
const cleanUrl = u => (u || "").trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
function contactParts(){
  return [state.email, state.phone, state.location, ...state.links].map(s => (s || "").trim()).filter(Boolean);
}
function siteShown(){ return !!(state.site && state.site.show && (state.site.url || "").trim()); }
function siteStr(){
  if(!siteShown()) return "";
  const label = (state.site.label || "").trim();
  return (label ? label + " · " : "") + cleanUrl(state.site.url);
}
function contactLine(){
  const parts = contactParts();
  const frag = document.createDocumentFragment();
  parts.forEach((p, i) => {
    if(i) frag.append(el("span", { class:"sep", text:"•" }));
    frag.append(document.createTextNode(p));
  });
  return frag;
}

function entryEl(entry, edu){
  const left = el("div", { class:"r-left" });
  if((entry.date || "").trim()) left.append(el("div", { class:"r-date", text: entry.date.trim() }));
  const body = el("div", { class:"r-body" });
  body.append(el("div", { class:"r-orgrow" },
    el("span", { class:"r-org", text: (entry.org || "").trim() || "—" }),
    (entry.location || "").trim() ? el("span", { class:"r-loc", text: entry.location.trim() }) : null));
  if((entry.subtitle || "").trim())
    body.append(el("div", { class: edu ? "r-sub-b" : "r-sub-i", text: entry.subtitle.trim() }));
  if((entry.extra || "").trim())
    body.append(el("div", { class:"r-extra", text: entry.extra.trim() }));
  const items = entry.bullets.filter(b => b.on !== false).map(b => b.text.trim()).filter(Boolean);
  if(items.length){
    const ul = el("ul", { class:"r-ul" });
    items.forEach(b => ul.append(el("li", { text: b })));
    body.append(ul);
  }
  return el("div", { class:"r-entry" }, left, body);
}

// break the résumé into atomic blocks that a page break may fall between
function buildUnits(){
  const units = [];
  const head = el("div", { class:"u-head" });
  head.append(el("div", { class:"r-name", text: state.name || "Your Name" }));
  const c = el("div", { class:"r-contact" }); c.append(contactLine()); head.append(c);
  if(siteShown()) head.append(el("div", { class:"r-site", text: siteStr() }));
  head.append(el("div", { class:"r-rule" }));
  units.push(head);

  state.sections.filter(sec => sec.on !== false).forEach(sec => {
    const edu = /EDUC/i.test(sec.title);
    const header = () => el("div", { class:"r-secthead", text: sec.title || "SECTION" });

    if(sec.kind === "list"){
      const items = sec.bullets.filter(b => b.on !== false).map(b => b.text.trim()).filter(Boolean);
      const u = el("div", { class:"u-sec" }, header());
      if(items.length){
        const ul = el("ul", { class:"r-ul" });
        items.forEach(b => ul.append(el("li", { text: b })));
        u.append(ul);
      }else u.append(el("div", { class:"r-empty", text:"No items shown" }));
      units.push(u);
      return;
    }

    const ents = sec.entries.filter(e => e.on !== false);
    if(!ents.length){
      units.push(el("div", { class:"u-sec" }, header(),
        el("div", { class:"r-empty", text: sec.entries.length ? "All entries hidden" : "No entries yet" })));
      return;
    }
    // section header stays with its first entry; later entries can flow onto the next page
    units.push(el("div", { class:"u-sec" }, header(), entryEl(ents[0], edu)));
    ents.slice(1).forEach(entry => units.push(el("div", { class:"u-entry" }, entryEl(entry, edu))));
  });
  return units;
}

function renderPreview(){
  const host = $("#pages");
  host.innerHTML = "";

  let w = host.clientWidth;
  if(!w || w < 60) w = Math.min(760, (window.innerWidth || 900) - 52);
  const ph = w * 11 / 8.5;
  host.style.setProperty("--ph", ph + "px");

  const probe = el("div", { class:"sheet", style:"visibility:hidden;position:absolute" });
  probe.append(el("div", { class:"page-body" }));
  host.append(probe);
  const cs = getComputedStyle(probe);
  // 0.985 keeps a hair of slack so a screen page never spills onto an extra printed page
  const usable = (probe.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) * 0.985;
  host.removeChild(probe);

  const pages = [];
  let body = null;
  const newPage = () => {
    const p = el("div", { class:"sheet" });
    body = el("div", { class:"page-body" });
    p.append(body); host.append(p); pages.push(p);
  };
  newPage();

  buildUnits().forEach(u => {
    body.append(u);
    if(body.scrollHeight > usable + 1 && body.childElementCount > 1){
      body.removeChild(u);
      newPage();
      body.append(u);
    }
  });

  pages.forEach((p, i) => {
    const pb = p.firstChild;
    if(pb.scrollHeight > usable + 1) p.classList.add("page-over");
    p.append(el("div", { class:"page-num", text: pages.length > 1 ? `${i + 1} / ${pages.length}` : "" }));
  });
}

function render(){
  const ed = $("#editor");
  const st = ed ? ed.scrollTop : 0;
  renderEditor();
  renderPreview();
  if(ed) ed.scrollTop = st;
}

/* ---------------- import / parse ---------------- */
const SECT_ALT = "EDUCATION|EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|RELEVANT EXPERIENCE|EMPLOYMENT|LEADERSHIP|LEADERSHIP EXPERIENCE|ACTIVITIES|PROJECTS|PERSONAL PROJECTS|RESEARCH|RESEARCH EXPERIENCE|SKILLS|TECHNICAL SKILLS|SKILLS & INTERESTS|ADDITIONAL|ADDITIONAL INFORMATION|CERTIFICATIONS|AWARDS|HONORS|AWARDS & HONORS|VOLUNTEER|VOLUNTEER EXPERIENCE|INTERESTS|LANGUAGES|PUBLICATIONS";
const SECT_RE = new RegExp("^(?:" + SECT_ALT + ")\\s*:?\\s*$", "i");
const SECT_LEAD_RE = new RegExp("^(" + SECT_ALT + ")(?:\\s*[:•·▪‣|]\\s*|\\s*[–—-]\\s+|\\s{2,})(.+)$", "i");
// header glued to its first entry by bad PDF extraction: "EDUCATION UNIVERSITY OF MICHIGAN ..." — section word must be ALL-CAPS
const SECT_GLUE_RE = new RegExp("^(" + SECT_ALT + ")\\s+(?=[A-Z0-9])(.+)$");
// location = Title-case city words (each starts Upper+lower) + comma + 2-letter state or Title-case state
const CITYST_RE = /\s+([A-Z][a-z][A-Za-z.'\-]*(?:\s+(?:[A-Z][a-z][A-Za-z.'\-]*|of|and))*,\s*(?:[A-Z]{2}|[A-Z][a-z]+\.?))\s*$/;
const YEAR_RE = /(?:19|20)\d{2}(?:\s*[–—\-]\s*(?:(?:19|20)\d{2}|present|current|now))?/i;
const YEARONLY_RE = new RegExp("^(?:" + YEAR_RE.source + ")$", "i");
const MONTHYEAR_RE = /^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z.]*\s+(?:19|20)\d{2}(?:\s*[–—\-]\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z.]*\s+(?:19|20)\d{2}|present|current))?$/i;
const BULLET_RE = /^\s*[•·▪◦‣\-*∙]\s+/;
const BARELOC_RE = /^([A-Z][a-z][A-Za-z.'\-]*(?:\s+(?:[A-Z][a-z][A-Za-z.'\-]*|of|and))*,\s*(?:[A-Z]{2}|[A-Z][a-z]+\.?)|Remote|Hybrid|On-?site)$/;
const normDate = s => s.replace(/\s*[–—\-]\s*/, "–").replace(/\s+/g, " ").trim();

function parseResume(raw){
  const lines = raw.replace(/\r/g, "").split("\n").map(s => s.replace(/\s+$/,"").trim());
  const out = { name:"", email:"", phone:"", location:"", links:[], sections:[] };

  // find first non-empty as name
  let i = 0;
  while(i < lines.length && !lines[i]) i++;
  out.name = (lines[i] || "Your Name").replace(/\t/g, " ").replace(/\s{2,}/g, " ").trim();
  i++;

  // scan the next few lines for contact info
  for(let k = i; k < Math.min(lines.length, i + 5); k++){
    const l = lines[k];
    if(!l) continue;
    if(SECT_RE.test(l) || SECT_LEAD_RE.test(l) || SECT_GLUE_RE.test(l)) break;
    if(/@/.test(l) || /\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/.test(l) || /linkedin|github/i.test(l)){
      l.split(/\s*[•|·‣∙]\s*|\s{2,}|\t/).map(s => s.trim()).filter(Boolean).forEach(p => {
        if(/@/.test(p) && !out.email) out.email = p;
        else if(/\d{3}[^a-z]*\d{3,4}/i.test(p) && !/linkedin|github/i.test(p)) out.phone = p.replace(/\s{2,}/g," ");
        else if(/linkedin|github|https?:|\.(com|io|dev|me)\b/i.test(p)) out.links.push(p.replace(/^https?:\/\//,""));
        else if(/,\s*[A-Z]{2}\b/.test(p) && !out.location) out.location = p;
      });
      i = k + 1;
    }
  }

  let cur = null, curEntry = null, pendingDate = "";
  const openSection = (name) => {
    const kind = /SKILL|ADDITIONAL|CERTIF|AWARD|HONOR|LANGUAGE|INTEREST|PUBLICATION/i.test(name) ? "list" : "entries";
    cur = { id: uid(), title: name.replace(/:\s*$/,"").toUpperCase(), kind, entries: [], bullets: [] };
    out.sections.push(cur); curEntry = null; pendingDate = "";
  };

  for(; i < lines.length; i++){
    let l = lines[i];
    if(!l) continue;
    let dateHere = "";

    // multi-column PDF line: cells separated by tabs from the extractor
    if(l.indexOf("\t") >= 0){
      let segs = l.split("\t").map(s => s.trim()).filter(Boolean);
      if(segs.length > 1){
        if(SECT_RE.test(segs[0])){ openSection(segs[0]); segs = segs.slice(1); }
        if(segs.length > 1 && (YEARONLY_RE.test(segs[0]) || MONTHYEAR_RE.test(segs[0]))){ dateHere = normDate(segs[0]); segs = segs.slice(1); }
        if(!cur) openSection("EXPERIENCE");
        if(cur.kind === "entries" && segs.length > 1 && BARELOC_RE.test(segs[segs.length - 1])){
          const loc = segs.pop();
          curEntry = { id: uid(), org: segs.join(" ").replace(/\s{2,}/g," ").trim(), location: loc,
                       date: dateHere || pendingDate, subtitle:"", extra:"", bullets:[] };
          cur.entries.push(curEntry); pendingDate = ""; continue;
        }
      }
      l = segs.join("  ").trim();
      if(dateHere){
        if(curEntry && !curEntry.date && !curEntry.bullets.length) curEntry.date = dateHere;
        else pendingDate = dateHere;
        dateHere = "";
      }
      if(!l) continue;
    }

    if(SECT_RE.test(l)){ openSection(l); continue; }
    const sl = l.match(SECT_LEAD_RE) || l.match(SECT_GLUE_RE);
    if(sl){ openSection(sl[1]); l = sl[2].trim(); if(!l) continue; }
    if(!cur) openSection("EXPERIENCE");

    if(cur.kind === "list"){
      l.split(/\s+[•·▪‣∙]\s+/).forEach((part, pi) => {
        const t = part.replace(BULLET_RE, "").trim();
        if(!t) return;
        const prev = cur.bullets[cur.bullets.length - 1];
        if(pi === 0 && !BULLET_RE.test(l) && prev && !/[.!?:)\]]$/.test(prev) && prev.length < 90)
          cur.bullets[cur.bullets.length - 1] = prev + " " + t;
        else cur.bullets.push(t);
      });
      continue;
    }

    // pull a leading date off the line
    if(!dateHere){
      const lead = l.match(YEAR_RE);
      if(lead && l.indexOf(lead[0]) <= 1){
        dateHere = normDate(lead[0]);
        l = l.slice(l.indexOf(lead[0]) + lead[0].length).replace(/^[\s|–—-]+/, "").trim();
      }
    }
    if(!l || YEARONLY_RE.test(l) || MONTHYEAR_RE.test(l)){
      pendingDate = l ? normDate(l) : (dateHere || pendingDate);
      if(curEntry && !curEntry.date && !curEntry.bullets.length){ curEntry.date = pendingDate; pendingDate = ""; }
      continue;
    }

    if(BULLET_RE.test(l)){
      const t = l.replace(BULLET_RE, "").trim();
      if(curEntry) curEntry.bullets.push(t);
      else if(cur.entries.length) cur.entries[cur.entries.length - 1].bullets.push(t);
      continue;
    }

    const cm = l.match(CITYST_RE);
    if(cm){
      const org = (l.slice(0, l.length - cm[0].length).trim() || l.replace(CITYST_RE, "").trim()).replace(/[,;\s]+$/, "");
      curEntry = { id: uid(), org, location: cm[1].replace(/\s+/g," "), date: dateHere || pendingDate, subtitle:"", extra:"", bullets:[] };
      cur.entries.push(curEntry); pendingDate = ""; continue;
    }

    if(curEntry && !curEntry.bullets.length){
      if(!curEntry.subtitle){ curEntry.subtitle = l; continue; }
      if(!curEntry.extra){ curEntry.extra = l; continue; }
    }
    if(curEntry && curEntry.bullets.length){
      curEntry.bullets[curEntry.bullets.length - 1] += " " + l; continue;
    }
    // fallback: treat as an org line without a location
    curEntry = { id: uid(), org: l, location:"", date: dateHere || pendingDate, subtitle:"", extra:"", bullets:[] };
    cur.entries.push(curEntry); pendingDate = "";
  }

  // tidy: drop empty sections, collapse whitespace
  out.sections = out.sections.filter(s => s.entries.length || s.bullets.length);
  out.sections.forEach(s => {
    s.bullets = s.bullets.map(b => b.replace(/\s{2,}/g," ").trim()).filter(Boolean);
    s.entries.forEach(e => e.bullets = e.bullets.map(b => b.replace(/\s{2,}/g," ").trim()).filter(Boolean));
  });
  return out;
}

// pdf.js needs a worker; a cross-origin CDN worker can't be constructed directly,
// so fetch it once and hand pdf.js a same-origin blob URL (falls back to the CDN URL).
let _pdfjsReady;
async function ensurePdfjs(){
  if(!window.pdfjsLib) return false;
  if(!_pdfjsReady) _pdfjsReady = (async () => {
    const u = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    try{
      const r = await fetch(u);
      if(!r.ok) throw 0;
      pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(await r.blob());
    }catch(e){
      pdfjsLib.GlobalWorkerOptions.workerSrc = u;
    }
  })();
  await _pdfjsReady;
  return true;
}

async function pdfToText(file){
  if(!(await ensurePdfjs())) throw new Error("no-pdfjs");
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data, isEvalSupported:false }).promise;
  const outLines = [];
  for(let p = 1; p <= pdf.numPages; p++){
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items = content.items
      .filter(it => it.str && it.str.trim())
      .map(it => ({ s: it.str, x: it.transform[4], y: it.transform[5], w: it.width || 0 }));
    items.sort((a, b) => (b.y - a.y) || (a.x - b.x));

    // group items into rows sharing a baseline
    const rows = [];
    for(const it of items){
      const row = rows.find(r => Math.abs(r.y - it.y) <= 3.4);
      if(row){ row.cells.push(it); row.y = (row.y + it.y) / 2; }
      else rows.push({ y: it.y, cells: [it] });
    }

    for(const row of rows){
      row.cells.sort((a, b) => a.x - b.x);
      let line = "", prevEnd = null;
      for(const c of row.cells){
        if(prevEnd !== null){
          const gap = c.x - prevEnd;
          line += gap > 26 ? "\t" : (gap > 0.6 ? " " : "");
        }
        line += c.s;
        prevEnd = c.x + c.w;
      }
      line = line.replace(/ {2,}/g, " ").replace(/ *\t */g, "\t").replace(/\t{2,}/g, "\t").trim();
      if(line) outLines.push(line);
    }
  }
  return outLines.join("\n");
}

/* ---------------- import modal wiring ---------------- */
const modal = $("#modal");
let parsed = null;
let parsedJson = null;

function openImport(){
  parsed = null; parsedJson = null;
  $("#found").hidden = true; $("#applyBtn").hidden = true; $("#msg").hidden = true;
  $("#pasteArea").value = ""; $("#fileInput").value = "";
  switchTab("paste");
  modal.hidden = false;
  $("#pasteArea").focus();
}
function closeImport(){ modal.hidden = true; }

function switchTab(which){
  const paste = which === "paste";
  $("#tabPaste").classList.toggle("on", paste);
  $("#tabPdf").classList.toggle("on", !paste);
  $("#panePaste").hidden = !paste;
  $("#panePdf").hidden = paste;
  $("#parseBtn").hidden = !paste;
  $("#found").hidden = true; $("#applyBtn").hidden = true; $("#msg").hidden = true;
}

function showFound(p){
  parsed = p;
  const secBits = p.sections.map(s => `${s.kind === "list" ? s.bullets.length : s.entries.length} in ${s.title}`);
  $("#found").innerHTML = `<b>Found:</b> ${p.name || "—"}${p.email ? " · " + p.email : ""}` +
    (p.sections.length ? "<ul>" + p.sections.map(s => `<li>${s.title} — ${s.kind === "list" ? s.bullets.length + " item" + (s.bullets.length===1?"":"s") : s.entries.length + " entr" + (s.entries.length===1?"y":"ies")}</li>`).join("") + "</ul>" : "");
  $("#found").hidden = false;
  $("#applyBtn").hidden = !(p.sections.length || p.name);
  $("#msg").hidden = true;
}

$("#tabPaste").onclick = () => switchTab("paste");
$("#tabPdf").onclick = () => switchTab("pdf");
$("#parseBtn").onclick = () => {
  const txt = $("#pasteArea").value.trim();
  if(!txt){ $("#msg").textContent = "Paste some text first."; $("#msg").hidden = false; return; }
  parsedJson = null;
  // a .json backup exported from here
  if(txt[0] === "{"){
    try{
      const j = JSON.parse(txt);
      if(j && Array.isArray(j.sections)){
        parsedJson = j;
        $("#found").innerHTML = "<b>Found a résumé backup</b> — importing it will load every section, entry and bullet exactly as saved.";
        $("#found").hidden = false; $("#applyBtn").hidden = false; $("#msg").hidden = true;
        return;
      }
    }catch(e){}
  }
  try{ showFound(parseResume(txt)); }
  catch(e){ $("#msg").textContent = "Could not read that text. Try cleaning it up a little."; $("#msg").hidden = false; }
};
$("#applyBtn").onclick = () => {
  if(parsedJson){
    state = normalizeState(clone(parsedJson));
    collapsed = {}; focusEntry = null;
    closeImport(); render(); save(true); toast("Backup imported");
    return;
  }
  if(!parsed) return;
  state = normalizeState({
    name: parsed.name || state.name, email: parsed.email || "", phone: parsed.phone || "",
    location: parsed.location || "", links: parsed.links || [],
    site: state.site || { label:"Personal projects", url:"", show:false },
    sections: parsed.sections.length ? parsed.sections : state.sections
  });
  collapsed = {}; focusEntry = null;
  closeImport(); render(); save(true); toast("Résumé imported — review and refine");
};
$("#cancelImport").onclick = closeImport;
function hasContent(){
  const bt = b => ((b && b.text) || "").trim();
  return !!(state.name || "").trim() || state.sections.some(s =>
    s.bullets.some(bt) ||
    s.entries.some(e => (e.org || e.subtitle || e.extra || "").trim() || e.bullets.some(bt)));
}
$("#startBlank").onclick = () => {
  if(hasContent() && !confirm("Start a blank résumé? This clears the current one.")) return;
  state = normalizeState(clone(BLANK)); collapsed = {}; focusEntry = null;
  closeImport(); render(); save(true);
  toast("Blank résumé — start adding your experience");
};
$("#importBtn").onclick = openImport;
modal.addEventListener("click", e => { if(e.target === modal) closeImport(); });

const drop = $("#drop"), fileInput = $("#fileInput");
["dragenter","dragover"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave","drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", e => { const f = e.dataTransfer.files[0]; if(f) handlePdf(f); });
fileInput.addEventListener("change", () => { if(fileInput.files[0]) handlePdf(fileInput.files[0]); });

async function handlePdf(file){
  if(!/\.pdf$/i.test(file.name) && file.type !== "application/pdf"){
    $("#msg").textContent = "That doesn't look like a PDF."; $("#msg").hidden = false; return;
  }
  $("#dropNote").textContent = "Reading " + file.name + "…";
  $("#msg").hidden = true; $("#found").hidden = true; $("#applyBtn").hidden = true;
  try{
    const text = await pdfToText(file);
    if(!text.trim() || text.replace(/\s/g,"").length < 40) throw new Error("empty");
    showFound(parseResume(text));
    $("#dropNote").textContent = "Read " + file.name;
  }catch(e){
    $("#dropNote").textContent = "Text is read in your browser — nothing is uploaded.";
    $("#msg").innerHTML = e.message === "empty"
      ? "This PDF has no selectable text (it may be a scan). Open it, copy the text, and use the <b>Paste text</b> tab."
      : "Couldn't read this PDF here. Open it, copy the text, and use the <b>Paste text</b> tab.";
    $("#msg").hidden = false;
  }
}

/* ---------------- export ---------------- */
const exModal = $("#exportModal");
let downloads = null;
if(window.claude && claude.use){
  claude.use("downloads").then(d => {
    downloads = d;
    if(!d) $("#exNote").textContent = "";
  }).catch(() => {});
}

function slug(){ return (state.name || "resume").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "resume"; }

/* what actually goes on the résumé: sections/entries/bullets whose include flag is on */
const visSections = () => state.sections.filter(s => s.on !== false);
const visEntries = s => s.entries.filter(e => e.on !== false);
const visBullets = arr => arr.filter(b => b.on !== false).map(b => (b.text || "").trim()).filter(Boolean);

function asPlainText(){
  const L = [];
  L.push((state.name || "").toUpperCase());
  L.push(contactParts().join("  •  "));
  if(siteStr()) L.push(siteStr());
  L.push("");
  for(const s of visSections()){
    const listItems = s.kind === "list" ? visBullets(s.bullets) : null;
    const ents = s.kind === "list" ? null : visEntries(s);
    if((listItems && !listItems.length) || (ents && !ents.length)) continue;
    L.push(s.title.toUpperCase());
    L.push("-".repeat(s.title.length));
    if(listItems){ listItems.forEach(b => L.push("  • " + b)); L.push(""); continue; }
    for(const e of ents){
      const head = [e.org, e.location].filter(Boolean).join("  —  ");
      L.push((e.date ? e.date + "   " : "") + head);
      if(e.subtitle) L.push("   " + e.subtitle);
      if(e.extra) L.push("   " + e.extra);
      visBullets(e.bullets).forEach(b => L.push("   • " + b));
      L.push("");
    }
  }
  return L.join("\n").replace(/\n{3,}/g,"\n\n").trim() + "\n";
}

function asMarkdown(){
  const L = [];
  L.push("# " + (state.name || ""));
  L.push("");
  L.push(contactParts().join(" · "));
  if(siteStr()) L.push("\n**" + siteStr() + "**");
  L.push("");
  for(const s of visSections()){
    const listItems = s.kind === "list" ? visBullets(s.bullets) : null;
    const ents = s.kind === "list" ? null : visEntries(s);
    if((listItems && !listItems.length) || (ents && !ents.length)) continue;
    L.push("## " + s.title);
    L.push("");
    if(listItems){ listItems.forEach(b => L.push("- " + b)); L.push(""); continue; }
    for(const e of ents){
      L.push("### " + [e.org, e.location].filter(Boolean).join(" — "));
      const meta = [e.subtitle, e.extra, e.date].filter(Boolean).join(" · ");
      if(meta){ L.push("*" + meta + "*"); L.push(""); }
      visBullets(e.bullets).forEach(b => L.push("- " + b));
      L.push("");
    }
  }
  return L.join("\n").replace(/\n{3,}/g,"\n\n").trim() + "\n";
}

function asStandaloneHtml(){
  const esc = s => (s || "").replace(/[&<>]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;" }[c]));
  let body = "";
  const contact = contactParts().map(esc).join(' <span class="s">•</span> ');
  let siteHtml = "";
  if(siteShown()){
    const label = (state.site.label || "").trim();
    const shown = cleanUrl(state.site.url);
    const href = /^https?:\/\//i.test(state.site.url.trim()) ? state.site.url.trim() : "https://" + shown;
    siteHtml = `<div class="site">${label ? esc(label) + " · " : ""}<a href="${esc(href)}">${esc(shown)}</a></div>`;
  }
  body += `<div class="name">${esc(state.name)}</div><div class="contact">${contact}</div>${siteHtml}<div class="rule"></div>`;
  for(const s of visSections()){
    if(s.kind === "list"){
      const items = visBullets(s.bullets);
      if(!items.length) continue;
      body += `<section><div class="secthead">${esc(s.title)}</div><ul>` +
        items.map(b => `<li>${esc(b)}</li>`).join("") + `</ul></section>`;
      continue;
    }
    const ents = visEntries(s);
    if(!ents.length) continue;
    body += `<section><div class="secthead">${esc(s.title)}</div>`;
    ents.forEach(e => {
      const left = e.date ? `<div class="dt">${esc(e.date)}</div>` : "";
      const sub = e.subtitle ? `<div class="${/EDUC/i.test(s.title) ? "subb" : "subi"}">${esc(e.subtitle)}</div>` : "";
      const extra = e.extra ? `<div>${esc(e.extra)}</div>` : "";
      const bl = visBullets(e.bullets);
      const uls = bl.length ? `<ul>${bl.map(b => `<li>${esc(b)}</li>`).join("")}</ul>` : "";
      body += `<div class="entry"><div class="left">${left}</div><div class="bd"><div class="org-row"><span class="org">${esc(e.org)}</span>${e.location ? `<span class="loc">${esc(e.location)}</span>` : ""}</div>${sub}${extra}${uls}</div></div>`;
    });
    body += `</section>`;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(state.name)} — Résumé</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box} body{margin:0;background:#eee;font-family:"Source Serif 4",Georgia,serif;color:#161a22}
.sheet{max-width:760px;margin:24px auto;background:#fff;padding:44px 50px 52px;font-size:10.5px;line-height:1.42;box-shadow:0 10px 30px rgba(0,0,0,.15)}
.name{text-align:center;font-weight:700;font-size:16px;letter-spacing:.15em;text-transform:uppercase}
.contact{text-align:center;font-size:9px;color:#464646;margin-top:5px} .contact .s{color:#8b8b8b;margin:0 5px}
.site{text-align:center;font-size:9.3px;font-weight:700;letter-spacing:.04em;margin-top:3px}
.site a{color:inherit;text-decoration:none}
.rule{height:1.4px;background:#1c1c1c;margin:11px 0 15px}
section{margin-bottom:15px}
.secthead{font-weight:700;text-transform:uppercase;letter-spacing:.14em;font-size:9.5px;padding-bottom:3px;margin-bottom:8px;border-bottom:1px solid #1c1c1c}
.entry{display:grid;grid-template-columns:58px 1fr;column-gap:13px;margin-bottom:9px}
.left{font-family:"IBM Plex Mono",monospace;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding-top:2px;line-height:1.5;color:#181818}
.dt{color:#181818;font-weight:700}
.org-row{display:flex;justify-content:space-between;gap:4px 14px;align-items:baseline;flex-wrap:wrap}
.org{font-weight:700;text-transform:uppercase;letter-spacing:.035em}
.loc{font-weight:700;font-size:8.6px;white-space:nowrap;margin-left:auto}
.subi{font-style:italic;margin-top:1.5px} .subb{font-weight:700;margin-top:1.5px}
ul{margin:3px 0 0;padding-left:15px} li{margin-bottom:2.5px;padding-left:3px}
@media print{body{background:#fff}.sheet{margin:0;max-width:none;box-shadow:none;padding:.5in .55in}@page{margin:0}}
</style></head><body><div class="sheet">${body}</div></body></html>`;
}

function buildPdf(){
  const J = window.jspdf && window.jspdf.jsPDF;
  if(!J) return null;
  const doc = new J({ unit:"pt", format:"letter", compress:true });
  const PW = doc.internal.pageSize.getWidth(), PH = doc.internal.pageSize.getHeight();
  const M = 44, RIGHT = PW - M, CW = PW - M * 2;
  const dateW = 50, gap = 12, bodyX = M + dateW + gap, bodyW = RIGHT - bodyX;
  let y = M + 4;
  const setF = (style, size) => { doc.setFont("times", style); doc.setFontSize(size); };
  const need = h => { if(y + h > PH - M){ doc.addPage(); y = M + 4; } };
  doc.setTextColor(24, 24, 24); doc.setDrawColor(24, 24, 24);

  setF("bold", 15);
  doc.text((state.name || "").toUpperCase(), PW / 2, y, { align:"center", charSpace:1.4 });
  y += 14;
  setF("normal", 8.5);
  const cp = contactParts().join("    •    ");
  if(cp){ doc.text(cp, PW / 2, y, { align:"center" }); y += 11; }
  if(siteStr()){ setF("bold", 8.5); doc.text(siteStr(), PW / 2, y, { align:"center" }); y += 11; }
  y += 4;
  doc.setLineWidth(1.1); doc.line(M, y, RIGHT, y); y += 15;

  const LH = 10.5;
  for(const s of visSections()){
    const listItems = s.kind === "list" ? visBullets(s.bullets) : null;
    const ents = s.kind === "list" ? null : visEntries(s);
    if((listItems && !listItems.length) || (ents && !ents.length)) continue;

    need(34);
    setF("bold", 9.5);
    doc.text((s.title || "").toUpperCase(), M, y, { charSpace:1.5 });
    y += 4.5; doc.setLineWidth(0.6); doc.line(M, y, RIGHT, y); y += 13;

    if(listItems){
      setF("normal", 9);
      for(const b of listItems){
        const ls = doc.splitTextToSize(b, CW - 12);
        need(ls.length * LH);
        doc.text("•", M, y); doc.text(ls, M + 12, y);
        y += ls.length * LH + 2;
      }
      y += 6; continue;
    }

    for(const e of ents){
      need(26);
      if((e.date || "").trim()){ setF("bold", 8); doc.text(e.date.trim().toUpperCase(), M, y); }
      setF("bold", 10);
      const loc = (e.location || "").trim();
      let locW = 0;
      if(loc){ setF("bold", 8.5); locW = doc.getTextWidth(loc); setF("bold", 10); }
      const orgLines = doc.splitTextToSize((e.org || "").toUpperCase(), Math.max(60, bodyW - (loc ? locW + 12 : 0)));
      doc.text(orgLines, bodyX, y);
      if(loc){ setF("bold", 8.5); doc.text(loc, RIGHT, y, { align:"right" }); }
      y += orgLines.length * 11;
      if((e.subtitle || "").trim()){
        setF(/EDUC/i.test(s.title) ? "bold" : "italic", 9.5);
        const sl = doc.splitTextToSize(e.subtitle.trim(), bodyW);
        need(sl.length * 10 + 2); doc.text(sl, bodyX, y); y += sl.length * 10 + 1;
      }
      if((e.extra || "").trim()){
        setF("normal", 9.5);
        const xl = doc.splitTextToSize(e.extra.trim(), bodyW);
        need(xl.length * 10 + 2); doc.text(xl, bodyX, y); y += xl.length * 10 + 1;
      }
      setF("normal", 9);
      for(const b of visBullets(e.bullets)){
        const ls = doc.splitTextToSize(b, bodyW - 12);
        need(ls.length * LH);
        doc.text("•", bodyX, y); doc.text(ls, bodyX + 12, y);
        y += ls.length * LH + 2;
      }
      y += 8;
    }
  }
  return doc;
}

function triggerBlobDownload(blob, filename){
  try{
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1500);
    return true;
  }catch(e){ return false; }
}

let previewedDoc = null;
async function previewPdf(){
  const host = $("#pdfPages");
  const doc = buildPdf();
  if(!doc){ toast("PDF engine still loading — try again in a moment"); return; }
  previewedDoc = doc;
  $("#pdfPreview").hidden = false;
  host.innerHTML = '<div class="ph">Rendering…</div>';
  if(!(await ensurePdfjs())){ host.innerHTML = '<div class="ph">Preview needs the PDF library, which didn\'t load. Use “Download PDF”.</div>'; return; }
  try{
    const pdf = await pdfjsLib.getDocument({ data: doc.output("arraybuffer"), isEvalSupported:false }).promise;
    host.innerHTML = "";
    for(let p = 1; p <= pdf.numPages; p++){
      const page = await pdf.getPage(p);
      const vp = page.getViewport({ scale: 2 });
      const cv = el("canvas");
      cv.width = vp.width; cv.height = vp.height;
      await page.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
      host.append(cv);
    }
    $("#pdfMeta").textContent = pdf.numPages + (pdf.numPages === 1 ? " page" : " pages");
    $("#pdfWarn").hidden = pdf.numPages <= 1;
  }catch(e){
    host.innerHTML = '<div class="ph">Couldn\'t render the preview here. “Download PDF” still works.</div>';
    $("#pdfMeta").textContent = "";
  }
}

async function saveFile(filename, data, mime){
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime || "text/plain" });
  if(!downloads && window.claude && claude.use){ try{ downloads = await claude.use("downloads"); }catch(e){} }
  if(downloads){
    try{
      await downloads.save({ filename, data: blob });
      toast("Saved " + filename); exModal.hidden = true; return;
    }catch(err){
      if(err && err.code === "declined") return;
    }
  }
  if(triggerBlobDownload(blob, filename)){ toast("Downloading " + filename); exModal.hidden = true; return; }
  if(typeof data === "string" && navigator.clipboard){
    navigator.clipboard.writeText(data).then(
      () => toast("Can't save files here — " + filename + " copied to clipboard"),
      () => toast("Couldn't export in this view")
    );
  }else{
    toast("Couldn't export here — use Print → Save as PDF");
  }
}

async function doExport(fmt){
  if(fmt === "pdf"){
    const doc = buildPdf();
    if(!doc){ toast("PDF engine still loading — try again, or use Print"); return; }
    await saveFile(slug() + "-resume.pdf", doc.output("blob"), "application/pdf");
    return;
  }
  const map = {
    txt: ["text/plain", asPlainText, "txt"],
    md: ["text/markdown", asMarkdown, "md"],
    json: ["application/json", () => JSON.stringify(state, null, 2), "json"],
    html: ["text/html", asStandaloneHtml, "html"]
  };
  const [mime, gen, ext] = map[fmt];
  await saveFile(slug() + "-resume." + ext, gen(), mime);
}

$("#exportBtn").onclick = () => {
  $("#exNote").textContent = "Choose a format. PDF and HTML are print-ready; JSON is a re-importable backup.";
  exModal.hidden = false;
};
$("#exCancel").onclick = () => exModal.hidden = true;
exModal.addEventListener("click", e => { if(e.target === exModal) exModal.hidden = true; });
exModal.querySelectorAll("[data-fmt]").forEach(b => b.onclick = () => doExport(b.dataset.fmt));
$("#exPreview").onclick = () => { exModal.hidden = true; previewPdf(); };

/* ---------------- pdf preview ---------------- */
const pdfModal = $("#pdfPreview");
$("#previewBtn").onclick = () => previewPdf();
$("#pdfClose").onclick = () => { pdfModal.hidden = true; $("#pdfPages").innerHTML = ""; };
$("#pdfDownload").onclick = async () => {
  const doc = previewedDoc || buildPdf();
  if(!doc){ toast("PDF engine still loading"); return; }
  await saveFile(slug() + "-resume.pdf", doc.output("blob"), "application/pdf");
  pdfModal.hidden = true; $("#pdfPages").innerHTML = "";
};
pdfModal.addEventListener("click", e => { if(e.target === pdfModal){ pdfModal.hidden = true; $("#pdfPages").innerHTML = ""; } });

/* ---------------- my résumés ---------------- */
const docsModal = $("#docsModal");
$("#docsBtn").onclick = () => { renderDocs(); docsModal.hidden = false; };
$("#docsClose").onclick = () => docsModal.hidden = true;
$("#newDocBtn").onclick = () => newDoc();
docsModal.addEventListener("click", e => { if(e.target === docsModal) docsModal.hidden = true; });

/* ---------------- misc wiring ---------------- */
$("#printBtn").onclick = () => { renderPreview(); setTimeout(() => window.print(), 80); };

let toastTimer;
function toast(msg){
  const t = $("#toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

function applyTheme(v){
  if(v) document.documentElement.setAttribute("data-theme", v);
  else document.documentElement.removeAttribute("data-theme");
}
let theme = null;
try{ theme = localStorage.getItem(THEME_KEY); }catch(e){}
applyTheme(theme);
$("#themeBtn").onclick = () => {
  const order = [null, "light", "dark"];
  const sysDark = matchMedia("(prefers-color-scheme: dark)").matches;
  theme = theme === "light" ? "dark" : theme === "dark" ? "light" : (sysDark ? "light" : "dark");
  applyTheme(theme);
  try{ localStorage.setItem(THEME_KEY, theme); }catch(e){}
  toast(theme === "light" ? "Light theme" : "Dark theme");
};

const bodyEl = document.body;
bodyEl.setAttribute("data-view", "edit");
$("#vEdit").onclick = () => { bodyEl.setAttribute("data-view", "edit"); $("#vEdit").classList.add("on"); $("#vPrev").classList.remove("on"); growAll(); };
$("#vPrev").onclick = () => { bodyEl.setAttribute("data-view", "preview"); $("#vPrev").classList.add("on"); $("#vEdit").classList.remove("on"); renderPreview(); };

let _rz;
window.addEventListener("resize", () => { clearTimeout(_rz); _rz = setTimeout(renderPreview, 180); });

window.addEventListener("keydown", e => {
  if(e.key === "Escape"){
    if(!modal.hidden) closeImport();
    if(!exModal.hidden) exModal.hidden = true;
    if(!docsModal.hidden) docsModal.hidden = true;
    if(!pdfModal.hidden){ pdfModal.hidden = true; $("#pdfPages").innerHTML = ""; }
  }
});

render();
updateDocLabel();
save(true);
