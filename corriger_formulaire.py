fichier = "admin_add_opp.html"

with open(fichier, "r", encoding="utf-8") as f:
    contenu = f.read()

with open(fichier + ".bak", "w", encoding="utf-8") as f:
    f.write(contenu)

ancre_form = '<input type="url" id="lien_officiel" placeholder="Lien officiel" required>'
ajout_form = ancre_form + '''
        <input type="url" id="source_url" placeholder="URL de la source officielle (obligatoire)" required>
        <input type="text" id="source_titre" placeholder="Titre de la source (optionnel)">'''

if ancre_form not in contenu:
    print("❌ Ancre formulaire introuvable. Rien modifié.")
    exit()

contenu = contenu.replace(ancre_form, ajout_form)

debut_marqueur = "const SUPABASE_URL"
fin_marqueur = "</script>"
i_debut = contenu.find(debut_marqueur)
i_fin = contenu.find(fin_marqueur, i_debut)

if i_debut == -1 or i_fin == -1:
    print("❌ Bloc script introuvable. Rien modifié après l'étape formulaire.")
    exit()

nouveau_script = '''const SUPABASE_URL = 'https://tvikvysdfbrcwmnnlgwp.supabase.co';
        const SUPABASE_KEY = 'sb_publishable_xp-8aSpz3R7vRZ0aYp5hVw_7-UHoQXy';
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        document.getElementById('oppForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const nomOrganisme = document.getElementById('organisme').value;
            let organismeId;

            const { data: existant } = await supabaseClient
                .from('organismes')
                .select('id')
                .eq('nom', nomOrganisme)
                .maybeSingle();

            if (existant) {
                organismeId = existant.id;
            } else {
                const { data: nouveau, error: orgError } = await supabaseClient
                    .from('organismes')
                    .insert([{ nom: nomOrganisme }])
                    .select()
                    .single();
                if (orgError) { alert('Erreur organisme : ' + orgError.message); return; }
                organismeId = nouveau.id;
            }

            const dataOpp = {
                titre: document.getElementById('titre').value,
                categorie: document.getElementById('categorie').value,
                organisme_id: organismeId,
                pays: document.getElementById('pays').value,
                date_limite: document.getElementById('date_limite').value || null,
                conditions: document.getElementById('description').value,
                lien_officiel: document.getElementById('lien_officiel').value
            };

            const { data: opp, error } = await supabaseClient
                .from('opportunites')
                .insert([dataOpp])
                .select()
                .single();

            if (error) {
                alert('Erreur : ' + error.message);
                return;
            }

            const { error: sourceError } = await supabaseClient
                .from('sources')
                .insert([{
                    opportunite_id: opp.id,
                    url: document.getElementById('source_url').value,
                    titre: document.getElementById('source_titre').value || null
                }]);

            if (sourceError) {
                alert("Opportunité créée, mais erreur source : " + sourceError.message);
                return;
            }

            alert('✅ Opportunité et source enregistrées avec succès !');
            document.getElementById('oppForm').reset();
        });
    '''

contenu = contenu[:i_debut] + nouveau_script + contenu[i_fin:]

with open(fichier, "w", encoding="utf-8") as f:
    f.write(contenu)

print("✅ Fichier corrigé avec succès.")
print("✅ Sauvegarde disponible : admin_add_opp.html.bak")
