# Backend - Synthetic Data Generation Platform

## 🎯 Vue d'ensemble

API Backend FastAPI pour une plateforme complète de génération de données synthétiques utilisant l'intelligence artificielle. Cette plateforme supporte plusieurs modèles d'IA (CTGAN, TVAE) avec des fonctionnalités avancées d'optimisation bayésienne et de stockage cloud via Supabase.

La plateforme est conçue pour permettre aux utilisateurs de :
- Uploader des datasets dans différents formats
- Configurer des modèles de génération de données synthétiques
- Optimiser automatiquement les hyperparamètres
- Télécharger les données générées
- Suivre les performances et les métriques

## 🚀 Fonctionnalités Principales

### 🤖 Génération de Données Synthétiques
- **Modèles IA supportés :**
  - **CTGAN** (Conditional Tabular GAN) - Génération conditionnelle de données tabulaires
  - **TVAE** (Tabular Variational AutoEncoder) - Génération basée sur les autoencodeurs variationnels
- **Optimisation Bayésienne** - Optimisation automatique des hyperparamètres    
- **Configuration flexible** - Paramètres personnalisables par modèle

### 📊 Optimisation des Hyperparamètres  
- **Grid Search** - Recherche exhaustive dans une grille de paramètres
- **Random Search** - Recherche aléatoire optimisée
- **Optimisation Bayésienne** avec scikit-optimize pour une recherche intelligente
- **Métriques de qualité** automatiques pour évaluer les résultats

### 📁 Gestion des Données
- **Upload multi-format :** CSV, JSON, Excel (.xlsx), 
- **Validation automatique** des datasets uploadés
- **Analyse des types de données** et détection des colonnes catégorielles
- **Stockage sécurisé** avec Supabase Storage
- **URLs temporaires** pour téléchargement sécurisé des résultats

### 🔐 Sécurité et Authentification
- **JWT Authentication** avec tokens d'accès et de rafraîchissement
- **Gestion des rôles** (utilisateur standard/administrateur)
- **Middleware de sécurité** avec headers automatiques
- **Limitation de taille** des requêtes et fichiers uploadés
- **CORS configuré** pour l'intégration frontend

### 📈 Monitoring et Analytics
- **Logging complet** de toutes les requêtes et opérations
- **Statistiques de performance** en temps réel
- **Dashboard analytique** pour les administrateurs
- **Suivi des requêtes** par utilisateur
- **Métriques de génération** et d'optimisation

### 👥 Gestion des Utilisateurs et Administration
- **Profils utilisateur** avec informations détaillées
- **Système de notifications** push intégré
- **Logs d'actions admin** pour traçabilité
- **Gestion des datasets** uploadés par utilisateur
- **Approbation des requêtes** par les administrateurs

## 🛠 Architecture Technique

### Stack Technologique
- **Framework :** FastAPI avec support asynchrone
- **Base de données :** PostgreSQL avec SQLAlchemy 2.0
- **IA/ML :** SDV (Synthetic Data Vault), scikit-optimize, pandas, numpy
- **Stockage cloud :** Supabase Storage
- **Authentification :** JWT avec python-jose[cryptography]
- **Migrations :** Alembic pour la gestion des versions DB
- **Validation :** Pydantic v2 pour les schémas de données

### Architecture des Modèles
La plateforme utilise une architecture modulaire avec :
- **Modèles SQLAlchemy** pour la persistance des données
- **Services métier** pour la logique applicative
- **Routeurs FastAPI** pour les endpoints API
- **Schémas Pydantic** pour la validation et sérialisation
- **Dépendances** pour l'injection et l'authentification

