# État du Studio Intranet EAFC v2 avant finalisation

## Objectif de cette sauvegarde

Ce document fige l'état textuel courant du Studio avant de poursuivre les workflows métier. Les pièces jointes binaires antérieures ne sont plus utilisées comme source de vérité ; la suite doit s'appuyer sur le dépôt, les sources, les tests et les documents textuels présents ici.

## Fonctionnalités déjà présentes

- Interface autonome `dist/studio-intranet-eafc-v2.html` générée depuis `src/studio/`.
- Quatre workflows visuels et fonctionnels : création OVP, actualisation Sofia-FMO, demandes éditoriales, thématiques/publics.
- Import guidé par workflow et import universel avancé.
- Modèle canonique partagé pour les pages/parcours.
- Adaptateur d'import pour JSON, CSV, HTML/XLS, XLSX diagnostique, anciens payloads, rapports et workspace Studio.
- Gestion non bloquante des fichiers binaires non pris en charge : ils sont marqués `unsupported_binary` / `skipped`.
- Rapprochements métier séparés selon workflow.
- Génération de différences Sofia uniquement sur sessions/préinscriptions.
- Génération de différences éditoriales uniquement sur les champs autorisés.
- Génération de modifications taxonomiques uniquement par Node ID.
- Export Job v2 sans cible vide.
- Sauvegarde locale, export/import de workspace, annulation/rétablissement.
- Rapport Agent importable et export de recensement CSV basé sur résultats confirmés.

## Fichiers Studio conservés

- `src/studio/` complet.
- `scripts/build-studio.py` et `scripts/build-studio.mjs`.
- `dist/studio-intranet-eafc-v2.html` reconstruit.
- `schemas/eafc-drupal-job-v2.schema.json` et `schemas/eafc-drupal-report-v2.schema.json`.
- `tests/studio.test.mjs`.
- Documentation Markdown et JSON déjà créée.

## Architecture actuelle

- `src/studio/adapters/universal.js` : détection/import des sources, fichiers binaires ignorés sans bloquer.
- `src/studio/core/constants.js` : workflows, étapes, types de sources, opérations et alias.
- `src/studio/core/model.js` : workspace, page canonique, historique, undo/redo.
- `src/studio/core/workflows.js` : orchestration métier création, Sofia, éditorial, taxonomies.
- `src/studio/core/operations.js` : règles `add/remove/replace/clear`, cellule vide ignorée, suppression explicite.
- `src/studio/core/validation.js` : contrôles bloquants et non-contamination.
- `src/studio/core/exportJob.js` : construction du Job v2.
- `src/studio/ui/app.js` : interface, imports, tableaux, actions, export.

## Choix d'interface conservés

- Accueil par cartes workflow.
- Mode simple guidé par sources attendues.
- Import universel réservé au mode avancé.
- Tableau central avec filtres, sélection et actions massives.
- Fiche latérale avec valeurs, prévisualisation, correspondances et rapport.
- Section contrôles/export affichant le Job JSON.

## Éléments qui fonctionnent et sont couverts par tests

- Détection `create_pages` legacy.
- Import CSV aliasé vers modèle canonique.
- Diagnostic XLSX non destructif.
- Ignorer les binaires non pris en charge sans bloquer l'extraction.
- Normalisation des titres départementaux.
- Matching Node ID prioritaire.
- Cellule vide = ignore.
- Suppression explicite.
- Ligne retirée absente du Job.
- Import OVP `plan.courses[]`.
- Workflow Sofia sans champ éditorial.
- Workflow demandes sans dates/lieux/liens/taxonomies.
- Workflow taxonomies par Node ID.
- Non-contamination entre workflows.

## Éléments encore incomplets ou à vérifier

- Validation réelle sur le fichier Excel de référence si présent dans une branche/source externe.
- Vérification runtime dans Firefox/Chrome non possible dans l'environnement actuel sans navigateur installé.
- Vérification de compatibilité complète avec le futur `agent-drupal-eafc-v2.user.js` si absent du dépôt courant.
- Export Excel riche avec conservation de styles/formules/onglets : pour l'instant, les rapports textuels/CSV restent la source extractible.

## Prochaines corrections demandées

- Continuer depuis ce commit et ce Studio existant.
- Ne pas reconstruire l'interface depuis zéro.
- Ne plus dépendre des anciennes pièces jointes binaires.
- Ajouter uniquement les workflows métier encore manquants ou corrections ciblées.
- Garder les changements extractibles en formats textuels.
