// ═══════════════════════════════════════════════════════════════
// Vantage Biopharma Dashboard — demo.js
// Fetches live data from scorecard-api and renders 6 panels
// with interactive elements, animations, and drill-down details
// ═══════════════════════════════════════════════════════════════

const API_BASE_URL = window.location.hostname === "localhost" ? "http://localhost:3001/api" : "/api";

// ── URL Param handling ──────────────────────────────────────
const urlParams = new URLSearchParams(window.location.search);
const selectedProgram = urlParams.get("program") || null;

// ── Persona Colors ──────────────────────────────────────────
const personaColors = {
  "Dr. Elena Vasquez": { bg: "bg-blue-500/5", border: "border-blue-500/20", hoverBorder: "hover:border-blue-500/40", text: "text-blue-400", iconBg: "bg-blue-500/20", codeTxt: "text-blue-300/80", symbol: "E", role: "MSL Field Rep", borderT: "border-blue-500/10" },
  "Marcus Chen": { bg: "bg-indigo-500/5", border: "border-indigo-500/20", hoverBorder: "hover:border-indigo-500/40", text: "text-indigo-400", iconBg: "bg-indigo-500/20", codeTxt: "text-indigo-300/80", symbol: "M", role: "Med Affairs Ops", borderT: "border-indigo-500/10" },
  "Sarah Okonkwo": { bg: "bg-purple-500/5", border: "border-purple-500/20", hoverBorder: "hover:border-purple-500/40", text: "text-purple-400", iconBg: "bg-purple-500/20", codeTxt: "text-purple-300/80", symbol: "S", role: "Commercial Strategist", borderT: "border-purple-500/10" },
  "Dr. James Park": { bg: "bg-emerald-500/5", border: "border-emerald-500/20", hoverBorder: "hover:border-emerald-500/40", text: "text-emerald-400", iconBg: "bg-emerald-500/20", codeTxt: "text-emerald-300/80", symbol: "J", role: "CRA Site Monitor", borderT: "border-emerald-500/10" },
  "Dr. Amara Osei": { bg: "bg-amber-500/5", border: "border-amber-500/20", hoverBorder: "hover:border-amber-500/40", text: "text-amber-400", iconBg: "bg-amber-500/20", codeTxt: "text-amber-300/80", symbol: "A", role: "Patient Safety", borderT: "border-amber-500/10" },
  "Dr. Richard Stein": { bg: "bg-red-500/5", border: "border-red-500/20", hoverBorder: "hover:border-red-500/40", text: "text-red-400", iconBg: "bg-red-500/20", codeTxt: "text-red-300/80", symbol: "R", role: "Medical Director", borderT: "border-red-500/10" },
};

// Chain definitions
const chainA = ["Dr. Elena Vasquez", "Marcus Chen", "Sarah Okonkwo"];
const chainB = ["Dr. James Park", "Dr. Amara Osei", "Dr. Richard Stein"];
let currentChain = "a";

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
  if (!res.ok) throw new Error("API " + path + ": " + res.status);
  return res.json();
}

function showError(el, msg) {
  el.innerHTML =
    '<div class="flex items-center gap-3 text-red-400 text-sm py-4">' +
    '<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>' +
    "</svg>" +
    "<span>" + esc(msg) + "</span>" +
    '<button onclick="location.reload()" class="ml-auto text-xs text-purple-400 hover:text-purple-300 underline">Retry</button>' +
    "</div>";
}

function flattenGoals(nodes) {
  let result = [];
  for (const n of nodes) {
    result.push(n);
    if (n.children) result = result.concat(flattenGoals(n.children));
  }
  return result;
}


// ═══════════════════════════════════════════════════════════════
// 1. BREADCRUMB — Show org hierarchy path in header
// ═══════════════════════════════════════════════════════════════

async function renderBreadcrumb() {
  const el = document.getElementById("header-breadcrumb");
  if (!el) return;
  try {
    const { data } = await apiFetch("/org-tree");
    const flat = [];
    function flatten(nodes, parentId) {
      for (const n of nodes) {
        n._parentId = parentId;
        flat.push(n);
        if (n.children) flatten(n.children, n.id);
      }
    }
    flatten(data, null);

    if (selectedProgram) {
      // Get the goal tree to find the program's org_unit_id
      const vantage = flat.find(function(n) { return n.name === "Vantage Biopharma"; }) || flat[0];
      if (!vantage) return;
      const goalRes = await apiFetch("/goal-tree/" + vantage.id);
      const allGoals = [];
      function flatGoals(nodes) {
        for (const n of nodes) { allGoals.push(n); if (n.children) flatGoals(n.children); }
      }
      flatGoals(goalRes.data.goals || []);
      const prog = allGoals.find(function(g) { return g.name === selectedProgram && g.goal_level === "Program"; });
      if (prog) {
        const orgNode = flat.find(function(o) { return o.id === prog.org_unit_id; });
        if (orgNode) {
          const chain = [];
          let current = orgNode;
          while (current) {
            chain.unshift(current.name);
            var pid = current._parentId;
            if (!pid) break;
            current = flat.find(function(o) { return o.id === pid; });
          }
          el.innerHTML = chain.map(function(name, i) {
            var isLast = i === chain.length - 1;
            return '<span class="' + (isLast ? 'text-slate-300' : 'text-slate-500') + '">' + esc(name) + '</span>';
          }).join(' <span class="text-slate-600 mx-1">&rsaquo;</span> ');
        }
      }
    } else {
      el.innerHTML = '<span class="text-slate-500">Vantage Biopharma</span> <span class="text-slate-600 mx-1">&rsaquo;</span> <span class="text-slate-300">Enterprise Overview</span>';
    }
  } catch (err) {
    console.warn("Breadcrumb error:", err);
  }
}


