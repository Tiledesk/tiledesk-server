let stringUtil = require("../utils/stringUtil");
const uuidv4 = require('uuid/v4');

class UIDGenerator {

    generate() {        
        let uid = uuidv4();
        // console.log("uid",uid);
        let uidWithoutChar = stringUtil.replaceAll(uid, "-", "");
        // console.log("uidWithoutChar",uidWithoutChar);
        return uidWithoutChar;
    }
}

 var uidGenerator = new UIDGenerator();

 module.exports = uidGenerator;
 

 