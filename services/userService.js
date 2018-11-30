var User = require("../models/user");
var mongoose = require('mongoose');

class UserService {
//TODO providerId cambia tutte classi di test perche è stato aggiunto providerId,
    signup ( email, password, firstname, lastname, emailverified) {
        return new Promise(function (resolve, reject) {
            var newUser = new User({
                _id: new mongoose.Types.ObjectId(),
               // providerId: providerId,
                email: email,
                password: password,
                firstname: firstname,
                lastname: lastname,
                emailverified: emailverified
              });
              // save the user
              newUser.save(function (err, savedUser) {
                if (err) {
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