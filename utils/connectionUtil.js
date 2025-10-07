
class ConnnectionUtil {

    constructor(connection) {
        this.connection = this.connection;
    }

    get() {
        console.log("this.connection",this.connection)
        return this.connection;
    }
    set(connection) {
        this.connection = connection;
    }

}

let connnectionUtil = new ConnnectionUtil();

module.exports = connnectionUtil;


