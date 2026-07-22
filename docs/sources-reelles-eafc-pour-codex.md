# Sources réelles EAFC pour Codex

Ce document est la source de vérité pour les adaptateurs du Studio Intranet EAFC v2.

## JSON OVP
Un fichier OVP réel est reconnu par `obj?.plan && Array.isArray(obj.plan.courses)`. Les parcours sont dans `obj.plan.courses`. Les champs éditoriaux sont portés par `course.meta.objectif`, `course.meta.contenu`, `course.meta.accessibilite`, `course.meta.prerequis`, `course.meta.publicConcerne`, `course.meta.datesLieux` et `course.meta.contact`. Les champs directs importants sont `course.id`, `course.title`, `course.effectif`, `course.presentiel`, `course.distanciel`, `course.dureeTotale`, `course.sessionsPresentiel`, `course.sessionsDistanciel`, `course.niveauDeploiement` et `course.typeCandidature`. `sessionsPresentiel` et `sessionsDistanciel` peuvent être numériques et ne doivent pas être itérés sans test de type.

## Recensement Drupal
Le recensement Drupal est un classeur Excel multi-feuilles. Les feuilles de synthèse ne sont pas des sources de pages. Les feuilles thématiques `T1_...` à `T12_...` sont importées lorsqu'elles contiennent au minimum `Node ID Drupal`, `Lien de la page` et `Titre`. Les colonnes GAIA attendues après `Node ID Drupal` sont `Numéro de dispositif GAIA` et `Numéro de module GAIA`. Variantes dispositif: `Numero de dispositif GAIA`, `N° dispositif GAIA`, `Code dispositif GAIA`, `Dispositif GAIA`. Variantes module: `Numero de module GAIA`, `N° module GAIA`, `Code module GAIA`, `Module GAIA`. Les codes sont conservés en chaînes. Plusieurs modules dans une cellule sont séparés par point-virgule, virgule, barre verticale ou retour ligne et doivent être comparés exactement après découpage.

## Demande éditoriale
Une demande éditoriale Excel est reconnue par une feuille contenant `ID intention`, `Titre du parcours`, `Objectif général` et `Contenu`.

## Sofia-FMO plan et sessions
Un export plan et sessions Sofia-FMO est reconnu par une feuille contenant notamment `Dispositif : code`, `Module : code`, `Groupe : identifiant`, `Session`, `Début`, `Fin`, `Modalité`, `UAI` et `Lieu`. Le nom du fichier n'est qu'un indice secondaire; `EAFC Formation Export plan et sessions (66).xlsx` doit être reconnu par ses colonnes.

## Matching GAIA vers Drupal
La correspondance prioritaire est `Sofia-FMO Module : code = Recensement Numéro de module GAIA`, qui fournit le `Node ID Drupal`. Le dispositif GAIA contrôle la cohérence. La priorité est: module exact, dispositif exact, résolution département/groupe/RNE/lieu, puis secours historique seulement si aucune association GAIA n'existe. Le titre ne doit pas être prioritaire lorsqu'un module GAIA est renseigné.

## Pages départementales et bidépartementales
Un même module GAIA peut pointer vers plusieurs Node ID Drupal: pages départementales, bidépartementales ou territorialisées. Ne jamais les fusionner. Utiliser les préfixes `16 -`, `17 -`, `79 -`, `86 -`, `16/17 -`, `79/86 -` et la colonne `Départements`. Le territoire Sofia est déduit dans l'ordre: UAI/RNE, territoire explicite, lieu, groupe, session. Une page `16/17` accepte les lignes des départements 16 et 17.

## Secours sans association GAIA
Lorsqu'aucune colonne GAIA n'est renseignée, reprendre les idées de `legacy/migration intranet v7.html`: retirer les préfixes départementaux pour comparer les titres, comparer Drupal avec dispositif/modules Sofia, utiliser mots-clés et Levenshtein, produire plusieurs propositions classées avec dispositif, module, score, groupes, sessions, RNE/UAI, lieux et départements, demander validation manuelle, puis préparer la mise à jour des colonnes GAIA. Seuils: fiable ≥ 0,90; probable ≥ 0,75; à vérifier ≥ 0,55; non trouvé < 0,55. Même fiable, une proposition doit avoir un Node ID avant export.

## Regroupement Sofia-FMO
Regrouper par `Dispositif : code`, `Module : code`, `Groupe : identifiant`; compléter avec UAI, lieu et session. Conserver toutes les sessions compatibles. Ne jamais remplacer une valeur renseignée par une cellule vide. Pour le lien de préinscription, privilégier la ligne qui contient une valeur. Calculer `remainingSeats = capacity - registered` uniquement lorsque les deux valeurs sont numériques; une cellule vide ne vaut pas zéro.

## Champs autorisés Sofia-FMO
Le workflow Sofia-FMO ne peut modifier que dates, horaires, modalités, lieux, nombre maximal de places, nombre total de préinscrits, places restantes, début/fin de publication et lien de préinscription. Il ne doit jamais modifier titre, objectif, contenu, accessibilité, mise en place, effectif éditorial, durée éditoriale, public éditorial, prérequis, contact, thématiques ou métiers/publics Drupal.
