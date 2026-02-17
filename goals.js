// ═══════════════════════════════════════════════════════════════
// Vantage Biopharma — CEO Goal View (goals.js)
// Fetches live data from scorecard-api and renders pillar layout
// with role-based filtering, alignment panels, and goal detail modal
// ═══════════════════════════════════════════════════════════════

const API_BASE_URL = window.location.hostname === "localhost" ? "http://localhost:3001/api" : "/api";

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
  el.innerHTML = '<div class="flex items-center gap-3 text-red-400 text-sm py-4">' +
    '<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>' +
    '</svg>' +
    '<span>' + esc(msg) + '</span>' +
    '<button onclick="location.reload()" class="ml-auto text-xs text-purple-400 hover:text-purple-300 underline">Retry</button>' +
    '</div>';
}


// ── State ──────────────────────────────────────────────────

let allGoals = [];        // flat list of all goals
let allAlignments = [];   // all alignments
let orgTree = null;       // org hierarchy (tree)
let orgFlat = [];         // flat org list
let goalTree = [];        // hierarchical goal tree
let summaryData = null;   // scorecard summary
let currentRole = "ceo";  // ceo | manager | individual
let currentFilter = null; // selected function/person for filtering


// ── Pillar Colors ──────────────────────────────────────────

const pillarColors = {
  "Advance Pipeline": { accent: "border-l-purple-500", bg: "bg-purple-500/5", text: "text-purple-400", badge: "bg-purple-500/15 text-purple-400", headerBg: "bg-purple-500/8", headerBorder: "border-purple-500/20" },
  "Improve Patient Outcomes": { accent: "border-l-indigo-500", bg: "bg-indigo-500/5", text: "text-indigo-400", badge: "bg-indigo-500/15 text-indigo-400", headerBg: "bg-indigo-500/8", headerBorder: "border-indigo-500/20" },
  "Develop Our People": { accent: "border-l-amber-500", bg: "bg-amber-500/5", text: "text-amber-400", badge: "bg-amber-500/15 text-amber-400", headerBg: "bg-amber-500/8", headerBorder: "border-amber-500/20" },
};

// Goal level colors
const levelColors = {
  Pillar: { border: "border-purple-500/30", bg: "bg-purple-500/5", badge: "bg-purple-500/15 text-purple-400" },
  Category: { border: "border-indigo-500/30", bg: "bg-indigo-500/5", badge: "bg-indigo-500/15 text-indigo-400" },
  Goal: { border: "border-amber-500/30", bg: "bg-amber-500/5", badge: "bg-amber-500/15 text-amber-400" },
  Program: { border: "border-emerald-500/30", bg: "bg-emerald-500/5", badge: "bg-emerald-500/15 text-emerald-400" },
};


// ── Utility ────────────────────────────────────────────────

function flattenGoals(nodes) {
  let result = [];
  for (const n of nodes) {
    result.push(n);
    if (n.children) result = result.concat(flattenGoals(n.children));
  }
  return result;
}

function flattenOrg(nodes) {
  let result = [];
  for (const n of nodes) {
    result.push(n);
    if (n.children) result = result.concat(flattenOrg(n.children));
  }
  return result;
}

function getOrgDescendantIds(orgName) {
  const node = orgFlat.find(function(o) { return o.name === orgName; });
  if (!node) return [];
  const ids = [];
  function collect(n) {
    ids.push(n.id);
    (n.children || []).forEach(collect);
  }
  collect(node);
  return ids;
}

function isGoalUnderOrgName(goal, orgName) {
  const ids = getOrgDescendantIds(orgName);
  return ids.includes(goal.org_unit_id);
}

function isGoalAncestorOf(goal, targetGoalIds) {
  // Check if any of targetGoalIds is a descendant of goal
  function hasDescendant(node, ids) {
    if (ids.includes(node.id)) return true;
    return (node.children || []).some(function(c) { return hasDescendant(c, ids); });
  }
  return hasDescendant(goal, targetGoalIds);
}

function getGoalIdsForOwner(owner) {
  return allGoals.filter(function(g) { return g.owner === owner; }).map(function(g) { return g.id; });
}

function getAncestorGoalIds(goalId) {
  const ids = [];
  let current = allGoals.find(function(g) { return g.id === goalId; });
  while (current && current.parent_id) {
    ids.push(current.parent_id);
    current = allGoals.find(function(g) { return g.id === current.parent_id; });
  }
  return ids;
}