### Structure Détaillée du Projet
```
synth-backend/
├── app/
│   ├── main.py                    # Point d'entrée FastAPI
│   ├── ai/                        # Services IA et modèles
│   │   ├── models/                # Définitions des modèles IA
│   │   └── services/              # Services de génération
│   ├── auth/                      # Authentification JWT
│   │   └── jwt.py                 # Gestion des tokens
│   ├── core/                      # Configuration centrale
│   │   ├── config.py              # Variables d'environnement
│   │   ├── middleware.py          # Middlewares personnalisés
│   │   ├── security.py            # Utilitaires de sécurité
│   │   └── supabase.py            # Client Supabase
│   ├── data/                      # Stockage des données
│   │   ├── datasets/              # Datasets uploadés
│   │   └── synthetic/             # Données générées
│   ├── db/                        # Configuration base de données
│   │   ├── database.py            # Connexion SQLAlchemy
│   │   ├── deps.py                # Dépendances DB
│   │   └── session.py             # Gestion des sessions
│   ├── dependencies/              # Dépendances FastAPI
│   │   ├── auth.py                # Dépendances d'authentification
│   │   └── roles.py               # Gestion des rôles
│   ├── models/                    # Modèles SQLAlchemy
│   │   ├── DataRequest.py         # Requêtes de génération
│   │   ├── user.py                # Utilisateurs
│   │   ├── UserProfile.py         # Profils utilisateur
│   │   ├── UploadedDataset.py     # Datasets uploadés
│   │   ├── Notification.py        # Notifications
│   │   ├── AdminActionLog.py      # Logs administrateur
│   │   └── Optimization*.py       # Modèles d'optimisation
│   ├── routers/                   # Endpoints API
│   │   ├── auth.py                # Authentification
│   │   ├── data.py                # Gestion des données
│   │   ├── dataset.py             # Gestion des datasets
│   │   ├── generation.py          # Génération v1
│   │   ├── generation_v2.py       # Génération v2 améliorée
│   │   ├── optimization.py        # Optimisation bayésienne
│   │   ├── upload_async.py        # Upload asynchrone
│   │   ├── user.py                # Gestion utilisateurs
│   │   ├── admin.py               # Administration
│   │   ├── notification.py        # Notifications
│   │   └── stats.py               # Statistiques
│   ├── schemas/                   # Schémas Pydantic
│   │   ├── user.py                # Schémas utilisateur
│   │   ├── DataRequest.py         # Schémas de requêtes
│   │   ├── datasets.py            # Schémas datasets
│   │   ├── Optimization.py        # Schémas optimisation
│   │   └── Notification.py        # Schémas notifications
│   └── services/                  # Services métier
├── alembic/                       # Migrations de base de données
│   ├── versions/                  # Fichiers de migration
│   └── env.py                     # Configuration Alembic
├── requirements.txt               # Dépendances Python
├── requirements-minimal.txt       # Dépendances minimales
├── .env.example                   # Template variables d'environnement
└── alembic.ini                    # Configuration Alembic
```

## 🚀 Installation et Configuration

### 1. Prérequis
```bash
Python 3.9+ (recommandé 3.12+)
PostgreSQL 12+
pip (gestionnaire de paquets Python)
```

### 2. Installation rapide
```bash
# 1. Cloner le repository et naviguer vers le backend
cd synth-backend

# 2. Créer un environnement virtuel (recommandé)
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# 3. Installer les dépendances
pip install -r requirements.txt

# 4. Configurer les variables d'environnement
copy .env.example .env
# Éditer le fichier .env avec vos paramètres

# 5. Initialiser la base de données
alembic upgrade head

# 6. Démarrer le serveur de développement
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Configuration de l'environnement

Copiez `.env.example` vers `.env` et configurez les variables suivantes :

```env
# Base de données PostgreSQL
DATABASE_URL=postgresql+psycopg2://username:password@localhost:5432/synth_db
ASYNC_DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/synth_db

# JWT Authentication
SECRET_KEY=your-super-secret-jwt-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Supabase (pour le stockage cloud)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_BUCKET_NAME=synthetic-datasets

# Configuration application
APP_NAME=Synthetic Data Generation Platform
APP_VERSION=1.0.0
DEBUG=True

# Limites de fichiers
MAX_FILE_SIZE_MB=500
SUPPORTED_FILE_TYPES=csv,json,xlsx,parquet

# Configuration génération
DEFAULT_SAMPLE_SIZE=1000
MAX_SAMPLE_SIZE=100000
DEFAULT_EPOCHS=100
MAX_EPOCHS=500
```

### 4. Configuration de la base de données

```bash
# Créer la base de données PostgreSQL
createdb synth_db

# Ou via psql
psql -U postgres -c "CREATE DATABASE synth_db;"

# Exécuter les migrations
alembic upgrade head

# Vérifier les tables créées
alembic current
```

## 📋 Commandes Utiles

### Gestion de l'application
```bash
# Démarrer le serveur de développement
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Démarrer en mode production
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Avec Gunicorn (production)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Gestion des migrations Alembic
```bash
# Créer une nouvelle migration
alembic revision --autogenerate -m "Description de la migration"

# Appliquer toutes les migrations
alembic upgrade head

# Voir l'historique des migrations
alembic history

# Revenir à une migration spécifique
alembic downgrade <revision_id>

# Voir le statut actuel
alembic current
```

### Gestion des dépendances
```bash
# Installer les dépendances complètes
pip install -r requirements.txt

# Installer les dépendances minimales
pip install -r requirements-minimal.txt

# Mettre à jour requirements.txt
pip freeze > requirements.txt

# Installer une nouvelle dépendance
pip install package_name
pip freeze > requirements.txt
```

## 🔧 Configuration Avancée

### Variables d'environnement complètes

