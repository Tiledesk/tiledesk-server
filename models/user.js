var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var winston = require('../config/winston');

var UserSchema = new Schema({
    _id: Schema.Types.ObjectId,
    email: {
        type: String,
        unique: true,//remove unique on db
        required: true,
        index: true
    },
    password: {
        type: String,
        required: true,
        // https://stackoverflow.com/questions/12096262/how-to-protect-the-password-field-in-mongoose-mongodb-so-it-wont-return-in-a-qu
        select: false
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
        select: false
    },
    signedInAt: {
        type: Date
    },

    // db.users.find({authUrl: {$exists : false }}).forEach(function(mydoc) {
    //     db.users.update({_id: mydoc._id}, {$set: {authUrl: Math.random().toString(36).substring(2) + Date.now().toString(36)}})
    //   })

    authUrl: {
        type: String,
        index: true
    },
    attributes: {
        type: Object,
    },
    status: {
        type: Number,
        required: true,
        default: 100,
        index: true,
        // select: false
    },
    description: {
        type: String,
    },
    public_email: {
        type: String,
        required: false
    },
    public_website: {
        type: String,
        required: false
    }
    // authType: { // update db old data
    //     type: String,
    //     index:true,
    //     default: 'email_password'
    // },
    // auth: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'auth',
    //     //required: true
    //   },       
}, {
    timestamps: true
}
);

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


//UserSchema.index({ email: 1, authType: 1 }, { unique: true }); 

var UserModel = mongoose.model('user', UserSchema);


// UserModel.getFullname = function () {
//     return 
// };

if (process.env.MONGOOSE_SYNCINDEX) {
    UserModel.syncIndexes();
    winston.info("UserModel syncIndexes")
}

module.exports = UserModel;
