fichier = "admin_add_opp.html"
ancre = "REMPLACE_PAR_LA_LIGNE_EXACTE_TROUVEE_A_L_ETAPE_1"

with open(fichier, "r", encoding="utf-8") as f:
    contenu = f.read()

if ancre not in contenu:
    print("❌ Ancre introuvable. Aucune modification faite. Vérifie l'étape 1.")
else:
    with open(fichier + ".bak", "w", encoding="utf-8") as f:
        f.write(contenu)
    print("✅ Sauvegarde créée :", fichier + ".bak")
    print("Ancre trouvée. Envoie-moi la ligne exacte pour que je te donne le script final complet.")
