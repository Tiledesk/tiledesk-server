// https://www.dofactory.com/javascript/singleton-design-pattern
let Singleton = (function () {
    let instance;
 
    function createInstance() {
        let object = new Object("I am the instance");
        return object;
    }
 
    return {
        getInstance: function () {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();