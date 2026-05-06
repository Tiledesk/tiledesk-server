const ROLE_PERMISSIONS = {
    owner: [
        "flows_read", 
        "flow_add", 
        "flow_edit", 
        "flow_delete", 
        "flow_test", 
        "flow_duplicate", 
        "flow_share", 
        "flow_export", 
        "flow_webhook_copy", 
        "flow_webhook_edit", 
        "flow_webhook_delete",
        "permission_test_create",
        "permission_test_read",
        "permission_test_update",
        "permission_test_delete",
    ],
    admin: [
        "flows_read", 
        "flow_add", 
        "flow_edit", 
        "flow_delete", 
        "flow_test", 
        "flow_duplicate", 
        "flow_share", 
        "flow_export", 
        "flow_webhook_copy", 
        "flow_webhook_edit", 
        "flow_webhook_delete",
        "permission_test_create",
        "permission_test_read",
        "permission_test_update",
    ],
    agent: [
        "flows_read", 
        "flow_test", 
        "flow_share",
        "permission_test_read",
    ],
    user: [],
    guest: [],
}

module.exports = {
    ROLE_PERMISSIONS
}