# SaludPlus API

A professional backend REST API for a medical clinic network built with **Node.js + Express**, using a **hybrid persistence architecture** combining PostgreSQL and MongoDB.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js 5.x |
| Relational DB | PostgreSQL 16 |
| Document DB | MongoDB 6+ |
| Authentication | JWT (Access + Refresh tokens) |
| Password hashing | bcrypt |
| Environment | dotenv |
| Dev server | nodemon |

---

## Architecture Decisions

### Why Hybrid Persistence?

The system manages two fundamentally different types of data that benefit from different storage strategies:

#### PostgreSQL — Relational Data (Source of Truth)
Used for data that requires **strict referential integrity**, **ACID transactions**, and **precise aggregations**:

- **Users, Doctors, Patients** — master records that must be unique and consistent
- **Appointments** — financial records requiring exact calculations
- **Insurance** — coverage rules applied to billing
- **Refresh Tokens** — security-critical, must be atomic

**Why SQL here?**
- Enforces uniqueness (no duplicate patients or doctors)
- Foreign key constraints prevent orphaned records
- `SUM()` aggregations on billing are 100% accurate
- Transactions guarantee consistency when creating appointments

#### MongoDB — Document Data (Read Optimization)
Used for data that benefits from **flexible schema**, **fast reads**, and **pre-joined documents**:

- **patient_histories** — complete patient history with all appointments embedded

**Why NoSQL here?**
- A patient's full history is always read together — embedding avoids costly JOINs
- Response time under 100ms even with 50+ appointments per patient
- Schema flexibility allows adding new appointment fields without migrations
- `findOne({ patientEmail })` returns everything in a single query

### Trade-offs Accepted
- **Eventual consistency**: When a doctor's name/email is updated in PostgreSQL, it propagates to MongoDB asynchronously.
- **Duplication**: Doctor name and email are stored in both systems intentionally to optimize read performance.

---

## SQL Normalization

The schema applies **1NF, 2NF, and 3NF**:

### 1NF — Atomic values
Every column contains a single value. No repeating groups.

### 2NF — No partial dependencies
`doctor` and `patient` tables contain only profile data. Identity data (name, email, password) lives in `users`.

### 3NF — No transitive dependencies
Insurance coverage percentage is stored in the `insurance` table, not in `appointment`. Doctor specialty is in `doctor`, not repeated in every appointment row.

### Entity-Relationship Diagram

```
users
  └── doctor (user_id → users.id)
  └── patient (user_id → users.id)
  └── refresh_tokens (user_id → users.id)

appointment
  ├── patient_id   → patient.id
  ├── doctor_id    → doctor.id
  └── insurance_id → insurance.id (nullable)
```

### Tables

| Table | Purpose | Key Constraints |
|---|---|---|
| `users` | Authentication identity | UNIQUE email, ENUM role |
| `doctor` | Doctor profile | UNIQUE user_id, FK → users |
| `patient` | Patient profile | UNIQUE user_id, FK → users |
| `insurance` | Insurance providers | UNIQUE name, CHECK coverage 0-100 |
| `appointment` | Medical appointments | UNIQUE code, FK → patient/doctor/insurance |
| `refresh_tokens` | JWT refresh tokens | UNIQUE token, FK → users |

### Indexes

```sql
idx_users_email           -- login queries
idx_doctor_specialty      -- filter doctors by specialty
idx_appointment_date      -- revenue reports by date range
idx_appointment_patient   -- patient appointment history
idx_appointment_doctor    -- doctor workload queries
idx_appointment_insurance -- revenue grouped by insurance
idx_refresh_user          -- token cleanup on logout
```

---

## NoSQL Document Modeling

### Collection: `patient_histories`

```json
{
  "patientEmail": "valeria.g@mail.com",
  "patientName": "Valeria Gomez",
  "appointments": [
    {
      "appointmentId": "APT-1001",
      "date": "2024-01-07",
      "doctorName": "Dr. Carlos Ruiz",
      "doctorEmail": "c.ruiz@saludplus.com",
      "specialty": "Cardiology",
      "treatmentCode": "TRT-007",
      "treatmentDescription": "Skin Treatment",
      "treatmentCost": 200000,
      "insuranceProvider": "ProteccionMedica",
      "coveragePercentage": 60,
      "amountPaid": 80000
    }
  ]
}
```

### Embedding vs Referencing Decision

| Data | Decision | Reason |
|---|---|---|
| Appointments inside patient | **Embedded** | Always read together, avoids JOINs |
| Doctor identity | **Duplicated** | Snapshot at query time, fast reads |
| Insurance details | **Duplicated** | Read performance over storage efficiency |

**Index:** `{ patientEmail: 1 }` unique — enables O(log n) lookup by email.

---

## API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication
Protected endpoints require a Bearer token:
```
Authorization: Bearer <accessToken>
```

---

### Auth Endpoints

