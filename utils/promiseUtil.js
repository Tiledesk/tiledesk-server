class PromiseUtil {

  async doAllSequentually(promises) {
    // return new Promise(async function (resolve, reject) {         
    // console.log("promises",promises);
    var values = [];
    for (let i=0; i < promises.length; i++) {
        // console.log("promises[i]",promises[i]);

    //   const val = await 
      var value = await promises[i]
    //   .then(function(value) {
    //     console.log("done promises[i]",value);
    //     values.push(value);
    //     console.log("values before",values);
    //   });
        values.push(value);
    };

    console.log("values",values);
    // return resolve(values);
    
    // });
    return values;
  }
}

var promiseUtil = new PromiseUtil();


module.exports = promiseUtil;