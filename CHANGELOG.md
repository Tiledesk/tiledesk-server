# 2.1.0-beta23
- Email fix for pooled request caming from bot

# 2.1.0-beta22 
- filter identity bot. use all=true to get all bot. Require Dashboard 2.0.49
- Chat21 Contacts for web chat recipients list
- Chat21 Presence webhook 
- Widget i8n


# 2.1.0-beta14 # 2.1.0-beta15 # 2.1.0-beta16 # 2.1.0-beta..20
- Docker tag

# 2.1.0-beta13
- add canned responses and tag library
- add groups and departments modules
- cache, routing, resthook deps update
- added request.status all for rest api
- request and lead physical deletion
- add mt and visitor counter modules
- removed reqLog feature
- typing webhook fix
- label fix with no pivoting to default languages
- removed terminus

# 2.1.0-beta12
- Send transcript fix

# 2.1.0-beta11
- Activity archiver fix for preflight request
- request physical deletion

# 2.1.0-beta10
- Minor bugfix for events

# 2.1.0-beta9
- Trigger fix for custom authentication

# 2.1.0-beta7
- Activities, Jwt History and Rest Hook update

# 2.1.0-beta6
- Widget language pivoting fix

# 2.1.0-beta5
- Support for cache
- Removed message_count of request model
- Concierge bot now update lead after preflight

# 2.1.0-beta4
- added isAuthenticated field to project_user model
- trigger update 
- set requester to request create of the chat21 webhook

# 2.1.0-beta2
- added field participantsAgents, participantsBot and hasBot fields. Migration file updated
- request, department, project, project_users, subscription indexes added
- conciergeBot multilanguage improvement
- trigger module updated
- resthook module updated with minor fixes
- added fanout pub sub to queue module and added support for *.queue.pubsub events
- WS_HISTORY_REQUESTS_LIMIT env variable added

# 2.1.0-beta1 
- project rest api order fix by updatedAt
- improved internal bot with defaultFallback and smart text and webhook
- messageService.send with metadata field
- widget and test page route
- Dockerfile fix (removed nano and nodemon)
- invite teammate rest api with available or unavailable 
- welcome message when a request is assigned to an agent (TOUCHING_OPERATOR)
- added department description and bot description fields
- added request rating rest api (PATCH)
- implemented \start command 
- trigger improvement 
- added request status (TEMP=50) and preflight field (exclude request.preflight=true from ws) 
- concierge bot now supports switch from preflight to standard request (rerouting, preflight update, first_text update) 
- added typing event 
- created Message Transformation Engine for multilanguage message (labels with the new labelService) and text templating
- added language field to message model and indexes improvement
- tag and tagLibrary refactoring 
- resigninAnonymously rest api for widget re-authenticate
- email notification improvement for agent joing 
- added label for office closed
- added queue for Enterprise version (websocket)
- Websocket pub/sub fix with handlePublishMessageToClientId
- Websocket performance fix with lean and removing populate 
- Added kubernetes sample config file
- Added required firstname and lastname to signup endpoint
- Removed message.request.messages and message.request.department.bot for message.create event  
