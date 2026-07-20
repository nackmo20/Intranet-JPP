# Stratégie de migration et non-régression

1. Geler les sources historiques dans `legacy/`.
2. Écrire fixtures et snapshots depuis les exports réels.
3. Implémenter adaptateurs de lecture sans modifier les formats historiques.
4. Produire le modèle canonique avec provenance et conflits.
5. Convertir les workflows en Job v2 résolu côté Studio.
6. Limiter l'Agent Drupal à l'exécution d'opérations explicites et au reporting.
7. Comparer chaque sortie v2 aux snapshots avant livraison.
8. Générer les deux fichiers autonomes par build uniquement.

## Suite proposée
- Prioriser tests de caractérisation des imports/exports, CKEditor, taxonomies, matching Sofia/BI-RANA, Excel.
- Valider les ambiguïtés métier avec exemples réels.
- Construire les adaptateurs puis le noyau avant l'interface.

## Étape 2 — base Studio livrée
- Sources modulaires sous `src/studio/` et build autonome `dist/studio-intranet-eafc-v2.html`.
- Tests noyau sous `tests/studio-core.test.js` et rapport `docs/rapport-tests-studio-v2.md`.
- Le Studio reste local-only et conserve les anciens outils intacts comme secours.