function getProgramRAG(programName) {
  if (!summaryData || !summaryData.pillars) return null;
  for (const p of summaryData.pillars) {
    for (const prog of p.programs) {
      if (prog.program_name === programName) return prog;
    }
  }
  return null;
}


// ── Alignment helpers ──────────────────────────────────────

function getAlignmentsForGoal(goalId) {
  return allAlignments.filter(function(a) {
    return a.child_goal_id === goalId || a.parent_goal_id === goalId;
  });
}


// ═══════════════════════════════════════════════════════════════
// ROLE FILTERING
// ═══════════════════════════════════════════════════════════════

window.setRole = function(role) {
  currentRole = role;
  currentFilter = null;

  // Update button styles
  document.querySelectorAll(".role-btn").forEach(function(btn) {
    var isActive = btn.dataset.role === role;
    btn.className = "role-btn px-3 py-1.5 text-xs font-medium " +
      (isActive ? "bg-purple-500/20 text-purple-400" : "text-slate-400 hover:text-white") +
      " transition-colors" +
      (btn.dataset.role !== "individual" ? " border-r border-slate-700/50" : "");
  });

  var filterEl = document.getElementById("role-filters");
  if (role === "ceo") {
    filterEl.innerHTML = "";
    applyFilter();
  } else if (role === "manager") {
    filterEl.innerHTML = '<select onchange="currentFilter = this.value; applyFilter()" class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300">' +
      '<option value="">Select Function...</option>' +
      '<option value="Medical Affairs">Medical Affairs</option>' +
      '<option value="Commercial">Commercial</option>' +
      '<option value="Clinical Development">Clinical Development</option>' +
      '</select>';
  } else if (role === "individual") {
    filterEl.innerHTML = '<select onchange="currentFilter = this.value; applyFilter()" class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300">' +
      '<option value="">Select Person...</option>' +
      '<option value="Dr. Elena Vasquez">Dr. Elena Vasquez</option>' +
      '<option value="Marcus Chen">Marcus Chen</option>' +
      '<option value="Sarah Okonkwo">Sarah Okonkwo</option>' +
      '<option value="Dr. James Park">Dr. James Park</option>' +
      '<option value="Dr. Amara Osei">Dr. Amara Osei</option>' +
      '<option value="Dr. Richard Stein">Dr. Richard Stein</option>' +
      '</select>';
  }
};

function applyFilter() {
  document.querySelectorAll(".goal-card").forEach(function(card) {
    var goalId = parseInt(card.dataset.goalId);
    var goal = allGoals.find(function(g) { return g.id === goalId; });
    if (!goal) return;

    if (currentRole === "ceo" || !currentFilter) {
      card.classList.remove("dimmed", "hidden-filter");
      return;
    }

    if (currentRole === "manager") {
      var isUnder = isGoalUnderOrgName(goal, currentFilter);
      // Check if this goal is an ancestor of any goal under the function
      var goalsUnder = allGoals.filter(function(g) { return isGoalUnderOrgName(g, currentFilter); });
      var goalIdsUnder = goalsUnder.map(function(g) { return g.id; });
      var ancestorIds = [];
      goalIdsUnder.forEach(function(id) {
        ancestorIds = ancestorIds.concat(getAncestorGoalIds(id));
      });
      var isAncestor = ancestorIds.includes(goal.id);

      if (isUnder) {
        card.classList.remove("dimmed", "hidden-filter");
      } else if (isAncestor) {
        card.classList.add("dimmed");
        card.classList.remove("hidden-filter");
      } else {
        card.classList.add("hidden-filter");
      }
    } else if (currentRole === "individual") {
      var isOwned = goal.owner === currentFilter;
      var ownedIds = getGoalIdsForOwner(currentFilter);
      var allAncestors = [];
      ownedIds.forEach(function(id) {
        allAncestors = allAncestors.concat(getAncestorGoalIds(id));
      });
      var isAnc = allAncestors.includes(goal.id);

      if (isOwned) {
        card.classList.remove("dimmed", "hidden-filter");
      } else if (isAnc) {
        card.classList.add("dimmed");
        card.classList.remove("hidden-filter");
      } else {
        card.classList.add("hidden-filter");
      }
    }
  });

  // Also dim/hide category headers that have all hidden children
  document.querySelectorAll(".category-group").forEach(function(group) {
    var cards = group.querySelectorAll(".goal-card");
    var allHidden = true;
    cards.forEach(function(c) {
      if (!c.classList.contains("hidden-filter")) allHidden = false;
    });
    if (allHidden && currentFilter) {
      group.style.display = "none";
    } else {
      group.style.display = "";
    }
  });
}


