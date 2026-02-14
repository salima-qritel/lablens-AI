# 🔧 PATCH : Implémentation Sauvegarde et Partage des Vues/Cohortes

Ce document contient les modifications de code exactes à appliquer pour rendre le projet compatible avec la sauvegarde et le partage des vues/cohortes.

---

## 📦 MODIFICATIONS FRONTEND

### 1. Modifier `frontend/src/pages/explorer.tsx`

#### 1.1 Ajouter les imports nécessaires

**À ajouter après les imports existants** (ligne ~13) :

```typescript
import { Bookmark, BookmarkCheck, Copy, Trash2, Share2 as ShareIcon } from 'lucide-react';
```

#### 1.2 Ajouter les états pour les vues

**À ajouter après les états existants** (après ligne ~61) :

```typescript
  // States for saved views
  const [savedViews, setSavedViews] = useState<any[]>([]);
  const [loadingViews, setLoadingViews] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [viewName, setViewName] = useState('');
  const [viewDescription, setViewDescription] = useState('');
  const [savingView, setSavingView] = useState(false);
  const [showViewsList, setShowViewsList] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
```

#### 1.3 Extraire `view_id` depuis l'URL

**Modifier la ligne 32** :

```typescript
// AVANT
const { file_id } = router.query;

// APRÈS
const { file_id, view_id } = router.query;
```

#### 1.4 Ajouter la fonction pour charger une vue depuis l'URL

**À ajouter après `loadVisualizationData`** (après ligne ~120) :

```typescript
  // Charger une vue sauvegardée depuis l'URL (partage)
  useEffect(() => {
    if (view_id && typeof view_id === 'string' && !loading) {
      loadViewFromId(view_id);
    }
  }, [view_id]);

  const loadViewFromId = async (viewId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/views/${viewId}`);
      if (!response.ok) {
        throw new Error('Vue non trouvée');
      }
      const data = await response.json();
      if (data.success && data.view) {
        const view = data.view;
        
        // Naviguer vers le bon file_id si nécessaire
        if (view.file_id !== file_id) {
          router.push(`/explorer?file_id=${view.file_id}&view_id=${viewId}`);
          return;
        }
        
        // Convertir les filtres au format FilterCondition
        const loadedFilters: FilterCondition[] = view.filters.map((f: any, idx: number) => ({
          id: `loaded-${idx}-${Date.now()}`,
          column: f.column,
          operator: f.operator,
          value: f.value
        }));
        
        // Appliquer les filtres
        setFilters(loadedFilters);
        setFilterMode('manual');
        
        // Recharger les données avec les filtres
        await loadDataFromBackend();
      }
    } catch (err: any) {
      setError(`Erreur lors du chargement de la vue : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
```

#### 1.5 Ajouter la fonction pour charger la liste des vues

**À ajouter après `loadViewFromId`** :

```typescript
  // Charger la liste des vues sauvegardées
  const loadSavedViews = async () => {
    if (!file_id) return;
    
    setLoadingViews(true);
    try {
      const response = await fetch(`http://localhost:8000/api/views?file_id=${file_id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSavedViews(data.views || []);
        }
      }
    } catch (err: any) {
      console.error('Error loading views:', err);
    } finally {
      setLoadingViews(false);
    }
  };

  // Charger les vues au montage et quand file_id change
  useEffect(() => {
    if (file_id) {
      loadSavedViews();
    }
  }, [file_id]);
