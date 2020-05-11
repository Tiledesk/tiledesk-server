# Migrating from 2.0.X to 2.0.6

## Add requests preflight field
db.requests.update(
  { preflight : { $exists: false }},
  { $set: {"preflight": false} },
  false,
  true
)

# Migrating from 2.0.6 to 2.1.X

## Add requests participantsAgents, participantsBots and hasBot fields

### MongoDB < 4.2


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


### MongoDB > 4.2

db.requests.update(
  { participants: { $regex: /bot_/ } },
  { $set: {"participantsBots": "$participants", "participantsAgents":[], "hasBot":true } },
  false,
  true
)

db.requests.update(
  { participants: { $not: /^bot_/ } },
  { $set: {"participantsAgents": $participants, "participantsBots":[], "hasBot":false } },
  false,
  true
)