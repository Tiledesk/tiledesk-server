var request = require('request');
var Subscription = require('../models/subscription');

var SubscriptionNotifier = {

  notify: function(event, item, next) {
    console.log("Subscription.notify", event, item);
    
    Subscription.find({event:event, id_project: item.id_project}).exec(function (err, subscriptions) {
      console.log("subscriptions.length", event,  subscriptions.length);
    
      //var json = {event: event, timestamp: Date.now(), payload: item};
      var json = {timestamp: Date.now(), payload: item};
      subscriptions.forEach(function(s) {
          
          json["hook"] = s;

          request.post({
            url: s.target,
            json: json
          }, function(err, result, json){
            //console.log("SENT " + event + " TO " + s.target, "result", result, "with error " , err);
            console.log("SENT " + event + " TO " + s.target,  "with error " , err);
            if (next) next(err, json);
          });
      });
  });
},
  // https://mongoosejs.com/docs/middleware.html#post-async
  decorate: function(model, modelName) {
    var isNew = false;

    model.pre('save', function(next) {
      isNew = this.isNew;
      console.log("Subscription.notify.pre (isNew)", isNew);
     
      return next();
    });

    //console.log("decorate");
    // .afterCreate = function(item, next) {
    model.post('save', function(doc, next) {
     
       // If we have isNew flag then it's an update
       var event = (isNew) ? 'create' : 'update';
       console.log("Subscription.notify."+event);
      next(null, doc);
      SubscriptionNotifier.notify(modelName+'.'+event, doc);
    });

    // model.afterUpdate = function(item, next) {
    //   next(null, item);
    //   SubscriptionNotifier.notify(modelName+'.update', item);
    // }

    // model.afterDestroy = function(next) {
    //   next();
    //   SubscriptionNotifier.notify(modelName+'.delete', {});
    // }
  }
};

module.exports = SubscriptionNotifier;