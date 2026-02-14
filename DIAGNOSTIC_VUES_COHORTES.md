# 🔍 DIAGNOSTIC : Sauvegarde et Partage des Vues/Cohortes

## 📊 RÉSUMÉ EXÉCUTIF

| Composant | Statut | Compatibilité | Notes |
|-----------|--------|---------------|-------|
| **Backend - Modèle** | ✅ **Complet** | 100% | Modèle `View` avec tous les champs nécessaires |
| **Backend - API** | ✅ **Complet** | 100% | Tous les endpoints CRUD + apply + share |
| **Frontend - Intégration** | ❌ **Manquant** | 0% | Aucune intégration avec l'API views |
| **Frontend - UI** | ❌ **Manquant** | 0% | Pas de boutons/interface pour sauvegarder/charger |
| **Partage via URL** | ⚠️ **Partiel** | 50% | Backend génère le lien, frontend ne le lit pas |

**Score Global : 50%** (Backend complet, Frontend à implémenter)

---

## ✅ CE QUI EXISTE DÉJÀ

### 1. Backend - Modèle de Données (`backend/app/db/models/view.py`)

✅ **Structure complète** :
```python
class View(SQLModel, table=True):
    view_id: str          # ID unique (UUID)
    name: str             # Nom de la cohorte
    file_id: str          # Fichier associé
    filters: str          # JSON string des filtres
    description: str      # Description optionnelle
    created_at: datetime  # Date de création
    updated_at: datetime  # Date de mise à jour
```

✅ **Indexes** : `idx_view_id`, `idx_file_id` pour performance

✅ **Stockage** : Les filtres sont stockés en JSON dans la base de données

---

### 2. Backend - API Endpoints (`backend/app/api/views.py`)

✅ **CRUD complet** :

| Endpoint | Méthode | Fonctionnalité | Statut |
|----------|---------|----------------|--------|
| `/api/views` | POST | Créer une vue | ✅ |
| `/api/views` | GET | Lister les vues | ✅ |
| `/api/views/{view_id}` | GET | Obtenir une vue | ✅ |
| `/api/views/{view_id}` | PUT | Mettre à jour une vue | ✅ |
| `/api/views/{view_id}` | DELETE | Supprimer une vue | ✅ |
| `/api/views/{view_id}/apply` | POST | Appliquer une vue (retourne données filtrées) | ✅ |
| `/api/views/{view_id}/share` | GET | Générer un lien partageable | ✅ |

✅ **Format des filtres** :
```typescript
interface FilterCondition {
  column: string;    // 'numorden', 'sexo', 'edad', etc.
  operator: string;  // '=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN'
  value: string;     // Valeur du filtre
}
```

✅ **Logique d'application** : L'endpoint `/apply` reconstruit correctement les filtres et applique la requête SQLModel

---

### 3. Backend - Intégration (`backend/app/main.py`)

✅ Router `views` inclus dans l'application FastAPI
✅ Endpoints documentés dans la route `/`

---

## ❌ CE QUI MANQUE

### 1. Frontend - Lecture du paramètre `view_id` dans l'URL

**Problème** : Le frontend ne lit pas le paramètre `view_id` depuis l'URL

**Code actuel** (`frontend/src/pages/explorer.tsx:32`) :
```typescript
const { file_id } = router.query;
// ❌ view_id n'est pas extrait
```

**Impact** : Impossible de charger automatiquement une vue partagée via un lien

---

### 2. Frontend - Chargement d'une vue sauvegardée

**Problème** : Aucune fonction pour charger une vue depuis l'API

**Manque** :
- Fonction `loadView(view_id)` qui appelle `/api/views/{view_id}`
- Application automatique des filtres chargés
- Navigation vers le bon `file_id` si nécessaire

---

### 3. Frontend - Sauvegarde d'une vue/cohorte

**Problème** : Aucun bouton ou interface pour sauvegarder les filtres actuels

**Manque** :
- Bouton "Sauvegarder la vue" dans l'interface
- Modal/dialog pour nommer la vue et ajouter une description
- Fonction `saveView()` qui appelle `/api/views` (POST)
- Feedback visuel (succès/erreur)

---

### 4. Frontend - Liste des vues sauvegardées

**Problème** : Aucune interface pour voir et gérer les vues sauvegardées

**Manque** :
- Composant/section pour afficher la liste des vues
- Bouton pour charger une vue
- Bouton pour supprimer une vue
- Bouton pour partager (copier le lien)
- Filtrage par `file_id`

---

### 5. Frontend - Partage (génération et copie de lien)

**Problème** : Le backend génère le lien mais le frontend ne peut pas le copier

**Manque** :
- Fonction pour appeler `/api/views/{view_id}/share`
- Bouton "Partager" qui copie le lien dans le presse-papier
- Notification de succès après copie

---

### 6. Frontend - Application automatique des filtres

**Problème** : Même si on charge une vue, les filtres ne sont pas appliqués automatiquement

**Manque** :
- Application des filtres chargés dans l'état `filters`
- Rechargement des données avec les filtres appliqués
- Mise à jour des visualisations

---

## 🔧 MODIFICATIONS NÉCESSAIRES

### Priorité 1 : Chargement depuis l'URL (Partage)

**Fichier** : `frontend/src/pages/explorer.tsx`

