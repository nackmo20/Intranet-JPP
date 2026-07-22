# Rapport de tests — Studio Intranet EAFC v2

Date : 2026-07-20

## Résultat

19/19 tests automatisés passent sur la base modulaire du Studio v2, incluant les parcours Sofia-FMO, demandes éditoriales, taxonomies et non-contamination.

## Couverture minimale demandée

| Domaine | Test automatisé | Statut |
|---|---|---|
| Imports | Détection `create_pages` legacy et import CSV aliasé | OK |
| Excel | Diagnostic XLSX structurel, non-modification de l'original | OK — le classeur réel reste absent |
| Binaires non pris en charge | PDF/DOC/images ignorés sans bloquer l'extraction | OK |
| Cellules fusionnées | Couvert par exigence d'adaptateur/diagnostic, fixture réelle à ajouter dès réception du classeur | Partiel |
| Titres départementaux | Préfixes 16/17/79/86, bi-départementaux, zéros initiaux ignorés pour comparaison | OK |
| Mappings | Priorité Node ID avant titre | OK |
| Différences | Cellule vide = ignore | OK |
| Taxonomies | `add` conserve les valeurs existantes | OK |
| Suppressions explicites | Marqueur `__DELETE__` requis | OK |
| Lignes retirées | Cible retirée absente du Job JSON | OK |
| Absence d'objets vides | Aucune cible sans opération exportée | OK |
| Payloads | Job v2 généré avec `inventoryUpdate` | OK |
| Sauvegarde/restauration | Export/import workspace round-trip | OK |
| Mise à jour recensement | Métadonnées `inventoryUpdate` présentes ; export CSV versionné dans l'UI | OK fonctionnel minimal |

## Limites connues

- Le classeur Excel obligatoire de suivi n'est toujours pas présent dans le dépôt ; la conservation réelle des cellules fusionnées, formules et formats doit être validée sur le fichier réel.
- Les interactions Drupal réelles seront vérifiées à l'étape Agent Drupal v2 ; le Studio produit un Job résolu et ne clique pas dans Drupal.

## Ajouts 2.0.0-beta.1

- Test intégration Sofia-FMO : recensement + plan sessions, matching dispositif/module/groupe/RNE, places restantes, Job sans champ éditorial.
- Test intégration demandes éditoriales : recensement + demandes, champs éditoriaux uniquement, cellules vides ignorées, ligne retirée absente du Job.
- Test intégration taxonomies : sélection par Node ID, add thématique/public, export uniquement des nouvelles valeurs.
- Test non-contamination entre workflows : chaque source ne génère que les champs autorisés et chaque cible possède un Node ID.

- Test binaire non pris en charge : un PDF est marqué `unsupported_binary` / `skipped` sans erreur bloquante.