```env
# === BASE DE DONNÉES ===
DATABASE_URL=postgresql+psycopg2://username:password@localhost:5432/synth_db
ASYNC_DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/synth_db

# === AUTHENTIFICATION JWT ===
SECRET_KEY=your-super-secret-jwt-key-minimum-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# === SUPABASE STORAGE ===
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-service-role-key
SUPABASE_BUCKET_NAME=synthetic-datasets

# === CONFIGURATION APPLICATION ===
APP_NAME=Synthetic Data Generation Platform
APP_VERSION=1.0.0
DEBUG=True
ENVIRONMENT=development  # development, staging, production

# === LIMITES ET RESTRICTIONS ===
MAX_FILE_SIZE_MB=500
SUPPORTED_FILE_TYPES=csv,json,xlsx,parquet
MAX_CONCURRENT_GENERATIONS=5
REQUEST_TIMEOUT_SECONDS=3600

# === GÉNÉRATION DE DONNÉES ===
DEFAULT_SAMPLE_SIZE=1000
MAX_SAMPLE_SIZE=100000
MIN_SAMPLE_SIZE=100
DEFAULT_EPOCHS=100
MAX_EPOCHS=500
MIN_EPOCHS=10

# === OPTIMISATION ===
MAX_OPTIMIZATION_TRIALS=100
DEFAULT_OPTIMIZATION_TRIALS=20
OPTIMIZATION_TIMEOUT_HOURS=24

# === SÉCURITÉ ===
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
ALLOWED_HOSTS=localhost,127.0.0.1
MAX_REQUEST_SIZE_MB=100

# === LOGGING ===
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
LOG_FILE_PATH=logs/app.log
LOG_ROTATION_SIZE_MB=10
LOG_BACKUP_COUNT=5

# === NOTIFICATIONS ===
ENABLE_PUSH_NOTIFICATIONS=true
NOTIFICATION_BATCH_SIZE=100

# === MONITORING ===
METRICS_ENABLED=true
PERFORMANCE_MONITORING=true
```

### Configuration Supabase

Pour configurer Supabase Storage :

1. **Créer un bucket :**
```sql
-- Dans l'interface Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('synthetic-datasets', 'synthetic-datasets', false);
```

2. **Configurer les politiques RLS :**
```sql
-- Politique pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Users can upload their own datasets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'synthetic-datasets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour permettre le téléchargement
CREATE POLICY "Users can download their own datasets" ON storage.objects
FOR SELECT USING (
  bucket_id = 'synthetic-datasets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Configuration PostgreSQL

Configuration optimale pour PostgreSQL :

```sql
-- postgresql.conf recommandations
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
checkpoint_segments = 32
checkpoint_completion_target = 0.7
wal_buffers = 16MB
default_statistics_target = 100
```

### Middleware et sécurité

Le backend inclut plusieurs middlewares de sécurité :

```python
# Middlewares automatiquement appliqués
SecurityHeadersMiddleware     # Headers de sécurité
RequestSizeLimitMiddleware   # Limite taille requêtes
LoggingMiddleware           # Logging automatique
PerformanceMonitoringMiddleware # Métriques de performance
CORSMiddleware             # Configuration CORS
```

### Configuration des logs

```python
# Configuration logging dans main.py
logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO')),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(os.getenv('LOG_FILE_PATH', 'logs/app.log')),
        logging.StreamHandler()
    ]
)
```

## 📚 API Documentation

L'API est entièrement documentée et accessible via :
- **Swagger UI :** `http://localhost:8000/docs` (interface interactive)
- **ReDoc :** `http://localhost:8000/redoc` (documentation statique)

### Endpoints principaux

#### 🔐 Authentification (`/auth`)
```http
POST /auth/register          # Inscription d'un nouvel utilisateur
POST /auth/login             # Connexion et génération de token
POST /auth/refresh           # Rafraîchissement du token
GET  /auth/me                # Récupération du profil utilisateur
POST /auth/logout            # Déconnexion
```

#### 👤 Gestion des utilisateurs (`/users`)
```http
GET    /users/profile        # Profil de l'utilisateur connecté
PUT    /users/profile        # Mise à jour du profil
POST   /users/push-token     # Enregistrement token push notifications
DELETE /users/account        # Suppression du compte
```

#### 📤 Upload de données (`/upload`)
```http
POST /upload/dataset         # Upload d'un dataset (CSV, JSON, Excel, Parquet)
GET  /upload/datasets        # Liste des datasets de l'utilisateur
GET  /upload/datasets/{id}   # Détails d'un dataset spécifique
DELETE /upload/datasets/{id} # Suppression d'un dataset
```

#### 🤖 Génération de données (`/generation`)
```http
POST /generation/start       # Démarrer une nouvelle génération
GET  /generation/requests    # Liste des requêtes de l'utilisateur
GET  /generation/status/{id} # Statut d'une génération
GET  /generation/download/{id} # Télécharger les résultats
DELETE /generation/requests/{id} # Annuler une requête
```

#### 🔧 Génération avancée (`/generation-v2`)
```http
POST /generation-v2/start    # Génération avec paramètres avancés
GET  /generation-v2/config   # Configuration par défaut
POST /generation-v2/validate # Validation des paramètres
```