**Modifications** :
1. Extraire `view_id` depuis `router.query`
2. Si `view_id` existe, charger la vue et appliquer les filtres
3. Rediriger vers le bon `file_id` si nécessaire

**Code à ajouter** :
```typescript
const { file_id, view_id } = router.query;

useEffect(() => {
  if (view_id && typeof view_id === 'string') {
    loadViewFromId(view_id);
  }
}, [view_id]);

const loadViewFromId = async (viewId: string) => {
  // Appeler /api/views/{view_id}
  // Appliquer les filtres
  // Naviguer vers le file_id si nécessaire
};
```

---

### Priorité 2 : Interface de sauvegarde

**Fichier** : `frontend/src/pages/explorer.tsx`

**Modifications** :
1. Ajouter un bouton "Sauvegarder la vue" près des filtres
2. Créer un modal pour nommer la vue
3. Implémenter `saveCurrentView()`

**UI à ajouter** :
- Bouton avec icône `Save` dans la section filtres
- Modal avec :
  - Champ "Nom de la vue"
  - Champ "Description" (optionnel)
  - Bouton "Sauvegarder"
  - Bouton "Annuler"

---

### Priorité 3 : Liste des vues sauvegardées

**Fichier** : `frontend/src/pages/explorer.tsx` (ou nouveau composant)

**Modifications** :
1. Créer une section "Vues sauvegardées"
2. Charger la liste via `/api/views?file_id={file_id}`
3. Afficher les vues avec actions (charger, supprimer, partager)

**UI à ajouter** :
- Section collapsible "Mes vues sauvegardées"
- Liste des vues avec :
  - Nom
  - Description
  - Date de création
  - Boutons : Charger | Partager | Supprimer

---

### Priorité 4 : Partage (copie de lien)

**Fichier** : `frontend/src/pages/explorer.tsx`

**Modifications** :
1. Fonction `shareView(view_id)` qui appelle `/api/views/{view_id}/share`
2. Copie du lien dans le presse-papier
3. Notification de succès

**Code à ajouter** :
```typescript
const shareView = async (viewId: string) => {
  const response = await fetch(`http://localhost:8000/api/views/${viewId}/share`);
  const data = await response.json();
  if (data.share_link) {
    await navigator.clipboard.writeText(data.share_link);
    // Afficher notification de succès
  }
};
```

---

## 📋 PLAN D'IMPLÉMENTATION

### Phase 1 : Chargement depuis URL (Partage) ⏱️ 2h
- [ ] Extraire `view_id` depuis `router.query`
- [ ] Créer `loadViewFromId(view_id)`
- [ ] Appliquer les filtres chargés
- [ ] Tester avec un lien partagé

### Phase 2 : Sauvegarde de vue ⏱️ 3h
- [ ] Ajouter bouton "Sauvegarder la vue"
- [ ] Créer modal de sauvegarde
- [ ] Implémenter `saveCurrentView()`
- [ ] Gérer les erreurs et feedback

### Phase 3 : Liste des vues ⏱️ 4h
- [ ] Créer section "Vues sauvegardées"
- [ ] Charger la liste depuis l'API
- [ ] Afficher les vues avec actions
- [ ] Implémenter chargement/suppression

### Phase 4 : Partage (copie lien) ⏱️ 1h
- [ ] Implémenter `shareView()`
- [ ] Ajouter bouton "Partager" sur chaque vue
- [ ] Copie dans presse-papier + notification

**Total estimé : 10 heures**

---

## 🎯 COMPATIBILITÉ FINALE ATTENDUE

Après implémentation, le projet sera **100% compatible** avec :

✅ Création de cohorte via filtres  
✅ Sauvegarde de la vue/cohorte  
✅ Stockage dans la base de données (JSON)  
✅ Réouverture depuis une liste  
✅ Génération de lien partageable  
✅ Partage à un autre utilisateur  
✅ Ouverture exacte de la même vue avec les mêmes filtres  

---

## 📝 NOTES TECHNIQUES

### Format des filtres sauvegardés

Les filtres sont stockés comme un tableau JSON :
```json
[
  {
    "column": "sexo",
    "operator": "=",
    "value": "F"
  },
  {
    "column": "edad",
    "operator": ">",
    "value": "40"
  }
]
```

### Lien partageable

Format généré par le backend :
```
http://localhost:3000/explorer?view_id={view_id}
```

Le frontend doit :
1. Détecter `view_id` dans l'URL
2. Charger la vue
3. Extraire `file_id` et `filters`
4. Appliquer les filtres
5. Recharger les données

### Gestion des erreurs

- Vue introuvable : Afficher message d'erreur
- Fichier supprimé : Afficher message + redirection
- Filtres invalides : Afficher message + ignorer les filtres invalides

---

## ✅ VALIDATION

Pour valider l'implémentation, tester ces scénarios :

1. **Création** : Créer une vue avec des filtres → Vérifier qu'elle apparaît dans la liste
2. **Chargement** : Cliquer sur une vue → Vérifier que les filtres sont appliqués
3. **Partage** : Générer un lien → Ouvrir dans un nouvel onglet → Vérifier que la vue se charge
4. **Modification** : Modifier une vue → Vérifier que les changements sont sauvegardés
5. **Suppression** : Supprimer une vue → Vérifier qu'elle disparaît de la liste

