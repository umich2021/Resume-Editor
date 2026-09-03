"use strict";
const $ = s => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);
const clone = o => JSON.parse(JSON.stringify(o));
const KEY = "resume-studio:v1";
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

const emptyEntry = () => ({ id: uid(), org:"", location:"", date:"", subtitle:"", extra:"", bullets:[""] });
const BLANK = {
  name:"", email:"", phone:"", location:"", links:[],
  site:{ label:"Personal projects", url:"", show:false },
  sections:[
    { id: uid(), title:"EDUCATION", kind:"entries", entries:[emptyEntry()], bullets:[] },
    { id: uid(), title:"EXPERIENCE", kind:"entries", entries:[emptyEntry()], bullets:[] },
    { id: uid(), title:"SKILLS", kind:"list", entries:[], bullets:[""] }
  ]
};

function migrate(s){
  if(!s || typeof s !== "object") return clone(DEFAULT);
  if(!s.site || typeof s.site !== "object") s.site = { label:"Personal projects", url:"", show:false };
  if(typeof s.site.show !== "boolean") s.site.show = false;
  if(!Array.isArray(s.links)) s.links = [];
  if(!Array.isArray(s.sections)) s.sections = clone(DEFAULT.sections);
  return s;
}

/* ---------------- state ---------------- */
let state = migrate(load()) || clone(DEFAULT);
let collapsed = {};        // block id -> bool
let focusEntry = null;     // entry id being edited
let focusRequest = null;   // data-fid to focus after editor render

function load(){
  try{ const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; }
  catch(e){ return null; }
}
let saveTimer;
function save(now){
  clearTimeout(saveTimer);
  const flag = $("#saveflag");
  flag.classList.add("busy"); flag.querySelector("span").textContent = "Saving…";
  const doWrite = () => {
    try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){}
    flag.classList.remove("busy"); flag.querySelector("span").textContent = "Saved";
  };
  if(now) doWrite(); else saveTimer = setTimeout(doWrite, 500);
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
const I = {
  up:'<path d="M12 19V5M6 11l6-6 6 6"/>',
  down:'<path d="M12 5v14M6 13l6 6 6-6"/>',
  del:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  chev:'<path d="M6 9l6 6 6-6"/>'
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
  const card = el("div", { class: "entry" + (focusEntry === entry.id ? " focused" : "") });
  card.addEventListener("focusin", () => {
    if(focusEntry !== entry.id){ focusEntry = entry.id; document.querySelectorAll(".entry").forEach(e => e.classList.remove("focused")); card.classList.add("focused"); }
  });

  const head = el("div", { class:"entry-head" },
    el("span", { class:"tag", text: edu ? "School" : "Role" }),
    moveCtl(sec.entries, idx, () => { render(); save(); })
  );

  const org = fieldText(edu ? "Institution" : "Organization", entry.org, v => entry.org = v, { fid: "e-" + entry.id });
  const loc = fieldText("Location", entry.location, v => entry.location = v, { ph:"City, ST" });
  const date = fieldText("Dates", entry.date, v => entry.date = v, { ph: edu ? "May 2025" : "2023–2024" });
  const sub = fieldText(edu ? "Program / school" : "Title", entry.subtitle, v => entry.subtitle = v);
  const extra = fieldText(edu ? "Degree / detail" : "Detail (optional)", entry.extra, v => entry.extra = v);

  const bullets = el("div", { class:"bullets" });
  entry.bullets.forEach((b, bi) => bullets.append(renderBullet(entry.bullets, bi, () => { render(); save(); })));
  const addBul = el("button", { class:"add", onclick: () => {
    entry.bullets.push(""); focusRequest = "b-" + entry.id + "-" + (entry.bullets.length - 1);
    render(); save();
  }}, ico(I.plus), "Add bullet");

  card.append(head, el("div", { class:"duo" }, org, loc), el("div", { class:"duo" }, date, sub), extra,
    el("div", { class:"f" }, el("label", { text:"Bullet points" }), bullets), el("div", { class:"addline" }, addBul));
  return card;
}

function renderBullet(list, i, after){
  const ta = el("textarea", { rows:2, "data-fid": mkBid(list, i) });
  ta.value = list[i];
  bindInput(ta, v => list[i] = v);
  const ctl = el("div", { class:"bul-ctl" },
    el("button", { class:"mini", title:"Move up", disabled: i === 0, onclick: () => { const [x] = list.splice(i,1); list.splice(i-1,0,x); after(); }}, ico(I.up)),
    el("button", { class:"mini", title:"Move down", disabled: i === list.length - 1, onclick: () => { const [x] = list.splice(i,1); list.splice(i+1,0,x); after(); }}, ico(I.down)),
    el("button", { class:"mini del", title:"Delete", onclick: () => { list.splice(i,1); after(); }}, ico(I.del))
  );
  return el("div", { class:"bul" }, el("span", { class:"dot" }), ta, ctl);
}
// stable-ish id so we can restore focus to a freshly added bullet
let _bidMap = new WeakMap();
function mkBid(list, i){
  if(!_bidMap.has(list)) _bidMap.set(list, uid());
  return "b-" + _bidMap.get(list) + "-" + i;
}

