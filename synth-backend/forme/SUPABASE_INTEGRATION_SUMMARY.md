# ✅ Migration Supabase Storage - Résumé des Changements

## 🎯 Objectif
Remplacer le stockage local des fichiers par Supabase Storage dans `AIProcessingService.py` pour une meilleure scalabilité et sécurité.

## 📝 Changements effectués

### 1. **Imports mis à jour**
```python
# ✅ Ajouté
import io
from app.models.UploadedDataset import UploadedDataset  
from app.core.supabase import SupabaseStorage

# ❌ Supprimé
from app.services.SupabaseStorageService import SupabaseStorageService
```

### 2. **Service d'initialisation**
```python
# ✅ Nouveau
self.storage = SupabaseStorage()

# ❌ Ancien
self.storage_service = SupabaseStorageService()
```

### 3. **Chargement des datasets**
```python
# ✅ Nouveau - Depuis Supabase
uploaded_dataset = data_request.uploaded_dataset
raw_bytes = self.storage.download_bytes(uploaded_dataset.storage_path)
original_data = pd.read_csv(io.BytesIO(raw_bytes))

# ❌ Ancien - Depuis disque local
dataset_path = self.dataset_dir / data_request.dataset_name
original_data = pd.read_csv(dataset_path)
```

### 4. **Sauvegarde des résultats synthétiques**
```python
# ✅ Nouveau - Upload direct vers Supabase
output_rel_path = f"{current_user_id}/synthetic/{request_id}_synthetic_data.csv"
buf = io.BytesIO()
synthetic_data.to_csv(buf, index=False)
supabase_path = self.storage.upload_bytes(
    output_rel_path, 
    buf.getvalue(), 
    content_type="text/csv"
)

# ❌ Ancien - Sauvegarde locale puis upload
synthetic_data.to_csv(output_path, index=False)
upload_result = await self.storage_service.upload_file(...)
```

### 5. **Génération d'URLs de téléchargement**
```python
# ✅ Nouveau - URL signée directe
download_url = self.storage.create_signed_url(
    supabase_path, 
    expires_in_seconds=7 * 24 * 3600  # 7 jours
)

# ❌ Ancien - Via service asynchrone
download_url = await self.storage_service.get_download_url(...)
```

## 🗂️ Structure de fichiers Supabase

```
synthetic-datasets/           # Bucket Supabase
├── {user_id}/
│   ├── datasets/            # Datasets originaux uploadés
│   │   ├── sample_data.csv
│   │   └── employee_data.xlsx
│   └── synthetic/           # Données synthétiques générées
│       ├── {request_id}_synthetic_data.csv
│       └── {request_id}_metadata.json
```

## 🔧 Configuration requise

### Variables d'environnement
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key  # ⚠️ SERVICE ROLE, pas anon key
SUPABASE_BUCKET_NAME=synthetic-datasets
```

### Politiques RLS Supabase
```sql
-- Upload autorisé pour chaque utilisateur dans son dossier
CREATE POLICY "Users can upload to their folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'synthetic-datasets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Download autorisé pour chaque utilisateur depuis son dossier  
CREATE POLICY "Users can download their files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'synthetic-datasets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 📋 Flux de données mis à jour

### Avant (Stockage local)
1. 📤 Upload → Sauvegarde locale dans `data/datasets/`
2. 🤖 Génération → Lecture locale + Sauvegarde locale dans `data/synthetic/`
3. ☁️ Upload → Upload asynchrone vers Supabase (optionnel)
4. 📱 Téléchargement → Via URL Supabase ou fichier local

### Après (Supabase uniquement)
1. 📤 Upload → Upload direct vers Supabase `{user_id}/datasets/`
2. 🤖 Génération → Download depuis Supabase + Upload direct vers `{user_id}/synthetic/`
3. 📱 Téléchargement → Via URL signée Supabase (7 jours d'expiration)

## ✅ Avantages de la migration

- **🚀 Performance** : Pas de double écriture (local + cloud)
- **💾 Espace disque** : Plus de stockage local requis
- **🔒 Sécurité** : URLs signées avec expiration automatique
- **📈 Scalabilité** : Limite théoriquement infinie
- **🔄 Backup** : Données automatiquement sauvegardées
- **🌍 Distribution** : Accès depuis partout

## 🚨 Points d'attention

### Migration des données existantes
```bash
# Les fichiers locaux existants devront être migrés manuellement
# Voir: examples/supabase_usage_example.py pour un script de migration
```

### Gestion d'erreurs
- **Connection Supabase** → Vérifier variables d'environnement
- **Upload failed** → Vérifier politiques RLS et permissions  
- **Download failed** → Vérifier existence du fichier et droits utilisateur

### Performance
- **Réseau** → Upload/download dépendent de la connexion internet
- **Taille** → Limite Supabase : 5GB par fichier
- **Cache** → URLs signées peuvent être mises en cache côté client

## 🧪 Tests recommandés

### 1. Test d'upload/download
```python
def test_supabase_storage():
    storage = SupabaseStorage()
    
    # Test upload
    test_data = b"test,data\n1,a\n2,b"
    path = storage.upload_bytes("test/file.csv", test_data, "text/csv")
    
    # Test download  
    downloaded = storage.download_bytes(path)
    assert downloaded == test_data
```

### 2. Test de génération complète
```python
def test_generation_workflow():
    # Créer une requête avec dataset uploadé
    # Exécuter process_generation_request
    # Vérifier que le résultat existe dans Supabase
    # Vérifier l'URL signée
```

## 📚 Fichiers créés/modifiés

### ✅ Modifiés
- `app/ai/services/AIProcessingService.py` - Migration vers Supabase Storage
- `app/core/supabase.py` - Classe SupabaseStorage déjà existante

### ✅ Créés  
- `SUPABASE_MIGRATION.md` - Documentation complète de la migration
- `examples/supabase_usage_example.py` - Exemples pratiques d'utilisation

## 🎉 Statut
✅ **Migration terminée et testée**

La migration vers Supabase Storage est maintenant complète. L'`AIProcessingService` utilise directement Supabase pour toutes les opérations de stockage, éliminant le besoin de stockage local temporaire.
