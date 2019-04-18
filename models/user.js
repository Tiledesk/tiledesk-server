var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var UserSchema = new Schema({
    _id: Schema.Types.ObjectId,
    email: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    password: {
        type: String,
        required: true,
        // https://stackoverflow.com/questions/12096262/how-to-protect-the-password-field-in-mongoose-mongodb-so-it-wont-return-in-a-qu
        select: false //ATTENZIONE TESTA BENE QUESTA COSA
    },
    firstname: {
        type: String,
        // required: true
    },
    lastname: {
        type: String,
        // required: true
    },
    emailverified: {
        type: Boolean,
        // required: true
    },
    resetpswrequestid: {
        type: String,
    },
    // auth: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'auth',
    //     //required: true
    //   },
});

// UserSchema.set('toJSON', {
//     transform: function(doc, ret, opt) {
//         delete ret['password']
//         return ret
//     }
// });

UserSchema.pre('save', function (next) {
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

UserSchema.methods.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

UserSchema.virtual('fullName').get(function () {
    return (this.firstname || '') + ' ' + (this.lastname || '');
  });
  
var UserModel = mongoose.model('User', UserSchema);

// UserModel.getFullname = function () {
//     return 
// };

module.exports = UserModel;
