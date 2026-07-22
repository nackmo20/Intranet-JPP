# Différences volontaires — Studio Intranet EAFC v2

- Le Studio exporte un format unifié Job v2 (`create`, `update_content`, `update_sofia`, `update_taxonomy`) au lieu de multiplier les anciens payloads. Les anciens formats restent importables par adaptateurs legacy.
- Une cellule vide signifie toujours `ignore`. Les suppressions passent uniquement par marqueur explicite.
- Les opérations taxonomiques `add` n'exportent que les nouvelles valeurs demandées et ne suppriment jamais implicitement l'existant.
- Les valeurs obligatoires `EAFC poitiers` et `6331` sont réservées au workflow de création.
- Le titre est utilisé uniquement comme dernier recours de rapprochement et jamais comme identifiant principal.
- L'agent Drupal v2 ne devra plus refaire de rapprochement métier complexe ; le Studio prépare les cibles résolues et opérations explicites.
