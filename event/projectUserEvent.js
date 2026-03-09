const EventEmitter = require('events');
const winston = require('../config/winston');
const Group = require("../models/group");

class ProjectUserEvent extends EventEmitter {
    constructor() {
        super();
        this.registerListeners();
    }

    registerListeners() {

        this.on('project_user.deleted', async (pu) => {

            try {
                winston.debug('[project_user.deleted] Event catched:', pu);
    
                const id_project = pu.id_project;
                let id_user = pu.id_user.toString();
                if (typeof id_user === 'object' && id_user._id) {
                    id_user = id_user._id.toString();
                }
    
                const result = await Group.updateMany({ id_project: id_project }, { $pull: { members: id_user }});
                winston.verbose(`Event project_user.deleted: User ${id_user} removed from ${result?.nModified} groups.`)

            } catch (err) {
                winston.verbose(`Event project_user.deleted: Error removing user ${id_user} from groups: `, err);
            }

        });

    }
}

// Istanza singleton
const puEvent = new ProjectUserEvent();

module.exports = puEvent;