#### POST /api/auth/register
```json
// Body
{ "name": "Admin", "email": "admin@saludplus.com", "password": "admin123", "role": "admin" }

// Response 201
{ "ok": true, "accessToken": "eyJ...", "refreshToken": "eyJ...", "user": {} }
```

#### POST /api/auth/login
```json
// Body
{ "email": "admin@saludplus.com", "password": "admin123" }

// Response 200
{ "ok": true, "message": "Login successful", "accessToken": "eyJ...", "refreshToken": "eyJ..." }
```

#### POST /api/auth/refresh
```json
// Body
{ "refreshToken": "eyJ..." }
```

#### POST /api/auth/logout
```json
// Body
{ "refreshToken": "eyJ..." }
```

#### GET /api/auth/me 
Returns current authenticated user data.

---

### Migration

#### POST /api/simulacro/migrate
```json
// Body
{ "clearBefore": true }

// Response 200
{
  "ok": true,
  "message": "Migration completed successfully",
  "result": { "patients": 10, "doctors": 5, "insurances": 4, "appointments": 100, "histories": 10 }
}
```

---

### Doctors

#### GET /api/doctors
List all doctors. Optional: `?specialty=Cardiology`

#### GET /api/doctors/:id
Get doctor by ID. Returns 404 if not found.

#### PUT /api/doctors/:id
Update doctor. Propagates name/email changes to MongoDB.
```json
// Body
{ "name": "Dr. Carlos Ruiz", "email": "c.ruiz@saludplus.com", "specialty": "Cardiology" }
```

---

### Reports

#### GET /api/reports/revenue
Revenue grouped by insurance. Optional: `?startDate=2024-01-01&endDate=2024-06-30`
```json
// Response 200
{
  "ok": true,
  "report": {
    "totalRevenue": 11893000,
    "byInsurance": [
      { "insuranceName": "SinSeguro", "totalAmount": 6070000, "appointmentCount": 25 }
    ],
    "period": { "startDate": "2024-01-01", "endDate": "2024-06-30" }
  }
}
```

---

### Patients

#### GET /api/patients/:email/history
Full patient history from MongoDB. Under 100ms response time.
```json
// Response 200
{
  "ok": true,
  "patient": { "email": "valeria.g@mail.com", "name": "Valeria Gomez" },
  "appointments": [],
  "summary": { "totalAppointments": 5, "totalSpent": 383000, "mostFrequentSpecialty": "Cardiology" }
}
```

---

### Appointments 🔒

#### GET /api/appointments
List all. Optional: `?patientId=101&doctorId=51`

#### GET /api/appointments/:id
Get by ID.

#### POST /api/appointments
Create appointment. Auto-syncs to MongoDB patient history.
```json
// Body
{
  "patientId": 101,
  "doctorId": 51,
  "appointmentDate": "2024-05-15",
  "treatmentCode": "TRT-001",
  "treatmentDescription": "General Consultation",
  "treatmentCost": 150000,
  "amountPaid": 150000
}
// Response 201
{ "ok": true, "message": "Appointment created successfully", "appointment": {} }
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 16+
- MongoDB 6+

### 1. Clone and install
```bash
git clone <repository-url>
cd saludplus-api
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/saludplus
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=saludplus
JWT_SECRET=your_long_secret_here
JWT_REFRESH_SECRET=another_long_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SIMULACRO_CSV_PATH=./data/simulacro_saludplus_data.csv
```

### 3. Create database and run schema
```bash
psql -U your_user -c "CREATE DATABASE saludplus;"
psql -U your_user -d saludplus -f scripts/schema.sql
```

### 4. Start MongoDB
```bash
# Windows
net start MongoDB

# Linux
sudo systemctl start mongod
```

### 5. Start the server
```bash
npm run dev
```

### 6. Run migration
```bash
curl -X POST http://localhost:3000/api/simulacro/migrate \
  -H "Content-Type: application/json" \
  -d '{"clearBefore": true}'
```

---

## Project Structure

```
saludplus-api/
├── src/
│   ├── config/         # DB connections and env validation
│   ├── controllers/    # HTTP handlers
│   ├── services/       # Business logic
│   ├── repositories/   # Database queries
│   ├── middleware/     # Auth and role guards
│   ├── validators/     # Input validation
│   ├── exceptions/     # Custom error classes (AppError, NotFoundError...)
│   ├── dtos/           # Data Transfer Objects
│   ├── utils/          # JWT, bcrypt, response helpers
│   ├── routes/         # Express routers
│   ├── app.js          # Express config
│   └── server.js       # Entry point
├── scripts/
│   └── schema.sql      # PostgreSQL schema
├── data/
│   └── simulacro_saludplus_data.csv
├── .env.example
└── package.json
```

---

## Error Codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthorized |
| 404 | Not found |
| 500 | Internal server error |

---

## Author
Jhon Stiven Zuluaga