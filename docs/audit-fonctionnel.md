# Audit fonctionnel EAFC intranet — étape 1

## Sources auditées et versions constatées

| Composant | Source inspectée | Version effective | Constats |
|---|---|---:|---|
| Outil de migration / studio historique | `migration intranet v7.html` | v7 par nom de fichier ; aucune métadonnée `@version` ni `SCRIPT_VERSION` trouvée | Application HTML autonome, 255 fonctions JavaScript détectées, onglets OVP/Sofia/BI-RANA/Drupal/mises à jour/tagging massif. |
| Tampermonkey de création | `10_07_Tampermonkey Creation parcours intranet.txt` | `@version 1.0.3` | Script de création Drupal Formation, stockage local `eafcDrupalFormationAutomation:v1`, export Excel HTML. |
| Tampermonkey de mise à jour | `MAJ 1.8.08.txt` | `@version 1.8.09` et `SCRIPT_VERSION = '1.8.09'` | Le nom est 1.8.08 mais le script interne est 1.8.09 : c'est la version de mise à jour la plus récente présente dans le dépôt. |
| Tampermonkey mise à jour 1.8.10 | non trouvé | absent | Aucun fichier 1.8.10 dans l'arbre de travail ni dans l'unique commit Git. |
| Classeur de suivi | `260717_Suivi_parcours_intranet_VF_colonne_subdivisee(1)(4).xlsx` | non auditable | Fichier obligatoire absent du dépôt et de l'historique Git disponible ; la structure Excel devra être complétée dès fourniture du classeur. |

Historique Git inspecté : un seul commit `7795972 Add files via upload`, contenant uniquement les trois sources historiques ci-dessus. Les versions antérieures/ultérieures ne sont donc pas récupérables depuis ce dépôt local.

## Inventaire — outil de migration

| ID | Fonctionnalité / comportement réel | Source / zone | Risque |
|---|---|---|---|
| MIG-001 | Import JSON OVP unique via lecteur de fichier, parsing JSON et normalisation parcours. | `parseOvpJson`, `handleOvpFileImport`, `normalizeOvpCourses` | Formats OVP implicites. |
| MIG-002 | Import de plusieurs JSON ou dossier OVP avec agrégation. | `handleOvpFolderImport` | Doublons intention/parcours. |
| MIG-003 | Filtrage des candidatures individuelles. | `isIndividualCandidature`, `getEligibleCourses` | Exclusion silencieuse. |
| MIG-004 | Import Sofia-FMO CSV/XLS/XLSX/HTML/JSON via lecteur générique. | `readWorkbookOrSingle`, `handleSofiaFileImport` | Colonnes variables. |
| MIG-005 | Import Plan et sessions, groupement dispositif/module/groupe. | `buildExcelDataWithGroupSessions`, `isSamePlanSessionGroup` | Multiples sessions. |
| MIG-006 | Import BI-RANA dispositifs/modules. | `downloadBiRanaMappingTemplate`, `restoreCachedBiRanaMapping` | Cache périmé. |
| MIG-007 | Import recensement Drupal pour mises à jour. | `importInventoryWorkbook`, `importBulkThemePublicInventory` | Feuilles Excel non homogènes. |
| MIG-008 | Lecture CSV/XLS/XLSX/HTML/JSON et conversion objets. | `parseCsv`, `csvRowsToObjects`, `readWorkbookOrSingle` | Encodage, cellules fusionnées. |
| MIG-009 | Normalisation des colonnes et alias. | `normalizeColumnName`, `findColumn`, `getAnyColumnValue` | Alias ambigus. |
| MIG-010 | Cache BI-RANA en stockage navigateur. | `restoreCachedBiRanaMapping`, `saveState` | Données obsolètes. |
| MIG-011 | Association automatique OVP ↔ Sofia/BI-RANA. | `autoAssociateAllCourses`, `scoreSofiaMatch`, `findBestMatches` | Faux positifs. |
| MIG-012 | Association manuelle et persistance. | `updateAssociationManually`, `persistAssociations` | Écrase l'auto sans audit complet. |
| MIG-013 | Seuils de confiance et affichage scores. | `keywordSimilarity`, `levenshteinSimilarity`, `scoreSofiaMatch` | Réglages codés. |
| MIG-014 | Mapping Drupal vers Sofia-FMO. | `buildMappingPayload`, `renderDrupalSofiaMapping` | Identifiants multiples. |
| MIG-015 | Mapping unitaire/multiple/départemental. | `detectDepartmentalModules`, `getCourseDuplicationMode` | Cas bidépartementaux. |
| MIG-016 | Correspondance par titre normalisé. | `normalizeIntranetTitleForComparison`, `normalizeTitle` | Titre non identifiant. |
| MIG-017 | Correspondance par identifiants dispositif/module/export. | `getExportIdSegments`, `exportIdContainsExactId` | Formats hétérogènes. |
| MIG-018 | Préfixes départementaux, variantes académiques/départementales. | `stripDrupalDepartmentPrefix`, `getDepartmentTitlePrefix`, `isDepartmentalTitleVariant` | Collision titres. |
| MIG-019 | Contrôles groupes, lieux, UAI/RNE. | `getSofiaGroupPreinscriptionAlerts`, `getSofiaLocationGroupCoverageAlerts`, `inferDepartmentFromRne` | RNE absent. |
| MIG-020 | Sélection départements et duplication. | `getCourseDepartments`, `getVariantDepartmentCodes` | Plusieurs pages par intention. |
| MIG-021 | Prévisualisation Drupal création. | `buildDrupalCreateItem`, `renderDrupalPreview` | Écart avec agent. |
| MIG-022 | Correction éditoriale et annulation. | `correctPublicationText`, `setPublicationCorrectionDisabled` | Correction non voulue. |
| MIG-023 | Publics globaux et par parcours. | `getSelectedPublics`, `getPublicsForCourse` | Fusion/écrasement. |
| MIG-024 | Thématique globale et par parcours. | `getThemeForCourse`, `THEMES` | Taxonomies codées. |
| MIG-025 | Dates par défaut. | `getDefaultDates` | Valeurs par défaut masquent absence source. |
| MIG-026 | Contrôles qualité et rapports. | `runQualityChecks`, `buildControlReport` | Couverture incomplète. |
| MIG-027 | Exports JSON création/mapping/update. | `buildCreatePagesPayload`, `buildUpdatePreinscriptionsPayload`, `exportCurrentUpdatePayload` | Formats divergents. |
| MIG-028 | Exports CSV/Excel HTML. | `toCsv`, `downloadFile`, `exportUpdatedInventory` | Excel HTML fragile. |
| MIG-029 | Sauvegarde locale, restauration, réinitialisation. | `saveState`, `restoreState`, `resetState` | Versionnement absent. |
| MIG-030 | Préparation mises à jour intranet et diff. | `buildPreview`, `selectDiffs` | Diff recalculé côté studio. |
| MIG-031 | Suppression/restauration de lignes de prévisualisation. | `excludedPreviewTargets`, `iuRestoreExcluded` | État UI non tracé. |
| MIG-032 | Mise à jour massive publics/thématiques par Node ID. | `buildBulkThemePublicPayload` | Sémantique add/remove/replace à figer. |
| MIG-033 | Journalisation interne exportable JSON/CSV/XLS. | `logIntranet`, boutons `logJson/logCsv/logXls` | Journal mutable. |

