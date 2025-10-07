let User = require("../models/user");
// let Auth = require("../models/auth");
let mongoose = require('mongoose');
let winston = require('../config/winston');

class UserService {

    signup ( email, password, firstname, lastname, emailverified, phone) {
        return new Promise(function (resolve, reject) {
                
            // winston.info("email: " + email);
            // let emailLowerCase = email;
            
            // if (email) {
            let   emailLowerCase = email.toLowerCase();
            // }

            let newUser = new User({
                _id: new mongoose.Types.ObjectId(),
                email: emailLowerCase,
                password: password,
                firstname: firstname,
                lastname: lastname,
                emailverified: emailverified,  
                phone: phone           
            });
            // save the user
            newUser.save(function (err, savedUser) {
                if (err) {
                    if (err.code === 11000) { //error for dupes
                        winston.warn('Error creating the user email already present');
                        return reject(err);
                    } else {
                        winston.error('Error creating the user', err);
                        return reject(err);
                    }
                    
                }

                winston.verbose('User created', savedUser.toObject());
                return resolve(savedUser);
            });
        });
    }

}

let userService = new UserService();

module.exports = userService;