// ═══════════════════════════════════════════════════════════════
// RENDER PILLARS
// ═══════════════════════════════════════════════════════════════

function renderPillars(pillars, summary) {
  var grid = document.getElementById("pillars-grid");
  if (!pillars || pillars.length === 0) {
    grid.innerHTML = '<p class="text-sm text-slate-500 col-span-3 text-center py-8">No goal data found</p>';
    return;
  }

  grid.innerHTML = pillars.map(function(pillar) {
    var pc = pillarColors[pillar.name] || pillarColors["Advance Pipeline"];
    var pillarGoalCount = flattenGoals([pillar]).length;
    var summaryPillar = summary && summary.pillars
      ? summary.pillars.find(function(sp) { return sp.pillar_name === pillar.name; })
      : null;
    var pillarRag = summaryPillar ? summaryPillar.overall_rag : "Not Started";
    var rc = ragColor(pillarRag);

    return '<div class="panel-reveal pillar-panel bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">' +
      // Pillar header
      '<div class="px-5 py-4 border-b border-slate-800 ' + pc.headerBg + ' border-l-4 ' + pc.accent + '">' +
        '<div class="flex items-center justify-between">' +
          '<div>' +
            '<h3 class="text-sm font-semibold text-white tracking-wide">' + esc(pillar.name) + '</h3>' +
            '<p class="text-[10px] text-slate-500 mt-0.5">' + pillarGoalCount + ' goals</p>' +
          '</div>' +
          '<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ' + rc.bg + ' ' + rc.text + '">' +
            '<span class="w-1.5 h-1.5 rounded-full ' + rc.dot + ' rag-pulse"></span>' +
            esc(pillarRag.replace("_", " ")) +
          '</span>' +
        '</div>' +
      '</div>' +
      // Categories and goals
      '<div class="p-4 space-y-3">' +
        (pillar.children || []).map(function(category) {
          return renderCategory(category, pc);
        }).join("") +
      '</div>' +
    '</div>';
  }).join("");

  // Set up reveal animations
  setupRevealAnimations();
}

function renderCategory(category, pillarColor) {
  var hasChildren = category.children && category.children.length > 0;
  var catId = "cat-" + category.id;
  var lc = levelColors.Category;

  return '<div class="category-group">' +
    '<div class="flex items-center gap-2 mb-2 cursor-pointer group" onclick="toggleCategory(\'' + catId + '\')">' +
      '<button class="cat-toggle w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-transform" id="toggle-' + catId + '">' +
        '<svg class="w-3 h-3 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>' +
      '</button>' +
      '<span class="text-[10px] font-medium px-1.5 py-0.5 rounded ' + lc.badge + '">' + esc(category.goal_level) + '</span>' +
      '<span class="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">' + esc(category.name) + '</span>' +
      (category.owner ? '<span class="text-[10px] text-slate-500 ml-auto">' + esc(category.owner) + '</span>' : '') +
    '</div>' +
    '<div id="' + catId + '" class="category-children ml-4 space-y-2">' +
      (hasChildren ? category.children.map(function(goal) {
        return renderGoalCard(goal, pillarColor);
      }).join("") : '') +
    '</div>' +
  '</div>';
}