```

#### 1.6 Ajouter la fonction pour sauvegarder la vue actuelle

**À ajouter après `loadSavedViews`** :

```typescript
  // Sauvegarder la vue actuelle
  const saveCurrentView = async () => {
    if (!file_id || !viewName.trim()) {
      setError('Veuillez entrer un nom pour la vue');
      return;
    }
    
    // Préparer les filtres à sauvegarder (uniquement ceux avec une valeur)
    const filtersToSave = filters.filter(f => f.value.trim());
    
    if (filtersToSave.length === 0) {
      setError('Aucun filtre à sauvegarder');
      return;
    }
    
    setSavingView(true);
    try {
      const response = await fetch('http://localhost:8000/api/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: viewName.trim(),
          file_id: file_id,
          filters: filtersToSave.map(f => ({
            column: f.column,
            operator: f.operator,
            value: f.value
          })),
          description: viewDescription.trim() || null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de la sauvegarde');
      }
      
      const data = await response.json();
      if (data.success) {
        // Réinitialiser le formulaire
        setViewName('');
        setViewDescription('');
        setShowSaveModal(false);
        
        // Recharger la liste des vues
        await loadSavedViews();
        
        // Afficher un message de succès (vous pouvez utiliser un toast)
        alert('Vue sauvegardée avec succès !');
      }
    } catch (err: any) {
      setError(`Erreur lors de la sauvegarde : ${err.message}`);
    } finally {
      setSavingView(false);
    }
  };
