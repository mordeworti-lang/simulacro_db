'use strict';

class CreateDoctorDTO {
    constructor({ name, email, specialty, password }) {
        this.name = name?.trim();
        this.email = email?.toLowerCase().trim();
        this.specialty = specialty?.trim();
        this.password = password;
    }
}

module.exports = CreateDoctorDTO;