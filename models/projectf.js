var fs = require('fs');

var util = require('util');
var mongoose = require('mongoose');


const methods = [ 'add',
    'aggregate',
    'count',
    'countDocuments',
    'create',
    'distinct',
    'ensureIndexes',
    'exec',
    'exec',
    // 'find',
    // 'findById',
    'findByIdAndRemove',
    'findByIdAndUpdate',
    // 'findOne',
    'findOneAndRemove',
    'findOneAndUpdate',
    'geoNear',
    'geoSearch',
    'index',
    'insertMany',
    'lean',
    'lean',
    'limit',
    'mapReduce',
    'plugin',
    'populate',
    'remove',
    'select',
    'set',
    'sort',
    'toObject',
    'toJSON',
    'toString',
    'update',
    'updateMany',
    'where'
];
var FILE = '/Users/andrealeo/dev/chat21/project.json';

class Project {


   constructor(project) {

    this._id = new mongoose.Types.ObjectId(),

    this.id =  this._id;
    this.name = project && project.name || "default";
    this.activeOperatingHours = project && project.activeOperatingHours || false;
    this.operatingHours = project && project.operatingHours || {};
    this.settings = project && project.settings || {};
    this.widget = project && project.widget || {};
    this.status = project && project.status || 100;
    this.jwtSecret = project && project.jwtSecret || "secretjwt";
    this.profile = project && project.profile || {}; //TODO?
    this.versions = project && project.versions || 200;
    this.channels = project && project.channels ||  {"name": "chat21"};
    this.createdBy = project && project.createdBy || "system";
    this.createdOn =  project && project.createdOn ||  new Date();
    this.updatedOn =  project && project.updatedOn || new Date();


//   profile: {
//     type: Profile.schema,
//     default: function () {
//       return new Profile();
//     }
//   },


    methods.forEach(method => {

      this[method] = function() {
          return this;
      };
  
     });
  }


  save(c) {
    fs.writeFileSync(FILE, JSON.stringify(this)  , 'utf-8'); 
    // fs.writeFileSync('./project.json', util.inspect(obj) , 'utf-8'); 
    // return this.findOne(undefined,c);
    return Project.cll(this,c);
  }

  static findOne(q,c) {
    var data  = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    // console.log("data", data);

    // if (data.name) {
      this.name = data.name;
    // }
    
    this.activeOperatingHours = data.activeOperatingHours;
    this.operatingHours = data.operatingHours;
    this.settings = data.settings;
    
    return this.cll(q,c);
  }
  static cll(q, c) {
    c(undefined, this);
    return this;
  }


}


// var project = new Project();
// // console.log("project",project);

// project.save({"name": "name1"},function(err, data) {
//   console.log("saved data",data, err);

//   var a = project.findOne({},function(err, data) {
//     console.log("read data",data, err);
//   });
  // console.log("a",a);

// });




// var MongooseModel = require('../utils/mongooseModel');
// console.log("MongooseModel",MongooseModel);

// var a = MongooseModel.findOne({ name: 'whiskers' }, (err, doc) => {
//   console.log("doc",doc);
// });
// console.log("a",a);


// var mM=mongooseModel(project);
module.exports = Project;
