# Agent Drupal EAFC v2 — documentation technique et utilisateur

## Installation
1. Conserver les anciens scripts Tampermonkey installés mais désactivables comme solution de secours.
2. Installer `dist/agent-drupal-eafc-v2.user.js` dans Tampermonkey.
3. Ouvrir l'intranet Drupal; le panneau compact apparaît en haut à droite.

## Utilisation
1. Importer le Job JSON produit par le Studio.
2. Vérifier Job ID, schéma, workflow, nombre de cibles, opérations, erreurs et avertissements.
3. Commencer en mode simulation.
4. Démarrer, puis utiliser pause/reprendre/arrêter/ignorer/réessayer selon le résultat.
5. Exporter le rapport JSON v2 et le CSV lisible, puis réimporter le JSON dans le Studio.

## Garanties d'exécution
- Le moteur convertit les anciens formats dès l'import puis n'exécute qu'un modèle interne Job v2.
- Aucune correspondance métier complexe n'est calculée dans l'Agent.
- Seuls les champs présents dans les opérations du Job peuvent être modifiés.
- Le Node ID est vérifié avant modification lorsque disponible.
- Une sauvegarde transactionnelle des valeurs relues est attachée au rapport avant modification.
- Le mode simulation lit, surligne et calcule les actions sans écrire ni enregistrer.

## Services modulaires
- `core/model.js`: normalisation Job v2 et anciens formats.
- `core/executor.js`: batch par phases explicites.
- `services/click.js`: clic robuste avec attente, scroll, surbrillance, confirmation, événements et annulation.
- `services/navigation.js`: création et mise à jour par URL/Node ID/admin content.
- `services/ckeditor.js`: lecture/écriture d'éditeurs et lien de retour.
- `services/autocomplete.js`: validation réelle de suggestion, y compris `Formateurs (6625)`.
- `services/fancytree.js`: chemins imbriqués pour publics et géographie.
- `services/taxonomy.js`: `add/remove/replace/clear`, thématiques obligatoires uniquement à la création.
- `services/sofia.js`: blocs préinscription, sessions et places restantes.
- `core/report.js`: rapport JSON v2 et CSV.

## Limites restantes avant validation finale
- Les sélecteurs Drupal réels doivent être validés en préproduction avec l'outil de diagnostic.
- L'écriture CKEditor avancée utilise un fallback DOM générique tant que les instances Drupal réelles ne sont pas confirmées.
- La médiathèque dispose d'une sélection robuste générique; la séquence exacte dossier `6632`/filtres est à valider sur Drupal réel.
