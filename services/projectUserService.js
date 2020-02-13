'use strict';

var Project = require("../models/project");
var Project_user = require("../models/project_user");
var mongoose = require('mongoose');
var User = require('../models/user');
var winston = require('../config/winston');
var pendinginvitation = require("../services/pendingInvitationService");

class ProjectUserService {


}
var projectUserService = new ProjectUserService();


module.exports = projectUserService;
