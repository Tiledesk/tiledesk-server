const mockProjectUser = {
  "_id": "64e36f5dbf72263f7c056666",
  "id_project": "64e36f5dbf72263f7c059999",
  "id_user": "64e36f5dbf72263f7c057777",
  "role": 'owner',
  "user_available": true,
  "createdBy": "64e36f5dbf72263f7c057777",
  "updatedBy": "64e36f5dbf72263f7c057777"
}

const mockProjectFreeTrialPlan = {
  "_id": "64e36f5dbf72263f7c059999",
  "status": 100,
  "ipFilterEnabled": false,
  "ipFilter": [],
  "ipFilterDenyEnabled": false,
  "ipFilterDeny": [],
  "name": "mock-project",
  "activeOperatingHours": false,
  "createdBy": "64e36f5cbf72263f7c05ba36",
  "profile": {
    "name": "free",
    "trialDays": 14,
    "agents": 0,
    "type": "free"
  },
  "versions": 20115,
  "channels": [
    {
      "name": "chat21"
    }
  ],
  "createdAt": new Date('2023-10-16T08:45:54.058Z')
}

const mockProjectSandboxPlan = {
  "_id": "64e36f5dbf72263f7c059999",
  "status": 100,
  "ipFilterEnabled": false,
  "ipFilter": [],
  "ipFilterDenyEnabled": false,
  "ipFilterDeny": [],
  "name": "mock-project",
  "activeOperatingHours": false,
  "createdBy": "64e36f5cbf72263f7c05ba36",
  "profile": {
    "name": "Sandbox",
    "trialDays": 14,
    "agents": 0,
    "type": "free",
  },
  "versions": 20115,
  "channels": [
    {
      "name": "chat21"
    }
  ],
  "createdAt": new Date('2023-10-20T08:45:54.058Z')
}

const mockProjectBasicPlan = {
  "_id": "64e36f5dbf72263f7c059999",
  "status": 100,
  "ipFilterEnabled": false,
  "ipFilter": [],
  "ipFilterDenyEnabled": false,
  "ipFilterDeny": [],
  "name": "mock-project",
  "activeOperatingHours": false,
  "createdBy": "64e36f5cbf72263f7c05ba36",
  "isActiveSubscription": true,
  "profile": {
    "name": "Basic",
    "trialDays": 14,
    "agents": 0,
    "type": "payment",
    "subStart": new Date('2023-10-20T08:45:54.058Z')
  },
  "versions": 20115,
  "channels": [
    {
      "name": "chat21"
    }
  ],
  "createdAt": new Date('2023-10-16T08:45:54.058Z')
}

const mockProjectPremiumPlan = {
  "_id": "64e36f5dbf72263f7c059999",
  "status": 100,
  "ipFilterEnabled": false,
  "ipFilter": [],
  "ipFilterDenyEnabled": false,
  "ipFilterDeny": [],
  "name": "mock-project",
  "activeOperatingHours": false,
  "createdBy": "64e36f5cbf72263f7c05ba36",
  "profile": {
    "name": "Premium",
    "trialDays": 14,
    "agents": 0,
    "type": "payment",
    "subStart": new Date('2023-10-20T08:45:54.058Z')
  },
  "versions": 20115,
  "channels": [
    {
      "name": "chat21"
    }
  ],
  "createdAt": new Date('2023-10-16T08:45:54.058Z')
}

const mockProjectPremiumPlan2 = {
  "_id": "64e36f5dbf72263f7c059999",
  "status": 100,
  "ipFilterEnabled": false,
  "ipFilter": [],
  "ipFilterDenyEnabled": false,
  "ipFilterDeny": [],
  "name": "mock-project",
  "activeOperatingHours": false,
  "createdBy": "64e36f5cbf72263f7c05ba36",
  "isActiveSubscription": true,
  "profile": {
    "name": "Premium",
    "trialDays": 14,
    "agents": 0,
    "type": "payment",
    "subStart": new Date('2024-01-31T10:00:00.058Z')
  },
  "versions": 20115,
  "channels": [
    {
      "name": "chat21"
    }
  ],
  "createdAt": new Date('2024-01-20T10:00:00.058Z')
}

const mockProjectCustomPlan = {
  "_id": "64e36f5dbf72263f7c059999",
  "status": 100,
  "ipFilterEnabled": false,
  "ipFilter": [],
  "ipFilterDenyEnabled": false,
  "ipFilterDeny": [],
  "name": "mock-project",
  "activeOperatingHours": false,
  "createdBy": "64e36f5cbf72263f7c05ba36",
  "profile": {
    "name": "Custom",
    "trialDays": 14,
    "agents": 0,
    "type": "payment",
    "subStart": new Date('2023-10-20T08:45:54.058Z')
  },
  "versions": 20115,
  "channels": [
    {
      "name": "chat21"
    }
  ],
  "createdAt": new Date('2023-10-16T08:45:54.058Z')
}

const mockOldProjecPlusPlan = {
  "_id": "64e36f5dbf72263f7c059999",
  "status": 100,
  "ipFilterEnabled": false,
  "ipFilter": [],
  "name": "mock-project",
  "activeOperatingHours": false,
  "createdBy": "64e36f5cbf72263f7c05ba36",
  "profile": {
    "name": "Plus",
    "trialDays": 30,
    "agents": 40,
    "type": "payment",
    "subStart": new Date('2023-10-20T08:45:54.058Z'),
    "subEnd": new Date('2024-3-29T08:45:54.058Z'),
    "subscriptionId": "sub_1MjKLHG7zhjGozkvDsXITiDf",
    "last_stripe_event": "invoice.payment_succeeded"
  },
  "versions": 20115,
  "channels": [
    {
      "name": "chat21"
    }
  ],
  "createdAt": new Date('2023-10-18T08:45:54.058Z'),
  "updatedAt": new Date('2023-10-20T08:45:54.058Z'),
  "bannedUsers": [],
  "ipFilterDeny": [],
  "ipFilterDenyEnabled": false
}

module.exports = { mockProjectUser, mockProjectFreeTrialPlan, mockProjectSandboxPlan, mockProjectBasicPlan, mockProjectPremiumPlan, mockProjectPremiumPlan2, mockProjectCustomPlan, mockOldProjecPlusPlan };