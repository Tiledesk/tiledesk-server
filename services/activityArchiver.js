const activityEvent = require('../event/activityEvent');
var Activity = require('../models/activity');
var winston = require('../config/winston');

class ActivityArchiver {
    listen() {

        
        activityEvent.on('user.signup', this.save);
        activityEvent.on('user.signin', this.save);
        activityEvent.on('user.verify.email', this.save);
        activityEvent.on('user.requestresetpassword', this.save);
        activityEvent.on('user.resetpassword', this.save);


        activityEvent.on('group.create', this.save);
        activityEvent.on('group.update', this.save);
        activityEvent.on('group.delete', this.save);

        // activityEvent.on('lead.create', this.save);
        activityEvent.on('lead.update', this.save);
        activityEvent.on('lead.delete', this.save);
        activityEvent.on('lead.download.csv', this.save);


        activityEvent.on('project_user.invite', this.save);
        activityEvent.on('project_user.update', this.save);
        activityEvent.on('project_user.delete', this.save);

        activityEvent.on('request.create', this.save);

        

    }

    save(activity) {
        activity.save(function(err, savedActivity) {
            if (err) {
                winston.error('Error saving activity ', err);
            }else {
                winston.info('Activity saved', savedActivity.toObject());
            }
        });
    }
}

var activityArchiver = new ActivityArchiver();
module.exports = activityArchiver;