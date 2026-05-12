const OWNER_ROLE = [                                
        ];

const ADMIN_ROLE = [                               
                "request_read_all"
        ];
const AGENT_ROLE= [
                "request_read_group"
        ];

// console.log("ADMIN_ROLE", ADMIN_ROLE.concat(AGENT_ROLE));
module.exports = {
        "agent": AGENT_ROLE,
        "admin": ADMIN_ROLE.concat(AGENT_ROLE),
        "owner": OWNER_ROLE.concat(ADMIN_ROLE).concat(AGENT_ROLE) 

}
// const ADMIN_ROLE = Object.assign({}, ADMIN_ROLE, AGENT_ROLE)  
// const ADMIN_ROLE = { ...ADMIN_ROLE, ...AGENT_ROLE }  
