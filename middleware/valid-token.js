
// unused
module.exports = function(req, res, next) {
        // console.log("valid-token");
        var token = getToken(req.headers);
        // console.log("token", token);
        if (token) {
           next();
        } else {
          return res.status(403).send({success: false, msg: 'Unauthorized.'});
        }
    }
  




getToken = function (headers) {
    if (headers && headers.authorization) {
      var parted = headers.authorization.split(' ');
      if (parted.length === 2) {
        return parted[1];
      } else {
        return null;
      }
    } else {
      return null;
    }
  };