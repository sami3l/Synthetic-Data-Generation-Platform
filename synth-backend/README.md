# Backend - Plateforme de Génération de Données Synthétiques

## 🎯 Vue d'ensemble

Backend FastAPI pour une plateforme complète de génération de données synthétiques utilisant l'intelligence artificielle. La plateforme supporte plusieurs modèles d'IA (CTGAN, TVAE, Bayesian Optimization) avec des fonctionnalités avancées d'optimisation et de stockage cloud.

## 🚀 Fonctionnalités Principales

### 🤖 Génération de Données Synthétiques
- **Modèles IA supportés:**
  - CTGAN (Conditional Tabular GAN)
  - TVAE (Tabular Variational AutoEncoder)
  - Optimisation Bayésienne

### 📊 Optimisation des Hyperparamètres
- Grid Search
- Random Search
- Optimisation Bayésienne avec scikit-optimize
- Configuration flexible des paramètres

### � Gestion des Données
- Upload multi-format (CSV, JSON, Excel, Parquet)
- Validation et analyse automatique des datasets
- Stockage sécurisé avec Supabase
- Génération d'URLs de téléchargement temporaires

### 🔐 Sécurité et Authentification
- JWT Authentication
- Gestion des rôles (utilisateur/admin)
- Middleware de sécurité
- Limitation de taille des requêtes

### 📈 Monitoring et Analytics
- Logging complet des requêtes
- Statistiques de performance
- Dashboard analytique
- Export des données utilisateur

## 🛠 Architecture Technique

### Stack Technologique
- **Framework:** FastAPI 0.104.1
- **Base de données:** PostgreSQL avec SQLAlchemy 2.0
- **IA/ML:** SDV, scikit-optimize, pandas, numpy
- **Stockage:** Supabase Storage
- **Authentification:** JWT avec python-jose
- **Migration:** Alembic

### Structure du Projet
```
synth-backend/
├── app/
│   ├── main.py              # Application principale
│   ├── core/                # Configuration et middleware
│   ├── models/              # Modèles SQLAlchemy
│   ├── routers/             # Routes API
│   ├── services/            # Services métier
│   ├── schemas/             # Schémas Pydantic
│   ├── db/                  # Configuration base de données
│   └── dependencies/        # Dépendances FastAPI
├── alembic/                 # Migrations
├── requirements.txt         # Dépendances Python
├── dev.py                   # Script de développement
└── .env.example            # Variables d'environnement
```

## 🚀 Installation et Configuration

### 1. Prérequis
```bash
Python 3.9+
PostgreSQL 12+
```

### 2. Configuration de l'environnement
```bash
# Cloner et naviguer
cd synth-backend

# Copier le fichier de configuration
copy .env.example .env

# Configurer les variables dans .env:
# - DATABASE_URL
# - SUPABASE_URL et SUPABASE_KEY
# - SECRET_KEY pour JWT
```

### 3. Installation automatisée
```bash
# Setup complet de l'environnement de développement
python dev.py setup
```

### 4. Installation manuelle
```bash
# Installer les dépendances
pip install -r requirements.txt

# Exécuter les migrations
alembic upgrade head

# Démarrer le serveur
python -m uvicorn app.main:app --reload
```

## 📋 Commandes de Développement

Le script `dev.py` fournit des commandes utiles:

```bash
# Configuration complète
python dev.py setup

# Démarrer le serveur
python dev.py server

=> uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Créer une migration
python dev.py new-migration -m "Description de la migration"

# Appliquer les migrations
python dev.py migrate

```

## 🔧 Configuration

### Variables d'environnement principales
```env
# Base de données
DATABASE_URL=postgresql://user:pass@localhost:5432/synth_db
ASYNC_DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/synth_db

# JWT
SECRET_KEY=your-super-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_BUCKET_NAME=synthetic-datasets

# Limites
MAX_FILE_SIZE_MB=500
MAX_SAMPLE_SIZE=100000
```

## � API Documentation

### Endpoints principaux

#### 🔐 Authentification
- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion
- `GET /auth/me` - Profil utilisateur

#### 📤 Upload de Données
- `POST /upload/dataset` - Upload d'un dataset
- `GET /upload/datasets` - Liste des datasets

#### 🤖 Génération
- `POST /generation/start` - Démarrer la génération
- `GET /generation/status/{request_id}` - Statut de génération
- `GET /generation/download/{request_id}` - Télécharger les résultats

#### 📊 Statistiques
- `GET /stats/dashboard` - Dashboard utilisateur
- `GET /stats/system` - Statistiques système (admin)
- `GET /stats/performance` - Métriques de performance

### Documentation interactive
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🎯 Modèles de Données Synthétiques

### CTGAN (Conditional Tabular GAN)
```python
{
    "model_type": "ctgan",
    "epochs": 100,
    "batch_size": 500,
    "generator_dim": [256, 256],
    "discriminator_dim": [256, 256]
}
```

### TVAE (Tabular Variational AutoEncoder)
```python
{
    "model_type": "tvae",
    "epochs": 100,
    "batch_size": 500,
    "embedding_dim": 128,
    "compress_dims": [128, 128]
}
```

### Optimisation Bayésienne
```python
{
    "model_type": "ctgan",
    "optimization_method": "bayesian",
    "n_trials": 50,
    "optimization_metric": "quality_score"
}
```

## 📈 Performance et Monitoring

### Métriques surveillées
- Temps de réponse des API
- Taux de succès des générations
- Utilisation des modèles IA
- Performance par type de dataset

### Logs
- Toutes les requêtes HTTP
- Erreurs et exceptions
- Métriques de génération
- Activité utilisateur

## 🔒 Sécurité

### Mesures implémentées
- Headers de sécurité automatiques
- Validation des uploads
- Limitation de taille des fichiers
- Authentification JWT
- CORS configuré

### Bonnes pratiques
- Rotation des clés JWT
- Validation des données d'entrée
- Nettoyage régulier des fichiers temporaires
- Monitoring des tentatives d'intrusion

## 🐛 Debugging et Tests

### Logs de développement
```bash
# Activer le mode debug
export DEBUG=True

# Logs détaillés
tail -f logs/app.log
```

### Tests
```bash
# Exécuter tous les tests
python dev.py test

# Tests spécifiques
pytest tests/test_generation.py -v
```

## 🚀 Déploiement

### Production
1. Configurer les variables d'environnement
2. Utiliser un serveur WSGI (Gunicorn)
3. Configurer un proxy reverse (Nginx)
4. Activer HTTPS
5. Configurer les sauvegardes de base de données

### Docker (recommandé)
```bash
# Build de l'image
docker build -t synth-backend .

# Démarrage avec docker-compose
docker-compose up -d
```

## � Support et Contribution

### Développement
- Code formaté avec Black
- Linting avec Flake8
- Type checking avec MyPy
- Tests avec Pytest

### Issues communes
1. **Erreur de connexion DB:** Vérifier DATABASE_URL
2. **Upload échoue:** Vérifier SUPABASE_KEY et permissions
3. **Génération lente:** Réduire epochs ou batch_size
4. **Mémoire insuffisante:** Limiter sample_size

---

**Version:** 1.0.0  
**Dernière mise à jour:** Décembre 2024
