# Protocole de recette manuelle Drupal EAFC v2

## Règles de sécurité
- Ne jamais lancer un batch complet en premier essai.
- Toujours commencer en simulation.
- Tester ensuite avec auto-save désactivé.
- Tester enfin un petit batch avec auto-save.
- Conserver les anciens Tampermonkey comme retour arrière.

## Scénarios prioritaires
| # | Scénario | Mode initial | Critère de réussite |
|---|---|---|---|
| 1 | Création simple | Simulation | Formulaire détecté, titre/contenu/taxonomies prévus, aucun enregistrement. |
| 2 | Création départementale | Simulation | Géographie départementale et titre vérifiés. |
| 3 | Création bidépartementale | Simulation | Exactement deux départements ciblés. |
| 4 | Mise à jour Sofia | Simulation | Préinscription, places, sessions et dates calculées sans contenu non demandé. |
| 5 | Ajout thématique | Simulation puis manuel | Thématiques existantes conservées. |
| 6 | Ajout métier | Simulation puis manuel | Métiers existants conservés. |
| 7 | Mise à jour contenu | Simulation puis manuel | Seuls les champs demandés changent. |
| 8 | Conflit volontaire | Simulation | Sauvegarde bloquée et rapport de conflit. |

## Retour arrière
- Désactiver `Agent Drupal EAFC v2` dans Tampermonkey.
- Réactiver les scripts historiques conservés dans `legacy/` ou les originaux du dépôt.
- Réimporter le dernier rapport JSON dans le Studio pour préparer les retries ciblés.
