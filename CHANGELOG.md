# Changelog

- Intègre la documentation des sources réelles EAFC, la détection XLSX par signatures de colonnes, les colonnes GAIA exactes et le matching Sofia-FMO module → Node ID avec contrôle territorial.
- Remplace le diagnostic XLSX simulé par un parseur structurel navigateur (workbook, sharedStrings, lignes, formules, dates Excel, feuilles et fusions) et ajoute des fixtures/tests EAFC.

## 2.0.0-beta.1 — 2026-07-20

- Spécialise les quatre workflows Studio : création OVP, mise à jour Sofia-FMO, demandes éditoriales, taxonomies.
- Sépare strictement les sources métier : Sofia-FMO ne génère que sessions/préinscriptions, les demandes ne génèrent que champs éditoriaux, les taxonomies s'appuient sur le recensement et le Node ID.
- Ajoute l'import OVP `plan.courses[]` et les champs `course.meta.*`.
- Ajoute les tests d'intégration Sofia-FMO, demandes éditoriales, taxonomies et non-contamination.
- Ajoute le build Python `python3 scripts/build-studio.py` et reconstruit le HTML autonome.

- Ignore les fichiers binaires non pris en charge (PDF, DOCX, images, archives…) pendant l'import afin qu'ils ne bloquent pas l'extraction des autres sources.