## Inventaire — Tampermonkey de création

| ID | Fonctionnalité / comportement réel | Source / zone | Risque |
|---|---|---|---|
| CRE-001 | Chargement d'un payload `type=create_pages` avec `items[]`. | `loadExportFromPanel` | Rejet autres versions. |
| CRE-002 | Parsing JSON brut ou bloc Markdown fenced. | `parseExportJson` | Extraction entre premier `{` et dernier `}`. |
| CRE-003 | Navigation vers formulaire Formation via lien direct ou menu Seeds Add. | `goToFormationForm` | Sélecteurs Drupal fragiles. |
| CRE-004 | Remplissage titre, chapo, publication/unpublish. | `fillCurrentFormation` | Champs obligatoires. |
| CRE-005 | Médiathèque : dossier Bannières `6632`, filtre, page suivante, image aléatoire. | `selectRandomMedia` | Aléatoire non reproductible. |
| CRE-006 | Thématiques par mapping + obligatoires `EAFC poitiers` et `6331`. | `REQUIRED_THEMATICS`, `resolveThematics` | À limiter à la création v2. |
| CRE-007 | Autocomplete Drupal avec délai et sélection réelle. | `fillAutocomplete`, `visibleAutocompleteSuggestions` | Suggestion non stable. |
| CRE-008 | Métiers/publics via chemins Fancytree. | `fillPublics`, `publicPath`, `clickFancytreePath` | Arbre dynamique. |
| CRE-009 | Géographie : Académie de Poitiers par défaut + départements. | `fillGeography`, `DEPARTMENT_LABELS` | Codes avec zéro. |
| CRE-010 | CKEditor : format avancé, mode Source, injection HTML. | `addRichtextParagraph`, `waitForSourceButton` | API UI variable. |
| CRE-011 | Unités automatiques « places » et « heures ». | `addFormationUnits`, `unitForLabelText` | Détection libellés. |
| CRE-012 | Bas de page : lien Retour à la page Ma formation. | `addReturnTrainingLink` | Méthodes multiples. |
| CRE-013 | Secours CKEditor toolbar/model/paste/execCommand et Firefox. | `insertReturnTrainingLinkInEditor`, `isFirefox` | Compatibilité navigateur. |
| CRE-014 | Mode sécurité, surbrillance clics, confirmation. | `safeClick`, `triggerClick` | Bloquant en batch. |
| CRE-015 | Pause/reprise/reprise après navigation. | `state`, `running`, `paused`, auto-resume | État localStorage. |
| CRE-016 | Récupération Node ID et URL après création. | `getCurrentNodeInfo`, `recordCreatedPageIfAvailable` | Lien Voir absent. |
| CRE-017 | Export bilan de création au format `.xls` HTML. | `exportCreatedRowsToExcel` | Format non XLSX réel. |
| CRE-018 | API diagnostic exposée. | `exposeDebugApi` | Surface globale. |