```

#### 1.7 Ajouter les fonctions pour gérer les vues (charger, supprimer, partager)

**À ajouter après `saveCurrentView`** :

```typescript
  // Charger une vue sauvegardée
  const loadSavedView = async (viewId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/views/${viewId}`);
      if (!response.ok) {
        throw new Error('Vue non trouvée');
      }
      const data = await response.json();
      if (data.success && data.view) {
        const view = data.view;
        
        // Convertir les filtres
        const loadedFilters: FilterCondition[] = view.filters.map((f: any, idx: number) => ({
          id: `loaded-${idx}-${Date.now()}`,
          column: f.column,
          operator: f.operator,
          value: f.value
        }));
        
        // Appliquer les filtres
        setFilters(loadedFilters);
        setFilterMode('manual');
        
        // Recharger les données
        await loadDataFromBackend();
        
        // Fermer la liste des vues
        setShowViewsList(false);
      }
    } catch (err: any) {
      setError(`Erreur lors du chargement : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une vue
  const deleteView = async (viewId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vue ?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:8000/api/views/${viewId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Recharger la liste
        await loadSavedViews();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (err: any) {
      setError(`Erreur lors de la suppression : ${err.message}`);
    }
  };

  // Partager une vue (copier le lien)
  const shareView = async (viewId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/views/${viewId}/share`);
      if (!response.ok) {
        throw new Error('Erreur lors de la génération du lien');
      }
      
      const data = await response.json();
      if (data.success && data.share_link) {
        // Copier dans le presse-papier
        await navigator.clipboard.writeText(data.share_link);
        setCopiedLink(viewId);
        
        // Réinitialiser après 2 secondes
        setTimeout(() => setCopiedLink(null), 2000);
        
        alert('Lien copié dans le presse-papier !');
      }
    } catch (err: any) {
      setError(`Erreur lors du partage : ${err.message}`);
    }
  };
```

#### 1.8 Ajouter l'UI pour sauvegarder une vue

**À ajouter dans la section des filtres** (chercher la section avec les boutons de filtres, environ ligne ~650) :

```typescript
{/* Bouton Sauvegarder la vue */}
<div className="flex items-center gap-2">
  <button
    onClick={() => setShowSaveModal(true)}
    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
    disabled={filters.filter(f => f.value).length === 0}
  >
    <Save className="w-4 h-4" />
    <span>Sauvegarder la vue</span>
  </button>
  
  {/* Bouton Liste des vues */}
  <button
    onClick={() => setShowViewsList(!showViewsList)}
    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
  >
    <Bookmark className="w-4 h-4" />
    <span>Mes vues ({savedViews.length})</span>
  </button>
</div>
```

#### 1.9 Ajouter le modal de sauvegarde

**À ajouter avant le `</div>` de fermeture principal** (vers la fin du composant, avant la dernière ligne) :

```typescript
{/* Modal de sauvegarde */}
{showSaveModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <h3 className="text-xl font-bold mb-4">Sauvegarder la vue</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nom de la vue *</label>
          <input
            type="text"
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            placeholder="Ex: Femmes > 40 ans"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Description (optionnel)</label>
          <textarea
            value={viewDescription}
            onChange={(e) => setViewDescription(e.target.value)}
            placeholder="Description de cette cohorte..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="text-sm text-gray-600">
          <p>Filtres à sauvegarder : {filters.filter(f => f.value).length}</p>
        </div>
      </div>
      
      <div className="flex gap-2 mt-6">
        <button
          onClick={saveCurrentView}
          disabled={savingView || !viewName.trim()}
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {savingView ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        <button
          onClick={() => {
            setShowSaveModal(false);
            setViewName('');
            setViewDescription('');
          }}
          className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
        >
          Annuler
        </button>
      </div>
    </div>
  </div>
)}
```

#### 1.10 Ajouter la liste des vues sauvegardées

**À ajouter après le modal de sauvegarde** :

```typescript
{/* Liste des vues sauvegardées */}
{showViewsList && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Mes vues sauvegardées</h3>
        <button
          onClick={() => setShowViewsList(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {loadingViews ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      ) : savedViews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Bookmark className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Aucune vue sauvegardée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedViews.map((view) => (
            <div
              key={view.view_id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{view.name}</h4>
                  {view.description && (
                    <p className="text-sm text-gray-600 mt-1">{view.description}</p>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    <p>Créée le : {new Date(view.created_at).toLocaleDateString('fr-FR')}</p>
                    <p>Filtres : {view.filters?.length || 0}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => loadSavedView(view.view_id)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    title="Charger cette vue"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => shareView(view.view_id)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                    title="Partager"
                  >
                    {copiedLink === view.view_id ? (
                      <BookmarkCheck className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteView(view.view_id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}
```

---

## 🧪 TESTS À EFFECTUER

### Test 1 : Sauvegarde d'une vue
1. Appliquer des filtres (ex: sexo = F, edad > 40)
2. Cliquer sur "Sauvegarder la vue"
3. Entrer un nom et description
4. Vérifier que la vue apparaît dans "Mes vues"

### Test 2 : Chargement d'une vue
1. Ouvrir "Mes vues"
2. Cliquer sur "Charger" (icône Play)
3. Vérifier que les filtres sont appliqués
4. Vérifier que les données sont filtrées correctement

### Test 3 : Partage d'une vue
1. Cliquer sur "Partager" (icône Copy)
2. Vérifier que le lien est copié
3. Ouvrir le lien dans un nouvel onglet
4. Vérifier que la vue se charge automatiquement

### Test 4 : Suppression d'une vue
1. Cliquer sur "Supprimer" (icône Trash)
2. Confirmer la suppression
3. Vérifier que la vue disparaît de la liste

### Test 5 : Chargement depuis URL
1. Copier un lien partagé
2. Ouvrir dans un navigateur privé
3. Vérifier que la vue se charge automatiquement
4. Vérifier que les filtres sont appliqués

---

## 📝 NOTES IMPORTANTES

1. **Gestion des erreurs** : Toutes les fonctions incluent une gestion d'erreur basique. Vous pouvez améliorer avec un système de toast/notifications.

2. **URLs** : Les URLs hardcodées (`http://localhost:8000`) devraient être remplacées par des variables d'environnement.

3. **Performance** : La liste des vues est chargée à chaque changement de `file_id`. Vous pouvez ajouter un cache si nécessaire.

4. **UX** : Les alertes `alert()` peuvent être remplacées par un système de notifications plus élégant (ex: react-hot-toast).

5. **Validation** : Ajouter une validation côté frontend pour éviter les appels API inutiles.

---

## ✅ CHECKLIST D'IMPLÉMENTATION

- [ ] Ajouter les imports (lucide-react)
- [ ] Ajouter les états pour les vues
- [ ] Extraire `view_id` depuis `router.query`
- [ ] Implémenter `loadViewFromId()`
- [ ] Implémenter `loadSavedViews()`
- [ ] Implémenter `saveCurrentView()`
- [ ] Implémenter `loadSavedView()`
- [ ] Implémenter `deleteView()`
- [ ] Implémenter `shareView()`
- [ ] Ajouter les boutons dans l'UI
- [ ] Ajouter le modal de sauvegarde
- [ ] Ajouter la liste des vues
- [ ] Tester tous les scénarios
- [ ] Gérer les erreurs
- [ ] Améliorer l'UX (notifications, loading states)

---

**Temps estimé d'implémentation : 10 heures**