function renderGoalCard(goal, pillarColor) {
  var lc = levelColors[goal.goal_level] || levelColors.Goal;
  var alignments = getAlignmentsForGoal(goal.id);
  var hasAlignments = alignments.length > 0;
  var isProgram = goal.goal_level === "Program";
  var progData = isProgram ? getProgramRAG(goal.name) : null;
  var rc = progData ? ragColor(progData.rag_status) : null;

  var html = '<div class="goal-card ' + lc.bg + ' border ' + lc.border + ' rounded-lg p-3 ' +
    (isProgram ? 'ring-1 ring-emerald-500/10 ' : '') +
    'hover:border-opacity-70 transition-all" data-goal-id="' + goal.id + '" data-org-id="' + goal.org_unit_id + '" data-owner="' + esc(goal.owner || "") + '">';

  // Header row
  html += '<div class="flex items-center gap-2 mb-1">';
  html += '<span class="text-[10px] font-medium px-1.5 py-0.5 rounded ' + lc.badge + '">' + esc(goal.goal_level) + '</span>';
  if (progData) {
    html += '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ' + rc.bg + ' ' + rc.text + '">';
    html += '<span class="w-1 h-1 rounded-full ' + rc.dot + ' rag-pulse"></span>' + esc(progData.rag_status) + '</span>';
  }
  html += '<span class="ml-auto flex items-center gap-1">';
  if (hasAlignments) {
    html += '<button onclick="event.stopPropagation(); toggleAlignmentPanel(' + goal.id + ')" class="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-0.5" title="View alignments">';
    html += '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>';
    html += '<span class="bg-purple-500/20 px-1 rounded text-[9px]">' + alignments.length + '</span>';
    html += '</button>';
  }
  html += '<button onclick="event.stopPropagation(); openGoalModal(' + goal.id + ')" class="text-[10px] text-slate-500 hover:text-slate-300 ml-1" title="Expand details">';
  html += '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>';
  html += '</button>';
  html += '</span>';
  html += '</div>';

  // Goal name
  html += '<p class="text-sm font-medium text-white mb-1">' + esc(goal.name) + '</p>';

  // Metadata row
  html += '<div class="flex items-center gap-2 text-[10px] text-slate-500">';
  if (goal.owner) {
    html += '<span>' + esc(goal.owner) + '</span>';
  }
  if (goal.org_unit_name) {
    html += '<span class="text-slate-600">' + esc(goal.org_unit_name) + '</span>';
  }
  html += '</div>';

  // Progress bar for programs
  if (isProgram && progData) {
    html += '<div class="mt-2 flex items-center gap-2">';
    html += '<div class="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">';
    html += '<div class="progress-fill h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-400" style="width: 0%" data-target-width="' + (progData.percent_complete || 0) + '%"></div>';
    html += '</div>';
    html += '<span class="text-[10px] font-medium ' + (rc ? rc.text : 'text-slate-400') + '">' + (progData.percent_complete || 0) + '%</span>';
    html += '</div>';
    // Link to dashboard
    html += '<a href="demo.html?program=' + encodeURIComponent(goal.name) + '" onclick="event.stopPropagation()" class="inline-flex items-center gap-1 mt-2 text-[10px] text-purple-400 hover:text-purple-300 transition-colors">';
    html += 'Open Dashboard <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>';
    html += '</a>';
  }

  // Alignment panel placeholder
  html += '<div id="alignment-panel-' + goal.id + '" class="hidden"></div>';

  html += '</div>';

  // Render children (nested goals under categories)
  if (goal.children && goal.children.length > 0) {
    html += '<div class="ml-3 mt-2 space-y-2">';
    html += goal.children.map(function(child) {
      return renderGoalCard(child, pillarColor);
    }).join("");
    html += '</div>';
  }

  return html;
}


// ═══════════════════════════════════════════════════════════════
// ALIGNMENT PANEL
// ═══════════════════════════════════════════════════════════════

window.toggleAlignmentPanel = function(goalId) {
  var panel = document.getElementById("alignment-panel-" + goalId);
  if (!panel) return;

  if (!panel.classList.contains("hidden")) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }

  var alignments = getAlignmentsForGoal(goalId);
  if (alignments.length === 0) return;

  var html = '<div class="mt-2 p-3 bg-slate-800/40 rounded-lg border border-slate-700/30 animate-fadeIn">';
  html += '<p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Alignments</p>';

  alignments.forEach(function(a) {
    var isChild = a.child_goal_id === goalId;
    var targetId = isChild ? a.parent_goal_id : a.child_goal_id;
    var targetName = isChild ? a.parent_goal_name : a.child_goal_name;
    var strength = Number(a.alignment_strength || 0) * 100;
    var typeColor = a.alignment_type === "cross-cutting" ? "bg-amber-500/15 text-amber-400" : "bg-purple-500/15 text-purple-400";

    html += '<div class="flex items-center gap-2 py-1.5">';
    html += '<span class="text-[10px] px-1.5 py-0.5 rounded ' + typeColor + '">' + esc(a.alignment_type) + '</span>';
    html += '<span class="text-xs text-slate-300">' + esc(targetName || "Goal #" + targetId) + '</span>';
    html += '<div class="flex-1 h-1 bg-slate-700 rounded-full mx-2">';
    html += '<div class="h-full bg-amber-400 rounded-full" style="width: ' + strength + '%"></div>';
    html += '</div>';
    html += '<span class="text-[10px] text-slate-500">' + strength + '%</span>';
    html += '<button onclick="event.stopPropagation(); scrollToGoal(' + targetId + ')" class="text-[10px] text-purple-400 hover:text-purple-300">Go</button>';
    html += '</div>';
  });

  html += '</div>';
  panel.innerHTML = html;
  panel.classList.remove("hidden");
};

