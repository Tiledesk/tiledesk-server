var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var AuthSchema = new Schema({
    // fullname: {
    //     type: String,
    //     required: false
    //   },
      providerId: {
        type: String,
        default: 'password',
        required: true
     },
     subject: {
        type: String,
        required: true
     },
     email: {
        type: String,        
     },
     password: {
        type: String,
        required: false,
        // required: true,
        // https://stackoverflow.com/questions/12096262/how-to-protect-the-password-field-in-mongoose-mongodb-so-it-wont-return-in-a-qu
        // select: false
    },
    //   id_project: {
    //     type: String,
    //     required: true
    //   }      
    }, {
        timestamps: true
      }
);

AuthSchema.pre('save', function (next) {
    var user = this;
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err);
            }
            bcrypt.hash(user.password, salt, null, function (err, hash) {
                if (err) {
                    return next(err);
                }
                user.password = hash;
                next();
            });
        });
    } else {
        return next();
    }
});

AuthSchema.methods.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};
module.exports = mongoose.model('auth', AuthSchema);
