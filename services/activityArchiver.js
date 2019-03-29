const activityEvent = require('../event/activityEvent');
var Activity = require('../models/activity');
var winston = require('../config/winston');

class ActivityArchiver {
    listen() {

        activityEvent.on('project_user.update', this.save);

    }

    save(activity) {
        activity.save(function(err, savedActivity) {
            if (err) {
                winston.error('Error saving activity ', err);
            }else {
                winston.error('Activity saved', savedActivity);
            }
        });
    }
}

var activityArchiver = new ActivityArchiver();
module.exports = activityArchiver;