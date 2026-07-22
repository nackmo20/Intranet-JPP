# Modèle canonique EAFC v2

Principe : chaque parcours/page possède un `canonicalId` stable généré indépendamment du titre. Le titre source et le titre Drupal sont des attributs versionnés, jamais des identifiants principaux.

## Entité `EafcPage`

- `canonicalId`, `intentionOvpId`, `exportId`, `sourceOvp`, `sourceTitle`, `drupalTitle`, `nodeId`, `drupalUrl`.
- `excelOrigin`: `{ workbookFingerprint, sheetName, rowNumber }`.
- `taxonomies`: `{ themes[], audiences[], fancytreePaths[], departments[], geography[] }`.
- `trainingCodes`: `{ dispositifCode, moduleCodes[], groups[], uai[], rne[] }`.
- `sessions[]`: `{ sessionId, moduleCode, groupCode, dates[], lieux[], modalities, capacity, registered, remainingSeats, preRegistrationUrl }`.
- `content`: `{ objective, body, accessibility, setup, headcount, totalDuration, inPersonDuration, remoteDuration, prerequisites, contact }`.
- `links[]`, `status`, `errors[]`, `warnings[]`, `manualValidation`.
- `history[]`: append-only events `{ eventId, at, actor, operation, before, after, source }`.
- `provenance`: map par chemin JSON vers `{ source, sourceFile, fingerprint, confidence, importedAt, priority, manuallyValidated }`.

## Cardinalités prises en charge

- Une intention OVP vers plusieurs pages via `canonicalId` distincts reliés par `intentionOvpId`.
- Une page vers plusieurs modules, sessions, groupes, lieux et départements.
- Pages académiques, départementales et bidépartementales par `pageScope` et `departments[]`.
- Plusieurs pages pour un même parcours via `siblings[]`.
- Parcours sans Sofia-FMO : `matches.sofia.status = "unmatched"` sans bloquer la création.

## Provenance et priorités

Sources admises : OVP, recensement Excel, BI-RANA, Plan et sessions, saisie manuelle, valeur actuelle Drupal, rapport de création, rapport de mise à jour, valeur par défaut. La priorité est configurable ; toute tentative d'écrasement par une priorité inférieure crée un conflit à valider, jamais une modification silencieuse.
