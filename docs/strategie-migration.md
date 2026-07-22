# Stratégie de migration

1. Conserver les sources historiques dans `legacy/` et ne jamais les remplacer pendant la refonte.
2. Écrire des tests de caractérisation qui exécutent les fonctions pures extraites ou des snapshots de sortie sur fixtures.
3. Formaliser tous les payloads legacy puis créer des adaptateurs de lecture v1/v7/1.8.09 vers le modèle canonique.
4. Implémenter le noyau partagé avec provenance et historique avant toute interface.
5. Produire le schéma Job v2 et Report v2 ; migrer progressivement les exports studio vers Job v2.
6. Réduire l'agent Drupal à l'exécution : navigation, saisie, sauvegarde, vérification, rapport.
7. Comparer les sorties v2 aux snapshots legacy pour chaque ligne de la matrice.
8. Auditer le classeur Excel manquant dès réception et compléter la matrice avant développement final.

## Fonctionnalités à risque

Autocomplete Drupal, Fancytree, CKEditor, médiathèque, callout Bleu cumulus, matching Sofia-FMO multi-session, duplication départementale/bidépartementale, correction éditoriale, Excel de recensement, rapports HTML-XLS.

## Incompatibilités et pertes possibles

Formats JSON multiples (`create_pages`, mapping, update preinscriptions, bulk taxonomy), Excel HTML vs XLSX, labels vs IDs taxonomie, titres préfixés, caches sans empreinte, champs HTML nettoyés, cellules vides interprétées comme suppression dans certains usages legacy.

## Suite proposée

- Obtenir le classeur manquant et compléter l'audit Excel.
- Créer fixtures représentatives et tests de caractérisation.
- Extraire schémas legacy et migrations.
- Développer noyau puis adaptateurs, ensuite seulement Studio et Agent v2.
