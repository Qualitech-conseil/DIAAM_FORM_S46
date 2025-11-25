// URL et clé Supabase (à remplir)
const SUPABASE_URL = "https://vawvmiosgslvykfqxffs.supabase.co";
const SUPABASE_ANON = "sb_publishable_A59tt4-xaFE_at6NLXprqA_oz3Xushc";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

const urlParams = new URLSearchParams(window.location.search);
const clientId = urlParams.get("client");

if (!clientId) {
    document.getElementById("app").innerHTML =
        "<p>Aucun client spécifié. Ajoutez ?client=xxx dans l'URL.</p>";
}

async function loadConfig() {
    const response = await fetch(`clients/${clientId}/config.json`);

    if (!response.ok) {
        document.getElementById("app").innerHTML =
            "<p>Impossible de charger la configuration du client.</p>";
        return;
    }

    const config = await response.json();

    // Logo + titre
    document.getElementById("client-logo").src = config.logo || "";
    document.getElementById("form-title").innerText =
        config.title || "Sondage";

    const form = document.getElementById("survey-form");
    form.innerHTML = "";

    // Couleur thème
    if (config.color) {
        document.documentElement.style.setProperty("--theme-color", config.color);
    }

    config.categories.forEach((cat) => {
        const block = document.createElement("div");
        block.className = "category-block";

        const q = document.createElement("h3");
        q.innerText = cat.question;
        block.appendChild(q);

        // Options
        cat.options.forEach((opt) => {
            const line = document.createElement("label");
            line.className = "option-line";
            line.innerHTML = `
                <input type="radio" name="${cat.id}" value="${opt}" />
                <span>${opt}</span>
            `;
            block.appendChild(line);
        });

        // Option Autre
        const other = document.createElement("div");
        other.className = "option-line";
        other.innerHTML = `
            <input type="radio" name="${cat.id}" value="Autre" />
            <span>Autre</span>
            <input type="text" id="other-${cat.id}" placeholder="Précisez"
                class="other-input" />
        `;
        block.appendChild(other);

        form.appendChild(block);
    });

    document.getElementById("submit-btn").style.display = "block";
}

async function submitForm() {
    const form = document.getElementById("survey-form");
    const status = document.getElementById("status");
    status.innerHTML = "";

    const formData = new FormData(form);
    const entries = [];

    for (let [key, value] of formData.entries()) {
        let other = null;
        if (value === "Autre") {
            other = document.getElementById(`other-${key}`).value;
        }

        entries.push({ key, value, other });
    }

    for (let e of entries) {
        await supabaseClient.from("responses").insert({
            client: clientId,
            category_id: e.key,
            question: document.querySelector(
                `input[name='${e.key}']`
            ).closest(".category-block").querySelector("h3").innerText,
            choice: e.value,
            other_value: e.other,
        });
    }

    status.innerHTML = "Merci, vos réponses ont été enregistrées.";
    document.getElementById("submit-btn").disabled = true;
}

// Événements
document
    .getElementById("submit-btn")
    .addEventListener("click", submitForm);

loadConfig();