function block(id, titleNode, count, bodyNodes){
  const isCol = !!collapsed[id];
  const b = el("div", { class:"block" + (isCol ? " collapsed" : "") });
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
    const titleNode = el("div", { class:"sect-name-row" }, nameInput, kindSel, secCtl);

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
      const list = el("div", { class:"bullets" });
      sec.bullets.forEach((b, bi) => list.append(renderBullet(sec.bullets, bi, () => { render(); save(); })));
      body.push(el("div", { class:"f" }, el("label", { text:"Items" }), list));
      body.push(el("div", { class:"addline" }, el("button", { class:"add", onclick: () => {
        sec.bullets.push(""); focusRequest = mkBid(sec.bullets, sec.bullets.length - 1); render(); save();
      }}, ico(I.plus), "Add item")));
    }
    const count = sec.kind === "entries" ? sec.entries.length + " entr" + (sec.entries.length === 1 ? "y" : "ies")
                                         : sec.bullets.length + " item" + (sec.bullets.length === 1 ? "" : "s");
    root.append(block("sec-" + sec.id, titleNode, count, body));
  });

  /* add section */
  root.append(el("div", { class:"addline" },
    el("button", { class:"add", onclick: () => {
      state.sections.push({ id: uid(), title:"NEW SECTION", kind:"entries", entries:[{ id:uid(), org:"", location:"", date:"", subtitle:"", extra:"", bullets:[""] }], bullets:[] });
      render(); save();
    }}, ico(I.plus), "Add section"),
    el("button", { class:"add", onclick: () => {
      state.sections.push({ id: uid(), title:"SKILLS", kind:"list", entries:[], bullets:[""] });
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
  state = clone(DEFAULT); collapsed = {}; focusEntry = null;
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

function renderPreview(){
  const sheet = $("#sheet");
  sheet.innerHTML = "";
  sheet.append(el("div", { class:"r-name", text: state.name || "Your Name" }));
  const c = el("div", { class:"r-contact" }); c.append(contactLine()); sheet.append(c);
  if(siteShown()) sheet.append(el("div", { class:"r-site", text: siteStr() }));
  sheet.append(el("div", { class:"r-rule" }));

  state.sections.forEach(sec => {
    const wrap = el("div", { class:"r-section" });
    const edu = /EDUC/i.test(sec.title);
    wrap.append(el("div", { class:"r-secthead", text: sec.title || "SECTION" }));

    if(sec.kind === "list"){
      const items = sec.bullets.map(b => (b || "").trim()).filter(Boolean);
      const body = el("div", { class:"r-listbody" });
      if(items.length){
        const ul = el("ul", { class:"r-ul" });
        items.forEach(b => ul.append(el("li", { text: b })));
        body.append(ul);
      }else body.append(el("div", { class:"r-empty", text:"No items yet" }));
      wrap.append(body);
      sheet.append(wrap);
      return;
    }

    if(!sec.entries.length){
      wrap.append(el("div", { class:"r-empty", text:"No entries yet" }));
      sheet.append(wrap);
      return;
    }

    sec.entries.forEach((entry, i) => {
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
      const items = entry.bullets.map(b => (b || "").trim()).filter(Boolean);
      if(items.length){
        const ul = el("ul", { class:"r-ul" });
        items.forEach(b => ul.append(el("li", { text: b })));
        body.append(ul);
      }
      wrap.append(el("div", { class:"r-entry" }, left, body));
    });
    sheet.append(wrap);
  });
}

function render(){ renderEditor(); renderPreview(); }

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

async function pdfToText(file){
  if(!window.pdfjsLib) throw new Error("no-pdfjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
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

function openImport(){
  parsed = null;
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
  try{ showFound(parseResume(txt)); }
  catch(e){ $("#msg").textContent = "Could not read that text. Try cleaning it up a little."; $("#msg").hidden = false; }
};
$("#applyBtn").onclick = () => {
  if(!parsed) return;
  state = {
    name: parsed.name || state.name, email: parsed.email || "", phone: parsed.phone || "",
    location: parsed.location || "", links: parsed.links || [],
    site: state.site || { label:"Personal projects", url:"", show:false },
    sections: parsed.sections.length ? parsed.sections : state.sections
  };
  collapsed = {}; focusEntry = null;
  closeImport(); render(); save(true); toast("Résumé imported — review and refine");
};
$("#cancelImport").onclick = closeImport;
function hasContent(){
  return !!(state.name || "").trim() || state.sections.some(s =>
    s.bullets.some(b => (b || "").trim()) ||
    s.entries.some(e => (e.org || e.subtitle || e.extra || "").trim() || e.bullets.some(b => (b || "").trim())));
}
$("#startBlank").onclick = () => {
  if(hasContent() && !confirm("Start a blank résumé? This clears the current one.")) return;
  state = clone(BLANK); collapsed = {}; focusEntry = null;
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

function asPlainText(){
  const L = [];
  L.push((state.name || "").toUpperCase());
  L.push(contactParts().join("  •  "));
  if(siteStr()) L.push(siteStr());
  L.push("");
  for(const s of state.sections){
    L.push(s.title.toUpperCase());
    L.push("-".repeat(s.title.length));
    if(s.kind === "list"){
      s.bullets.filter(Boolean).forEach(b => L.push("  • " + b));
      L.push(""); continue;
    }
    for(const e of s.entries){
      const head = [e.org, e.location].filter(Boolean).join("  —  ");
      L.push((e.date ? e.date + "   " : "") + head);
      if(e.subtitle) L.push("   " + e.subtitle);
      if(e.extra) L.push("   " + e.extra);
      e.bullets.filter(Boolean).forEach(b => L.push("   • " + b));
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
  for(const s of state.sections){
    L.push("## " + s.title);
    L.push("");
    if(s.kind === "list"){
      s.bullets.filter(Boolean).forEach(b => L.push("- " + b));
      L.push(""); continue;
    }
    for(const e of s.entries){
      L.push("### " + [e.org, e.location].filter(Boolean).join(" — "));
      const meta = [e.subtitle, e.extra, e.date].filter(Boolean).join(" · ");
      if(meta){ L.push("*" + meta + "*"); L.push(""); }
      e.bullets.filter(Boolean).forEach(b => L.push("- " + b));
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
  for(const s of state.sections){
    body += `<section><div class="secthead">${esc(s.title)}</div>`;
    if(s.kind === "list"){
      body += `<ul>` + s.bullets.filter(Boolean).map(b => `<li>${esc(b)}</li>`).join("") + `</ul>`;
    }else{
      s.entries.forEach(e => {
        const left = e.date ? `<div class="dt">${esc(e.date)}</div>` : "";
        const sub = e.subtitle ? `<div class="${/EDUC/i.test(s.title) ? "subb" : "subi"}">${esc(e.subtitle)}</div>` : "";
        const extra = e.extra ? `<div>${esc(e.extra)}</div>` : "";
        const uls = e.bullets.filter(Boolean).length ? `<ul>${e.bullets.filter(Boolean).map(b => `<li>${esc(b)}</li>`).join("")}</ul>` : "";
        body += `<div class="entry"><div class="left">${left}</div><div class="bd"><div class="org-row"><span class="org">${esc(e.org)}</span>${e.location ? `<span class="loc">${esc(e.location)}</span>` : ""}</div>${sub}${extra}${uls}</div></div>`;
      });
    }
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
@media print{body{background:#fff}.sheet{margin:0;max-width:none;box-shadow:none;padding:0}@page{margin:.5in}}
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
  for(const s of state.sections){
    need(34);
    setF("bold", 9.5);
    doc.text((s.title || "").toUpperCase(), M, y, { charSpace:1.5 });
    y += 4.5; doc.setLineWidth(0.6); doc.line(M, y, RIGHT, y); y += 13;

    if(s.kind === "list"){
      setF("normal", 9);
      for(const b of s.bullets.filter(Boolean)){
        const ls = doc.splitTextToSize(b, CW - 12);
        need(ls.length * LH);
        doc.text("•", M, y); doc.text(ls, M + 12, y);
        y += ls.length * LH + 2;
      }
      y += 6; continue;
    }

    for(const e of s.entries){
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
      for(const b of e.bullets.filter(Boolean)){
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

/* ---------------- misc wiring ---------------- */
$("#printBtn").onclick = () => window.print();

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
$("#vPrev").onclick = () => { bodyEl.setAttribute("data-view", "preview"); $("#vPrev").classList.add("on"); $("#vEdit").classList.remove("on"); };

window.addEventListener("keydown", e => {
  if(e.key === "Escape"){ if(!modal.hidden) closeImport(); if(!exModal.hidden) exModal.hidden = true; }
  if((e.metaKey || e.ctrlKey) && e.key === "p"){ /* let browser print */ }
});

render();
save();