// ═══════════════════════════════════════════════════════════════
// 2. GOAL CASCADE — Interactive vertical flow with alignments
// ═══════════════════════════════════════════════════════════════

async function renderGoalCascade() {
  const el = document.getElementById("goal-cascade-content");
  try {
    const orgRes = await apiFetch("/org-tree");
    const vantage = orgRes.data.find(n => n.name === "Vantage Biopharma");
    if (!vantage) { el.innerHTML = "<p class='text-sm text-slate-500'>No org data found</p>"; return; }

    const { data } = await apiFetch("/goal-tree/" + vantage.id);
    const goals = data.goals || [];
    const allFlat = flattenGoals(goals);
    document.getElementById("goal-badge").textContent = allFlat.length + " goals";

    const levelColors = {
      Pillar: { border: "border-purple-500/40", bg: "bg-purple-500/5", badge: "bg-purple-500/15 text-purple-400" },
      Category: { border: "border-indigo-500/40", bg: "bg-indigo-500/5", badge: "bg-indigo-500/15 text-indigo-400" },
      Goal: { border: "border-amber-500/40", bg: "bg-amber-500/5", badge: "bg-amber-500/15 text-amber-400" },
      Program: { border: "border-emerald-500/40", bg: "bg-emerald-500/5", badge: "bg-emerald-500/15 text-emerald-400" },
    };

    function renderCascadeNode(node, isHighlighted) {
      const c = levelColors[node.goal_level] || levelColors.Goal;
      const isProgram = node.goal_level === "Program";
      const alignment = (data.alignments || []).find(a => a.child_goal_id === node.id);

      return '<div class="goal-cascade-node">' +
        '<div class="group ' + c.bg + ' ' + c.border + ' border rounded-lg p-3 ' +
          (isProgram ? 'ring-1 ring-emerald-500/20 ' : '') +
          (isHighlighted ? '' : 'opacity-60 ') +
          'cursor-pointer hover:border-opacity-80 transition-all" ' +
          'onclick="toggleGoalDetail(' + node.id + ')">' +
          '<div class="flex items-center gap-2 mb-1">' +
            '<span class="text-[10px] font-medium px-1.5 py-0.5 rounded ' + c.badge + '">' + esc(node.goal_level) + '</span>' +
            (alignment ? '<span class="text-[10px] text-slate-500 ml-auto">' + (Number(alignment.alignment_strength) * 100) + '% aligned</span>' : '') +
          '</div>' +
          '<p class="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">' + esc(node.name) + '</p>' +
          (node.owner ? '<p class="text-[11px] text-slate-500 mt-1">' + esc(node.owner) + '</p>' : '') +
        '</div>' +
        '<div id="goal-detail-' + node.id + '" class="hidden mx-2 p-3 bg-slate-800/30 rounded-b-lg border-x border-b border-slate-700/20 text-xs text-slate-400">' +
          (node.description ? '<p class="mb-1">' + esc(node.description) + '</p>' : '') +
          (node.org_unit_name ? '<p>Org: <span class="text-slate-300">' + esc(node.org_unit_name) + '</span></p>' : '') +
        '</div>' +
      '</div>';
    }

    var connector = '<div class="flex justify-center py-1"><div class="flex flex-col items-center"><div class="w-px h-3 bg-gradient-to-b from-slate-600 to-slate-700"></div><svg class="w-3 h-3 text-slate-600 -mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg></div></div>';

    if (goals.length === 0) {
      el.innerHTML = "<p class='text-sm text-slate-500'>No goals found</p>";
    } else if (selectedProgram) {
      // Find the program and build the ancestor chain
      var prog = allFlat.find(function(g) { return g.name === selectedProgram && g.goal_level === "Program"; });
      if (prog) {
        var chain = [];
        var current = prog;
        while (current) {
          chain.unshift(current);
          var parentId = current.parent_id;
          current = parentId ? allFlat.find(function(g) { return g.id === parentId; }) : null;
        }
        el.innerHTML = chain.map(function(g) {
          return renderCascadeNode(g, true);
        }).join(connector);
      } else {
        // Program not found in tree, show pillars
        el.innerHTML = goals.map(function(g) { return renderCascadeNode(g, true); }).join(connector);
      }
    } else {
      // No program selected — show all pillars
      el.innerHTML = goals.map(function(g) { return renderCascadeNode(g, true); }).join(connector);
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
    // Find the selected program or first available
    const program = selectedProgram
      ? (data.find(p => p.program_name === selectedProgram) || data[0])
      : data[0];
    if (!program) { el.innerHTML = "<p class='text-sm text-slate-500'>No scorecard data</p>"; return; }

    // Update subtitle
    const subtitle = document.getElementById("header-subtitle");
    if (subtitle) {
      subtitle.innerHTML = "Scorecard Dashboard &mdash; " + esc(program.program_name) + " &mdash; Q1 2026";
    }

    const progress = program.progress;
    const metrics = progress?.metrics || {};
    const ragStatus = progress?.rag_status || "Not Started";
    const ragLabel = ragStatus.replace("_", " ");
    const rc = ragColor(ragStatus);
    const pct = Number(progress?.percent_complete || 0);

    // Update header RAG
    ragBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full ' + rc.dot + ' rag-pulse"></span><span>' + esc(ragLabel) + "</span>";
    ragBadge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium " + rc.bg + " " + rc.text;
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
// 4. SKILLS REGISTRY — Interactive cards with persona colors
// ═══════════════════════════════════════════════════════════════

async function renderSkills() {
  const el = document.getElementById("skills-content");
  try {
    const { data } = await apiFetch("/skills");
    document.getElementById("skills-badge").textContent = data.length + " skills";

    const inputKeys = (spec) => spec?.properties ? Object.keys(spec.properties).join(", ") : "--";

    el.innerHTML = `<div class="grid grid-cols-3 gap-3">${data.map(s => {
      const cc = personaColors[s.person_name] || { bg: "bg-slate-500/5", border: "border-slate-500/20", hoverBorder: "hover:border-slate-500/40", text: "text-slate-400", iconBg: "bg-slate-500/20", codeTxt: "text-slate-300/80", symbol: "?", role: "Unknown", borderT: "border-slate-500/10" };

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
// 5. SKILL CHAIN — Animated pipeline with Chain A/B toggle
// ═══════════════════════════════════════════════════════════════

// Program-to-chain mapping: determine which chain a program uses
// Chain A (KOL Insights): Elena, Marcus, Sarah → KOL-INSIGHTS, LAUNCH-READY
// Chain B (AE Escalation): James, Amara, Richard → AE-SENTINEL, VBP-142 Phase II Readiness
const programChainMap = {
  "KOL-INSIGHTS": "a",
  "LAUNCH-READY": "a",
  "AE-SENTINEL": "b",
  "VBP-142 Phase II Readiness": "b",
};

async function renderSkillChain() {
  const el = document.getElementById("skill-chain-content");
  try {
    const [outputsRes, feedbackRes, skillsRes] = await Promise.all([
      apiFetch("/skill-outputs"),
      apiFetch("/feedback"),
      apiFetch("/skills"),
    ]);
    const outputs = outputsRes.data || [];
    const feedback = feedbackRes.data || [];
    const allSkills = skillsRes.data || [];

    // Auto-select chain based on program
    if (selectedProgram && programChainMap[selectedProgram]) {
      currentChain = programChainMap[selectedProgram];
    }

    // Update chain badge
    var chainLabel = currentChain === "a" ? "KOL Insights" : "AE Escalation";
    var chainBadge = document.getElementById("chain-badge");
    if (chainBadge) chainBadge.textContent = chainLabel + " pipeline";

    renderChainView(el, outputs, feedback);
  } catch (err) {
    showError(el, "Could not load skill chain: " + err.message);
  }
}

function renderChainView(el, outputs, feedback) {
  const chain = currentChain === "a" ? chainA : chainB;
  const chainLabel = currentChain === "a" ? "KOL Insights" : "AE Escalation";
  const chainColor = currentChain === "a" ? { flow: "from-blue-500/40 via-indigo-500/40 to-purple-500/40", flowLine: "#818cf8" } : { flow: "from-emerald-500/40 via-amber-500/40 to-red-500/40", flowLine: "#f59e0b" };

  // Build chain toggle + pipeline
  let html = '';

  // Toggle buttons
  html += '<div class="flex rounded-lg overflow-hidden border border-slate-700/50 mb-4">';
  html += '<button onclick="switchChain(\'a\')" class="chain-toggle px-3 py-1.5 text-xs font-medium ' + (currentChain === "a" ? "bg-blue-500/20 text-blue-400" : "text-slate-400 hover:text-white") + ' transition-colors border-r border-slate-700/50">Chain A: KOL Insights</button>';
  html += '<button onclick="switchChain(\'b\')" class="chain-toggle px-3 py-1.5 text-xs font-medium ' + (currentChain === "b" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-white") + ' transition-colors">Chain B: AE Escalation</button>';
  html += '</div>';

  // Show which programs this chain serves
  var chainPrograms = currentChain === "a" ? ["KOL-INSIGHTS", "LAUNCH-READY"] : ["AE-SENTINEL", "VBP-142 Phase II Readiness"];
  html += '<div class="flex flex-wrap gap-1.5 mb-3">';
  chainPrograms.forEach(function(progName) {
    var isSelected = progName === selectedProgram;
    html += '<a href="demo.html?program=' + encodeURIComponent(progName) + '" class="text-[10px] px-2 py-0.5 rounded-full border ' +
      (isSelected ? 'bg-purple-500/20 border-purple-500/30 text-purple-400 font-medium' : 'border-slate-700/50 text-slate-500 hover:text-slate-300 hover:border-slate-600') +
      ' transition-colors">' + esc(progName) + '</a>';
  });
  html += '</div>';

  // 3-step pipeline visualization
  html += '<div class="flex items-center gap-2 mb-4">';
  chain.forEach(function(person, i) {
    const cc = personaColors[person];
    html += '<div class="flex items-center gap-2 px-3 py-2 ' + cc.bg + ' border ' + cc.border + ' rounded-lg flex-1">';
    html += '<span class="w-6 h-6 rounded-full ' + cc.iconBg + ' flex items-center justify-center text-[10px] ' + cc.text + ' font-bold">' + cc.symbol + '</span>';
    html += '<div class="min-w-0">';
    html += '<p class="text-xs font-semibold text-white truncate">' + esc(person) + '</p>';
    html += '<p class="text-[10px] ' + cc.text + '">' + cc.role + '</p>';
    html += '</div>';
    html += '</div>';

    if (i < chain.length - 1) {
      html += '<div class="flex-shrink-0 w-8 h-1 chain-flow-line rounded-full"></div>';
    }
  });
  html += '</div>';

  // Chain data entries
  const chainOutputs = outputs.filter(function(o) { return chain.includes(o.person_name); });
  const hasData = chainOutputs.length > 0;

  if (hasData) {
    html += '<div id="chain-entries" class="space-y-3 max-h-[180px] overflow-y-auto timeline-scroll">';
    chainOutputs.forEach(function(o, i) {
      const cc = personaColors[o.person_name] || personaColors["Dr. Elena Vasquez"];
      html += '<div class="bg-slate-800/30 rounded-lg border border-slate-700/20 p-3 cursor-pointer hover:border-slate-600/40 transition-all"' +
        ' onclick="this.querySelector(\'.chain-detail\').classList.toggle(\'hidden\')" style="animation-delay: ' + (i * 0.15) + 's">';
      html += '<div class="flex items-center gap-2 mb-1">';
      html += '<span class="w-5 h-5 rounded-full ' + cc.iconBg + ' flex items-center justify-center text-[9px] ' + cc.text + ' font-bold">' + cc.symbol + '</span>';
      html += '<span class="text-[10px] font-medium ' + cc.text + '">' + esc(o.person_name) + '</span>';
      html += '<span class="text-[10px] text-slate-500">' + esc(o.skill_name) + '</span>';
      html += '<span class="text-[10px] text-slate-600 ml-auto">' + timeAgo(o.created_at) + '</span>';
      html += '</div>';
      html += '<p class="text-xs text-slate-300 leading-relaxed">' + esc(o.output_summary || "Skill output") + '</p>';
      html += '<div class="chain-detail hidden mt-2 p-2 bg-slate-800/40 rounded text-[10px] text-slate-400">';
      html += '<pre class="overflow-x-auto whitespace-pre-wrap">' + esc(JSON.stringify(o.output_data || {}, null, 2)) + '</pre>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
  } else {
    html += '<div class="text-center py-6">';
    html += '<p class="text-sm text-slate-500 mb-3">Pipeline ready. No outputs yet.</p>';
    html += '</div>';
  }

  // Demo button
  const demoFn = currentChain === "a" ? "runDemoFlowA" : "runDemoFlowB";
  const demoLabel = currentChain === "a" ? "View KOL Insights Flow" : "View AE Escalation Flow";
  html += '<div class="mt-3 pt-3 border-t border-slate-800">';
  html += '<button onclick="' + demoFn + '()" class="w-full flex items-center justify-center gap-2 py-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-slate-800/40 rounded-lg transition-all">';
  html += '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
  html += demoLabel;
  html += '</button>';
  html += '</div>';

  el.innerHTML = html;
}

window.switchChain = function(chain) {
  currentChain = chain;
  // Re-render the chain panel
  const el = document.getElementById("skill-chain-content");
  // Re-fetch and render
  Promise.all([apiFetch("/skill-outputs"), apiFetch("/feedback")])
    .then(function(results) {
      renderChainView(el, results[0].data || [], results[1].data || []);
    })
    .catch(function(err) {
      showError(el, "Could not load skill chain: " + err.message);
    });
};


// ═══════════════════════════════════════════════════════════════
// 6. DEMO FLOW OVERLAYS — Chain A (KOL Insights) + Chain B (AE)
// ═══════════════════════════════════════════════════════════════

function createDemoOverlay(title, steps) {
  // Remove existing overlay if any
  const existing = document.getElementById("demo-overlay");
  if (existing) existing.remove();

  const demo = document.createElement("div");
  demo.id = "demo-overlay";
  demo.className = "fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto";

  let stepsHTML = '';
  steps.forEach(function(step, i) {
    if (step.type === "arrow") {
      stepsHTML += '<div class="flex justify-center">';
      stepsHTML += '<div class="demo-arrow opacity-0 transition-all duration-300" data-step="' + step.step + '">';
      stepsHTML += '<div class="w-1 h-8 bg-gradient-to-b ' + (step.gradient || "from-slate-500/40 to-slate-500/0") + ' mx-auto"></div>';
      stepsHTML += '<svg class="w-4 h-4 ' + (step.arrowColor || "text-slate-400") + ' mx-auto -mt-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>';
      stepsHTML += '</div>';
      stepsHTML += '</div>';
    } else {
      stepsHTML += '<div class="demo-step opacity-0 transform translate-y-4 transition-all duration-500" data-step="' + step.step + '">';
      stepsHTML += '<div class="flex items-center gap-3 mb-2">';
      stepsHTML += '<div class="w-8 h-8 rounded-full ' + step.iconBg + ' flex items-center justify-center">';
      stepsHTML += '<span class="text-sm font-bold ' + step.iconColor + '">' + step.iconSymbol + '</span>';
      stepsHTML += '</div>';
      stepsHTML += '<div>';
      stepsHTML += '<p class="text-sm font-semibold ' + step.titleColor + '">' + esc(step.title) + '</p>';
      stepsHTML += '<p class="text-xs text-slate-500">' + esc(step.subtitle) + '</p>';
      stepsHTML += '</div>';
      stepsHTML += '</div>';
      stepsHTML += '<div class="ml-11 p-3 bg-slate-800/60 rounded-lg border ' + step.borderColor + ' text-sm text-slate-300">';
      stepsHTML += step.content;
      stepsHTML += '</div>';
      stepsHTML += '</div>';
    }
  });

  demo.innerHTML = '<div class="max-w-2xl w-full mx-4 my-8">' +
    '<div class="flex items-center justify-between mb-6">' +
    '<h3 class="text-lg font-bold text-white">' + esc(title) + '</h3>' +
    '<button onclick="document.getElementById(\'demo-overlay\').remove()" class="text-slate-400 hover:text-white text-sm">&times; Close</button>' +
    '</div>' +
    '<div class="space-y-4" id="demo-steps">' + stepsHTML + '</div>' +
    '</div>';

  document.body.appendChild(demo);

  // Close on backdrop click
  demo.addEventListener("click", function(e) {
    if (e.target === demo) demo.remove();
  });

  // Close on Escape
  function onEsc(e) {
    if (e.key === "Escape") {
      demo.remove();
      document.removeEventListener("keydown", onEsc);
    }
  }
  document.addEventListener("keydown", onEsc);

  // Animate steps sequentially
  var allSteps = [];
  steps.forEach(function(s) { allSteps.push(s.step); });
  var uniqueSteps = [...new Set(allSteps)];
  uniqueSteps.forEach(function(step, i) {
    setTimeout(function() {
      var els = demo.querySelectorAll('[data-step="' + step + '"]');
      els.forEach(function(el) {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      });
      // Progress bar animation on final step
      if (i === uniqueSteps.length - 1) {
        setTimeout(function() {
          var bars = demo.querySelectorAll(".demo-progress-bar");
          bars.forEach(function(bar) { bar.style.width = bar.dataset.targetWidth || "10%"; });
        }, 300);
      }
    }, 600 + i * 700);
  });
}


// ── Chain A: KOL Insights Flow ──
window.runDemoFlowA = function() {
  var ec = personaColors["Dr. Elena Vasquez"];
  var mc = personaColors["Marcus Chen"];
  var sc = personaColors["Sarah Okonkwo"];

  createDemoOverlay("Chain A: KOL Insights Flow", [
    {
      step: 1, type: "step",
      iconBg: ec.iconBg, iconColor: ec.text, iconSymbol: "E",
      titleColor: ec.text,
      title: "Step 1: Dr. Elena Vasquez submits KOL insight",
      subtitle: "MSL Field Rep captures engagement data",
      borderColor: ec.border,
      content: '<div class="space-y-2">' +
        '<p class="text-xs text-slate-400">KOL: <span class="text-white">Dr. Margaret Liu</span> &mdash; Mass General, Boston</p>' +
        '<p class="text-xs text-slate-400">Context: <span class="text-white">VBP-142 NSCLC treatment landscape</span></p>' +
        '<p class="text-xs text-slate-400">Key insight: <span class="italic text-blue-300">"Patients are asking about real-world outcomes, not just trial data. First-in-class mechanism is compelling but clinicians want safety data from compassionate use."</span></p>' +
        '<div class="flex gap-2 mt-2">' +
        '<span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400">engagement_type: advisory_board</span>' +
        '<span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400">therapeutic_area: oncology</span>' +
        '</div>' +
        '</div>'
    },
    { step: 2, type: "arrow", gradient: "from-blue-500/40 to-indigo-500/40", arrowColor: "text-indigo-400" },
    {
      step: 3, type: "step",
      iconBg: mc.iconBg, iconColor: mc.text, iconSymbol: "M",
      titleColor: mc.text,
      title: "Step 2: Marcus Chen aggregates insights",
      subtitle: "Med Affairs Ops reviews and synthesizes",
      borderColor: mc.border,
      content: '<div class="space-y-2">' +
        '<p class="text-xs text-slate-400">Aggregated with <span class="text-white">2 other recent KOL engagements</span></p>' +
        '<div class="bg-slate-900/50 rounded p-2 mt-1">' +
        '<p class="text-[10px] text-indigo-400 font-medium mb-1">Top Unmet Needs Identified:</p>' +
        '<p class="text-[10px] text-slate-400">1. Real-world outcome data beyond Phase II</p>' +
        '<p class="text-[10px] text-slate-400">2. Compassionate use safety signals</p>' +
        '<p class="text-[10px] text-slate-400">3. Patient-reported outcome instruments</p>' +
        '</div>' +
        '<p class="text-xs text-slate-400 mt-1">Trend: <span class="text-indigo-300">3/3 KOLs emphasize patient outcomes over efficacy metrics</span></p>' +
        '</div>'
    },
    { step: 4, type: "arrow", gradient: "from-indigo-500/40 to-purple-500/40", arrowColor: "text-purple-400" },
    {
      step: 5, type: "step",
      iconBg: sc.iconBg, iconColor: sc.text, iconSymbol: "S",
      titleColor: sc.text,
      title: "Step 3: Sarah Okonkwo develops positioning",
      subtitle: "Commercial Strategist refines messaging",
      borderColor: sc.border,
      content: '<div class="space-y-2">' +
        '<p class="text-xs text-slate-400">Positioning: <span class="italic text-purple-300">"First-in-class with real-world KOL validation"</span></p>' +
        '<p class="text-xs text-slate-400">Recommended pivot: Lead with patient outcomes, not mechanism of action</p>' +
        '<div class="bg-slate-900/50 rounded p-2 mt-1">' +
        '<p class="text-[10px] text-purple-400 font-medium">Messaging Framework Update:</p>' +
        '<p class="text-[10px] text-slate-400">Primary: Patient-outcome-first narrative</p>' +
        '<p class="text-[10px] text-slate-400">Secondary: First-in-class mechanism differentiation</p>' +
        '<p class="text-[10px] text-slate-400">Proof points: 3 KOL endorsements + compassionate use data</p>' +
        '</div>' +
        '</div>'
    },
    { step: 6, type: "arrow", gradient: "from-purple-500/40 to-amber-500/40", arrowColor: "text-amber-400" },
    {
      step: 7, type: "step",
      iconBg: "bg-amber-500/20", iconColor: "text-amber-400", iconSymbol: "!",
      titleColor: "text-amber-400",
      title: "Step 4: Decision logged",
      subtitle: "Strategic pivot captured in goal system",
      borderColor: "border-amber-500/20",
      content: '<div class="bg-amber-500/5 border border-amber-500/10 rounded p-2">' +
        '<p class="text-xs font-medium text-amber-400 mb-1">Decision: Shift messaging from efficacy-first to patient-outcome-first</p>' +
        '<p class="text-[10px] text-slate-400">Rationale: Consistent KOL feedback indicates market preference for outcome data</p>' +
        '<p class="text-[10px] text-slate-400 mt-1">Impact: LAUNCH-READY messaging materials updated, VBP-142 positioning revised</p>' +
        '</div>'
    },
    { step: 8, type: "arrow", gradient: "from-amber-500/40 to-emerald-500/40", arrowColor: "text-emerald-400" },
    {
      step: 9, type: "step",
      iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400", iconSymbol: "+",
      titleColor: "text-emerald-400",
      title: "Step 5: Scorecard updates",
      subtitle: "Programs reflect intelligence chain output",
      borderColor: "border-emerald-500/20",
      content: '<div class="space-y-3">' +
        '<div class="flex items-center justify-between">' +
        '<span class="text-xs text-white">KOL-INSIGHTS</span>' +
        '<span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">Green 20%</span>' +
        '</div>' +
        '<div class="h-2 bg-slate-700 rounded-full overflow-hidden">' +
        '<div class="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full demo-progress-bar" style="width: 0%; transition: width 1s ease" data-target-width="20%"></div>' +
        '</div>' +
        '<div class="flex items-center justify-between mt-2">' +
        '<span class="text-xs text-white">LAUNCH-READY</span>' +
        '<span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">Green 10%</span>' +
        '</div>' +
        '<div class="h-2 bg-slate-700 rounded-full overflow-hidden">' +
        '<div class="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full demo-progress-bar" style="width: 0%; transition: width 1s ease" data-target-width="10%"></div>' +
        '</div>' +
        '<p class="text-[10px] text-slate-500 mt-1">Pipeline loop complete. Intelligence feeds back into the scorecard.</p>' +
        '</div>'
    }
  ]);
};


// ── Chain B: AE Escalation Flow ──
window.runDemoFlowB = function() {
  var jc = personaColors["Dr. James Park"];
  var ac = personaColors["Dr. Amara Osei"];
  var rc = personaColors["Dr. Richard Stein"];

  createDemoOverlay("Chain B: AE Escalation Flow", [
    {
      step: 1, type: "step",
      iconBg: jc.iconBg, iconColor: jc.text, iconSymbol: "J",
      titleColor: jc.text,
      title: "Step 1: Dr. James Park flags adverse event",
      subtitle: "CRA Site Monitor detects Grade 3 AE",
      borderColor: jc.border,
      content: '<div class="space-y-2">' +
        '<p class="text-xs text-slate-400">AE ID: <span class="text-white font-mono">AE-2026-014-003</span></p>' +
        '<p class="text-xs text-slate-400">Site: <span class="text-white">Site 014 — Memorial Sloan Kettering</span></p>' +
        '<p class="text-xs text-slate-400">Event: <span class="text-emerald-300 font-medium">Grade 3 hepatotoxicity</span></p>' +
        '<div class="flex gap-2 mt-2">' +
        '<span class="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">severity: grade_3</span>' +
        '<span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">type: hepatotoxicity</span>' +
        '<span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">causality: pending</span>' +
        '</div>' +
        '</div>'
    },
    { step: 2, type: "arrow", gradient: "from-emerald-500/40 to-amber-500/40", arrowColor: "text-amber-400" },
    {
      step: 3, type: "step",
      iconBg: ac.iconBg, iconColor: ac.text, iconSymbol: "A",
      titleColor: ac.text,
      title: "Step 2: Dr. Amara Osei evaluates causality",
      subtitle: "Patient Safety assesses signal",
      borderColor: ac.border,
      content: '<div class="space-y-2">' +
        '<div class="bg-slate-900/50 rounded p-2">' +
        '<p class="text-[10px] text-amber-400 font-medium mb-1">Naranjo Assessment:</p>' +
        '<p class="text-[10px] text-slate-400">Score: <span class="text-white font-medium">6</span> (Probable)</p>' +
        '<p class="text-[10px] text-slate-400">Classification: <span class="text-amber-300 font-medium">Probable causal relationship</span></p>' +
        '</div>' +
        '<div class="bg-slate-900/50 rounded p-2 mt-1">' +
        '<p class="text-[10px] text-amber-400 font-medium mb-1">Signal Detection:</p>' +
        '<p class="text-[10px] text-slate-400">Hepatotoxicity rate: <span class="text-white">2.1%</span> (threshold: 1.5%)</p>' +
        '<p class="text-[10px] text-red-400 font-medium">Signal detected: rate exceeds safety threshold</p>' +
        '</div>' +
        '</div>'
    },
    { step: 4, type: "arrow", gradient: "from-amber-500/40 to-red-500/40", arrowColor: "text-red-400" },
    {
      step: 5, type: "step",
      iconBg: rc.iconBg, iconColor: rc.text, iconSymbol: "R",
      titleColor: rc.text,
      title: "Step 3: Dr. Richard Stein decides",
      subtitle: "Medical Director approves protocol amendment",
      borderColor: rc.border,
      content: '<div class="space-y-2">' +
        '<div class="bg-red-500/5 border border-red-500/10 rounded p-2">' +
        '<p class="text-xs font-medium text-red-400 mb-1">Decision: approve_amendment</p>' +
        '<p class="text-[10px] text-slate-400">Action: Add mandatory liver function monitoring (ALT/AST) at each study visit</p>' +
        '<p class="text-[10px] text-slate-400 mt-1">Protocol version: v3.2 amendment pending IRB review</p>' +
        '</div>' +
        '<div class="flex gap-2 mt-2">' +
        '<span class="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">regulatory_impact: protocol_amendment</span>' +
        '<span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">timeline: 2-4 weeks for IRB</span>' +
        '</div>' +
        '</div>'
    },
    { step: 6, type: "arrow", gradient: "from-red-500/40 to-purple-500/40", arrowColor: "text-purple-400" },
    {
      step: 7, type: "step",
      iconBg: "bg-purple-500/20", iconColor: "text-purple-400", iconSymbol: "X",
      titleColor: "text-purple-400",
      title: "Step 4: Cross-cutting alignment impact",
      subtitle: "AE-SENTINEL impacts VBP-142 Phase II",
      borderColor: "border-purple-500/20",
      content: '<div class="space-y-2">' +
        '<div class="bg-purple-500/5 border border-purple-500/10 rounded p-2">' +
        '<p class="text-xs text-slate-400">AE-SENTINEL <span class="text-purple-400">cross-cuts</span> VBP-142 Phase II Readiness</p>' +
        '<div class="flex items-center gap-2 mt-2">' +
        '<span class="text-[10px] text-slate-500">Alignment strength:</span>' +
        '<div class="flex-1 h-1.5 bg-slate-700 rounded-full">' +
        '<div class="h-full bg-purple-400 rounded-full" style="width: 90%"></div>' +
        '</div>' +
        '<span class="text-[10px] text-purple-400 font-medium">90%</span>' +
        '</div>' +
        '<p class="text-[10px] text-slate-400 mt-1">Protocol amendment delays may impact Phase II readiness timeline</p>' +
        '</div>' +
        '</div>'
    },
    { step: 8, type: "arrow", gradient: "from-purple-500/40 to-amber-500/40", arrowColor: "text-amber-400" },
    {
      step: 9, type: "step",
      iconBg: "bg-amber-500/20", iconColor: "text-amber-400", iconSymbol: "!",
      titleColor: "text-amber-400",
      title: "Step 5: Scorecard updates",
      subtitle: "Programs reflect safety signal impact",
      borderColor: "border-amber-500/20",
      content: '<div class="space-y-3">' +
        '<div class="flex items-center justify-between">' +
        '<span class="text-xs text-white">AE-SENTINEL</span>' +
        '<span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">Amber 15%</span>' +
        '</div>' +
        '<div class="h-2 bg-slate-700 rounded-full overflow-hidden">' +
        '<div class="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full demo-progress-bar" style="width: 0%; transition: width 1s ease" data-target-width="15%"></div>' +
        '</div>' +
        '<p class="text-[10px] text-slate-500 mt-1">Safety signal escalation complete. Amendment tracking in progress.</p>' +
        '</div>'
    }
  ]);
};

// Keep backward compat for any existing calls
window.runDemoFlow = window.runDemoFlowA;


// ═══════════════════════════════════════════════════════════════
// 7. ACTIVITY TIMELINE — Chronological feed with persona colors
// ═══════════════════════════════════════════════════════════════

async function renderTimeline() {
  const el = document.getElementById("timeline-content");
  try {
    const [outputsRes, feedbackRes] = await Promise.all([
      apiFetch("/skill-outputs"),
      apiFetch("/feedback"),
    ]);

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
          <p class="text-xs text-slate-600 mt-1">Events will appear as the intelligence pipeline runs</p>
        </div>`;
      return;
    }

    const typeConfig = {
      output: { label: "Output", defaultDot: "bg-green-400", defaultIcon: "text-green-400" },
      feedback: { label: "Review", defaultDot: "bg-purple-400", defaultIcon: "text-purple-400" },
      response: { label: "Response", defaultDot: "bg-amber-400", defaultIcon: "text-amber-400" },
    };

    el.innerHTML = `<div class="relative">
      <div class="absolute left-3 top-0 bottom-0 w-px bg-slate-800"></div>
      ${events.map((e, i) => {
        const tc = typeConfig[e.type] || typeConfig.output;
        // Use persona color for the dot if available
        const personName = e.type === "output" ? e.data.person_name : (e.type === "response" ? e.data.requested_from : null);
        const pc = personName ? personaColors[personName] : null;
        const dotColor = pc ? pc.iconBg.replace("bg-", "bg-") : tc.defaultDot;
        const iconColor = pc ? pc.text : tc.defaultIcon;

        return `
          <div class="timeline-entry relative pl-8 pb-4 cursor-pointer hover:bg-slate-800/20 -mx-2 px-10 py-2 rounded-lg transition-colors"
               onclick="this.querySelector('.tl-detail').classList.toggle('hidden')"
               style="animation-delay: ${i * 0.1}s">
            <div class="absolute left-1.5 top-3 w-3 h-3 rounded-full ${dotColor} border-2 border-slate-900"></div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] font-medium ${iconColor}">${tc.label}</span>
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
    renderBreadcrumb(),
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