#### 📊 Optimisation (`/optimization`)
```http
POST /optimization/start     # Démarrer une optimisation bayésienne
GET  /optimization/trials/{id} # Résultats des essais d'optimisation
GET  /optimization/best/{id} # Meilleurs paramètres trouvés
PUT  /optimization/stop/{id} # Arrêter une optimisation en cours
```

#### � Statistiques (`/stats`)
```http
GET /stats/dashboard         # Dashboard utilisateur
GET /stats/system           # Statistiques système (admin uniquement)
GET /stats/performance      # Métriques de performance
GET /stats/usage            # Statistiques d'utilisation
```

#### 🔔 Notifications (`/notifications`)
```http
GET    /notifications        # Notifications de l'utilisateur
POST   /notifications/read   # Marquer comme lues
DELETE /notifications/{id}   # Supprimer une notification
```

#### 👑 Administration (`/admin`)
```http
GET    /admin/users          # Liste tous les utilisateurs
GET    /admin/requests       # Toutes les requêtes de génération
POST   /admin/approve/{id}   # Approuver une requête
POST   /admin/reject/{id}    # Rejeter une requête
GET    /admin/logs           # Logs d'actions administrateur
POST   /admin/users/{id}/toggle # Activer/désactiver un utilisateur
```

### Authentification

La plupart des endpoints nécessitent une authentification via JWT :

```http
Authorization: Bearer <your-jwt-token>
```

### Formats de réponse

Toutes les réponses suivent un format standardisé :

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2024-12-13T10:30:00Z"
}
```

En cas d'erreur :
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": { ... }
  },
  "timestamp": "2024-12-13T10:30:00Z"
}
```

## 🎯 Configuration des Modèles de Génération

### CTGAN (Conditional Tabular GAN)

Le modèle CTGAN est optimal pour les données tabulaires avec des relations complexes :

```json
{
  "model_type": "ctgan",
  "epochs": 100,              // Nombre d'époques d'entraînement
  "batch_size": 500,          // Taille des lots
  "generator_dim": [256, 256], // Architecture du générateur
  "discriminator_dim": [256, 256], // Architecture du discriminateur
  "generator_lr": 2e-4,       // Taux d'apprentissage du générateur
  "discriminator_lr": 2e-4,   // Taux d'apprentissage du discriminateur
  "discriminator_steps": 1,   // Étapes d'entraînement du discriminateur
  "log_frequency": true,      // Logging des métriques
  "pac": 10                   // Facteur PAC (packing)
}
```

**Paramètres recommandés selon la taille du dataset :**
- **Petit dataset (< 1000 lignes) :** epochs=200, batch_size=100
- **Dataset moyen (1000-10000) :** epochs=150, batch_size=500
- **Grand dataset (> 10000) :** epochs=100, batch_size=1000

### TVAE (Tabular Variational AutoEncoder)

Le modèle TVAE est plus rapide et efficace pour les datasets simples :

```json
{
  "model_type": "tvae",
  "epochs": 100,
  "batch_size": 500,
  "embedding_dim": 128,       // Dimension de l'espace latent
  "compress_dims": [128, 128], // Architecture de l'encodeur
  "decompress_dims": [128, 128], // Architecture du décodeur
  "l2scale": 1e-5,           // Régularisation L2
  "learning_rate": 1e-3,     // Taux d'apprentissage
  "loss_factor": 2           // Facteur de pondération de la perte
}
```

### Optimisation Bayésienne

Configuration pour l'optimisation automatique des hyperparamètres :

```json
{
  "model_type": "ctgan",      // ou "tvae"
  "optimization_method": "bayesian",
  "n_trials": 50,            // Nombre d'essais d'optimisation
  "optimization_metric": "quality_score", // Métrique à optimiser
  "search_space": {
    "epochs": [50, 200],
    "batch_size": [100, 1000],
    "learning_rate": [1e-4, 1e-2]
  },
  "acquisition_function": "EI", // Expected Improvement
  "random_state": 42
}
```

### Métriques de qualité disponibles

La plateforme évalue automatiquement la qualité des données générées :

- **Statistical Similarity :** Comparaison des distributions statistiques
- **Correlation Preservation :** Conservation des corrélations entre variables
- **Privacy Metrics :** Mesures de protection de la vie privée
- **Machine Learning Efficacy :** Performance sur des tâches ML

### Exemple de requête complète

```json
{
  "dataset_id": 123,
  "sample_size": 5000,
  "model_config": {
    "model_type": "ctgan",
    "epochs": 150,
    "batch_size": 500,
    "generator_dim": [256, 256],
    "discriminator_dim": [256, 256]
  },
  "optimization_config": {
    "enabled": true,
    "method": "bayesian",
    "n_trials": 20,
    "metric": "quality_score"
  },
  "output_format": "csv",
  "include_metadata": true
}
```

