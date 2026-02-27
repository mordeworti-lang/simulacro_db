'use strict';

class CreatePatientDTO {
    constructor({ name, email, phone, address, password }) {
        this.name = name?.trim();
        this.email = email?.toLowerCase().trim();
        this.phone = phone?.trim();
        this.address = address?.trim();
        this.password = password;
    }
}

module.exports = CreatePatientDTO;