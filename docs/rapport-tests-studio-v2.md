# Rapport de tests — Studio Intranet EAFC v2

## Commandes exécutées

| Statut | Commande | Résultat |
|---|---|---|
| Succès | `python3 scripts/build-studio.py` | Génère `dist/studio-intranet-eafc-v2.html` autonome. |
| Succès | `node tests/studio-core.test.js` | Valide les invariants critiques du noyau Studio. |

## Couverture minimale implémentée

- Imports: détecteurs JSON historiques, OVP, payloads, rapports, workspace; lecture XLSX structurelle via ZIP/OpenXML côté navigateur.
- Excel: conservation de l'ordre des feuilles, noms, dimensions, lignes, cellules fusionnées, formules lues, diagnostics de colonnes reconnues/non reconnues.
- Titres départementaux: normalisation des préfixes `16 -`, `17 -`, `79 -`, `86 -`, `16/17 -`, `79/86 -` et variantes.
- Différences: cellule vide = `ignore`; suppression uniquement avec marqueur explicite.
- Taxonomies: `add` conserve l'existant et n'exporte que les nouveautés; `replace` et `clear` portent des avertissements destructifs.
- Lignes retirées: exclues des compteurs, cibles et opérations du Job JSON.
- Payload: génération `eafc-drupal-job-v2` conforme au schéma v2 mis à jour pour les workflows Studio.
- Workspace: autosave local, export, undo/redo, historique d'actions.
- Recensement: export d'un plan de copie versionnée, sans écraser l'original, prêt pour l'écriture XLSX complète.

## Différences volontaires

- L'export de copie de recensement produit à cette étape un plan JSON versionné de mise à jour plutôt qu'un XLSX binaire complet, afin de ne pas risquer de perte de formules/styles avant validation de l'écriture OpenXML.
- L'agent Drupal n'est pas implémenté dans cette étape; le Studio exporte des opérations résolues et explicites.

## Points restant à vérifier sur le vrai Drupal

- Sélecteurs réels de formulaire, médiathèque, autocomplete, Fancytree et CKEditor côté futur Agent.
- Rendu exact du HTML Drupal après injection et sauvegarde.
- Exactitude des taxonomies réelles et IDs Drupal en production.
- Comportement de sauvegarde/reprise sur les postes verrouillés académiques.

## Étape 3 — Agent Drupal

| Statut | Commande | Résultat |
|---|---|---|
| Succès | `python3 scripts/build-agent.py` | Génère `dist/agent-drupal-eafc-v2.user.js`. |
| Succès | `node tests/agent-core.test.js` | Valide import Job v2, migrations legacy, autocomplete, taxonomies création/mise à jour, validation cible et workflow. |

## Tableau récapitulatif final étape 3
| Fonctionnalité | Ancienne source | Nouvelle implémentation | Test | Résultat | Limite restante |
|---|---|---|---|---|---|
| Import Job v2 | Nouveaux schémas | `src/agent/core/model.js` | `agent-core.test.js` | OK | Validation terrain. |
| Compatibilité update 3.0 | `MAJ 1.8.08.txt` | `normalizeJob()` | `agent-core.test.js` | OK | Mapping exhaustif à enrichir avec fixtures réelles. |
| Compatibilité taxonomy legacy | `migration intranet v7.html` / MAJ | `normalizeJob()` | `agent-core.test.js` | OK | Validation avec payload réel massif. |
| Batch par phases | deux Tampermonkey | `src/agent/core/executor.js` | test workflow/validate | OK | Navigation réelle Drupal à recetter. |
| Clic robuste | deux Tampermonkey | `src/agent/services/click.js` | inspection + DOM simulé | OK | Confirmation utilisateur en vrai navigateur. |
| Autocomplete | création/MAJ | `src/agent/services/autocomplete.js` | `Formateurs (6625)` | OK | Sélecteurs Drupal réels. |
| Thématiques création | création | `src/agent/services/taxonomy.js` | obligatoires création | OK | Mapping complet à confirmer. |
| Thématiques mise à jour add | MAJ | `src/agent/services/taxonomy.js` | pas d'ajout 6331 | OK | Lecture finale réelle. |
| Publics/Fancytree | création | `src/agent/services/fancytree.js` | DOM simulé partiel | OK | Arborescence réelle. |
| CKEditor/lien retour | création/MAJ | `src/agent/services/ckeditor.js` | inspection | Partiel | Instances CKEditor Drupal à valider. |
| Sofia-FMO | MAJ | `src/agent/services/sofia.js` | calcul places | OK | Rendu mise en avant réel. |
| Rapport JSON/CSV | MAJ | `src/agent/core/report.js` | export structure | OK | Réimport Studio avec rapports terrain. |

## Étape 4 — Sources réelles EAFC et corrections Studio

| Statut | Commande | Résultat |
|---|---|---|
| Succès | `python3 scripts/build-studio.py` | Reconstruit `dist/studio-intranet-eafc-v2.html` depuis `src/studio/`. |
| Succès | `node tests/studio-real-sources.test.js` | Valide OVP réel, recensement GAIA, Sofia-FMO, matching départemental/bidépartemental et sécurités d'export. |
| Succès | `node tests/excel-structure-readonly.test.js` | Vérifie que la lecture du recensement source reste strictement read-only. |

## Détection des fichiers par contenu
- JSON OVP: `obj?.plan && Array.isArray(obj.plan.courses)`.
- Recensement Drupal: feuille avec alias `Node ID Drupal`, `Lien de la page`, `Titre`.
- Demande éditoriale: feuille avec `ID intention`, `Titre du parcours`, `Objectif général`, `Contenu`.
- Sofia-FMO: feuille avec `Dispositif : code`, `Module : code`, `Groupe : identifiant`, `Session`, `Début`, `Fin`, `Modalité`, `UAI`, `Lieu`.