## 📈 Monitoring et Performance

### Métriques surveillées automatiquement

La plateforme collecte automatiquement plusieurs métriques :

#### Métriques d'API
- **Temps de réponse** par endpoint
- **Taux de succès/échec** des requêtes
- **Utilisation de la bande passante**
- **Nombre de requêtes concurrentes**

#### Métriques de génération
- **Temps d'entraînement** des modèles
- **Qualité des données générées**
- **Utilisation mémoire** pendant la génération
- **Taux de succès** des optimisations

#### Métriques utilisateur
- **Activité par utilisateur**
- **Formats de fichiers** les plus utilisés
- **Tailles de datasets** moyennes
- **Durée des sessions**

### Dashboard de monitoring

Accès aux métriques via les endpoints :

```http
GET /stats/dashboard        # Métriques utilisateur
GET /stats/system          # Métriques système (admin)
GET /stats/performance     # Performance en temps réel
```

### Logs structurés

Tous les logs suivent un format structuré pour faciliter l'analyse :

```json
{
  "timestamp": "2024-12-13T10:30:00Z",
  "level": "INFO",
  "module": "generation_service",
  "user_id": 123,
  "request_id": "req_abc123",
  "message": "Generation completed successfully",
  "metadata": {
    "model_type": "ctgan",
    "sample_size": 5000,
    "duration_seconds": 120.5
  }
}
```

### Alertes et notifications

Le système génère automatiquement des alertes pour :

- **Générations qui échouent** plus de 3 fois
- **Temps de réponse** > 30 secondes
- **Utilisation mémoire** > 80%
- **Erreurs de base de données**

### Performance et optimisation

#### Recommandations pour la production

1. **Configuration PostgreSQL :**
   - Activer les connexions pooling
   - Configurer `shared_buffers` à 25% de la RAM
   - Utiliser des index appropriés

2. **Configuration FastAPI :**
   - Utiliser Gunicorn avec des workers asyncio
   - Configurer un reverse proxy (Nginx)
   - Activer la compression gzip

3. **Monitoring externe :**
   - Intégrer avec Prometheus/Grafana
   - Configurer des alertes Slack/email
   - Utiliser des health checks

#### Commandes de diagnostic

```bash
# Vérifier l'état de la base de données
alembic current

# Tester les connexions
python -c "from app.db.database import engine; print(engine.execute('SELECT 1').scalar())"

# Vérifier l'espace disque
df -h data/

# Monitorer les processus
ps aux | grep uvicorn
```

## 🔒 Sécurité et Bonnes Pratiques

### Mesures de sécurité implémentées

#### Authentification et autorisation
- **JWT stateless** avec expiration automatique
- **Tokens de rafraîchissement** sécurisés
- **Gestion des rôles** granulaire (user/admin)
- **Validation des permissions** sur chaque endpoint

#### Protection des données
- **Chiffrement des mots de passe** avec bcrypt
- **Validation stricte** des uploads de fichiers
- **Nettoyage automatique** des fichiers temporaires
- **URLs temporaires** pour le téléchargement

#### Headers de sécurité automatiques
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

#### Validation et limitations
- **Limitation de taille** des fichiers (configurable)
- **Validation des types MIME** pour les uploads
- **Rate limiting** sur les endpoints sensibles
- **Timeout** sur les opérations longues

### Configuration CORS

```python
# Configuration CORS sécurisée
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

### Bonnes pratiques de déploiement

#### Variables d'environnement sensibles
```bash
# Ne jamais commiter ces valeurs
SECRET_KEY=                 # Générer avec: openssl rand -hex 32
SUPABASE_KEY=              # Utiliser la clé service role
DATABASE_URL=              # Utiliser des credentials forts
```

#### Configuration production
```env
DEBUG=False
ENVIRONMENT=production
LOG_LEVEL=WARNING
CORS_ORIGINS=https://your-domain.com
ALLOWED_HOSTS=your-domain.com
```

#### Recommandations serveur
1. **Utiliser HTTPS** uniquement en production
2. **Configurer un firewall** restrictif
3. **Mettre à jour** régulièrement les dépendances
4. **Sauvegarder** la base de données quotidiennement
5. **Monitorer** les tentatives d'intrusion

### Audit et conformité

#### Logs de sécurité
- **Tentatives de connexion** échouées
- **Accès admin** et modifications
- **Uploads** et téléchargements de fichiers
- **Erreurs d'authentification**

#### Nettoyage automatique
```python
# Tâches de nettoyage programmées
- Suppression des fichiers temporaires > 24h
- Nettoyage des tokens expirés
- Archivage des logs anciens
- Purge des notifications lues
```

#### Compliance RGPD
- **Anonymisation** des données utilisateur
- **Droit à l'effacement** implémenté
- **Consentement explicite** pour les notifications
- **Portabilité des données** via export

## 🐛 Debugging et Troubleshooting

### Problèmes fréquents et solutions

#### 1. Erreur de connexion à la base de données

**Symptôme :** `sqlalchemy.exc.OperationalError: could not connect to server`

**Solutions :**
```bash
# Vérifier que PostgreSQL est en cours d'exécution
# Windows
net start postgresql-x64-13

