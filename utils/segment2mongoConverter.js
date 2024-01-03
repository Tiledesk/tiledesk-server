
class Segment2MongoConverter {

    convert(query, segment) {
        //console.log("qui", query);

        let condition = query;
        //let condition = {};

        // if (segment.match == "any") {
        //      // db.inventory.find( { $or: [ { quantity: { $lt: 20 } }, { price: 10 } ] } )
        //     condition["$or"] = [];
        // }

        if (segment.filters && segment.filters.length > 0) {
            for(var i = 0; i < segment.filters.length; i++) {
                let filter = segment.filters[i];
                switch (filter.operator) {
                    case '=':
                      //console.log('Operator =');
                      this.convertEqualsOperatorFilter(condition, filter);
                      break;
                    case '!=':
                        //console.log('Operator !=');
                        this.convertNotEqualsOperatorFilter(condition, filter);
                        break;
                    case '>':
                        //console.log('Operator !=');
                        this.convertGreaterThanOperatorFilter(condition, filter);
                        break;
                    case '>=':
                        //console.log('Operator >=');
                        this.convertGreaterThanOrEqualOperatorFilter(condition, filter);
                        break;
                    case 'starts with':
                        //console.log('Operator >=');
                        this.convertStarsWithOperatorFilter(condition, filter);
                        break;
                    case 'contains':
                        //console.log('Operator >=');
                        this.convertContainsOperatorFilter(condition, filter);
                        break;
                    case 'is null':
                        //console.log('Operator >=');
                        this.convertIsUndefinedOperatorFilter(condition, filter);
                        break;
                    case 'is not null':
                        //console.log('Operator >=');
                        this.convertExistsOperatorFilter(condition, filter);
                        break;

                    default:
                        console.log('Operator default');
                    } 

            }
        }

        //console.log("qui2", query);
       
    }

    convertEqualsOperatorFilter(query, filter) {
        query[filter.field] = filter.value;
    }

    convertNotEqualsOperatorFilter(query, filter) {
        query[filter.field] = {"$ne": filter.value};
    }

    convertGreaterThanOperatorFilter(query, filter) {
        query[filter.field] = {"$gt": filter.value};
    }
    convertGreaterThanOrEqualOperatorFilter(query, filter) {
        query[filter.field] = {"$gte": filter.value};
    }

    convertStartWithOperatorFilter(query, filter) {
        query[filter.field] = {"$regex": "/^"+filter.value+"/i"};
    }
    convertStartWithOperatorFilter(query, filter) {
        query[filter.field] = {"$regex": "/^"+filter.value+"/i"};
    }
    convertContainsOperatorFilter(query, filter) {
        query[filter.field] = {"$regex": filter.value};
    }
    convertIsUndefinedOperatorFilter(query, filter) {
        query[filter.field] = {"$exists": false};
    }
    convertExistsOperatorFilter(query, filter) {
        query[filter.field] = {"$exists": true};
    }
}

 var segment2MongoConverter = new Segment2MongoConverter();

 module.exports = segment2MongoConverter;
 