window.scrollToGoal = function(goalId) {
  var card = document.querySelector('[data-goal-id="' + goalId + '"]');
  if (!card) return;
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  card.classList.add("flash-highlight");
  setTimeout(function() { card.classList.remove("flash-highlight"); }, 1500);
};


// ═══════════════════════════════════════════════════════════════
// CATEGORY COLLAPSE
// ═══════════════════════════════════════════════════════════════

window.toggleCategory = function(catId) {
  var children = document.getElementById(catId);
  var toggle = document.getElementById("toggle-" + catId);
  if (!children) return;

  var isCollapsed = children.classList.contains("collapsed");
  if (isCollapsed) {
    children.classList.remove("collapsed");
    children.style.maxHeight = children.scrollHeight + "px";
    if (toggle) toggle.querySelector("svg").style.transform = "rotate(90deg)";
  } else {
    children.classList.add("collapsed");
    children.style.maxHeight = "0";
    if (toggle) toggle.querySelector("svg").style.transform = "rotate(0deg)";
  }
};


// ═══════════════════════════════════════════════════════════════
// GOAL DETAIL MODAL
// ═══════════════════════════════════════════════════════════════

window.openGoalModal = function(goalId) {
  var goal = allGoals.find(function(g) { return g.id === goalId; });
  if (!goal) return;

  var modal = document.getElementById("goal-modal");
  var content = document.getElementById("goal-modal-content");
  var isProgram = goal.goal_level === "Program";
  var progData = isProgram ? getProgramRAG(goal.name) : null;
  var rc = progData ? ragColor(progData.rag_status) : ragColor("Not Started");
  var alignments = getAlignmentsForGoal(goalId);
  var lc = levelColors[goal.goal_level] || levelColors.Goal;

  var html = '';

  // Close button
  html += '<div class="flex items-center justify-between mb-6">';
  html += '<div class="flex items-center gap-3">';
  html += '<span class="text-[10px] font-medium px-1.5 py-0.5 rounded ' + lc.badge + '">' + esc(goal.goal_level) + '</span>';
  html += '<h2 class="text-lg font-bold text-white">' + esc(goal.name) + '</h2>';
  if (progData) {
    html += '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ' + rc.bg + ' ' + rc.text + '">';
    html += '<span class="w-1.5 h-1.5 rounded-full ' + rc.dot + ' rag-pulse"></span>' + esc(progData.rag_status) + '</span>';
  }
  html += '</div>';
  html += '<button onclick="closeGoalModal()" class="text-slate-400 hover:text-white text-xl leading-none">&times;</button>';
  html += '</div>';

  // Description
  if (goal.description) {
    html += '<p class="text-sm text-slate-400 mb-4 leading-relaxed">' + esc(goal.description) + '</p>';
  }

  // Metadata
  html += '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">';
  if (goal.owner) {
    html += '<div class="bg-slate-800/40 rounded-lg p-3 border border-slate-700/20">';
    html += '<p class="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Owner</p>';
    html += '<p class="text-sm text-white">' + esc(goal.owner) + '</p>';
    html += '</div>';
  }
  if (goal.org_unit_name) {
    html += '<div class="bg-slate-800/40 rounded-lg p-3 border border-slate-700/20">';
    html += '<p class="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Org Unit</p>';
    html += '<p class="text-sm text-white">' + esc(goal.org_unit_name) + '</p>';
    html += '</div>';
  }
  if (goal.weight) {
    html += '<div class="bg-slate-800/40 rounded-lg p-3 border border-slate-700/20">';
    html += '<p class="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Weight</p>';
    html += '<p class="text-sm text-white">' + goal.weight + '</p>';
    html += '</div>';
  }
  if (isProgram && progData) {
    html += '<div class="bg-slate-800/40 rounded-lg p-3 border border-slate-700/20">';
    html += '<p class="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Progress</p>';
    html += '<div class="flex items-center gap-2">';
    html += '<div class="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">';
    html += '<div class="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-400" style="width: ' + (progData.percent_complete || 0) + '%"></div>';
    html += '</div>';
    html += '<span class="text-sm font-medium ' + rc.text + '">' + (progData.percent_complete || 0) + '%</span>';
    html += '</div>';
    html += '</div>';
  }
  html += '</div>';

  // Alignments
  if (alignments.length > 0) {
    html += '<div class="mb-6">';
    html += '<p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3">Alignments</p>';
    html += '<div class="space-y-2">';
    alignments.forEach(function(a) {
      var isChild = a.child_goal_id === goalId;
      var targetName = isChild ? a.parent_goal_name : a.child_goal_name;
      var strength = Number(a.alignment_strength || 0) * 100;
      var typeColor = a.alignment_type === "cross-cutting" ? "bg-amber-500/15 text-amber-400" : "bg-purple-500/15 text-purple-400";
      html += '<div class="flex items-center gap-3 bg-slate-800/30 rounded-lg p-2 border border-slate-700/20">';
      html += '<span class="text-[10px] px-1.5 py-0.5 rounded ' + typeColor + '">' + esc(a.alignment_type) + '</span>';
      html += '<span class="text-xs text-slate-300 flex-1">' + esc(targetName) + '</span>';
      html += '<div class="w-24 h-1.5 bg-slate-700 rounded-full">';
      html += '<div class="h-full bg-amber-400 rounded-full" style="width: ' + strength + '%"></div>';
      html += '</div>';
      html += '<span class="text-[10px] text-slate-500">' + strength + '%</span>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
  }

  // Program-specific: Quarterly objectives + Context graph
  if (isProgram) {
    html += '<div id="modal-program-detail" class="space-y-6">';
    html += '<div class="text-center py-4"><p class="text-sm text-slate-500">Loading program details...</p></div>';
    html += '</div>';

    // Dashboard link
    html += '<div class="mt-6 pt-4 border-t border-slate-800">';
    html += '<a href="demo.html?program=' + encodeURIComponent(goal.name) + '" class="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/15 border border-purple-500/30 rounded-lg text-sm text-purple-400 hover:bg-purple-500/25 hover:text-purple-300 transition-all">';
    html += 'Open Dashboard <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>';
    html += '</a>';
    html += '</div>';
  }

  content.innerHTML = html;
  modal.classList.remove("hidden");

  // Load program detail if applicable
  if (isProgram) {
    loadProgramDetail(goal);
  }
};

window.closeGoalModal = function() {
  document.getElementById("goal-modal").classList.add("hidden");
};

// Close on Escape key
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") closeGoalModal();
});