# Linux/Mac
sudo systemctl start postgresql

# Vérifier la configuration DATABASE_URL
echo $DATABASE_URL

# Tester la connexion
psql -h localhost -U username -d synth_db
```

#### 2. Erreur d'upload Supabase

**Symptôme :** `supabase.StorageException: Unauthorized`

**Solutions :**
```bash
# Vérifier les clés Supabase
echo $SUPABASE_URL
echo $SUPABASE_KEY

# Vérifier les politiques RLS dans Supabase
# Aller dans Storage > Settings > Policies
```

#### 3. Génération qui échoue

**Symptôme :** Génération reste en statut "processing"

**Solutions :**
```bash
# Vérifier les logs
tail -f logs/app.log

# Vérifier l'utilisation mémoire
free -h

# Réduire la taille du sample si nécessaire
# Ajuster epochs et batch_size
```

#### 4. Token JWT expiré

**Symptôme :** `401 Unauthorized` sur les requêtes authentifiées

**Solutions :**
```python
# Vérifier la configuration JWT
print(settings.SECRET_KEY)
print(settings.ACCESS_TOKEN_EXPIRE_MINUTES)

# Utiliser le refresh token pour obtenir un nouveau token
POST /auth/refresh
```

### Mode debug avancé

```bash
# Activer le mode debug complet
export DEBUG=True
export LOG_LEVEL=DEBUG

# Démarrer avec logs détaillés
uvicorn app.main:app --reload --log-level debug

# Suivre les logs en temps réel
tail -f logs/app.log | grep ERROR
```

### Tests et validation

```bash
# Tester l'API avec curl
curl -X GET http://localhost:8000/docs

# Tester l'authentification
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Tester l'upload
curl -X POST http://localhost:8000/upload/dataset \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test_data.csv"
```

### Commandes de diagnostic

```bash
# Vérifier l'état du serveur
curl -X GET http://localhost:8000/health

# Vérifier les migrations
alembic history
alembic current

# Vérifier les dépendances
pip list | grep -E "(fastapi|sqlalchemy|supabase)"

# Vérifier l'espace disque
du -sh data/
du -sh logs/

# Vérifier les processus
ps aux | grep uvicorn
netstat -tlnp | grep 8000
```

### Logs structurés pour debugging

```python
# Activer les logs SQL (attention en production)
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# Logger personnalisé pour les générations
import logging
logger = logging.getLogger(__name__)

logger.info("Starting generation", extra={
    "user_id": user.id,
    "model_type": config.model_type,
    "sample_size": config.sample_size
})
```
### Performance debugging

```bash
# Profiling d'une requête spécifique
pip install py-spy
py-spy record -o profile.svg -d 30 -p $(pgrep -f uvicorn)

# Monitoring mémoire
pip install memory-profiler
python -m memory_profiler app/main.py

# Analyse des requêtes SQL lentes
# Activer log_min_duration_statement dans postgresql.conf
```

## 🚀 Déploiement et Production

### Déploiement local avec Docker

```dockerfile
# Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copier et installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source
COPY . .

# Variables d'environnement
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Port
EXPOSE 8000

# Commande de démarrage
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+psycopg2://postgres:password@db:5432/synth_db
      - ASYNC_DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/synth_db
    depends_on:
      - db
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=synth_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Déploiement en production

#### 1. Configuration serveur

```bash
# Installation sur Ubuntu/Debian
sudo apt update
sudo apt install -y python3.12 python3-pip postgresql nginx

# Création utilisateur application
sudo useradd -m -s /bin/bash synthapp
sudo usermod -aG sudo synthapp
```

#### 2. Configuration Gunicorn

```python
# gunicorn.conf.py
bind = "0.0.0.0:8000"
workers = 4
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 120
keepalive = 5
preload_app = True
```

```bash
# Démarrage avec Gunicorn
gunicorn app.main:app -c gunicorn.conf.py
```

#### 3. Configuration Nginx

```nginx
# /etc/nginx/sites-available/synth-backend
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 500M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
    }

    location /static/ {
        alias /var/www/synth-backend/static/;
    }
}
```

#### 4. Service systemd

```ini
# /etc/systemd/system/synth-backend.service
[Unit]
Description=Synthetic Data Generation Backend
After=network.target

[Service]
Type=notify
User=synthapp
Group=synthapp
WorkingDirectory=/home/synthapp/synth-backend
Environment=PATH=/home/synthapp/synth-backend/venv/bin
ExecStart=/home/synthapp/synth-backend/venv/bin/gunicorn app.main:app -c gunicorn.conf.py
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Activation du service
sudo systemctl enable synth-backend
sudo systemctl start synth-backend
sudo systemctl status synth-backend
```

