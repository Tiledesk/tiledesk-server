
class UserUtil {

    decorateUser(user) {
        user.id = user._id;
        user.fullName = (user.firstname || '') + ' ' + (user.lastname || '');
        return user;
    }
}

 let userUtil = new UserUtil();

 module.exports = userUtil;
 