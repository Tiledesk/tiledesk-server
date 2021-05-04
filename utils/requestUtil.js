
class RequestUtil {

    getToken(headers) {
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
    }

    getProjectIdFromRequestId(request_id) {
        if (request_id && request_id.length>0) {
            request_id = request_id.replace("support-group-","");
            const firstChar = request_id.indexOf("-");
            if (firstChar && request_id.length>0) {
                return request_id.substring(0,request_id.indexOf("-"));
            }else {
                return null;
            }
            
        } else {
            return null;
        }

    }

    arraysEqual (a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length != b.length) return false;
      
        // If you don't care about the order of the elements inside
        // the array, you should sort both arrays here.
        // Please note that calling sort on an array will modify that array.
        // you might want to clone your array first.
      
        for (var i = 0; i < a.length; ++i) {
          if (a[i] !== b[i]) return false;
        }
        return true;
      }

}

 var requestUtil = new RequestUtil();

 module.exports = requestUtil;
 