async function loadProgramDetail(goal) {
  var detailEl = document.getElementById("modal-program-detail");
  if (!detailEl) return;

  try {
    // Load scorecard for quarterly objectives
    var scorecardRes = await apiFetch("/scorecard");
    var programs = scorecardRes.data || [];
    var program = programs.find(function(p) { return p.program_name === goal.name; });

    var html = '';

    // Quarterly objectives
    if (program && program.objectives) {
      html += '<div>';
      html += '<p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3">Quarterly Objectives</p>';
      var quarters = ["Q1", "Q2", "Q3", "Q4"];
      html += '<div class="divide-y divide-slate-800/60">';
      quarters.forEach(function(q) {
        var obj = program.objectives[q];
        if (!obj) {
          html += '<div class="flex items-center gap-2 py-2 text-xs">';
          html += '<span class="w-7 font-medium text-slate-500">' + q + '</span>';
          html += '<span class="text-slate-600 italic">--</span>';
          html += '</div>';
          return;
        }
        html += '<div class="py-2 text-xs">';
        html += '<div class="flex items-start gap-2">';
        html += '<span class="w-7 font-semibold text-slate-300 flex-shrink-0">' + q + '</span>';
        html += '<div class="flex-1">';
        html += '<p class="text-slate-300 leading-relaxed">' + esc(obj.objective_text) + '</p>';
        if (obj.target_value) {
          html += '<p class="text-[10px] text-slate-500 mt-0.5">Target: ' + esc(obj.target_value) + ' ' + esc(obj.target_unit || '') + '</p>';
        }
        html += '</div>';
        if (obj.status) {
          html += '<span class="text-[10px] text-slate-500">' + esc(obj.status) + '</span>';
        }
        html += '</div>';
        html += '</div>';
      });
      html += '</div>';
      html += '</div>';
    }

    // Context graph (progress history)
    try {
      var progId = programs.find(function(p) { return p.program_name === goal.name; });
      if (progId) {
        var progressRes = await apiFetch("/progress/" + progId.program_id);
        var updates = progressRes.data.updates || [];
        if (updates.length > 0) {
          html += renderContextGraph(updates);
        }
      }
    } catch (e) {
      // Progress history not critical
    }

    detailEl.innerHTML = html || '<p class="text-sm text-slate-500">No additional details available.</p>';
  } catch (err) {
    detailEl.innerHTML = '<p class="text-sm text-red-400">Failed to load program details: ' + esc(err.message) + '</p>';
  }
}