### Configuration SSL avec Let's Encrypt

```bash
# Installation Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtention du certificat
sudo certbot --nginx -d your-domain.com

# Renouvellement automatique
sudo crontab -e
# Ajouter : 0 12 * * * /usr/bin/certbot renew --quiet
```

### Monitoring et logs en production

```bash
# Logs application
sudo journalctl -u synth-backend -f

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Monitoring des ressources
htop
df -h
free -h
```

### Sauvegarde automatique

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/synth-backend"

# Sauvegarde de la base de données
pg_dump -h localhost -U postgres synth_db > "$BACKUP_DIR/db_$DATE.sql"

# Sauvegarde des fichiers uploadés
tar -czf "$BACKUP_DIR/data_$DATE.tar.gz" /home/synthapp/synth-backend/data/

# Nettoyage des anciennes sauvegardes (> 7 jours)
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
```

### Checklist de déploiement

- [ ] Variables d'environnement configurées
- [ ] Base de données initialisée et migrée
- [ ] Supabase bucket créé et configuré
- [ ] Nginx configuré avec SSL
- [ ] Service systemd activé
- [ ] Logs rotatifs configurés
- [ ] Sauvegardes automatiques programmées
- [ ] Monitoring mis en place
- [ ] Tests de charge effectués

## 🛠 Contribution et Développement

### Standards de développement

#### Structure du code
- **PEP 8** pour le style Python
- **Type hints** obligatoires pour toutes les fonctions
- **Docstrings** au format Google
- **Tests unitaires** pour toute nouvelle fonctionnalité

#### Pre-commit hooks
```bash
# Installation
pip install pre-commit
pre-commit install

# Configuration .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.3.0
    hooks:
      - id: mypy
```

### Workflow de développement

1. **Fork** du repository
2. **Créer une branche** feature/bugfix
3. **Développer** avec tests
4. **Commit** avec messages conventionnels
5. **Push** et créer une Pull Request

#### Messages de commit conventionnels
```bash
feat: add Bayesian optimization for TVAE models
fix: resolve memory leak in dataset processing
docs: update API documentation for v2 endpoints
refactor: improve error handling in auth module
test: add integration tests for optimization service
```

### Architecture des tests

```bash
tests/
├── unit/                    # Tests unitaires
│   ├── test_auth.py
│   ├── test_models.py
│   └── test_services.py
├── integration/             # Tests d'intégration
│   ├── test_api_endpoints.py
│   └── test_database.py
├── e2e/                     # Tests end-to-end
│   └── test_generation_flow.py
├── fixtures/                # Données de test
│   └── sample_datasets/
└── conftest.py             # Configuration pytest
```

### Exemples de tests

```python
# tests/unit/test_generation_service.py
import pytest
from app.services.generation_service import GenerationService
from app.schemas.DataRequest import DataRequestCreate

@pytest.fixture
def generation_service():
    return GenerationService()

@pytest.fixture
def sample_request():
    return DataRequestCreate(
        model_type="ctgan",
        sample_size=1000,
        epochs=10
    )

def test_ctgan_generation(generation_service, sample_request):
    """Test CTGAN model generation"""
    result = generation_service.generate_synthetic_data(sample_request)
    
    assert result.success is True
    assert len(result.synthetic_data) == 1000
    assert result.metadata.model_type == "ctgan"

def test_invalid_model_type(generation_service):
    """Test handling of invalid model type"""
    with pytest.raises(ValueError, match="Unsupported model type"):
        invalid_request = DataRequestCreate(
            model_type="invalid_model",
            sample_size=1000
        )
        generation_service.generate_synthetic_data(invalid_request)
```

### Configuration pour le développement

```bash
# Installation environnement de développement
pip install -r requirements.txt
pip install -r requirements-dev.txt  # Si disponible

# Variables d'environnement pour dev
export DEBUG=True
export LOG_LEVEL=DEBUG
export DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/synth_db_dev

# Base de données de test
createdb synth_db_test
export TEST_DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/synth_db_test
```

### Commandes de développement utiles

```bash
# Formatage du code
black app/ tests/
isort app/ tests/

# Linting
flake8 app/ tests/
pylint app/

# Type checking
mypy app/

# Tests avec coverage
pytest --cov=app tests/
coverage html  # Générer rapport HTML

# Tests de performance
pytest --benchmark-only tests/benchmarks/

# Profile d'une fonction spécifique
python -m cProfile -o profile.stats app/main.py
```

### Debugging avancé

```python
# Utilisation du debugger
import pdb; pdb.set_trace()

# Avec IPython (plus avancé)
import IPython; IPython.embed()

