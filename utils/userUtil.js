
class UserUtil {

    decorateUser(user) {
        user.id = user._id;
        user.fullName = (user.firstname || '') + ' ' + (user.lastname || '');
        return user;
    }
}

 var userUtil = new UserUtil();

 module.exports = userUtil;
 