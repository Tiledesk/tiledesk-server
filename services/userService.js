var User = require("../models/user");
var mongoose = require('mongoose');

class UserService {

    signup(email, password, firstname, lastname, emailverified) {
        return new Promise(function (resolve, reject) {
            var newUser = new User({
                _id: new mongoose.Types.ObjectId(),
                email: email,
                password: password,
                firstname: firstname,
                lastname: lastname,
                emailverified: emailverified
            });
            // save the user
            newUser.save(function (err, savedUser) {
                if (err) {
                    console.log('USER SERVICE SIGNUP ERROR ', err)
                    return reject(err);
                }

                console.log('User created', savedUser);
                return resolve(savedUser);
            });

        });
    }

}

var userService = new UserService();

module.exports = userService;