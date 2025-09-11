# Migration vers Supabase Storage - AIProcessingService

## 🎯 Changements effectués

### 1. Imports modifiés
```python
# Ajouté
import io
from app.models.UploadedDataset import UploadedDataset
from app.core.supabase import SupabaseStorage

# Supprimé
from app.services.SupabaseStorageService import SupabaseStorageService
```

### 2. Initialisation du service
```python
# Avant
self.storage_service = SupabaseStorageService()

# Après
self.storage = SupabaseStorage()
```

### 3. Chargement des données
```python
# Avant - Lecture depuis le disque local
dataset_path = self.dataset_dir / data_request.dataset_name
original_data = pd.read_csv(dataset_path)

# Après - Téléchargement depuis Supabase
uploaded_dataset = data_request.uploaded_dataset
raw_bytes = self.storage.download_bytes(uploaded_dataset.storage_path)
original_data = pd.read_csv(io.BytesIO(raw_bytes))
```
### 4. Sauvegarde des données synthétiques
```python
# Avant - Sauvegarde locale puis upload
synthetic_data.to_csv(output_path, index=False)
upload_result = await self.storage_service.upload_file(...)

# Après - Upload direct vers Supabase
buf = io.BytesIO()
synthetic_data.to_csv(buf, index=False)
supabase_path = self.storage.upload_bytes(
    output_rel_path, 
    buf.getvalue(), 
    content_type="text/csv"
)
```

## 🔧 Configuration requise

### Variables d'environnement Supabase
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key  # Important: Service role, pas anon key
SUPABASE_BUCKET_NAME=synthetic-datasets
```

### Politiques Supabase Storage (RLS)
```sql
-- Permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Users can upload their own datasets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'synthetic-datasets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permettre le téléchargement
CREATE POLICY "Users can download their own datasets" ON storage.objects
FOR SELECT USING (
  bucket_id = 'synthetic-datasets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 📁 Structure de stockage Supabase

```
synthetic-datasets/
├── {user_id}/
│   ├── datasets/
│   │   ├── {upload_id}_original.csv
│   │   └── {upload_id}_processed.json
│   └── synthetic/
│       ├── {request_id}_synthetic_data.csv
│       └── {request_id}_metadata.json
```

## 🔄 Flux de données mis à jour

### 1. Upload d'un dataset
1. L'utilisateur upload un fichier via l'API `/upload/dataset`
2. Le fichier est stocké dans `{user_id}/datasets/{upload_id}_{filename}`
3. Le chemin Supabase est enregistré dans `UploadedDataset.storage_path`

### 2. Génération de données synthétiques
1. Récupération du `DataRequest` avec la relation `uploaded_dataset`
2. Téléchargement du dataset original depuis `uploaded_dataset.storage_path`
3. Traitement et génération des données synthétiques
4. Upload direct du résultat vers `{user_id}/synthetic/{request_id}_synthetic_data.csv`
5. Génération d'une URL signée pour le téléchargement (expires en 7 jours)

### 3. Téléchargement des résultats
1. L'utilisateur accède au résultat via l'URL signée
2. L'URL expire automatiquement après 7 jours pour la sécurité

## 🚨 Points d'attention

### Migration des données existantes
Si vous avez des données déjà stockées localement, vous devrez les migrer :

```python
# Script de migration (exemple)
import os
from pathlib import Path
from app.core.supabase import SupabaseStorage

def migrate_local_to_supabase():
    storage = SupabaseStorage()
    local_synthetic_dir = Path("data/synthetic")
    
    for file_path in local_synthetic_dir.glob("*.csv"):
        # Lire le fichier local
        with open(file_path, 'rb') as f:
            file_data = f.read()
        
        # Upload vers Supabase
        supabase_path = f"migration/synthetic/{file_path.name}"
        storage.upload_bytes(supabase_path, file_data, "text/csv")
        
        print(f"Migrated: {file_path} -> {supabase_path}")
```

### Gestion d'erreurs
- **Connexion Supabase échoue :** Vérifier les variables d'environnement
- **Upload échoue :** Vérifier les politiques RLS et les permissions
- **Download échoue :** Vérifier que le fichier existe et que l'utilisateur a les droits

### Performance
- **Upload/Download plus lent :** Normal pour les gros fichiers, considérer la compression
- **URLs signées :** Utilisez un cache si vous générez souvent les mêmes URLs
- **Limite de taille :** Supabase a une limite de 5GB par fichier

## 🧪 Tests

### Test de l'upload
```python
def test_synthetic_data_upload():
    storage = SupabaseStorage()
    
    # Créer des données de test
    test_data = pd.DataFrame({
        'col1': [1, 2, 3],
        'col2': ['a', 'b', 'c']
    })
    
    # Convertir en bytes
    buf = io.BytesIO()
    test_data.to_csv(buf, index=False)
    
    # Upload
    path = storage.upload_bytes(
        "test/synthetic_data.csv",
        buf.getvalue(),
        "text/csv"
    )
    
    assert path == "test/synthetic_data.csv"
```

### Test du download
```python
def test_synthetic_data_download():
    storage = SupabaseStorage()
    
    # Download
    raw_bytes = storage.download_bytes("test/synthetic_data.csv")
    data = pd.read_csv(io.BytesIO(raw_bytes))
    
    assert len(data) == 3
    assert 'col1' in data.columns
```

## 📈 Avantages de la migration

1. **Scalabilité :** Pas de limite d'espace disque local
2. **Sécurité :** URLs signées avec expiration automatique
3. **Backup :** Données automatiquement sauvegardées chez Supabase
4. **Distribution :** Accès depuis n'importe où via HTTP
5. **Simplicité :** Plus besoin de gérer le stockage local

## 🔗 Liens utiles

- [Documentation Supabase Storage](https://supabase.com/docs/guides/storage)
- [Politiques RLS Storage](https://supabase.com/docs/guides/storage/security/access-control)
- [Python SDK Supabase](https://github.com/supabase/supabase-py)
