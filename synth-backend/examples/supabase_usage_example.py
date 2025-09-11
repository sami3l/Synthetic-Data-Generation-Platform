"""
Exemple d'utilisation de l'AIProcessingService avec Supabase Storage
"""
import asyncio
import pandas as pd
import io
from sqlalchemy.orm import Session
from app.ai.services.AIProcessingService import AIProcessingService
from app.core.supabase import SupabaseStorage
from app.db.database import get_db

async def example_complete_workflow():
    """
    Exemple complet du workflow de génération de données synthétiques
    """
    # Initialiser les services
    ai_service = AIProcessingService()
    storage = SupabaseStorage()
    
    # Simuler une session DB (remplacez par votre méthode)
    db: Session = next(get_db())
    
    try:
        # 1. Simuler l'upload d'un dataset original
        print("📤 Étape 1: Upload du dataset original")
        
        # Créer des données de test
        original_data = pd.DataFrame({
            'age': [25, 30, 35, 40, 45, 50],
            'salary': [35000, 45000, 55000, 65000, 75000, 85000],
            'department': ['IT', 'HR', 'Finance', 'IT', 'HR', 'Finance'],
            'experience': [2, 5, 8, 12, 15, 20]
        })
        
        # Convertir en CSV bytes
        csv_buffer = io.BytesIO()
        original_data.to_csv(csv_buffer, index=False)
        csv_bytes = csv_buffer.getvalue()
        
        # Upload vers Supabase
        user_id = 123  # Exemple d'ID utilisateur
        upload_path = f"{user_id}/datasets/sample_employee_data.csv"
        
        uploaded_path = storage.upload_bytes(
            upload_path,
            csv_bytes,
            content_type="text/csv"
        )
        
        print(f"✅ Dataset uploadé vers: {uploaded_path}")
        
        # 2. Vérifier le téléchargement
        print("\n📥 Étape 2: Vérification du téléchargement")
        
        downloaded_bytes = storage.download_bytes(uploaded_path)
        downloaded_data = pd.read_csv(io.BytesIO(downloaded_bytes))
        
        print(f"✅ Dataset téléchargé: {len(downloaded_data)} lignes, {len(downloaded_data.columns)} colonnes")
        print("Aperçu des données:")
        print(downloaded_data.head())
        
        # 3. Créer une requête de génération (simulée)
        print("\n🤖 Étape 3: Génération de données synthétiques")
        
        # Dans un vrai scénario, vous auriez déjà:
        # - Un DataRequest créé via l'API
        # - Un UploadedDataset lié avec storage_path
        # - Des RequestParameters configurés
        
        # Pour cet exemple, nous simulons juste le processus de génération
        request_id = 456  # Exemple d'ID de requête
        
        print(f"🔄 Traitement de la requête {request_id}...")
        
        # Ici, dans un vrai scénario, vous appelleriez:
        # result = await ai_service.process_generation_request(
        #     db=db,
        #     request_id=request_id,
        #     current_user_id=user_id
        # )
        
        # 4. Simuler la génération et l'upload du résultat
        print("\n💾 Étape 4: Sauvegarde du résultat synthétique")
        
        # Simuler des données synthétiques générées
        synthetic_data = pd.DataFrame({
            'age': [28, 33, 37, 42, 48, 52],
            'salary': [38000, 47000, 58000, 67000, 77000, 87000],
            'department': ['IT', 'Finance', 'HR', 'IT', 'Finance', 'HR'],
            'experience': [3, 6, 9, 13, 16, 21]
        })
        
        # Convertir en CSV bytes
        synthetic_buffer = io.BytesIO()
        synthetic_data.to_csv(synthetic_buffer, index=False)
        synthetic_bytes = synthetic_buffer.getvalue()
        
        # Upload du résultat synthétique
        synthetic_path = f"{user_id}/synthetic/{request_id}_synthetic_data.csv"
        
        uploaded_synthetic_path = storage.upload_bytes(
            synthetic_path,
            synthetic_bytes,
            content_type="text/csv"
        )
        
        print(f"✅ Données synthétiques sauvegardées: {uploaded_synthetic_path}")
        
        # 5. Générer une URL signée pour le téléchargement
        print("\n🔗 Étape 5: Génération de l'URL de téléchargement")
        
        download_url = storage.create_signed_url(
            uploaded_synthetic_path,
            expires_in_seconds=7 * 24 * 3600  # 7 jours
        )
        
        print(f"✅ URL de téléchargement générée (expire dans 7 jours)")
        print(f"🔗 URL: {download_url[:100]}...")
        
        # 6. Tester le téléchargement via l'URL
        print("\n🧪 Étape 6: Test de téléchargement via URL signée")
        
        # Dans une vraie application, l'utilisateur utiliserait cette URL
        # pour télécharger le fichier depuis son application mobile/web
        
        downloaded_synthetic_bytes = storage.download_bytes(uploaded_synthetic_path)
        downloaded_synthetic_data = pd.read_csv(io.BytesIO(downloaded_synthetic_bytes))
        
        print(f"✅ Résultat téléchargé: {len(downloaded_synthetic_data)} lignes")
        print("Aperçu des données synthétiques:")
        print(downloaded_synthetic_data.head())
        
        # 7. Résumé final
        print("\n📊 Résumé du workflow:")
        print("=" * 50)
        print(f"📁 Dataset original: {upload_path}")
        print(f"🤖 Données synthétiques: {synthetic_path}")
        print(f"🔗 URL de téléchargement: Générée avec succès")
        print(f"⏰ Expiration: 7 jours")
        print("✅ Workflow complet réussi!")
        
        return {
            "original_path": upload_path,
            "synthetic_path": synthetic_path,
            "download_url": download_url,
            "original_data_size": len(original_data),
            "synthetic_data_size": len(synthetic_data)
        }
        
    except Exception as e:
        print(f"❌ Erreur durant le workflow: {str(e)}")
        raise
    finally:
        db.close()

