# Architecture cible EAFC v2

## Livrables buildés

- `studio-intranet-eafc-v2.html` : fichier autonome produit par build.
- `agent-drupal-eafc-v2.user.js` : userscript autonome produit par build.

## Modules sources

### Noyau partagé
`canonical-model`, `normalization`, `business-rules`, `validation-engine`, `matching-engine`, `diff-engine`, `history-store`, `json-schemas`.

### Adaptateurs
`adapter-ovp`, `adapter-bi-rana`, `adapter-sofia-fmo`, `adapter-plan-sessions`, `adapter-recensement-excel`, `adapter-legacy-json`, `adapter-legacy-reports`, `adapter-drupal-job-v2`.

### Studio
Interface en quatre entrées : créer pages, mettre à jour pages, actualiser Sofia/dates/lieux/préinscriptions, modifier thématiques/publics. Chaque workflow suit : Sources → Correspondances → Modifications → Prévisualisation → Contrôles → Export → Rapport. Les options rares restent disponibles en mode avancé.

### Agent Drupal
`execution-engine`, `navigation`, `forms`, `media-library`, `autocomplete`, `fancytree`, `ckeditor`, `save-and-verify`, `reporting`. L'agent ne fait plus de rapprochement métier complexe : il exécute des cibles résolues et opérations explicites.

### Tests
Unitaires, caractérisation legacy, intégration adaptateurs, fixtures, snapshots, simulateur DOM Drupal.

## Opérations explicites

Taxonomies : `add`, `remove`, `replace`, `clear`. Contenu : `add`, `replace`, `delete`. Cellule vide = `ignore`; suppression = marqueur explicite. `add` n'utilise jamais `expectedBefore/After` pour supprimer implicitement. `EAFC poitiers` et `6331` sont injectés seulement dans le workflow création.

## Améliorations obligatoires

Undo/redo, autosave local, export/import workspace, historique append-only, statut par page, opérations réessayables, doublons, empreintes fichiers, prévention imports périmés, séparation préparation/exécution, journal structuré, version générée, migrations schémas, reprise navigateur, configuration sélecteurs/taxonomies centralisée, mode test sélecteurs sans écriture Drupal.
