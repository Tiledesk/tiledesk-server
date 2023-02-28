'use strict';

var requestEvent = require("./../event/requestEvent");
var Location = require("./../models/location");
var Request = require("./../models/request");


var winston = require('../config/winston');
var geoip = require('geoip-lite');

class GeoService {

    constructor() {
        this.enabled = true;
        if (process.env.GEO_SERVICE_ENABLED=="false" || process.env.GEO_SERVICE_ENABLED==false) {
            this.enabled = false;
        }
        winston.debug("GeoService this.enabled: "+ this.enabled);
    }


  // https://medium.com/@rossbulat/node-js-client-ip-location-with-geoip-lite-fallback-c25833c94a76
  // https://www.npmjs.com/package/geoip-lite
  // https://www.npmjs.com/package/geoip-country

  listen() {
    
    if (this.enabled==true) {
        winston.info("GeoService listener started");
    } else {
        return winston.info("GeoService listener disabled");
    }
    


 
  // var ip = "95.255.73.34";
  // var geo = geoip.lookup(ip);
  
  // console.log("geo", geo);

  // { range: [ 1610565632, 1610566143 ],
  //     country: 'IT',
  //     region: '65',
  //     eu: '1',
  //     timezone: 'Europe/Rome',
  //     city: 'Roseto degli Abruzzi',
  //     ll: [ 42.6716, 14.0148 ],
  //     metro: 0,
  //     area: 200 }



  var requestCreateKey = 'request.create';
  if (requestEvent.queueEnabled) {
    requestCreateKey = 'request.create.queue';
  }
  winston.debug('GeoService requestCreateKey: ' + requestCreateKey);


  requestEvent.on(requestCreateKey, function(request) {

    setImmediate(() => { 

    winston.debug("request", request);

    var ip = (request.location && request.location.ipAddress) || (request.attributes && request.attributes.ipAddress);
    winston.debug("ip" + ip);
    if (ip) {
        var geo = geoip.lookup(ip);  
        winston.debug("Geo result", geo);

        
        if (geo) {
            var update = {};

            if (!request.location) {
                request.location = {};
            }

            if (geo.country && !request.location.country) {
                winston.debug("geo.country:"+ geo.country);
                // request.location.country = geo.country;
                update["location.country"] = geo.country;

            }
            if (geo.region && !request.location.region) {
                winston.debug("geo.region: "+ geo.region);
                // request.location.region = geo.region;
                update["location.region"] = geo.region;
            }
            if (geo.city && !request.location.city) {
                winston.debug("geo.city: " + geo.city);
                // request.location.city = geo.city;
                update["location.city"] = geo.city;
            }

            if (!request.location.ipAddress) {
                winston.debug("request.location.ipAddress: " + request.location.ipAddress);
                // request.location.ipAddress = ip;
                update["location.ipAddress"] = ip;
            }

            // console.log(request.location.toString());
            

            // var locFound=false;
            // try {
            //     var loc = request.location.geometry;
            //     locFound = true;
            // } catch (e) {locFound = false;}
            
            winston.debug("geo.ll: " + geo.ll);
            winston.debug("request.location: " + request.location);
            winston.debug("request.location.geometry: " + request.location.geometry);
            
            
            if (geo.ll && (!request.location.geometry || 
                    (request.location.geometry && request.location.geometry.coordinates && request.location.geometry.coordinates.length==0) 
                ) ) {
                // if (geo.ll && request.location.geometry != undefined) {
                winston.debug("geo.ll: " + geo.ll);
                // request.location.geometry = {type: "Point", coordinates: geo.ll};
                update["location.geometry"]  = {type: "Point", coordinates: geo.ll};
            }
            
            
            // var setObj = { $set: {location: update} }        
            // winston.info("setObj", setObj);
            // winston.info("update", update);

            winston.debug("geo request saving", update);
            // winston.debug("geo request saving", request);


            // if (request.markModified) {
            //     request.markModified('location');
            // }
            

            //when queue is enabled request.save is undefined because request is a plain object
            // request.save(function(err, reqL) {            
            return Request.findByIdAndUpdate(request.id, update, { new: true, upsert: false }).exec( function(err, reqL) {                
                if (err) {
                    return winston.error("Error saving location metadata for request with id " + request._id, err);
                }
                return winston.verbose("Saved location metadata for request with id " + request._id);
            }); 

            //TODO AGGIORNA ANCHE LEAD e req.snapshot.lead?
            // leggi ip da request e nn da attributes
               
        }
    }
    });
    });
}


}
var geoService = new GeoService();


module.exports = geoService;
