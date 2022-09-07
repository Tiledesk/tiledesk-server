const ipfilter = require('express-ipfilter').IpFilter
var winston = require('../config/winston');
var jwt = require('jsonwebtoken');


var customDetection = function (req)  {
    // const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;  
    // const ip = (req.headers['x-forwarded-for'] || '').split(',').pop().trim() ||        //https://stackoverflow.com/questions/8107856/how-to-determine-a-users-ip-address-in-node
    //   req.socket.remoteAddress
  
  
    let ip = req.socket.remoteAddress;
  
      const xFor =  req.headers['x-forwarded-for'];
      if (xFor ) {
        const xForArr = xFor.split(',');
        if (xForArr && xForArr.length>0) {
          ip = xForArr.shift();
        }
      }
      // const ip = 
      // req.headers['x-forwarded-for']?.split(',').shift()
      // || req.socket?.remoteAddress
  
    winston.info("standard ip: "+ip); // ip address of the user
    return ip;
}

var getToken = function (headers) {
  winston.debug("getToken",headers);
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
  

class IPFilter {
    

    
    constructor() {
    }






  
  
  
projectIpFilter (req, res, next) {
    var that = this;
    // console.log("that", that)
  
    const nextIp = function(err) {
      winston.debug("projectIpFilter next",err);
    
        if (err && err.name === "IpDeniedError") {
          winston.info("IpDeniedError for projectIpFilter");
          return res.status(401).json({ err: "error project ip filter" });
          // next(err) 
        } 
    
      next();
    
    }
  
  
    if (!req.project) {
      return next();
    }
    
    var projectIpFilterEnabled = req.project.ipFilterEnabled;
    winston.debug("project projectIpFilterEnabled: " +projectIpFilterEnabled)
  
    var projectIpFilter =  req.project.ipFilter
    winston.debug("project ipFilter: " + projectIpFilter)
    
    if (projectIpFilterEnabled === true && projectIpFilter && projectIpFilter.length > 0) {
      winston.debug("filtering project IpFilter with ", projectIpFilter );
      var ip = ipfilter(projectIpFilter, { detectIp: customDetection, mode: 'allow' })
      // var ip = ipfilter(projectIpFilter, { mode: 'allow' })
       ip(req, res, nextIp);
    } else {
      next();
    }
  
  }
  
   projectIpFilterDeny (req, res, next) {
  
    const nextIp = function(err) {
      winston.debug("projectIpFilter next",err);
    
        if (err && err.name === "IpDeniedError") {
          winston.info("IpDeniedError for projectIpFilterDeny");
          return res.status(401).json({ err: "error project deny ip filter" });
          // next(err) 
        } 
    
      next();
    
    }
  
    if (!req.project) {
      return next();
    }
    
    var projectIpFilterDenyEnabled = req.project.ipFilterDenyEnabled;
    winston.debug("project projectIpFilterDenyEnabled: " +projectIpFilterDenyEnabled)
  
    var projectIpFilterDeny =  req.project.ipFilterDeny
    winston.debug("project IpFilterDeny: " + projectIpFilterDeny)
  
  
    if (projectIpFilterDenyEnabled === true && projectIpFilterDeny && projectIpFilterDeny.length > 0) {
      winston.debug("filtering project projectIpFilterDeny with ", projectIpFilterDeny );
      var ip = ipfilter(projectIpFilterDeny, { detectIp: customDetection, mode: 'deny' })
      ip(req, res, nextIp);
    } else {
      next();
    }
  
  }
  
  
  
projectBanUserFilter(req, res, next) {
  
  winston.debug("projectBanUserFilter hereee*********** ")

    const nextIp = function(err) {
      winston.debug("projectBanUserFilter next",err);
    
        if (err && err.name === "IpDeniedError") {
          winston.info("IpDeniedError for projectBanUserFilter");
          return res.status(401).json({ err: "error projectBanUserFilter" });
          // next(err) 
        } 
    
      next();
    
    }
  
    if (!req.project) {
      return next();
    }
    
    var bannedUsers =  req.project.bannedUsers
    winston.debug("project bannedUsers: " + bannedUsers)
  
    if (bannedUsers && bannedUsers.length > 0) {
  
      let bannedUsersArr = [];
      let bannedUsersIdUserArr = [];
      for (var i =0; i < bannedUsers.length; i++) {
        bannedUsersArr.push(bannedUsers[i].ip);
        bannedUsersIdUserArr.push(bannedUsers[i].id);
      }
    
      winston.debug("project req.preDecodedJwt: ", req.preDecodedJwt)
      // winston.debug("project req.preDecodedJwt._id: "+ req.preDecodedJwt._id)


      if (req.preDecodedJwt && req.preDecodedJwt._id && bannedUsersIdUserArr.indexOf(req.preDecodedJwt._id) > -1) {
        winston.info("filtering project bannedUsers with id: " + req.preDecodedJwt._id)
        return res.status(401).json({ err: "error projectBanUserFilter by id" });
      }


      // winston.debug("filtering project bannedUsers with ", bannedUsersArr );
      // var ip = ipfilter(bannedUsersArr, { detectIp: customDetection, mode: 'deny' })
      // ip(req, res, nextIp);
      next();
    } else {
      next();
    }
  
  }
  
  

  

  decodeJwt(req, res, next) {
  
    let token = getToken(req.headers);
    winston.debug("filtering token " + token); 

    if (token) {

      try {
        var decoded = jwt.decode(token);
        winston.debug("filtering decoded ", decoded);
        req.preDecodedJwt = decoded;
      }catch(e) {
        winston.debug("Error decoding jwt");
      }
     
    }
   
    
    next();
  }
  
  


  
}
var iPFilter = new IPFilter();
module.exports = iPFilter;