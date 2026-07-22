export const STUDIO_VERSION = '2.0.0-beta.1';
export const SCHEMA_VERSION = '2.0.0';
export const STORAGE_KEY = 'studio-intranet-eafc-v2:workspace';
export const WORKFLOWS = {
  create: 'create',
  updateContent: 'update_content',
  updateSofia: 'update_sofia',
  updateTaxonomy: 'update_taxonomy'
};
export const STEPS = ['Choix du workflow', 'Import des sources', 'Contrôle des fichiers', 'Correspondances', 'Modifications', 'Prévisualisation', 'Contrôles', 'Export', 'Import du rapport Agent', 'Actualisation du recensement'];
export const SOURCE_TYPES = [
  'json_ovp', 'json_ovp_batch', 'bi_rana', 'plan_sessions_sofia', 'recensement_excel',
  'demande_modification_excel', 'legacy_mapping_drupal_sofia', 'legacy_create_pages',
  'legacy_update_payload', 'legacy_taxonomy_payload', 'creation_report', 'update_report', 'studio_workspace', 'unsupported_binary', 'unknown'
];
export const MATCH_PRIORITY = ['nodeId', 'intentionOvpId', 'sourceOvp', 'exportId', 'dispositifCode', 'moduleCode', 'groupCode', 'rne', 'department', 'normalizedTitle'];
export const TAXONOMY_OPERATIONS = ['add', 'remove', 'replace', 'clear'];
export const CONTENT_OPERATIONS = ['add', 'replace', 'delete'];
export const EXPLICIT_DELETE_MARKERS = ['__DELETE__', '[DELETE]', 'SUPPRIMER', '[SUPPRIMER]', '<SUPPRIMER>'];
export const CREATION_REQUIRED_THEMATICS = ['EAFC poitiers', '6331'];
export const DEPARTMENT_PREFIX_RE = /^\s*0?(16|17|79|86)(?:\s*[\/,+-]\s*0?(16|17|79|86))?\s*[-–—:]\s*/i;
export const FIELD_ALIASES = {
  nodeId: ['Node ID Drupal', 'Node ID', 'NID', 'ID Drupal', 'Identifiant Drupal', 'Id'],
  drupalUrl: ['Lien vers la page', 'URL', 'Lien', 'Edit URL', 'Page Drupal'],
  title: ['Titre', 'Titre du parcours', 'Title', 'Libellé'],
  intentionOvpId: ['ID intention', 'Identifiant intention', 'Intention OVP', 'Source OVP'],
  exportId: ['Export ID', 'Identifiant export', 'Fiche formation export OVP'],
  dispositifCode: ['Dispositif', 'Code dispositif', 'CODE DISPOSITIF'],
  moduleCode: ['Module', 'Code module', 'CODE MODULE'],
  groupCode: ['Groupe', 'Code groupe'],
  rne: ['RNE', 'UAI', 'Code RNE'],
  department: ['Département', 'Departement', 'Dept', 'Territoire'],
  themes: ['Thématiques saisies', 'Thematiques saisies', 'Thématique', 'Theme'],
  audiences: ['Métiers', 'Metiers', 'Publics', 'Métiers ou publics', 'Public concerné'],
  objective: ['Objectif', 'Objectifs'],
  body: ['Contenu', 'Description', 'HTML principal'],
  accessibility: ['Accessibilité', 'Accessibilite'],
  setup: ['Mise en place', 'Organisation'],
  headcount: ['Effectif'],
  totalDuration: ['Durée totale', 'Duree totale'],
  inPersonDuration: ['Présentiel', 'Presentiel'],
  remoteDuration: ['Distanciel'],
  editorialPublic: ['Public éditorial', 'Public editorial'],
  prerequisites: ['Prérequis', 'Prerequis'],
  contact: ['Contact'],
  dates: ['Dates', 'Date'],
  location: ['Lieu', 'Lieux'],
  link: ['Lien de préinscription', 'Préinscription', 'Lien']
};
