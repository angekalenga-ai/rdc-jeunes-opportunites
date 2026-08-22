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
    throw error;
  }

  return data || [];
}}

/**
 * Construit le HTML d'une carte opportunité.
 */
function carteOpportuniteHTML(opp) {
  const organismeData = Array.isArray(opp.organismes)
    ? opp.organismes[0]
    : opp.organismes;

  const nomOrganisme =
    organismeData?.nom || "Organisme non précisé";

  const paysAffiche = opp.pays || "RDC";

  const imageAffichee =
    opp.image_url ||
    "images/placeholder-opportunite.jpg";

  const categorie =
    LABELS_CATEGORIE[opp.categorie] ||
    opp.categorie ||
    "Opportunité";

  return `
    <a
      class="carte-opportunite"
      href="opportunite.html?id=${opp.id}"
    >

      <div class="carte-opportunite-image">
        <img
          src="${imageAffichee}"
          alt="${opp.titre}"
          loading="lazy"
          onerror="this.src='images/placeholder-opportunite.jpg'"
        >
      </div>

      <div class="carte-opportunite-contenu">

        <div class="carte-opportunite-badges">
          <span class="tampon-verifie">
            ✓ RJO Vérifié
          </span>

          <span class="badge-categorie">
            ${categorie}
          </span>
        </div>

        <h3>${opp.titre}</h3>

        <div class="organisme">
          ${nomOrganisme}
        </div>

        <div class="opp-infos">
          <span>📍 ${paysAffiche}</span>
          <span>📅 ${formaterDate(opp.date_limite)}</span>
        </div>

        <span class="opp-bouton">
          Voir l'opportunité →
        </span>

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
      data: { nom_complet: nomComplet },
      emailRedirectTo: "https://angekalenga-ai.github.io/rdc-jeunes-opportunites/compte.html",
    },
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

/* -------- BACK-OFFICE -------- */

/**
 * Vérifie que l'utilisateur est connecté ET a un rôle autorisé.
 * Redirige vers login.html sinon. À appeler en haut de chaque page admin.
 */
async function verifierAccesAdmin(rolesAutorises = ["super_admin", "admin"]) {
  const session = await recupererSessionActuelle();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  const profil = await recupererProfil(session.user.id);
  if (!profil || !rolesAutorises.includes(profil.role)) {
    await deconnecter();
    window.location.href = "login.html";
    return null;
  }
  return profil;
}

/**
 * Retrouve un organisme par son nom (insensible à la casse), ou le crée s'il n'existe pas.
 * Retourne l'id de l'organisme.
 */
async function trouverOuCreerOrganisme(nom) {
  const nomPropre = nom.trim();
  const { data: existant, error: erreurRecherche } = await rjoClient
    .from("organismes")
    .select("id")
    .ilike("nom", nomPropre)
    .limit(1)
    .maybeSingle();

  if (erreurRecherche) throw erreurRecherche;
  if (existant) return existant.id;

  const { data: nouveau, error: erreurCreation } = await rjoClient
    .from("organismes")
    .insert({ nom: nomPropre })
    .select("id")
    .single();

  if (erreurCreation) throw erreurCreation;
  return nouveau.id;
}
