# Changelog EAFC v2

## 2.0.0-step3
- Ajout de l'Agent Drupal unifié Tampermonkey.
- Build `dist/agent-drupal-eafc-v2.user.js`.
- Import Job v2 et migration des formats historiques `create_pages`, `update_drupal_pages` v3.0 et `bulk_drupal_theme_public_update`.
- Batch persistant par phases explicites.
- Services partagés: clic, navigation, CKEditor, autocomplete, Fancytree, médiathèque, taxonomies, Sofia-FMO, rapports.
- Tests automatisés Agent et simulateur DOM minimal.

## 2.0.0-step2
- Ajout du Studio autonome et des sources modulaires.

## 2.0.0-step1
- Audit, architecture, matrice et schémas.

## 2.0.0-step4
- Ajout de la documentation source de vérité `docs/sources-reelles-eafc-pour-codex.md` et lien README.
- Correction des adaptateurs Studio pour détecter les Excel par contenu: recensement Drupal, demande éditoriale et Sofia-FMO plan/sessions.
- Lecture OVP réelle via `course.meta.*` et prise en charge des sessions numériques.
- Import des colonnes GAIA dispositif/module en chaînes exactes avec découpage multi-valeurs sans `includes` partiel.
- Matching Sofia-FMO prioritaire module GAIA → Node ID, avec contrôle dispositif et résolution départementale/bidépartementale.
- Secours historique par titre normalisé, score et validation manuelle lorsque les codes GAIA manquent.
- Ajout des fixtures textuelles réelles et tests Studio associés.
