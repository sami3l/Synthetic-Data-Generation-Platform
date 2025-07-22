# 🔄 Plateforme de Génération de Données Synthétiques

## 🔍 Résumé du Projet

### 📌 Nom du Projet
**Backend de Génération de Données Synthétiques**

### 🎯 Objectifs
Système backend permettant aux utilisateurs de :
* Soumettre des demandes de génération de données synthétiques
* Entraîner automatiquement des modèles génératifs (CTGAN, TVAE)
* Optimiser les hyperparamètres des modèles
* Évaluer la qualité des données générées
* Recevoir des notifications sur l'état de leurs demandes

## 🛠️ Technologies Utilisées

| Couche            | Technologies                                           |
|-------------------|-------------------------------------------------------|
| Framework Backend | FastAPI                                               |
| ORM              | SQLAlchemy                                            |
| Base de données  | PostgreSQL                                            |
| Auth             | JWT, Pydantic                                         |
| Modèles IA       | CTGAN, TVAE (SDV Library)                            |
| Évaluation       | SDMetrics                                             |
| Env Config       | python-dotenv                                         |
| Dev Tools        | Alembic, Uvicorn                                      |

## 🏗️ Architecture du Système

### 📁 Modules Principaux

#### 🔐 Module d'Authentification
* **User**: Gestion des identités et connexions
* **UserProfile**: Informations utilisateur
* JWT intégré dans les dépendances FastAPI

#### 👤 Opérations Utilisateur
* **DataRequest**: Demandes de génération
* **RequestParameters**: Configuration des modèles et optimisation
* **SyntheticDataset**: Stockage des résultats
* **DatasetService**: Gestion des données

#### ⚙️ Traitement IA
* **AIProcessingService**: 
  * Orchestration de la génération
  * Optimisation des hyperparamètres
  * Évaluation de la qualité
* **Modèles**:
  * CTGAN et TVAE avec SDV
  * Optimisation par grid search ou random search
  * Validation qualité intégrée

#### 📬 Système de Notifications
* Notifications en temps réel
* Suivi des états des générations
* Alertes de completion/erreur

## 📊 Schéma de Base de Données

### 🆕 Nouvelles Tables

#### OptimizationResult
* `id`, `request_id`, `best_parameters`, `quality_score`, `created_at`
* Stockage des résultats d'optimisation

### ⚡ Mises à jour

#### RequestParameters (Ajouts)
* `optimization_enabled`: Boolean
* `optimization_search_type`: String (grid/random)
* `optimization_n_trials`: Integer

## 📡 API Endpoints

### Génération de Données
```
POST /data/generate/{request_id}
```
Paramètres:
* `request_id`: ID de la requête
* `optimization`: Configuration d'optimisation (optionnel)

### Notifications
```
GET /notifications
POST /notifications/{notification_id}/read
```

## 🚀 Installation et Démarrage

### 1. Configuration
```bash
cp .env.example .env
```

`.env` exemple:
```
DATABASE_URL=postgresql://user:password@localhost:5432/synth_db
SECRET_KEY=your_jwt_secret
```

### 2. Dépendances
```bash
pip install -r requirements.txt
```

### 3. Migrations
```bash
alembic upgrade head
```

### 4. Lancement
```bash
uvicorn app.main:app --reload
```

## 📈 Exemple d'Utilisation

### Création d'une requête avec optimisation
```json
{
  "request": {
    "dataset_name": "customers.csv"
  },
  "params": {
    "model_type": "tvae",
    "optimization_enabled": true,
    "optimization_search_type": "random",
    "optimization_n_trials": 5
  }
}
```

## 🔜 Améliorations Futures
* Interface utilisateur complète
* Visualisation des métriques de qualité
* Support de nouveaux modèles
* Optimisation distribuée
* Intégration OAuth

## 📝 Contact
Développé par Sami