## Inventaire — Tampermonkey de mise à jour

| ID | Fonctionnalité / comportement réel | Source / zone | Risque |
|---|---|---|---|
| UPD-001 | Import mapping JSON historique. | `handleMappingFile`, `parseMappingJson`, `normalizeMappingItems` | Variantes de payload. |
| UPD-002 | Import Excel Sofia-FMO et indexation. | `handleExcelFile`, `readExcelWorkbook`, `buildExcelIndex` | En-têtes inconnus. |
| UPD-003 | Import payload intranet et validation. | `handleIntranetUpdateFile`, `validateIntranetPayload` | Plusieurs types. |
| UPD-004 | Sélection workflow préinscriptions / intranet / taxonomie. | `renderWorkflowMode` | Logique UI liée exécution. |
| UPD-005 | Correspondance dispositif/module/groupe/RNE/territoire. | `makeMappingKey`, `scoreExcelMatch`, `selectExcelMatchForMappingItem` | Matching métier côté agent. |
| UPD-006 | Gestion multiples sessions, tri dates. | `buildExcelDataWithGroupSessions`, `compareSessionRows` | Ordre significatif. |
| UPD-007 | Dates, lieux, places restantes, lien préinscription. | `buildSessionParagraphs`, `calculateRemainingPlaces` | Données numériques vides. |
| UPD-008 | Mise en avant / bouton préinscription / Bleu cumulus. | `addCalloutParagraph`, `createCallout`, `setCalloutColor` | Paragraph Drupal complexe. |
| UPD-009 | Modification HTML/titre/objectifs/contenu/accessibilité/mise en place/effectif/durées/public/prérequis/contact. | `applyEditorialChanges`, `applyRequestedFormationHtmlChanges` | Risque perte HTML. |
| UPD-010 | Thématiques, publics/métiers Drupal, départements. | `applyTaxonomyChanges`, `updateAutocompleteMultiField`, `setFancytreeSelection` | Add ne doit pas supprimer. |
| UPD-011 | Sauvegarde avant modification. | `createIntranetReportItem`, `readCurrentDrupalValues` | À rendre systématique. |
| UPD-012 | Détection conflits par état attendu. | `expectedBefore`, `typedError`, `readCurrentDrupalValues` | Comparaison normalisée. |
| UPD-013 | Vérification après modification. | `verifyAfterUpdate`, `expectedAfter`, `expectedAfterContains` | Couverture champs. |
| UPD-014 | Simulation, auto-save, confirmation clics. | `simulation`, `autoSave`, `confirmClicks` | Options de sécurité. |
| UPD-015 | Pause, arrêt, persistance batch, reprise auto. | `runUpdateBatch`, `scheduleAutoResumeBatch`, `readBatchState` | Reprise après navigation. |
| UPD-016 | Rapports JSON/Excel et statuts d'erreur. | `downloadReportJson`, `downloadReportExcel`, `status` | Format rapport à stabiliser. |
| UPD-017 | Réinitialisations séparées imports Excel/intranet/tout. | `resetExcelData`, `resetIntranetUpdateData`, `resetImportedData` | Perte données UI. |

## Excel de suivi

Le classeur `260717_Suivi_parcours_intranet_VF_colonne_subdivisee(1)(4).xlsx` est absent. Les éléments suivants sont donc marqués **à auditer dès réception** : noms et ordre des feuilles, lignes utiles, en-têtes simples/subdivisés, cellules fusionnées, colonnes répétées/techniques/contenu/suivi, onglets thématiques/cartographie/synthèse, formules, formats, validations et colonnes non utilisées. Les adaptateurs v2 devront refuser un audit final tant que cette source n'est pas fournie.

## Tests à écrire

- Tests de caractérisation des parsers OVP, Sofia-FMO, BI-RANA, recensement Drupal et payloads historiques.
- Snapshots des exports `create_pages`, mapping, préinscriptions, update intranet, bulk taxonomy.
- Tests DOM Drupal simulés pour autocomplete, Fancytree, CKEditor, médiathèque et paragraphes callout.
- Tests de non-régression Excel dès fourniture du classeur.
- Tests de provenance/priorité empêchant l'écrasement silencieux par une source moins fiable.

## Décisions et ambiguïtés

1. Le fichier `MAJ 1.8.08.txt` doit être traité comme version 1.8.09.
2. Le classeur obligatoire manque : aucune décision finale sur les colonnes Excel ne doit être prise sans lui.
3. Les champs taxonomie doivent distinguer `add/remove/replace/clear`; une cellule vide signifie `ignore`.
4. Les titres ne doivent jamais devenir identifiants principaux ; ils restent uniquement indices de rapprochement.
