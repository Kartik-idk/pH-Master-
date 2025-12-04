// -----------------------------
// UTILITY FUNCTIONS
// -----------------------------
function log10(x) {
    return Math.log(x) / Math.log(10);
}
function round(num) {
    return Math.round(num * 10000) / 10000;
}

// -----------------------------
// ACID/BASE DATABASE
// -----------------------------
const substances = {
    strong_acids: {
        "HCl": { type: "strong-acid" },
        "HNO3": { type: "strong-acid" },
        "H2SO4": { type: "strong-acid-diprotic" }
    },
    weak_acids: {
        "CH3COOH (Acetic Acid)": { type: "weak-acid", Ka: 1.8e-5 },
        "H2CO3 (Carbonic Acid)": { type: "weak-acid", Ka: 4.3e-7 },
        "HCOOH (Formic Acid)": { type: "weak-acid", Ka: 1.7e-4 }
    },
    strong_bases: {
        "NaOH": { type: "strong-base" },
        "KOH": { type: "strong-base" },
        "Ca(OH)2": { type: "strong-base-diprotic" }
    },
    weak_bases: {
        "NH3 (Ammonia)": { type: "weak-base", Kb: 1.8e-5 },
        "Pyridine": { type: "weak-base", Kb: 1.7e-9 }
    }
};

// -----------------------------
// POPULATE PRESET DROPDOWN
// -----------------------------
const preset = document.getElementById("preset");
if (preset) {
    Object.keys(substances).forEach(group => {
        const opt = document.createElement("optgroup");
        opt.label = group.replace("_", " ").toUpperCase();
        Object.keys(substances[group]).forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            opt.appendChild(option);
        });
        preset.appendChild(opt);
    });
}

// -----------------------------
// THEME TOGGLE
// -----------------------------
const themeBtn = document.getElementById("theme-toggle");

// Load saved theme
function loadTheme() {
    const theme = localStorage.getItem("theme") || "light";
    if (theme === "dark") {
        document.body.classList.add("dark");
        if (themeBtn) themeBtn.textContent = "☀️";
    } else {
        document.body.classList.remove("dark");
        if (themeBtn) themeBtn.textContent = "🌙";
    }
}
loadTheme();

if (themeBtn) {
    themeBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        const isDark = document.body.classList.contains("dark");
        localStorage.setItem("theme", isDark ? "dark" : "light");
        themeBtn.textContent = isDark ? "☀️" : "🌙";
    });
}

// -----------------------------
// PRESET CHANGE → AUTO SET TYPE
// -----------------------------
function onPresetChange() {
    const val = preset.value;
    if (val === "manual") return;

    const obj =
        substances.strong_acids[val] ||
        substances.weak_acids[val] ||
        substances.strong_bases[val] ||
        substances.weak_bases[val];

    const typeSelect = document.getElementById("type");
    if (typeSelect) {
        typeSelect.value = obj.type;
        renderInputs();
    }
}

// -----------------------------
// RENDER INPUTS BASED ON TYPE
// -----------------------------
function renderInputs() {
    const typeSelect = document.getElementById("type");
    const container = document.getElementById("inputs");
    if (!typeSelect || !container) return;

    const type = typeSelect.value;
    if (!type) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = `
        <div class="form-row">
            <label>Concentration (M)</label>
            <input type="number" id="concentration" min="0" step="0.0001">
        </div>
    `;
}

// -----------------------------
// CALCULATE PH
// -----------------------------
function calculate() {
    const typeSelect = document.getElementById("type");
    const concInput = document.getElementById("concentration");
    const val = preset ? preset.value : "manual";

    if (!typeSelect || !concInput) return;

    const type = typeSelect.value;
    const conc = parseFloat(concInput.value);

    if (!type || !conc) {
        alert("Please choose a type and enter concentration.");
        return;
    }

    let data = {};
    if (val !== "manual") {
        data =
            substances.strong_acids[val] ||
            substances.weak_acids[val] ||
            substances.strong_bases[val] ||
            substances.weak_bases[val];
    } else {
        data.type = type;
    }

    let pH = 7, steps = "", category = "";

    switch(data.type) {
        case "strong-acid":
            pH = -log10(conc);
            steps = `Strong Acid\n[H⁺] = ${conc}\npH = ${round(pH)}`;
            category = "Strong Acid";
            break;
        case "strong-acid-diprotic":
            pH = -log10(conc*2);
            steps = `Diprotic Strong Acid\n[H⁺] = 2×${conc}\npH = ${round(pH)}`;
            category = "Strong Acid (Diprotic)";
            break;
        case "weak-acid":
            pH = -log10(Math.sqrt(data.Ka*conc));
            steps = `Weak Acid\nKa = ${data.Ka}\n[H⁺] = √(Ka×C)\npH = ${round(pH)}`;
            category = "Weak Acid";
            break;
        case "strong-base":
            pH = 14 + log10(conc);
            steps = `Strong Base\n[OH⁻] = ${conc}\npH = ${round(pH)}`;
            category = "Strong Base";
            break;
        case "strong-base-diprotic":
            pH = 14 + log10(conc*2);
            steps = `Diprotic Strong Base\n[OH⁻] = 2×${conc}\npH = ${round(pH)}`;
            category = "Strong Base (Diprotic)";
            break;
        case "weak-base":
            const OH = Math.sqrt(data.Kb*conc);
            pH = 14 + log10(OH);
            steps = `Weak Base\nKb = ${data.Kb}\npH = ${round(pH)}`;
            category = "Weak Base";
            break;
    }

    pH = round(pH);

    const resultCard = document.getElementById("resultCard");
    if (resultCard) resultCard.classList.remove("hidden");
    const pHvalue = document.getElementById("pHvalue");
    if (pHvalue) pHvalue.textContent = `pH ${pH}`;
    const categoryEl = document.getElementById("category");
    if (categoryEl) categoryEl.textContent = category;
    const stepsEl = document.getElementById("steps");
    if (stepsEl) stepsEl.textContent = steps;
    updateScale(pH);
    addHistory(val, conc, pH);
}

// -----------------------------
// PH SCALE MARKER
// -----------------------------
function updateScale(pH) {
    const marker = document.getElementById("marker");
    if (!marker) return;
    const percent = (pH/14)*100;
    marker.style.left = percent + "%";
}

// -----------------------------
// HISTORY SYSTEM
// -----------------------------
function addHistory(name, conc, pH) {
    let history = JSON.parse(localStorage.getItem("ph_history")) || [];
    history.push({ name, conc, pH, time: new Date().toLocaleString() });
    localStorage.setItem("ph_history", JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    const list = document.getElementById("historyList");
    if (!list) return;
    let history = JSON.parse(localStorage.getItem("ph_history")) || [];
    list.innerHTML = "";
    history.slice().reverse().forEach(h => {
        const li = document.createElement("li");
        li.textContent = `${h.name}: ${h.conc} M → pH ${h.pH}`;
        list.appendChild(li);
    });
}
function clearHistory() {
    localStorage.removeItem("ph_history");
    loadHistory();
}

window.onload = loadHistory;

// -----------------------------
// SHOW / HIDE STEPS
// -----------------------------
function toggleSteps() {
    const s = document.getElementById("steps");
    if (s) s.classList.toggle("hidden");
}