# Logging pour debugging
import logging
logger = logging.getLogger(__name__)

def complex_function():
    logger.debug("Starting complex operation")
    # ... code ...
    logger.debug(f"Intermediate result: {result}")
    # ... more code ...
    logger.debug("Operation completed successfully")
```

### Intégration continue

Exemple de configuration GitHub Actions :

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: synth_db_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.12'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Run tests
      run: |
        pytest --cov=app tests/
      env:
        DATABASE_URL: postgresql+psycopg2://postgres:postgres@localhost:5432/synth_db_test
```

## 📞 Support et Contact

### FAQ - Questions Fréquentes

#### **Q: Comment augmenter la qualité des données générées ?**
A: Essayez ces approches :
- Augmentez le nombre d'`epochs` (100-300 pour CTGAN)
- Utilisez l'optimisation Bayésienne pour trouver les meilleurs paramètres
- Assurez-vous que votre dataset d'origine est suffisamment grand (>1000 lignes)
- Vérifiez que les colonnes catégorielles sont bien détectées

#### **Q: Pourquoi ma génération est-elle si lente ?**
A: Plusieurs facteurs peuvent causer des lenteurs :
- Taille du `batch_size` trop petite (essayez 500-1000)
- Nombre d'`epochs` trop élevé pour un test
- Dataset très volumineux (>100MB)
- Ressources insuffisantes sur le serveur

#### **Q: Comment gérer les erreurs de mémoire ?**
A: Solutions possibles :
- Réduisez la `sample_size` générée
- Diminuez le `batch_size` du modèle
- Utilisez `TVAE` au lieu de `CTGAN` (moins gourmand)
- Augmentez la RAM du serveur

#### **Q: Les données générées ne ressemblent pas aux originales**
A: Vérifications à faire :
- Le dataset original est-il assez diversifié ?
- Y a-t-il des colonnes avec beaucoup de valeurs manquantes ?
- Les types de données sont-ils correctement détectés ?
- Essayez d'augmenter les `epochs` ou utilisez l'optimisation

#### **Q: Comment sécuriser l'API en production ?**
A: Mesures recommandées :
- Utilisez HTTPS uniquement
- Configurez des secrets robustes (32+ caractères)
- Activez les limitations de taux (rate limiting)
- Mettez à jour régulièrement les dépendances
- Surveillez les logs d'erreurs

### Ressources et Documentation

#### Documentation technique
- **API Interactive :** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Schémas de données :** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **SDV Documentation :** [https://docs.sdv.dev/](https://docs.sdv.dev/)
- **FastAPI Guide :** [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)

#### Dépendances principales
- **FastAPI :** Framework web moderne et rapide
- **SQLAlchemy :** ORM pour la gestion de base de données
- **SDV :** Suite de génération de données synthétiques
- **Supabase :** Backend-as-a-Service pour le stockage
- **Pydantic :** Validation et sérialisation des données

### Roadmap et Améliorations Futures

#### Version 1.1 (Q1 2025)
- [ ] Support des modèles GAN conditionnels avancés
- [ ] Intégration avec MLflow pour le tracking des expériences
- [ ] API GraphQL en complément du REST
- [ ] Support des datasets distribués (Dask)

#### Version 1.2 (Q2 2025)
- [ ] Génération de données temporelles (time series)
- [ ] Support des données textuelles (NLP)
- [ ] Intégration avec des modèles LLM pour la génération
- [ ] Dashboard analytics avancé

#### Version 2.0 (Q3 2025)
- [ ] Architecture microservices
- [ ] Support Kubernetes natif
- [ ] API streaming pour la génération en temps réel
- [ ] Intégration blockchain pour la traçabilité

### Contribution au Projet

#### Comment contribuer
1. **Issues :** Signalez des bugs ou proposez des améliorations
2. **Pull Requests :** Soumettez du code après avoir créé une issue
3. **Documentation :** Améliorez la documentation existante
4. **Tests :** Ajoutez des tests pour augmenter la couverture

#### Guidelines de contribution
- Suivez les standards PEP 8 pour Python
- Ajoutez des tests pour toute nouvelle fonctionnalité
- Documentez les fonctions publiques
- Utilisez des messages de commit conventionnels

### Licence et Mentions Légales

Ce projet est distribué sous licence MIT. Voir le fichier [LICENSE](../LICENSE) pour plus de détails.

#### Crédits
- **SDV Team :** Pour la suite de génération de données synthétiques
- **FastAPI Team :** Pour le framework web moderne
- **Supabase Team :** Pour les services backend
- **Communauté Open Source :** Pour les nombreuses dépendances utilisées

---

**Version Backend :** 1.0.0  
**Dernière mise à jour :** 13 août 2025  
**Compatibilité Python :** 3.9+  
**Statut :** Production Ready  

**Développé avec ❤️ pour la génération de données synthétiques**