// ═══════════════════════════════════════════════════════════════
// CONTEXT GRAPH (Timeline in modal)
// ═══════════════════════════════════════════════════════════════

function renderContextGraph(progressUpdates) {
  var events = [];

  progressUpdates.forEach(function(update) {
    events.push({
      type: "progress",
      timestamp: update.created_at,
      title: "v" + update.version + " -- " + (update.rag_status || ""),
      detail: update.update_text,
      author: update.author,
      percent: Number(update.percent_complete || 0),
      rag: update.rag_status
    });

    var decisions = (update.metrics && update.metrics.decisions) || [];
    decisions.forEach(function(d) {
      events.push({
        type: "decision",
        timestamp: d.timestamp || update.created_at,
        title: d.title,
        detail: d.rationale,
        impact: d.impact,
        author: d.decided_by
      });
    });
  });

  events.sort(function(a, b) { return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(); });

  if (events.length === 0) return '';

  var html = '<div>';
  html += '<p class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3">Context Timeline</p>';
  html += '<div class="relative ml-3">';
  html += '<div class="absolute left-0 top-0 bottom-0 w-px bg-slate-800"></div>';

  events.forEach(function(e) {
    var isDecision = e.type === "decision";
    var dotColor = isDecision ? "bg-amber-400" : "bg-emerald-400";
    var rc = isDecision ? null : ragColor(e.rag);

    html += '<div class="relative pl-6 pb-4">';
    html += '<div class="absolute left-[-4px] top-1.5 w-2.5 h-2.5 rounded-full ' + dotColor + ' border-2 border-slate-900"></div>';

    if (isDecision) {
      html += '<div class="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">';
      html += '<div class="flex items-center gap-2 mb-1">';
      html += '<svg class="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>';
      html += '<span class="text-[10px] font-medium text-amber-400">Decision</span>';
      html += '<span class="text-[10px] text-slate-500 ml-auto">' + (e.author ? esc(e.author) : '') + '</span>';
      html += '</div>';
      html += '<p class="text-xs font-medium text-white mb-1">' + esc(e.title) + '</p>';
      if (e.detail) html += '<p class="text-[11px] text-slate-400">' + esc(e.detail) + '</p>';
      if (e.impact) html += '<p class="text-[10px] text-amber-400/70 mt-1">Impact: ' + esc(e.impact) + '</p>';
      html += '</div>';
    } else {
      html += '<div class="bg-slate-800/30 rounded-lg p-3 border border-slate-700/20">';
      html += '<div class="flex items-center gap-2 mb-1">';
      html += '<span class="text-[10px] font-medium text-emerald-400">' + esc(e.title) + '</span>';
      if (rc) {
        html += '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] ' + rc.bg + ' ' + rc.text + '">' + esc(e.rag) + '</span>';
      }
      html += '<span class="text-[10px] text-slate-600 ml-auto">' + timeAgo(e.timestamp) + '</span>';
      html += '</div>';
      if (e.detail) html += '<p class="text-[11px] text-slate-400 leading-relaxed">' + esc(e.detail) + '</p>';
      if (e.author) html += '<p class="text-[10px] text-slate-500 mt-1">-- ' + esc(e.author) + '</p>';
      if (e.percent > 0) {
        html += '<div class="mt-2 flex items-center gap-2">';
        html += '<div class="flex-1 h-1 bg-slate-700 rounded-full">';
        html += '<div class="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full" style="width: ' + e.percent + '%"></div>';
        html += '</div>';
        html += '<span class="text-[10px] text-slate-500">' + e.percent + '%</span>';
        html += '</div>';
      }
      html += '</div>';
    }

    html += '</div>';
  });

  html += '</div>';
  html += '</div>';
  return html;
}


