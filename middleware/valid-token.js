
module.exports = function(req, res, next) {
        // winston.debug("valid-token");
        let token = getToken(req.headers);
        // winston.debug("token", token);
        if (token) {
           next();
        } else {
          return res.status(403).send({success: false, msg: 'Unauthorized.'});
        }
    }
  




getToken = function (headers) {
    if (headers && headers.authorization) {
      let parted = headers.authorization.split(' ');
      if (parted.length === 2) {
        return parted[1];
      } else {
        return null;
      }
    } else {
      return null;
    }
  };