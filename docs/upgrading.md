# Upgrading

Use this procedure to upgrade from a previous version of Tiledesk server. You must manually execute the following upgrades depending on the starting version:

# From the 2.0.7 version the schema updates are automatically managed by migrations

# Upgrading from 2.0.X to 2.0.6

## Add requests preflight field

```
db.requests.update(
  { preflight : { $exists: false }},
  { $set: {"preflight": false} },
  false,
  true
)
```

# Upgrading from 2.0.6 to 2.1.X

## Add requests participantsAgents, participantsBots and hasBot fields

```
db.requests.find( { participants: { $regex: /^bot_/ } } ).forEach(function(doc) {
  doc.participantsBots = [doc.participants[0].replace("bot_","")];
  doc.participantsAgents = [];
  doc.hasBot = true;
  db.requests.save(doc);
});

db.requests.find( { "participants": { "$not": /^bot_/ } }).forEach(function(doc) {
  doc.participantsAgents = doc.participants;
  doc.participantsBots = [];
  doc.hasBot = false;
  db.requests.save(doc);
});

```
