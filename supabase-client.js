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
  const nomOrganisme = opp.organismes?.nom || "Organisme non précisé";
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
