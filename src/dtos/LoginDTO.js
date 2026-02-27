'use strict';

class LoginDTO {
    constructor({ email, password }) {
        this.email = email?.toLowerCase().trim();
        this.password = password;
    }
}

module.exports = LoginDTO;