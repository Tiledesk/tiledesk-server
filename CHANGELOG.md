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

# 2.0.6 