// ═══════════════════════════════════════════════════════════════
// RAG SUMMARY + HEADER
// ═══════════════════════════════════════════════════════════════

function updateRAGSummary(summary) {
  var ragEl = document.getElementById("rag-summary");
  if (!summary || !summary.totals) {
    ragEl.innerHTML = "";
    return;
  }
  var t = summary.totals;
  var pills = [];
  if (t.green > 0) pills.push('<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Green ' + t.green + '</span>');
  if (t.amber > 0) pills.push('<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-400"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Amber ' + t.amber + '</span>');
  if (t.red > 0) pills.push('<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/15 text-red-400"><span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>Red ' + t.red + '</span>');
  if (t.not_started > 0) pills.push('<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-500/15 text-slate-400"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Not Started ' + t.not_started + '</span>');
  ragEl.innerHTML = pills.join("");
}

function updateHeaderRAG(summary) {
  var headerRag = document.getElementById("header-rag");
  if (!summary || !summary.pillars || summary.pillars.length === 0) return;

  // Overall RAG: worst-wins across all pillars
  var ragPriority = { Red: 5, Amber: 4, "Not Started": 3, Green: 2, Complete: 1 };
  var worstRag = "Complete";
  var worstP = 0;
  summary.pillars.forEach(function(p) {
    var pr = ragPriority[p.overall_rag] || 0;
    if (pr > worstP) { worstP = pr; worstRag = p.overall_rag; }
  });

  var rc = ragColor(worstRag);
  headerRag.innerHTML = '<span class="w-1.5 h-1.5 rounded-full ' + rc.dot + ' rag-pulse"></span><span>' + esc(worstRag.replace("_", " ")) + '</span>';
  headerRag.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium " + rc.bg + " " + rc.text;
}


// ═══════════════════════════════════════════════════════════════
// PANEL REVEAL
// ═══════════════════════════════════════════════════════════════

function setupRevealAnimations() {
  var panels = document.querySelectorAll(".panel-reveal");
  var revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
      }
    });
  }, { threshold: 0.05 });
  panels.forEach(function(p) { revealObserver.observe(p); });

  // Animate progress bars after a short delay
  setTimeout(function() {
    document.querySelectorAll(".progress-fill[data-target-width]").forEach(function(bar) {
      bar.style.width = bar.dataset.targetWidth;
    });
  }, 400);
}


// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

async function init() {
  try {
    // 1. Fetch org tree
    var orgRes = await apiFetch("/org-tree");
    orgTree = orgRes.data;
    orgFlat = flattenOrg(orgTree);
    var enterprise = orgFlat.find(function(n) { return n.name === "Vantage Biopharma"; }) || orgTree[0];

    if (!enterprise) {
      document.getElementById("pillars-grid").innerHTML = '<p class="text-sm text-red-400 col-span-3 text-center py-8">No enterprise org found</p>';
      return;
    }

    // 2. Fetch goal tree for the enterprise
    var goalRes = await apiFetch("/goal-tree/" + enterprise.id);
    goalTree = goalRes.data.goals || [];
    allAlignments = goalRes.data.alignments || [];

    // 3. Flatten goals for filtering
    allGoals = flattenGoals(goalTree);

    // 4. Fetch scorecard summary for RAG data
    var summaryRes = await apiFetch("/scorecard/summary");
    summaryData = summaryRes.data;

    // 5. Render the three-column pillar layout (each pillar is a top-level goal)
    renderPillars(goalTree, summaryData);

    // 6. Update header RAG
    updateHeaderRAG(summaryData);

    // 7. RAG summary pills
    updateRAGSummary(summaryData);

  } catch (err) {
    document.getElementById("pillars-grid").innerHTML = '<div class="col-span-3">' +
      '<div class="flex items-center gap-3 text-red-400 text-sm py-4">' +
      '<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>' +
      '</svg>' +
      '<span>Could not load goal overview: ' + esc(err.message) + '</span>' +
      '<button onclick="location.reload()" class="ml-auto text-xs text-purple-400 hover:text-purple-300 underline">Retry</button>' +
      '</div></div>';
  }
}

document.addEventListener("DOMContentLoaded", init);
