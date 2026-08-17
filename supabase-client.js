/* =========================================================
   CLIENT SUPABASE PARTAGÉ — RDC Jeunes Opportunités
   Nécessite : config.js chargé avant ce fichier,
   et la librairie CDN @supabase/supabase-js chargée avant les deux.
   ========================================================= */

const rjoClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LABELS_CATEGORIE = {
  emploi: "Emploi",
  stage: "Stage",
  bourse: "Bourse",
  formation: "Formation",
  concours: "Concours",
  entrepreneuriat: "Entrepreneuriat",
  financement: "Financement",
  programme_international: "Programme international",
};

function formaterDate(dateStr) {
  if (!dateStr) return "Non précisée";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Récupère les opportunités vérifiées, avec filtres optionnels.
 * filtres = { categorie, pays, recherche, limite }
 */
async function recupererOpportunitesVerifiees(filtres = {}) {
  let requete = rjoClient
    .from("opportunites")
    .select("id, titre, categorie, pays, date_limite, image_url, organismes(nom)")
    .eq("statut", "verifiee")
    .order("date_publication", { ascending: false });

  if (filtres.categorie) {
    requete = requete.eq("categorie", filtres.categorie);
  }
  if (filtres.pays) {
    requete = requete.ilike("pays", `%${filtres.pays}%`);
  }
  if (filtres.recherche) {
    requete = requete.ilike("titre", `%${filtres.recherche}%`);
  }
  if (filtres.limite) {
    requete = requete.limit(filtres.limite);
  }

  const { data, error } = await requete;
  if (error) {
    console.error("Erreur Supabase (opportunités) :", error);
    return [];
  }
  return data;
}

/**
 * Construit le HTML d'une carte opportunité.
 */
function carteOpportuniteHTML(opp) {
  const organismeData = Array.isArray(opp.organismes) ? opp.organismes[0] : opp.organismes;
  const nomOrganisme = organismeData?.nom || "Organisme non précisé";
  const paysAffiche = opp.pays || "—";
  return `
    <a class="carte-opportunite" href="opportunite.html?id=${opp.id}" style="text-decoration:none;">
      <span class="tampon-verifie"><span>RJO<br>Vérifié</span></span>
      <span class="badge-categorie">${LABELS_CATEGORIE[opp.categorie] || opp.categorie}</span>
      <h3>${opp.titre}</h3>
      <div class="organisme">${nomOrganisme} · ${paysAffiche}</div>
      <div class="meta-ligne">
        <span>Date limite</span>
        <span>${formaterDate(opp.date_limite)}</span>
      </div>
    </a>
  `;
}

function basculerMenuMobile() {
  const nav = document.getElementById("nav-mobile");
  if (nav) nav.classList.toggle("ouvert");
}

/* -------- AUTHENTIFICATION -------- */

async function inscrire(email, motDePasse, nomComplet) {
  return await rjoClient.auth.signUp({
    email,
    password: motDePasse,
    options: {
      data: {
        nom_complet: nomComplet
      },
      emailRedirectTo: "https://angekalenga-ai.github.io/rdc-jeunes-opportunites/compte.html"
    }
  });
}

async function connecter(email, motDePasse) {
  return await rjoClient.auth.signInWithPassword({ email, password: motDePasse });
}

async function deconnecter() {
  return await rjoClient.auth.signOut();
}

async function recupererSessionActuelle() {
  const { data } = await rjoClient.auth.getSession();
  return data.session;
}

async function recupererProfil(userId) {
  const { data, error } = await rjoClient
    .from("profiles")
    .select("nom_complet, role")
    .eq("id", userId)
    .single();
  if (error) {
    console.error("Erreur récupération profil :", error);
    return null;
  }
  return data;
}

function traduireErreurAuth(message) {
  const table = {
    "Invalid login credentials": "Email ou mot de passe incorrect.",
    "User already registered": "Un compte existe déjà avec cet email.",
    "Password should be at least 6 characters": "Le mot de passe doit contenir au moins 6 caractères.",
    "Email not confirmed": "Confirme ton email avant de te connecter (vérifie ta boîte mail).",
  };
  return table[message] || "Une erreur est survenue. Réessaie dans un instant.";
}
