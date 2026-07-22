# Architecture cible EAFC v2

## Livrables finaux générés par build
- `studio-intranet-eafc-v2.html`
- `agent-drupal-eafc-v2.user.js`

## Modules
- `core/`: modèle canonique, normalisation, règles métier, validation, rapprochement, différences, historique append-only, schémas JSON.
- `adapters/`: OVP, BI-RANA, Sofia-FMO, plan/sessions, recensement Excel, anciens JSON, anciens rapports, Drupal Job v2.
- `studio/`: workflows, prévisualisation, actions massives, exports, espaces de travail, mise à jour recensement.
- `agent-drupal/`: exécution, navigation, formulaires, médiathèque, autocomplete, Fancytree, CKEditor, sauvegarde, vérification, rapports.
- `tests/`: unitaires, caractérisation, intégration, fixtures, snapshots, simulateur DOM Drupal.

## Interface
Entrées: créer pages; mettre à jour pages; actualiser Sofia-FMO/dates/lieux/préinscriptions; modifier thématiques/publics. Étapes communes: Sources, Correspondances, Modifications, Prévisualisation, Contrôles, Export, Rapport. Options rares en mode avancé.

## Améliorations obligatoires
Undo/redo, autosave local, import/export workspace, historique append-only, statut par page, retry, doublons, empreintes, imports périmés, séparation préparation/exécution, journal structuré, version build, migrations de schémas, reprise navigateur, configuration centralisée sélecteurs/taxonomies, test des sélecteurs sans écriture Drupal.