async def example_load_and_generate():
    """
    Exemple simplifié de chargement de données et génération
    """
    storage = SupabaseStorage()
    
    # Exemple de chemin d'un dataset déjà uploadé
    dataset_path = "123/datasets/employee_data.csv"
    
    try:
        # Charger les données depuis Supabase
        print(f"📥 Chargement du dataset: {dataset_path}")
        raw_bytes = storage.download_bytes(dataset_path)
        original_data = pd.read_csv(io.BytesIO(raw_bytes))
        
        print(f"✅ Dataset chargé: {len(original_data)} lignes")
        
        # Simuler la génération (dans la vraie vie, ceci serait fait par les modèles IA)
        print("🤖 Génération de données synthétiques...")
        
        # Ici vous utiliseriez vos modèles CTGAN/TVAE
        # synthetic_data = model.generate(sample_size=len(original_data))
        
        # Pour cet exemple, on créé des données factices
        synthetic_data = original_data.copy()
        # Ajouter un peu de bruit pour simuler des données synthétiques
        if 'age' in synthetic_data.columns:
            synthetic_data['age'] = synthetic_data['age'] + 1
        
        # Sauvegarder le résultat
        user_id = 123
        request_id = 789
        output_path = f"{user_id}/synthetic/{request_id}_synthetic_data.csv"
        
        buf = io.BytesIO()
        synthetic_data.to_csv(buf, index=False)
        
        uploaded_path = storage.upload_bytes(
            output_path,
            buf.getvalue(),
            content_type="text/csv"
        )
        
        print(f"✅ Données synthétiques sauvegardées: {uploaded_path}")
        
        # Générer URL de téléchargement
        download_url = storage.create_signed_url(uploaded_path)
        print(f"🔗 URL de téléchargement: {download_url[:50]}...")
        
        return {
            "input_path": dataset_path,
            "output_path": uploaded_path,
            "download_url": download_url
        }
        
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")
        raise

if __name__ == "__main__":
    print("🚀 Démarrage des exemples d'utilisation Supabase Storage")
    print("=" * 60)
    
    # Exemple complet
    print("\n🔥 Exemple 1: Workflow complet")
    result1 = asyncio.run(example_complete_workflow())
    
    print("\n" + "=" * 60)
    
    # Exemple simplifié
    print("\n⚡ Exemple 2: Chargement et génération simplifiés")
    try:
        result2 = asyncio.run(example_load_and_generate())
        print("✅ Tous les exemples ont réussi!")
    except Exception as e:
        print(f"⚠️ Exemple 2 échoué (probablement fichier inexistant): {e}")
    
    print("\n🎉 Exemples terminés!")
