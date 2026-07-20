# Modèle canonique unique

Identifiant primaire: `canonicalId` stable; ne jamais utiliser le titre comme identifiant.

Champs: intention OVP, exportId, source OVP, titre source, titre Drupal, Node ID, URL, origine Excel (onglet/ligne), thématiques, publics/métiers, chemins Fancytree, géographie, départements, dispositif, modules, groupes, sessions, UAI/RNE, lieux, modalités, objectif, contenu, accessibilité, mise en place, effectif, durées, prérequis, contact, dates, liens, capacité, inscrits, places restantes, statut, historique, provenance par valeur, confiance, validation manuelle, erreurs, avertissements.

Cardinalités: une intention vers N pages; une page vers N modules; N sessions/groupes/lieux; pages académiques, départementales et bidépartementales; N pages pour un parcours; parcours sans Sofia-FMO.

Provenance: OVP, recensement Excel, BI-RANA, Plan et sessions, saisie manuelle, valeur Drupal actuelle, rapport création, rapport mise à jour, valeur par défaut. Priorité configurable; remplacement moins fiable interdit sans conflit visible.

Opérations explicites: taxonomies `add/remove/replace/clear`; contenu `add/replace/delete`; cellule vide = `ignore`; suppression = marqueur explicite; `add` ne supprime jamais via expectedBefore/After; `EAFC poitiers` et `6331` ajoutés seulement à la création.
