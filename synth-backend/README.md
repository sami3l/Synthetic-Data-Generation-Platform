## 🔍 Project Summary

### 📌 Project Name

**Synthetic Data Generation Backend**

### 🎯 Objective

To build a backend system that allows users to:

* Submit requests for synthetic tabular data generation.
* Automatically train generative models (CTGAN, TVAE) on submitted datasets.
* Evaluate generated synthetic data using SDMetrics.
* Manage user roles, notifications, and access via a clean modular architecture.

---

## 🛠️ Technologies Used

| Layer             | Technologies                                           |
| ----------------- | ------------------------------------------------------ |
| Backend Framework | FastAPI                                                |
| ORM               | SQLAlchemy                                             |
| Database          | postgresql                                             |
| Auth              | JWT (FastAPI Dependencies), Pydantic                   |
| AI Models         | CTGAN, TVAE from SDV Library                           |
| Evaluation        | SDMetrics                                              |
| Env Management    | `python-dotenv`                                        |
| Dev Tools         | Alembic (for DB migrations), Uvicorn, HTTPie (testing) |

---

## 🧱 System Architecture

### 📁 Modules

#### 🔐 Authentication Module

* **User**: Handles identity and login.
* **UserProfile**: Stores bio, organization, and creation timestamps.
* JWT-based auth integrated in FastAPI dependencies.

#### 👤 User Operations

* **DataRequest**: Represents a user's request to generate synthetic data.
* **RequestParameters**: Stores generation configuration like model, epochs, etc.
* **SyntheticDataset**: Stores reference to the output file and quality score.
* **DatasetService**: Provides download and metadata functions.

#### ⚙️ AI Processing

* **AIProcessingService**: Orchestrates synthetic data generation.
* **ModelManager**: Handles logic between CTGAN/TVAE model classes.
* **CTGANModel / TVAEModel**: Wrap around SDV Synthesizers.
* **QualityValidator**: Uses SDMetrics to evaluate synthetic data quality.

#### 📧 Notification System

* **Notification**: Stores messages sent to users (e.g., completion, failure).
* **NotificationService**: Sends alerts and reminders.

---

## 🔗 Database Schema

### 👤 User

* `id`, `email`, `hashed_password`
* **Relations**:

  * `UserProfile` (One-to-One)
  * `DataRequests` (One-to-Many)
  * `SyntheticDatasets` (One-to-Many)
  * `Notifications` (One-to-Many)

### 📄 UserProfile

* `id`, `user_id`, `organization`, `created_at`, `updated_at`
* FK: `user_id → User.id`

### 📥 DataRequest

* `id`, `user_id`, `status`, `created_at`
* FK: `user_id → User.id`
* One-to-One with `RequestParameters`

### ⚙️ RequestParameters

* `id`, `data_request_id`, `model_type`, `epochs`, `batch_size`, etc.
* FK: `data_request_id → DataRequest.id`

### 🧪 SyntheticDataset

* `id`, `user_id`, `data_request_id`, `model_used`, `quality_score`, `path`
* FK: `user_id → User.id`, `data_request_id → DataRequest.id`

### 🛠️ Models

* **CTGANModel / TVAEModel**:

  * Trains on real data from CSV or DB.
  * Generates synthetic dataset.
  * Returns `SyntheticDataset` with metadata.

### 📨 Notification

* `id`, `user_id`, `message`, `is_read`, `timestamp`
* FK: `user_id → User.id`

## 🧪 Running the App

### Step 1: Setup Environment

```bash
cp .env.example .env
```

Example `.env`:

```
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/synth_db
SECRET_KEY=your_jwt_secret
```

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 3: Run Migrations

```bash
alembic upgrade head
```

### Step 4: Launch App

```bash
uvicorn app.main:app --reload
```

---

## 📊 API Endpoints (Sample)

* `POST /auth/signup`: Register a user
* `POST /auth/login`: JWT login
* `POST /data/request`: Submit new synthetic request
* `GET /data/requests`: View your requests
* `POST /notifications`: Read notifications

---

## 📌 Future Enhancements

* Admin dashboard (approve/deny requests)
* Upload CSVs from UI
* Support for more models (GaussianCopula, etc.)
* OAuth (Google/GitHub)

---

## 📧 Contact

Built with ❤️ by Sami.

```

---

Let me know if you want:
- A PDF version of this full report
- Deployment instructions (Docker, etc.)
- Integration of a web dashboard (React/Next.js) to control all of this.
```
