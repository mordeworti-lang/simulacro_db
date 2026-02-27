-- =========================================
-- SaludPlus — PostgreSQL Schema
-- =========================================

CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'patient');

-- =========================================
-- USERS
-- =========================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- =========================================
-- DOCTOR
-- =========================================
CREATE TABLE doctor (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doctor_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_doctor_specialty ON doctor(specialty);

-- =========================================
-- PATIENT
-- =========================================
CREATE TABLE patient (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_patient_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================
-- INSURANCE
-- =========================================
CREATE TABLE insurance (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    coverage_percentage NUMERIC(5,2) NOT NULL
        CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- APPOINTMENT
-- ✏️  CAMBIOS respecto al schema original:
--   1. appointment_date: DATE → TIMESTAMP  (para guardar fecha + hora)
--   2. treatment_code: NOT NULL removido    (el sistema lo genera automáticamente)
-- =========================================
CREATE TABLE appointment (
    id SERIAL PRIMARY KEY,
    appointment_code VARCHAR(50) UNIQUE NOT NULL,
    appointment_date TIMESTAMP NOT NULL,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    insurance_id INT,
    treatment_code VARCHAR(50),
    treatment_description TEXT NOT NULL,
    treatment_cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (treatment_cost >= 0),
    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_appointment_patient
        FOREIGN KEY (patient_id)
        REFERENCES patient(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_appointment_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctor(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_appointment_insurance
        FOREIGN KEY (insurance_id)
        REFERENCES insurance(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_appointment_date ON appointment(appointment_date);
CREATE INDEX idx_appointment_patient ON appointment(patient_id);
CREATE INDEX idx_appointment_doctor ON appointment(doctor_id);
CREATE INDEX idx_appointment_insurance ON appointment(insurance_id);

-- =========================================
-- REFRESH TOKENS
-- =========================================
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_refresh_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);

-- =========================================
-- COMANDO PARA MIGRAR BASE EXISTENTE
-- (solo si ya tienes datos, no borres y recrees)
-- =========================================
-- ALTER TABLE appointment
--     ALTER COLUMN appointment_date TYPE TIMESTAMP,
--     ALTER COLUMN treatment_code DROP NOT NULL;
