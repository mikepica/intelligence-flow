// ═══════════════════════════════════════════════════════════════
// Riddle Enterprises Dashboard — demo.js
// Fetches live data from scorecard-api and renders 6 panels
// with interactive elements, animations, and drill-down details
// ═══════════════════════════════════════════════════════════════

const API_BASE_URL = "http://localhost:3001/api";

// ── Helpers ──────────────────────────────────────────────────

function esc(str) {
  if (str == null) return "";
  const d = document.createElement("div");
  d.textContent = String(str);
  return d.innerHTML;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  return Math.floor(hrs / 24) + "d ago";
}

function ragColor(status) {
  const map = {
    Green: { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
    Amber: { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
    Red: { bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" },
    "Not Started": { bg: "bg-slate-500/15", text: "text-slate-400", dot: "bg-slate-400" },
    Not_Started: { bg: "bg-slate-500/15", text: "text-slate-400", dot: "bg-slate-400" },
    Complete: { bg: "bg-purple-500/15", text: "text-purple-400", dot: "bg-purple-400" },
  };
  return map[status] || map["Not Started"];
}

async function apiFetch(path) {
  const res = await fetch(API_BASE_URL + path);
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json();
}

function showError(el, msg) {
  el.innerHTML = `
    <div class="flex items-center gap-3 text-red-400 text-sm py-4">
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
      </svg>
      <span>${esc(msg)}</span>
      <button onclick="location.reload()" class="ml-auto text-xs text-purple-400 hover:text-purple-300 underline">Retry</button>
    </div>`;
}


// ═══════════════════════════════════════════════════════════════
// 1. ORG TREE — Interactive collapsible hierarchy
// ═══════════════════════════════════════════════════════════════

async function renderOrgTree() {
  const el = document.getElementById("org-tree-content");
  try {
    const { data } = await apiFetch("/org-tree");

    // Find Riddle Enterprises subtree
    const riddle = data.find(n => n.name === "Riddle Enterprises") || data[0];
    if (!riddle) { el.innerHTML = "<p class='text-sm text-slate-500'>No org data</p>"; return; }

    // Count nodes
    function countNodes(node) { return 1 + (node.children || []).reduce((s, c) => s + countNodes(c), 0); }
    const total = countNodes(riddle);
    document.getElementById("org-badge").textContent = total + " units";

    function renderNode(node, depth = 0) {
      const hasChildren = node.children && node.children.length > 0;
      const indent = depth * 20;
      const levelColors = {
        Enterprise: "text-purple-400", Business_Unit: "text-indigo-400", Function: "text-blue-400",
        Department: "text-cyan-400", Sub_Department: "text-teal-400", Individual: "text-green-400"
      };
      const colorClass = levelColors[node.org_level] || "text-slate-400";
      const id = "org-" + node.id;

      return `
        <div class="org-node" style="padding-left:${indent}px">
          <div class="group flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-lg cursor-pointer hover:bg-slate-800/60 transition-colors"
               onclick="toggleOrgDetail(${node.id})" data-org-id="${node.id}">
            ${hasChildren
              ? `<button onclick="event.stopPropagation(); toggleOrgChildren('${id}')" class="org-toggle w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-transform">
                   <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                 </button>`
              : `<span class="w-4 h-4 flex items-center justify-center"><span class="w-1.5 h-1.5 rounded-full ${colorClass.replace('text-', 'bg-')} opacity-60"></span></span>`
            }
            <span class="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">${esc(node.name)}</span>
            <span class="text-[10px] ${colorClass} opacity-70 ml-auto">${esc((node.org_level || "").replace("_", " "))}</span>
          </div>
          <div id="org-detail-${node.id}" class="hidden ml-6 mb-2 p-3 bg-slate-800/40 rounded-lg border border-slate-700/30 text-xs text-slate-400 animate-fadeIn">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-slate-300">${esc(node.name)}</span>
              <span class="px-1.5 py-0.5 rounded ${colorClass} bg-slate-800 text-[10px]">${esc((node.org_level || "").replace("_", " "))}</span>
            </div>
            ${node.description ? `<p class="mb-1">${esc(node.description)}</p>` : ""}
            ${node.owner ? `<p>Owner: <span class="text-slate-300">${esc(node.owner)}</span></p>` : ""}
          </div>
          <div id="${id}-children" class="org-children">
            ${(node.children || []).map(c => renderNode(c, depth + 1)).join("")}
          </div>
        </div>`;
    }

    el.innerHTML = renderNode(riddle);
  } catch (err) {
    showError(el, "Could not load org tree: " + err.message);
  }
}

window.toggleOrgChildren = function(id) {
  const children = document.getElementById(id + "-children");
  const parent = children?.previousElementSibling?.previousElementSibling;
  if (!children) return;
  const isHidden = children.style.display === "none";
  children.style.display = isHidden ? "" : "none";
  const toggle = parent?.closest(".org-node")?.querySelector(".org-toggle svg");
  if (toggle) toggle.style.transform = isHidden ? "rotate(90deg)" : "";
};

window.toggleOrgDetail = function(id) {
  const detail = document.getElementById("org-detail-" + id);
  if (detail) detail.classList.toggle("hidden");
};


// ═══════════════════════════════════════════════════════════════
// 2. GOAL CASCADE — Interactive vertical flow with alignments
// ═══════════════════════════════════════════════════════════════

async function renderGoalCascade() {
  const el = document.getElementById("goal-cascade-content");
  try {
    // Get the Riddle Enterprises org tree first to find the ID
    const orgRes = await apiFetch("/org-tree");
    const riddle = orgRes.data.find(n => n.name === "Riddle Enterprises");
    if (!riddle) { el.innerHTML = "<p class='text-sm text-slate-500'>No org data found</p>"; return; }

    const { data } = await apiFetch("/goal-tree/" + riddle.id);
    const goals = data.goals || [];
    document.getElementById("goal-badge").textContent = flattenGoals(goals).length + " goals";

    function flattenGoals(nodes) {
      let result = [];
      for (const n of nodes) {
        result.push(n);
        if (n.children) result = result.concat(flattenGoals(n.children));
      }
      return result;
    }

    // Render goals as vertical cascade with connector lines
    const levelColors = {
      Pillar: { border: "border-purple-500/40", bg: "bg-purple-500/5", badge: "bg-purple-500/15 text-purple-400", icon: "text-purple-400" },
      Category: { border: "border-indigo-500/40", bg: "bg-indigo-500/5", badge: "bg-indigo-500/15 text-indigo-400", icon: "text-indigo-400" },
      Goal: { border: "border-amber-500/40", bg: "bg-amber-500/5", badge: "bg-amber-500/15 text-amber-400", icon: "text-amber-400" },
      Program: { border: "border-emerald-500/40", bg: "bg-emerald-500/5", badge: "bg-emerald-500/15 text-emerald-400", icon: "text-emerald-400" },
    };

    function renderGoalNode(node) {
      const c = levelColors[node.goal_level] || levelColors.Goal;
      const hasChildren = node.children && node.children.length > 0;
      const alignment = (data.alignments || []).find(a => a.child_goal_id === node.id);

      return `
        <div class="goal-cascade-node">
          <div class="group ${c.bg} ${c.border} border rounded-lg p-3 cursor-pointer hover:border-opacity-80 transition-all ${node.goal_level === 'Program' ? 'ring-1 ring-emerald-500/10' : ''}"
               onclick="toggleGoalDetail(${node.id})">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] font-medium px-1.5 py-0.5 rounded ${c.badge}">${esc(node.goal_level)}</span>
              ${alignment ? `<span class="text-[10px] text-slate-500 ml-auto" title="Alignment: ${esc(alignment.alignment_type)}">
                ${Number(alignment.alignment_strength) * 100}% aligned
              </span>` : ""}
            </div>
            <p class="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">${esc(node.name)}</p>
            ${node.goal_level === "Program" ? `<p class="text-xs text-slate-400 mt-1">Q1 2026 -- 10 riddles target</p>` : ""}
            ${node.owner && node.goal_level !== "Program" ? `<p class="text-[11px] text-slate-500 mt-1">${esc(node.owner)}</p>` : ""}
          </div>
          <div id="goal-detail-${node.id}" class="hidden mx-2 p-3 bg-slate-800/30 rounded-b-lg border-x border-b border-slate-700/20 text-xs text-slate-400">
            ${node.description ? `<p class="mb-1">${esc(node.description)}</p>` : ""}
            ${node.org_unit_name ? `<p>Org: <span class="text-slate-300">${esc(node.org_unit_name)}</span></p>` : ""}
            ${node.weight ? `<p>Weight: <span class="text-slate-300">${node.weight}</span></p>` : ""}
          </div>
          ${hasChildren ? `
            <div class="flex justify-center py-1.5">
              <div class="w-px h-4 bg-gradient-to-b from-slate-600 to-slate-700"></div>
            </div>
            <div class="space-y-0">
              ${node.children.map(c => renderGoalNode(c)).join(`
                <div class="flex justify-center py-1.5">
                  <div class="w-px h-4 bg-gradient-to-b from-slate-600 to-slate-700"></div>
                </div>
              `)}
            </div>
          ` : ""}
        </div>`;
    }

    if (goals.length === 0) {
      el.innerHTML = "<p class='text-sm text-slate-500'>No goals found</p>";
    } else {
      el.innerHTML = goals.map(g => renderGoalNode(g)).join("");
    }
  } catch (err) {
    showError(el, "Could not load goals: " + err.message);
  }
}

window.toggleGoalDetail = function(id) {
  const detail = document.getElementById("goal-detail-" + id);
  if (detail) detail.classList.toggle("hidden");
};


// ═══════════════════════════════════════════════════════════════
// 3. SCORECARD — RAG badge, progress bar, quarterly objectives
// ═══════════════════════════════════════════════════════════════

async function renderScorecard() {
  const el = document.getElementById("scorecard-content");
  const ragBadge = document.getElementById("scorecard-rag-badge");
  const headerRag = document.getElementById("header-rag");
  try {
    const { data } = await apiFetch("/scorecard");
    // Find the Riddlemethis program
    const program = data.find(p => p.program_name === "Riddlemethis") || data[0];
    if (!program) { el.innerHTML = "<p class='text-sm text-slate-500'>No scorecard data</p>"; return; }

    const progress = program.progress;
    const metrics = progress?.metrics || {};
    const ragStatus = progress?.rag_status || "Not Started";
    const ragLabel = ragStatus.replace("_", " ").replace("Not Started", "Not Started");
    const rc = ragColor(ragStatus);
    const pct = Number(progress?.percent_complete || 0);

    // Update header RAG
    ragBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${rc.dot} rag-pulse"></span><span>${esc(ragLabel)}</span>`;
    ragBadge.className = `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${rc.bg} ${rc.text}`;
    headerRag.innerHTML = ragBadge.innerHTML;
    headerRag.className = ragBadge.className;

    // Build quarterly objectives
    const quarters = ["Q1", "Q2", "Q3", "Q4"];
    const objHTML = quarters.map(q => {
      const obj = program.objectives[q];
      if (!obj) return `
        <div class="flex items-center gap-2 py-1.5 text-xs">
          <span class="w-7 font-medium text-slate-500">${q}</span>
          <span class="text-slate-600 italic">--</span>
        </div>`;
      return `
        <div class="flex items-start gap-2 py-1.5 text-xs cursor-pointer hover:bg-slate-800/40 -mx-1 px-1 rounded transition-colors"
             onclick="this.querySelector('.obj-detail').classList.toggle('hidden')">
          <span class="w-7 font-semibold text-slate-300 flex-shrink-0">${q}</span>
          <div class="flex-1">
            <p class="text-slate-300 leading-relaxed">${esc(obj.objective_text)}</p>
            ${q === "Q1" ? `<div class="flex items-center gap-4 mt-1.5">
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-green-400/60"></span>
                <span class="text-[10px] text-slate-400">Riddler: ${metrics.riddles_created || 0} created</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-amber-400/60"></span>
                <span class="text-[10px] text-slate-400">Sphinx: ${metrics.riddles_deepened || 0} deepened</span>
              </div>
            </div>` : ""}
            <div class="obj-detail hidden mt-1 text-[11px] text-slate-500">
              ${obj.target_value ? `Target: <span class="text-slate-400">${obj.target_value} ${esc(obj.target_unit || "")}</span>` : ""}
              ${obj.status ? ` &middot; Status: <span class="text-slate-400">${esc(obj.status)}</span>` : ""}
            </div>
          </div>
        </div>`;
    }).join("");

    el.innerHTML = `
      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-sm font-semibold text-white">${esc(program.program_name)}</h4>
          <span class="text-xs text-slate-500">${esc(program.org_unit)}</span>
        </div>
        <div class="flex items-center gap-3 mb-1">
          <div class="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div class="progress-fill h-full rounded-full ${pct > 0 ? "bg-gradient-to-r from-purple-500 to-indigo-400" : "bg-slate-700"}" style="width: 0%"
                 data-target-width="${pct}%"></div>
          </div>
          <span class="text-xs font-medium ${rc.text}">${pct}%</span>
        </div>
        ${progress?.update_text ? `
          <p class="text-[11px] text-slate-500 mt-2 leading-relaxed cursor-pointer hover:text-slate-400 transition-colors"
             onclick="this.nextElementSibling.classList.toggle('hidden')">${esc(progress.update_text.slice(0, 120))}${progress.update_text.length > 120 ? "..." : ""}</p>
          <div class="hidden mt-2 p-2 bg-slate-800/30 rounded text-[11px] text-slate-400 leading-relaxed">
            ${esc(progress.update_text)}
            ${progress.author ? `<p class="mt-1 text-slate-500">-- ${esc(progress.author)}, v${progress.version}</p>` : ""}
          </div>
        ` : ""}
      </div>
      <div class="border-t border-slate-800 pt-3">
        <p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Quarterly Objectives</p>
        <div class="divide-y divide-slate-800/60">${objHTML}</div>
      </div>`;

    // Animate progress bar
    requestAnimationFrame(() => {
      setTimeout(() => {
        const bar = el.querySelector(".progress-fill");
        if (bar) bar.style.width = bar.dataset.targetWidth;
      }, 200);
    });
  } catch (err) {
    showError(el, "Could not load scorecard: " + err.message);
  }
}


// ═══════════════════════════════════════════════════════════════
// 4. SKILLS REGISTRY — Interactive cards with I/O specs
// ═══════════════════════════════════════════════════════════════

async function renderSkills() {
  const el = document.getElementById("skills-content");
  try {
    const { data } = await apiFetch("/skills");
    document.getElementById("skills-badge").textContent = data.length + " skills";

    const chainIcons = {
      "The Riddler": `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
      "The Sphinx": `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>`,
    };

    // Character color mapping per DESIGN_SPEC
    const charColors = {
      "The Riddler": { bg: "bg-green-500/5", border: "border-green-500/20", hoverBorder: "hover:border-green-500/40", text: "text-green-400", iconBg: "bg-green-500/20", codeTxt: "text-green-300/80", symbol: "?", role: "Creative Lead", borderT: "border-green-500/10" },
      "The Sphinx": { bg: "bg-amber-500/5", border: "border-amber-500/20", hoverBorder: "hover:border-amber-500/40", text: "text-amber-400", iconBg: "bg-amber-500/20", codeTxt: "text-amber-300/80", symbol: "\u25B2", role: "Sr. Enigmatologist", borderT: "border-amber-500/10" },
    };

    const inputKeys = (spec) => spec?.properties ? Object.keys(spec.properties).join(", ") : "--";

    el.innerHTML = `<div class="grid grid-cols-2 gap-3">${data.map(s => {
      const meta = s.metadata || {};
      const chainNext = meta.chain_next;
      const chainPrev = meta.chain_prev;
      const cc = charColors[s.person_name] || charColors["The Riddler"];

      return `
        <div class="${cc.bg} border ${cc.border} rounded-lg p-3.5 cursor-pointer ${cc.hoverBorder} transition-all"
             onclick="toggleSkillDetail(${s.id})">
          <div class="flex items-center gap-2 mb-2.5">
            <span class="w-6 h-6 rounded-full ${cc.iconBg} flex items-center justify-center text-[10px] ${cc.text} font-bold">${cc.symbol}</span>
            <div>
              <p class="text-xs font-semibold ${cc.text}">${esc(s.person_name)}</p>
              <p class="text-[10px] text-slate-500">${cc.role}</p>
            </div>
          </div>
          <p class="text-sm font-medium text-white mb-2">${esc(s.skill_name)}</p>
          <p class="text-xs text-slate-400 mb-3 line-clamp-2">${esc(s.description)}</p>
          <div class="space-y-1.5">
            <div>
              <p class="text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Input</p>
              <code class="text-[10px] ${cc.codeTxt} bg-slate-800/80 px-1.5 py-0.5 rounded">{ ${esc(inputKeys(s.input_spec))} }</code>
            </div>
            <div>
              <p class="text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Output</p>
              <code class="text-[10px] ${cc.codeTxt} bg-slate-800/80 px-1.5 py-0.5 rounded">{ ${esc(inputKeys(s.output_spec))} }</code>
            </div>
          </div>
          <div class="mt-3 pt-2 border-t ${cc.borderT} flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-500">Type: </span>
              <span class="text-[10px] ${cc.text}">${esc(s.skill_type)}</span>
            </div>
            <span class="text-[10px] text-slate-500">${s.output_count || 0} outputs</span>
          </div>
          <div id="skill-detail-${s.id}" class="hidden mt-3 pt-3 border-t ${cc.borderT} text-[11px] space-y-2">
            <div>
              <p class="text-slate-500 font-medium mb-1">Input Spec</p>
              <pre class="bg-slate-900/50 rounded p-2 ${cc.codeTxt} overflow-x-auto text-[10px] leading-relaxed">${esc(JSON.stringify(s.input_spec, null, 2))}</pre>
            </div>
            <div>
              <p class="text-slate-500 font-medium mb-1">Output Spec</p>
              <pre class="bg-slate-900/50 rounded p-2 ${cc.codeTxt} overflow-x-auto text-[10px] leading-relaxed">${esc(JSON.stringify(s.output_spec, null, 2))}</pre>
            </div>
          </div>
        </div>`;
    }).join("")}</div>`;
  } catch (err) {
    showError(el, "Could not load skills: " + err.message);
  }
}

window.toggleSkillDetail = function(id) {
  const detail = document.getElementById("skill-detail-" + id);
  if (detail) detail.classList.toggle("hidden");
};


// ═══════════════════════════════════════════════════════════════
// 5. SKILL CHAIN — Animated pipeline with real data flow
// ═══════════════════════════════════════════════════════════════

async function renderSkillChain() {
  const el = document.getElementById("skill-chain-content");
  try {
    const [outputsRes, feedbackRes] = await Promise.all([
      apiFetch("/skill-outputs"),
      apiFetch("/feedback"),
    ]);
    const outputs = outputsRes.data || [];
    const feedback = feedbackRes.data || [];

    // Group outputs by person
    const riddlerOutputs = outputs.filter(o => o.person_name === "The Riddler");
    const sphinxOutputs = outputs.filter(o => o.person_name === "The Sphinx");

    // Build chain visualization
    const hasData = riddlerOutputs.length > 0 || sphinxOutputs.length > 0;

    el.innerHTML = `
      <!-- Pipeline header -->
      <div class="flex items-center gap-2 mb-4">
        <div class="flex items-center gap-3 flex-1">
          <div class="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div>
              <p class="text-xs font-semibold text-white">The Riddler</p>
              <p class="text-[10px] text-purple-400">${riddlerOutputs.length} riddle${riddlerOutputs.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          <div class="flex-1 h-1 chain-flow-line rounded-full relative">
            ${feedback.length > 0 ? `<div class="absolute -top-3 left-1/2 -translate-x-1/2">
              <span class="text-[9px] text-purple-400 bg-slate-900 px-1.5 py-0.5 rounded">${feedback.length} review${feedback.length !== 1 ? "s" : ""}</span>
            </div>` : ""}
          </div>

          <div class="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
            <div>
              <p class="text-xs font-semibold text-white">The Sphinx</p>
              <p class="text-[10px] text-amber-400">${sphinxOutputs.length} deepened</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Chain entries -->
      <div id="chain-entries" class="space-y-3 max-h-[220px] overflow-y-auto timeline-scroll">
        ${hasData ? renderChainEntries(riddlerOutputs, sphinxOutputs, feedback) : `
          <div class="text-center py-6">
            <p class="text-sm text-slate-500 mb-3">Pipeline ready. No riddles generated yet.</p>
            <button onclick="runDemoFlow()" class="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/15 border border-purple-500/30 rounded-lg text-sm text-purple-400 hover:bg-purple-500/25 hover:text-purple-300 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              View Data Flow Demo
            </button>
          </div>
        `}
      </div>`;

    if (hasData) {
      // Also render the demo button if there's data
      const entries = document.getElementById("chain-entries");
      entries.insertAdjacentHTML("afterend", `
        <div class="mt-3 pt-3 border-t border-slate-800">
          <button onclick="runDemoFlow()" class="w-full flex items-center justify-center gap-2 py-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-slate-800/40 rounded-lg transition-all">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg>
            Replay Flow Animation
          </button>
        </div>
      `);
    }
  } catch (err) {
    showError(el, "Could not load skill chain: " + err.message);
  }
}

function renderChainEntries(riddlerOutputs, sphinxOutputs, feedback) {
  // Pair riddles with their deepened versions via feedback
  const entries = [];
  for (const ro of riddlerOutputs) {
    const fb = feedback.find(f => f.skill_output?.id === ro.id);
    const deepened = sphinxOutputs.find(so => {
      const od = so.output_data || {};
      const roData = ro.output_data || {};
      return od.original_riddle === roData.riddle || od.original_answer === roData.answer;
    });
    entries.push({ riddle: ro, feedback: fb, deepened });
  }

  if (entries.length === 0) return "<p class='text-sm text-slate-500 text-center py-4'>No chain data</p>";

  return entries.map((e, i) => {
    const rd = e.riddle.output_data || {};
    const dd = e.deepened?.output_data || {};
    return `
      <div class="chain-entry bg-slate-800/30 rounded-lg border border-slate-700/20 p-3 cursor-pointer hover:border-slate-600/40 transition-all"
           onclick="this.querySelector('.chain-detail').classList.toggle('hidden')" style="animation-delay: ${i * 0.15}s">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-[10px] font-medium text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">Step 1</span>
          <span class="text-[10px] text-slate-500">${esc(rd.topic || "riddle")}</span>
          ${e.feedback ? `<span class="text-[10px] text-green-400 ml-auto">reviewed</span>` : ""}
          ${e.deepened ? `<span class="text-[10px] text-amber-400 ml-auto">3-layer</span>` : ""}
        </div>
        <p class="text-xs text-slate-300 italic leading-relaxed">"${esc((rd.riddle || "").slice(0, 150))}${(rd.riddle || "").length > 150 ? "..." : ""}"</p>
        <div class="chain-detail hidden mt-3 space-y-3 border-t border-slate-700/20 pt-3 text-xs">
          <div>
            <p class="text-slate-500 font-medium mb-1">Answer</p>
            <p class="text-slate-300">${esc(rd.answer)}</p>
            <p class="text-slate-500 mt-1">Difficulty: <span class="text-slate-400">${esc(rd.difficulty)}</span></p>
          </div>
          ${e.feedback ? `<div>
            <p class="text-slate-500 font-medium mb-1">Sphinx Feedback</p>
            <p class="text-green-400/80">${esc((e.feedback.response_text || "").slice(0, 200))}</p>
          </div>` : ""}
          ${dd.layers ? `<div>
            <p class="text-slate-500 font-medium mb-1">Deepened Layers</p>
            ${dd.layers.map((l, li) => `
              <div class="ml-2 mb-2 pl-2 border-l border-amber-500/20">
                <p class="text-[10px] text-amber-400 font-medium">Layer ${l.level || li + 1}: ${esc(l.name || "")}</p>
                <p class="text-slate-400 italic">${esc((l.riddle || "").slice(0, 120))}...</p>
                ${l.hint ? `<p class="text-slate-500 mt-0.5">Hint: ${esc(l.hint)}</p>` : ""}
              </div>
            `).join("")}
            <p class="text-amber-400/80 font-medium">Final answer: ${esc(dd.final_answer)}</p>
          </div>` : ""}
        </div>
      </div>`;
  }).join("");
}

// Demo flow animation — simulates data flowing through the pipeline
window.runDemoFlow = function() {
  const el = document.getElementById("skill-chain-content");
  const container = el.querySelector("#chain-entries") || el;

  // Create animated demo overlay
  const demo = document.createElement("div");
  demo.id = "demo-overlay";
  demo.className = "fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center";
  demo.innerHTML = `
    <div class="max-w-2xl w-full mx-4">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-bold text-white">Skill Chain Pipeline Demo</h3>
        <button onclick="document.getElementById('demo-overlay').remove()" class="text-slate-400 hover:text-white text-sm">&times; Close</button>
      </div>
      <div class="space-y-4" id="demo-steps">
        <div class="demo-step opacity-0 transform translate-y-4 transition-all duration-500" data-step="1">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-purple-400">Step 1: The Riddler receives a topic</p>
              <p class="text-xs text-slate-500">Input: { topic: "time" }</p>
            </div>
          </div>
          <div class="ml-11 p-3 bg-slate-800/60 rounded-lg border border-purple-500/20 text-sm text-slate-300 italic">
            Processing prompt through Riddle Maker skill...
          </div>
        </div>
        <div class="flex justify-center">
          <div class="demo-arrow opacity-0 transition-all duration-300" data-step="2">
            <div class="w-1 h-8 bg-gradient-to-b from-purple-500/40 to-purple-500/0 mx-auto"></div>
            <svg class="w-4 h-4 text-purple-400 mx-auto -mt-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          </div>
        </div>
        <div class="demo-step opacity-0 transform translate-y-4 transition-all duration-500" data-step="3">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-green-400">Step 2: Riddle created, feedback requested</p>
              <p class="text-xs text-slate-500">Output recorded to skill_outputs + feedback_request sent</p>
            </div>
          </div>
          <div class="ml-11 p-3 bg-slate-800/60 rounded-lg border border-green-500/20 text-sm text-slate-300 italic">
            "I fly without wings, I cry without eyes. Wherever I go, darkness follows me. What am I?" -- answer: A cloud
          </div>
        </div>
        <div class="flex justify-center">
          <div class="demo-arrow opacity-0 transition-all duration-300" data-step="4">
            <div class="w-1 h-8 bg-gradient-to-b from-green-500/40 to-amber-500/40 mx-auto"></div>
            <svg class="w-4 h-4 text-amber-400 mx-auto -mt-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          </div>
        </div>
        <div class="demo-step opacity-0 transform translate-y-4 transition-all duration-500" data-step="5">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-amber-400">Step 3: The Sphinx deepens to 3 layers</p>
              <p class="text-xs text-slate-500">Riddle Deepener creates Surface, Hidden, and Deep layers</p>
            </div>
          </div>
          <div class="ml-11 p-3 bg-slate-800/60 rounded-lg border border-amber-500/20 text-xs text-slate-300 space-y-2">
            <p class="text-amber-400 font-medium">Layer 1 - Surface:</p>
            <p class="italic">The outer riddle that most can solve...</p>
            <p class="text-amber-400 font-medium">Layer 2 - Hidden:</p>
            <p class="italic">A deeper metaphor beneath the surface...</p>
            <p class="text-amber-400 font-medium">Layer 3 - Deep:</p>
            <p class="italic">The philosophical core only the wise unravel...</p>
          </div>
        </div>
        <div class="flex justify-center">
          <div class="demo-arrow opacity-0 transition-all duration-300" data-step="6">
            <div class="w-1 h-8 bg-gradient-to-b from-amber-500/40 to-blue-500/40 mx-auto"></div>
            <svg class="w-4 h-4 text-blue-400 mx-auto -mt-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          </div>
        </div>
        <div class="demo-step opacity-0 transform translate-y-4 transition-all duration-500" data-step="7">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-blue-400">Step 4: Scorecard updated</p>
              <p class="text-xs text-slate-500">Progress: 1/10 riddles completed. RAG: Green</p>
            </div>
          </div>
          <div class="ml-11 p-3 bg-slate-800/60 rounded-lg border border-blue-500/20">
            <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full demo-progress-bar" style="width: 0%; transition: width 1s ease"></div>
            </div>
            <p class="text-xs text-slate-500 mt-1">Pipeline loop complete. Data feeds back into the scorecard.</p>
          </div>
        </div>
      </div>
    </div>`;

  document.body.appendChild(demo);

  // Close on backdrop click
  demo.addEventListener("click", (e) => {
    if (e.target === demo) demo.remove();
  });

  // Animate steps sequentially
  const steps = [1, 2, 3, 4, 5, 6, 7];
  steps.forEach((step, i) => {
    setTimeout(() => {
      const els = demo.querySelectorAll(`[data-step="${step}"]`);
      els.forEach(el => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      });
      // Animate progress bar on last step
      if (step === 7) {
        setTimeout(() => {
          const bar = demo.querySelector(".demo-progress-bar");
          if (bar) bar.style.width = "10%";
        }, 300);
      }
    }, 600 + i * 700);
  });
};


// ═══════════════════════════════════════════════════════════════
// 6. ACTIVITY TIMELINE — Chronological feed with expandable entries
// ═══════════════════════════════════════════════════════════════

async function renderTimeline() {
  const el = document.getElementById("timeline-content");
  try {
    const [outputsRes, feedbackRes] = await Promise.all([
      apiFetch("/skill-outputs"),
      apiFetch("/feedback"),
    ]);

    // Merge outputs and feedback into a single timeline
    const events = [];
    for (const o of (outputsRes.data || [])) {
      events.push({
        type: "output",
        time: o.created_at,
        person: o.person_name,
        skill: o.skill_name,
        summary: o.output_summary || "Skill output",
        data: o,
      });
    }
    for (const f of (feedbackRes.data || [])) {
      events.push({
        type: "feedback",
        time: f.created_at,
        person: f.requested_by + " -> " + f.requested_from,
        skill: f.skill?.skill_name || "",
        summary: f.request_message || "Feedback request",
        data: f,
      });
      if (f.responded_at) {
        events.push({
          type: "response",
          time: f.responded_at,
          person: f.requested_from,
          skill: f.skill?.skill_name || "",
          summary: (f.response_text || "").slice(0, 100),
          data: f,
        });
      }
    }

    events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    document.getElementById("timeline-badge").textContent = events.length + " events";

    if (events.length === 0) {
      el.innerHTML = `
        <div class="text-center py-8">
          <svg class="w-8 h-8 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p class="text-sm text-slate-500">No activity yet</p>
          <p class="text-xs text-slate-600 mt-1">Events will appear as the riddle pipeline runs</p>
        </div>`;
      return;
    }

    const typeConfig = {
      output: { dot: "bg-green-400", label: "Output", icon: "text-green-400" },
      feedback: { dot: "bg-purple-400", label: "Review", icon: "text-purple-400" },
      response: { dot: "bg-amber-400", label: "Response", icon: "text-amber-400" },
    };

    el.innerHTML = `<div class="relative">
      <div class="absolute left-3 top-0 bottom-0 w-px bg-slate-800"></div>
      ${events.map((e, i) => {
        const tc = typeConfig[e.type] || typeConfig.output;
        return `
          <div class="timeline-entry relative pl-8 pb-4 cursor-pointer hover:bg-slate-800/20 -mx-2 px-10 py-2 rounded-lg transition-colors"
               onclick="this.querySelector('.tl-detail').classList.toggle('hidden')"
               style="animation-delay: ${i * 0.1}s">
            <div class="absolute left-1.5 top-3 w-3 h-3 rounded-full ${tc.dot} border-2 border-slate-900"></div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] font-medium ${tc.icon}">${tc.label}</span>
              <span class="text-[10px] text-slate-600">${esc(e.person)}</span>
              <span class="text-[10px] text-slate-600 ml-auto">${timeAgo(e.time)}</span>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed">${esc(e.summary)}</p>
            ${e.skill ? `<p class="text-[10px] text-slate-600 mt-0.5">${esc(e.skill)}</p>` : ""}
            <div class="tl-detail hidden mt-2 p-2 bg-slate-800/40 rounded text-[10px] text-slate-400">
              <pre class="overflow-x-auto whitespace-pre-wrap">${esc(JSON.stringify(e.type === "output" ? (e.data.output_data || {}) : { message: e.data.request_message, response: e.data.response_text }, null, 2))}</pre>
            </div>
          </div>`;
      }).join("")}
    </div>`;
  } catch (err) {
    showError(el, "Could not load timeline: " + err.message);
  }
}


// ═══════════════════════════════════════════════════════════════
// INIT — Panel reveal animation + data loading
// ═══════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
  // Reveal panels with stagger
  const panels = document.querySelectorAll(".panel-reveal");
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
      }
    });
  }, { threshold: 0.05 });
  panels.forEach(p => revealObserver.observe(p));

  // Load all panels in parallel
  Promise.allSettled([
    renderOrgTree(),
    renderGoalCascade(),
    renderScorecard(),
    renderSkills(),
    renderSkillChain(),
    renderTimeline(),
  ]).then(results => {
    const failed = results.filter(r => r.status === "rejected");
    if (failed.length > 0) {
      console.warn("Some panels failed to load:", failed);
    }
  });
});
