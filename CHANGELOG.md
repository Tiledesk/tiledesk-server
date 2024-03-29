

💥 TILEDESK SERVER v2.3.77 💥
🚀        TAGGED AND PUBLISHED ON NPM           🚀
🚀        IN PRODUCTION                        🚀
(https://www.npmjs.com/package/@tiledesk/tiledesk-server/v/2.3.77) 

# 2.7.2
- Improved QuoteManager with kbs and chatbots (disabled)
- Improved QuoteManager with AI multipliers

# 2.7.1
- Updated widget.json translation file
- Improved widget White Label 

# 2.7.0
- Lead update queued
- Updated tybot-connector to 0.2.57
- Updated kb route
- Added trainer job worker

# 2.5.3
- Updated whatsapp-connector to 0.1.64

# 2.5.2
- Updated messenger-connector to 0.1.18
- Bug fix: kbs createdAt wrongly generated
- Added advanced search for kbs

# 2.5.1
- Bug fix: reset busy status for agents when smart assignment is enabled
- Added possibility to delete chat21 conversation 
- Updated tybot-connector to 0.2.56

# 2.5.0
- Added new pricing modules
- Added integrations route
- Added new kb route
- Added mqttTest module

# 2.4.103
- Added new pricing modules
- Added integrations route
- Added new kb route
- Added mqttTest module

# 2.4.102
- Updated whatsapp-connector to 0.1.63
- Updated messenger-connector to 0.1.17
- Added quote management

# 2.4.101
- Added new route for knowledge base
- Bug fix: conflicts with old knowledge base

# 2.4.100
- Updated tybot-connector to 0.2.50
- Added new route for knowledge base

# 2.4.99
- Updated whatsapp-connector to 0.1.62
- Updated messenger-connector to 0.1.16
- Bug fix: globals are not exported when a chatbot is published

# 2.4.98
- Updated whatsapp-connector to 0.1.61

# 2.4.97
- Updated whatsapp-connector to 0.1.61

# 2.4.96
- Updated tybot-connector to 0.2.49

# 2.4.95
- Updated tybot-connector to 0.2.48

# 2.4.94
- Updated WIDGET_LOCATION usage

# 2.4.92
- Updated messenger-connector to 0.1.14

# 2.4.91
- Bug fix: globals will no longer exported in chatbot export

# 2.4.90
- Updated tybot-connector to 0.2.45

# 2.4.89
- Updated whatsapp-connector to 0.1.60

# 2.4.88
- Added chatbot templates and community in pubmodules

# 2.4.87
- Updated tybot-connector to 0.2.43
- Updated whatsapp-connector to 0.1.59

# 2.4.86
- Updated tybot-connector to 0.2.41

# 2.4.85
- Updated tybot-connector to 0.2.40

# 2.4.84
- Updated tybot-connector to 0.2.38
- Updated whatsapp-connector to 0.1.58

# 2.4.83
- Improved whatsapp log services
- Updated whatsapp-connector to 0.1.57
- Updated whatsapp-jobworker to 0.0.7

# 2.4.82
- Added whatsapp log services

# 2.4.81
- update whatsapp-connector to 0.1.56

# 2.4.79
- update whatsapp-connector to 0.1.55
- update whatsapp-jobworker to 0.0.4
- added support for whatsapp broadcast queue

# 2.4.78
- update whatsapp-connector to 0.1.53
- update messenger-connector to 0.1.13
- update telegram-connector to 0.1.10

# 2.4.77
- update tybot-connector to 0.2.26

# 2.4.76
- update tybot-connector to 0.2.25
- update redirectToDesktop email for new onboarding

# 2.4.74
- update tiledesk-messenger-connector to 0.1.12

# 2.4.73
- Fix KB Settings bugs

# 2.4.72
- update tiledesk-messenger-connector to 0.1.11

# 2.4.71
- update tiledesk-messenger-connector to 0.1.10

# 2.4.70
- campaign direct refactoring with job worker
- segment filter fix for lead

# 2.4.69
- update tiledesk-tybot-connector to 0.2.15

# 2.4.68
- update tiledesk-tybot-connector to 0.2.11

# 2.4.67
- update tiledesk-tybot-connector to 0.2.9

# 2.4.63
- downgrade tiledesk-tybot-connector to 0.1.97

# 2.4.62
- improved kbsettings endpoints for qa, scrape and check status
- update tiledesk-whatsapp-connector to 0.1.52
- update tiledesk-telegram-connector to 0.1.8

# 2.4.59
- update tiledesk-whatsapp-connector to 0.1.52
- update tiledesk-telegram-connector to 0.1.8

# 2.4.57
- added telegram module
- update tiledesk-apps to 0.1.17
- update tiledesk-telegram-connector to 0.1.7

# 2.4.55
- updated tybot-connector to 0.1.97

# 2.4.43
- updated tybot-connector to 0.1.96
- added segment module

# 2.4.42
- createIfNotExistsWithLeadId now update the lead email if jwt email changes

# 2.4.41
- Whatsapp updates

# 2.4.40
- botSubscriptionNotifier and botEvent queued disabled
- added lead.create to the queue
- queued scheduler (close chat)
- added chat21 channel, cache, rules 

# 2.4.39
- Queued botSubscriptionNotifier
- added lead.create to the queue
- @tiledesk/tiledesk-tybot-connector: 0.1.89
- jobsManager.listen(); //listen after pubmodules to enabled queued *.queueEnabled events

# 2.4.38
- str fix

# 2.4.37
- added replyto to email endpoint
- tiledesk/tiledesk-tybot-connector: 0.1.88
- added lead.create to the queue
- added subscriptionNotifiedQueued for the most common events (message.create, request.create, request.update, request.close, lead.create, project_user.update)


# 2.4.36
- Google last name fix with empty string

# 2.4.35
- tiledesk/tiledesk-tybot-connector: 0.1.87

# 2.4.34 -> ERRORE PAGAMENTO
- tiledesk/tiledesk-tybot-connector:0.1.83
- stateless as default for Google Strategy
- added redis session for google auth. To enable it put ENABLE_REDIS_SESSION to true otherwise standard passport session is used

# 2.4.33
- "@tiledesk/tiledesk-tybot-connector": "^0.1.86"
- stateless true for Google Strategy

# 2.4.32
- close chat set timeout for performance

# 2.4.31
- close chat set timeout for performance

# 2.4.30
- close chat set timeout for performance

# 2.4.29
- @tiledesk/tiledesk-whatsapp-connector 0.1.50

# 2.4.28
- smartAssignment default value condition for channels

# 2.4.27
- tiledesk/tiledesk-tybot-connector:0.1.83

# 2.4.26
- filter by priority
- bugfix intent invalidation by intent id

# 2.4.25
- "@tiledesk/tiledesk-tybot-connector": "^0.1.81"
- bugfix intent invalidation by intent_display_name

# 2.4.24
- Wildcard invalidate bugfix for intents, subscriptions and triggers

# 2.4.23
- waiting time chance invalidation fix
- delete redis fix

# 2.4.22
- bugfix changed del method from cachemon to native redis

# 2.4.21
- changed del method from cachemon to native redis

# 2.4.20
- removed unused redis delete with wildcard

# 2.4.19
- Added QUEUE_NAME env parameter

# 2.4.18
- logfix

# 2.4.17
- logfix
- post and .patch for /properties are equals
- bugfix added invalidatRequestSimple for waiting time issue
- added QUEUE_EXCHANGE_TOPIC env parameter
- email template changes


# 2.4.16
- env for durable and persistent queue

# 2.4.15
- persistent false


# 2.4.14 -> PROD
- added request_channel attribute to chat21 messages
- moved propertiies to agent role
- logfix
- "@tiledesk/tiledesk-tybot-connector": "^0.1.80"

# 2.4.13
- "@tiledesk/tiledesk-tybot-connector": "^0.1.79"

# 2.4.12
- logfix
- givanni fix

# 2.4.11
- whatsapp connector aggiornata alla 0.1.48
- aggiunti campi title, certifiedTags e short_description nel modello faq_kb
- gestiti i campi title, certifiedTags e short_description in update faq_kb

# 2.4.10
- email template fix

# 2.4.9
- added trained field to bot entity
- added training endpoint
- skip has role verification for admin@td user
- bot websocket realtime endpoint
- added properties to lead model and patch endpoint
- @tiledesk/tiledesk-whatsapp-connector 0.1.46

# 2.4.8
- added webp image
- added description to user entity

# 2.4.7

# 2.4.6
- Added forcing message to bot.calling trigger action

# 2.4.5
- Custom subject for direct email. Also supported with trigger subject configuration (from DB). See Custom OCF trigger Open Ticket email

# 2.4.3
- tiledesk-ent/tiledesk-server-payments: 1.1.12 with node 16.20
# 2.4.2
- tiledesk-whatsapp-connector to 0.1.45
- bot.calling trigger added
- Endpoint to generate a jwt token for a chatbot
- tiledesk-ent/tiledesk-server-payments: 1.1.11 with node 16

# 2.4.1
- tiledesk/tiledesk-tybot-connector": "^0.1.77
- node 16 support for package.json and dockers files

# 2.3.132
- Added channel name to message attributes for chat21 engine

# 2.3.131
- update tiledesk-whatsapp-connector to 0.1.44
- update tiledesk-messenger-connector to 0.1.9

# 2.3.130
- cache invalidation for docker image

# 2.3.129
- ocf email fix

# 2.3.128
- email subject customization on project settings

# 2.3.127
- Added Google OAuth Strategy
- tiledesk/tiledesk-tybot-connector": "^0.1.76


# 2.3.126
- removed secret from faq_kb cache before caching
- removed description and attributes from chabot subscription notifier to reduce the payload size

# 2.3.125
-  @tiledesk/tiledesk-tybot-connector@0.1.74

# 2.3.124
-  tiledesk/tiledesk-messenger-connector 0.1.8

# 2.3.123
-  tiledesk/tiledesk-messenger-connector 0.1.7

# 2.3.122
- new stripe
- Updated dependency @tiledesk/tiledesk-tybot-connector to 0.1.73

# 2.3.121
- trial period to 14 days
- tiledesk-ent/tiledesk-server-payments: 1.1.9 with new stripe plan
- Updated dependency @tiledesk/tiledesk-tybot-connector to 0.1.72

# 2.3.120
- ocf fix

# 2.3.119
- Updated dependency @tiledesk/tiledesk-tybot-connector to 0.1.71

# 2.3.118
-  tiledesk/tiledesk-messenger-connector 0.1.3

# 2.3.117
- Updated dependency @tiledesk/tiledesk-tybot-connector to 0.1.70

# 2.3.116
- tiledesk/tiledesk-dialogflow-connector": "^1.8.4",

# 2.3.115
- github action fix

# 2.3.113
- tiledesk-ent/tiledesk-server-payments: 1.1.7 with new stripe plan
- Updated dependency @tiledesk/tiledesk-tybot-connector to 0.1.68
- tiledesk-whatsapp-connector 0.1.41

# 2.3.112
- fb messenger fix

# 2.3.111
- Updated dependency @tiledesk/tiledesk-tybot-connector to 0.1.67
- facebook messenger plugin added 

# 2.3.110
- websocket fix ATTENTION change value by reference
- Bugfix: Cannot read property 'toString' of undefined at /usr/src/app/services/requestService.js:404
- Updated tiledesk/tiledesk-whatsapp-connector 0.1.40
- Implmented request /agent endpoint (also support request with empty deparment generated by direct agent/bot assignment with participants field)
- fixed bug: fields webhook_enabled and webhook_url was ignored on “publish”

# 2.3.109
- Added support gif mimetype for image endpoint 

# 2.3.108
- BugFix Chat21 event emitter listener changes request attributes values by reference
- Restored populate for message endpoint
- Test attributes send message

# 2.3.107
- bugfix execPopulate message endpoint wrong attributes
- Dependency updated tiledesk-whatsapp-connector 0.1.39


# 2.3.106
@tiledesk/tiledesk-tybot-connector 0.1.63
{{dateFormat request.createdAt \"DD/MM/YYYY HH:mm:ss\"}}
# 2.3.105
- tiledesk/tiledesk-apps: 1.0.14

# 2.3.104
- apps module auth fix

# 2.3.103 
- Fix image not found bug

# 2.3.102
- Fix image not found bug

# 2.3.101
- created property entity and endpoint
- JSON_BODY_LIMIT env variable fix

# 2.3.100
- added filter by tags for lead endpoint

# 2.3.99
- tags field changed to flat object

# 2.3.98
- Ocf fix

# 2.3.97
- Updated dependency @tiledesk/tiledesk-tybot-connector to 0.1.62

# 2.3.96
- image endpoint set content type and length headers

# 2.3.95
- Bugfix when a conversation has a first_text with \agent

# 2.3.94
- log fix

# 2.3.93
- subscriptionNotifier secret fix

# 2.3.92
- Apps module fix for public secret key

# 2.3.91
- subscription webhook fix for global webhook secret creation for token
- added jsonRequest field to subscriptionLog to save request body payload

# 2.3.90
- Dependency updated tiledesk-tybot-connector 0.1.59

# 2.3.89 
- added as_attachment query parameter to images endpoint to download the images

# 2.3.88
- added score, publishedBy and publishedAt to bot model 

# 2.3.87
- Geo Service fix with queue enabled

# 2.3.86 
- Geo Service fix with queue enabled

# 2.3.85
- Dependency updated tiledesk-whatsapp-connector 0.1.33

# 2.3.84 
- Dependency updated tiledesk-tybot-connector 0.1.58
- Dependency updated tiledesk/tiledesk-kaleyra-proxy 0.1.7

# 2.3.83
- Dependency updated tiledesk-tybot-connector 0.1.56
- Dependency updated tiledesk-whatsapp-connector 0.1.32

# 2.3.82
- Enable current chabot when &td_draft=true query parameter is passed in the url

# 2.3.81
- Added publish method to the chatbot endpoint and fix for SubscriptionNotifier
- Added request_status and preflight body parameters to send (post) message endpoint

# 2.3.80
- Updated dep tiledesk/tiledesk-whatsapp-connector to 0.1.31

# 2.3.79
- Env fix

# 2.3.78 
- Updated dep tiledesk/tiledesk-whatsapp-connector to 0.1.30
- Added FaqSchema.index({ id_project: 1, id_faq_kb: 1, intent_id: 1 }, { unique: true });
- Added filter by public and certified to the bot endpoint
- Added cache invalidation for intent edit and delete
- Added score field to the bot model

# 2.3.77 
- Updated tiledesk/tiledesk-whatsapp-connector dependency to 0.1.24
- Added KALEYRA_API_URL environment variable
- Now GRAPH_URL environment variable is optional 
- Added bot cache invalidation for new radis key without project for tilebot
- Added chatbot fulltext endpoint 

# 2.3.76
- Adedd tag to bot model
- \\n fix for public private key
- Chatbot invalidation fix when created
- @tiledesk/tiledesk-tybot-connector@0.1.53

# 2.3.75
- @tiledesk/tiledesk-tybot-connector@0.1.51

# 2.3.74
- Added cache for bot 
- @tiledesk/tiledesk-tybot-connector@0.1.50
- Added cache for user 

# 2.3.73
- Removed unused mongoose-auto-increment dependency
- Removed version versions files
- Added attributes field to the project model and relative patch endpoint 
- Message text validation only for the first message
- Updated tiledesk/tiledesk-tybot-connector@0.1.46
- Added an endpoint to patch the bot attributes
- Added Faq_kbSchema index({certified: 1, public: 1});
- Added ActivitySchema index({id_project: 1, createdAt: -1});
- Changed from .remove to findByIdAndRemove for faq remove endpoint to fix event emitter payload
- Updated tiledesk/tiledesk-tybot-connector@0.1.47
- Added caching for /widgets endpoint with invalidations
- Added bot rules to /widgets endpoint
- Select false for resetpswrequestid field of user model
- Added support for Public Private Key for JWT Auth with GLOBAL_SECRET_OR_PRIVATE_KEY and GLOBAL_SECRET_OR_PUB_KEY and GLOBAL_SECRET_ALGORITHM(default: HS256, RS256 for pub private key) environments variables. If these properties are configured Public/Private Key method is enabled otherwise if only GLOBAL_SECRET env varible is configured the shared secret method is used. 
- Updated tiledesk/tiledesk-tybot-connector@0.1.48
- Removed “snapshot” from request payload for external chatbot
- Added CHATBOT_TEMPLATES_API_URL env varible
- Updated tiledesk/tiledesk-tybot-connector@0.1.49




# 2.3.72
- Added Kaleyra module
- Updated tiledesk-apps to 1.0.12

# 2.3.71.1 -> PROD v2
- ocf email fix

# 2.3.71 
- Email service send email direct fit without request_id
- Removed strong from transcript email template
- Added for updateWaitingTimeByRequestId the field enable_populate
- Added cache for message send endpoint 
- Added support to mention and group to mail endpoint
- Now user role can use /users/search (for smtp)
- Disable text validation for send message
- Logo email fix

# 2.3.70
- Update tiledesk-tybot-connector to 0.1.42

# 2.3.69
- Update tiledesk-dialogflow-connector to 1.8.3

# 2.3.68
- Update tiledesk-dialogflow-connector to 1.8.2

# 2.3.67
- Tybot updated to 0.1.39

# 2.3.66
- ccEnabled fix

# 2.3.65
- Updated tiledesk-tybot-connector 0.1.38
- chatbot and subscription can use send email endpoint
- Added EMAIL_CC_ENABLED env variable to disable CCs email inboud notification

# 2.3.64
- log fix
- Tybot updated to 0.1.37

# 2.3.63
- Tybot updated to 0.1.36
- ChangeLog degli ultimi due commit:
- added trainingService.js file 
- added certified, mainCategory and intentsEngine fields for faq_kb model 
- deleted new_bot_name for forked chatbot 
- updated faq and faq_kb tests
- edit trainingService.js
- add test for bot with intentsEngine (training) 


# 2.3.62
- if (request.markModified) fix webhook in queue

# 2.3.61
- troubleshooting api added

# 2.3.60
- Tybot updated to 0.1.34

# 2.3.59
- Tybot updated to 0.1.32

# 2.3.58
- Tybot updated to 0.1.31

# 2.3.57
- Tybot updated to 0.1.30

# 2.3.55 
- Tybot updated to 0.1.28

# 2.3.54
- Added HIDE_CLOSE_REQUEST_ERRORS env variable
- Added email.send trigger action 
- Added participants parameter for trigger action
- Added status -1 for department model to hide department for dashboard and widget. It can be used for chatbot
- Added template engine to send email trigger action

# 2.3.51
- Added message.received as trigger event
- Added import chatbot
- Fix lead.fullname.email.update event

# 2.3.50
- Added new email sending endpoint 
- Emails endpoint is now usable by agents
- Added route for tiledesk-apps
- Added route for tiledesk-whatsapp
- Added route for tiledesk-kaleyra
- Updated widget.json file
- Fixed template for: beenInvitedNewUser.html beenInvitedExistingUser.html

# 2.3.49 
- @tiledesk/tiledesk-tybot-connector": "^0.1.22

# 2.3.48
- added populate_request to root message endpoint for descending 

# 2.3.47
- added root message endpoint for descending 

# 2.3.46 
- @tiledesk/tiledesk-tybot-connector": "^0.1.21

# 2.3.45
- process.env.GLOBAL_SECRET fix

# 2.3.44
- Removed unused "sinon": "^9.2.4",
- Removed unused "sinon-mongoose": "^2.3.0"
- Update @tiledesk/tiledesk-tybot-connector: 0.1.19


# 2.3.43
- Package-lock fix
- @tiledesk/tiledesk-tybot-connector: 0.1.17


# 2.3.42
- Labels update 

# 2.3.41
- Added force parameter to close request 
- Updated dependency tiledesk/tiledesk-tybot-connector": 0.1.16

# 2.3.40
- logfix

# 2.3.39
- logfix

# 2.3.38
- JobManager require fix

# 2.3.37
- Created a job worker for geo db, activities and email notification
- users_util lookup fix

# 2.3.36
- BugFix email secure with false value. https://tiledesk.discourse.group/t/error-sending-email/180

# 2.3.35
- Added user util endpoint for contact lookup from chat21

# 2.3.34
- aqmp depenency fix

# 2.3.32
- log pub module queue

# 2.3.31
- logfix

# 2.3.30
- save multiple messages fix with sequential promises
- Default JSON_BODY_LIMIT increased to 500KB. Added JSON_BODY_LIMIT env variable

# 2.3.29
- UIDGenerator class replacement for request route
- Added hasRole cache for project_user
- Added index { id_project: 1, role: 1, status: 1, createdAt: 1  } for  Project_user schema
- Enabled project_user for cacheEnabler class
- Created cache test for project_user and project
- Enabled project_user cache for hasRole method
- Log fix
- add fields reply and enabled to faq model 
- field answer in faq model is no longer required
- add field public to faq_kb model
- when template is undefined the empty template is now created
- Add unit test for project and project_user
- Created new endpoint for creating new requests with unit test
- Created new endpoint for inserting multiple messages at once with unit test
- New validation for empty text for new message endpoint 
- Added project_user_test route 
- Unit test fix

# 2.3.28
- UIDGenerator renamed fix

# 2.3.27
- CacheUtil fix with new values
- UIDGenerator class replacement
- Disabled cache for requestService route. Bug:  No matching document found for id "XYZ" 

# 2.3.26
- DialogFlow connector fix /tdbot

# 2.3.25
- Emebedded DialogFlow connector to 1.7.4

# 2.3.24
- Increased cache TTL from: standardTTL from 120 to 300, longTTL from 1200 to 3600
- Added cache request.create.simple + cacheEnabler. name fix
- Disabled unapplicable cache for updateWaitingTimeByRequestId and find request by id REST API
- Updated dependency @tiledesk/tiledesk-tybot-connector to 0.1.14
- Restored populateMessageWithRequest. Bug with \agent command. Try to resolve performance with cache
- Added cache for chat21 webhook event type message. The cache key is without the project id
- Disabled cache for chat21 webhook conversation archived method
- Added cache for message event lookup
- Added cache for chat21 webhook event type message
- Added cache for getoperator method of department service


# 2.3.23
- cacheEnabler + trigger cache + subscription cache
- project cache with cacheEnabler
- request cache with cacheEnabler
- Updated dependency @tiledesk/tiledesk-tybot-connector to 0.1.10
- Added trigger and subscription cache invalidation rules

# 2.3.22
- added cacheoose dep package.json
- Updated dependency @tiledesk/tiledesk-tybot-connector to 0.1.8

# 2.3.21
- log fix
- Updated dependency @tiledesk/tiledesk-tybot-connector to 0.1.7
- Moved cache module to public module
- filter request by smartAssignment

# 2.3.20
- Performance: Removed populate for message.update messages. This event is not used by anyone. 

# 2.3.19
- Moved queue module to public module
- Moved route-queue to public module
- Disable queue module if JOB_WORKER_ENABLED is true

# 2.3.18.7
- filter request by smartAssignment

# 2.3.18.6
- logfix

# 2.3.18.1 
- Updated dependency @tiledesk/tiledesk-tybot-connector to 0.1.10

# 2.3.18
- Added profileStatus field to the project_user model
- Added smartAssignment field to the request model                      
- Canned responses default limit value increased from 40 to 1000
- Now you change channel name from REST endpoint
- New Tybot 0.1.5
- GeoService setImmediate added
- Websocket setImmediate and topic validation
- Do not trigger requestNotification send email method for preflight request
- Removed deprecated .count with .countDocument
- Added workingStatus to request model                                     
- Changed Anonymous signin from Guest to guest#shortuid
- Updated chat21/chat21-node-sdk to 1.1.7. Now group parameter is supported.
- Moved queue module to public modules folder
- Created JobManager and Job runner files
- Now activity archiver module uses queue engine
- Now geoService uses queue engine
- Added GEO_SERVICE_ENABLED to enable disable ip lookup to latitude and longitude
- Added EMAIL_NOTIFICATION_ENABLED to enable disable email notification


# 2.3.17 
- Webhook chat21 fix
- Chat21 Cloud Function: when an agent leaves a conversation an info message is sent to notify it to the visitor 

# 2.3.16
- Request close activity added as event. Now you can see from the Activity menu who has closed the conversation and when.
- Log fix for webhook chat21

# 2.3.15
- BugFix: Endpoint Widget fix for undefined of the project.widget object

# 2.3.14 
- Added ip filter with Deny roles and ban User roles
- Ban notifier module
- Created a new Middleware decodeJwt before passport with passport fallback
- Removed unused requestService.incrementMessagesCountByRequestId code from chat21Webhook
- Allow agents to manage groups endpoint
- Embedded the new Tilebot chat server

# 2.3.13 
- Getting ip fix

# 2.3.10
- Added tilebot submodule
- Askbot endpoint fix for tilebot and auto create faqs for tilebot
- Added /widgets/ip endpoint   
- Added bot and subscription as permission check for /intents or /faq

# 2.3.9
- Rasa process env variable read fix

# 2.3.8
- @tiledesk/tiledesk-rasa-connector": "^1.0.10

# 2.3.7
- Find by intent_display_name parameter intents

# 2.3.5
- CHAT_REOPENED updated conversation true

# 2.3.4
- download pdf fix
- added no_count and no_textscore fields query parameters to request search endpoint

# 2.3.3
- Follower notification fix by email

# 2.3.2
- Dowload trascript as csv, pdf and txt endpoint
- Added closed_by field to the request model
- Added followers field to the request model
- Added lead index
- Added widget v5 code loader /widgets/v5/:project_id -> heroku blocca cache-control PROVA IN PROD
- Bugfix  Cannot read property 'profile' of null 
- Added filter by channel offline and online 
- Updated Rasa Connector to 1.0.7   -- QUANDO PORTI IN PROD AGGIORNA SUL DB PER FARLI PUNTARE QUI..
- Send info message on lead.fullaname.update
- Follower email notification

https://support.zendesk.com/hc/en-us/articles/4408822451482-Using-CCs-followers-and-mentions#topic_wm2_zgq_qgb

Followers allow you to include additional internal users (agents or administrators) on ticket notifications. Internal users can add followers to tickets. There's no limit to the number of followers you can include on a ticket.

Agents and administrators can use the Followers field in the properties panel of the ticket interface to add internal users to a ticket. 

Internal users who can view the ticket can add followers to the ticket.

Followers can:

* Receive public comments and private comments added to the ticket conversation.
* Ability to make a private comments and public comment.
* Replying to a private comment creates a private comment and likewise for public comments.
* Remove themselves from the ticket conversation.
* Remain hidden from end users copied on the ticket.
* Access any ticket that they are following, even if they would not normally be allowed to access the ticket.

# Adding agents as followers from the ticket interface
If followers have been enabled by the administrator, internal users (your company's agents and administrators) can add followers from the Followers field from the properties panel in the ticket interface. Followers are internal users such as agents, light agents, and administrators that receive email notifications when a ticket is updated.

Note these things about using followers:

* Followers can add and receive public comments and private comments.
* Followers can reply to a public comment with a public comment, and reply to a private comment with a private comment.
* Followers can remove themselves from the ticket.
* Followers are hidden from copied (CC'd) end users and other followers on email notifications. Their name and email address don't appear in email notifications sent to other users. For more information about the email notifications that followers receive, see Best practices for using email clients with CCs and followers.
* If your administrator has enabled Automatically make an agent a follower, you can added internal users, such as agents and admins, to tickets as followers from ticket notifications by adding them to the reply as a CC. In this case, the agent becomes both a CC and a follower.
## To add agents as followers from the ticket interface
* Select a ticket from one of your views.
The Followers field appears in the ticket properties panel on the left side.

* In the Followers field, enter a user's name, email domain, or organization name and the relevant results appear.
Internal users such as agents, light agents, and administrators can be followers.

* To quickly add yourself as a follower, click follow.



## To remove a follower from the ticket interface
* Click the delete button (X) in the person's name box in the Followers list


* To quickly remove yourself as a follower, click unfollow.

* To add agents as followers from ticket notifications

* From your email client, open the ticket notification.
* Open the CC line, per your email provider’s instructions.
* Add the name of the user you want to add as a follower. Repeat as necessary.
* Add your comment and send the email.



# 2.3.1
- changed tiledesk logo for emails
- open modules: analytics, activity log, multi tenancy, departments, groups, canned responses, tags, triggers, webhooks

# 2.2.39
- Added enterprise module
- Log fix
- Added DISABLE_MONGO_PASSWORD_MASK env variable
- Embedded rasa  proxy
- Added Swedish, Uzbek and Kazakh languages
- Added Azerbaijani language

# 2.2.38  
- Unlocked departments, groups, multi-tenant, tags and canned resposes modules

# 2.2.37  -> PROD 
- skip subtype private message for notification

# 2.2.36
- Ukraine translations

# 2.2.35 
- BugFix projection for /me service

# 2.2.34  
- Added transcript webpage for users without system messages

# 2.2.33
- Request fulltext sort fix

# 2.2.32
- Added Arabic language for the widget
- Updated dependencies with npm update
- Filter requests by lead email

# 2.2.31 (compatible with: Dashboard 2.2.37, Widget 5.0.25)
- Fix email template reading from project.
- Fix export messages to csv
- Fix ip address resolver
- Exclude poweredBy field from widget endpoint
- Bugfix when a conversation has a first_text with \agent
- Added rasa chatbot chatbot type
- Added visitor email and fullname in the fulltext index 

# 2.2.30
- Log fix

# 2.2.29 
- Added endpoint to find requests created by users and guests
- Log fix

# 2.2.28 (compatible with dasboard ver. 2.2.36)
- Operator.select returns context object that contains the temp request
- Added Serbian language to the widget
- Added tag field to the project_user
- Removed default BCC from email
- BugFix: Avoid cluster concurrent jobs in multiple nodes
- Faq template now support blank and example
- Organizzation support added
- ipFilter related to the project is now supported
- Added filter channel name for the request
- Added edit card for payment
- Fix concierge concierge bot for department selection
- Added filter to find a request by ticket_id
- Added filter to snap_lead_lead_id for request
- Added endpoint to close a request by guest


# 2.2.26 (compatible with dasboard ver. 2.2.35)
- Tag fix for 2.2.25

# 2.2.25
- New label prechat form
- Updated mongodb-runner from 4.8.1 to 4.8.3 to fix ssh key error

# 2.2.24 
- webhook subscription can fetch temmates endpoint
- Added hasBot and createdAt index to the request model

# 2.2.23 
- Increased list answers limit from 1000 to 3000

# 2.2.22
- Increased list answers limit from 300 to 1000

# 2.2.21 
- Increased list answers limit from 100 to 300
- enabled again waiting time in widgets endpoint unused


# 2.2.20
- disabled waiting time in widgets endpoint unused

# 2.2.18
- Router logger module enable with ROUTELOGGER_ENABLED=true

# 2.2.17
- Removed default fallback limit on parse reply

# 2.2.16 
- Email templates endpoint
- Created request.updated event for request event and deprecated request.update.comment
- Added Handlebars template processor for the message transformer module only if message.attributes.templateProcessor=true
- Email test send endpoint
- Bugfix widget label
- Added /intents alias for /faq endpoint
- The request_id field of the request model has now a unique index

# 2.2.15
- Added catch messageService.send for bot
- Added external searcher for bot( ex. Rasa proxy) 
- Faq language fix taken from bot language for create single and import from csv
- Lower case reset password fix
- Added alias /bots for /faq_kb

# 2.2.14
- Fix Tiledesk Queue 1.1.11 with authEvent.queueEnabled = true 

# 2.2.13
- Send message validation with empty text

# 2.2.12
- Add /bot endpoint
- Bot and subscription can manage bots

# 2.2.11 
- Logfix

# 2.2.10
- Native mqtt auth fix

# 2.2.8
- Public trigger module

# 2.2.6
- Quota license fix

# 2.2.4  -> PROD
- email invitation fix

# 2.2.3
- Email inboud fix (others disabled and inboudDomain variable fix and token query string encode fix)

# 2.2.2
- log fix

# 2.2.1
- log fix

# 2.2.0
- Cache circleci fix
- Added EMAIL_REPLY_ENABLED and EMAIL_INBOUND_DOMAIN env parameters.
- Added API_URL env variable TODO use wehbook url the same as API_URL if not differnet

# 2.1.42 (Compatible with tiledesk-dashboard 2.2.X)


- Added ticket_id sequence field to the request model
- Routing round robin fix (Also in 2.1.40.1)
- GLOBAL_SECRET env variable fix (Also in 2.1.40.4)
- Chatbot now support blocked_intent
- BugFix route request to another department with the same agents (Also in 2.1.40.1)
- Renamed the chatbot webhook payload field from faq to intent
- Updated tiledesk-chat-util to 0.8.21  (Also in 2.1.40.1)
- Removed request first_text replace new line with empty string (for ticketing)

- Fix login problem when email contains upper case char
- Removed answer field from the fulltext search of the faqs (2.1.40.3)

- Stripe fix for adding new agents (2.1.40.13)
- Added request delete endpoint by id (Also in 2.1.40.15)
- Campaigns direct and for group (Also in 2.1.40.16)

- Csv request export added tags (2.1.40.14)
- Changed request_id to the new standard: support-group-<project_id>-<uid>
- Added tag to the department model
- Bugfix first message with an image fix and touchText limited to 30 character or subject (2.1.40.3)
- Fix request create if department id is not correct
- MessageRoot endpoint also for group messages (Also in 2.1.40.16)
- c21 handler group mesages support (Also in 2.1.40.16)
- Added recipientFullname field to message model. Added save method to messageServive (Also in 2.1.40.16)
- ChatBot webhook fix when the webhook returns also attributes 
- Messages export csv supported
- Request util to lookup id_project from request_id (2.1.40.24)

- Find user id from user email endpoint (also in 2.1.40.21)
- Inizialize enterprise modules before public modules
- Request Notification fix loading snapshot agents (also in 2.1.40.22)
- Config secret fix from env (also in 2.1.40.22)
- Lic ck for users (also in 2.1.40.26)
- Added s_ticketing_taking_01 trigger
- Added email template from project settings
- Faq pagination support
- For Ticketing send to the cc(s) the agent replies 
- \agent now is hidden
- added \close faq
- \close now is hidden
- set custom role in custom auth using signInWithCustomToken
- Chat21 contacts find for agent logged with custom auth 
- Added language field to faq_kb and used to specify the language for faq full-text query (default en)
- Added request priority field
- Concierge bot fix to reroute only for temp conversation without a bot. Race condition issue when you try manually route a request for example inside a chatbot webhook (Also in 2.1.40.31)
- Added webhook_enabled parameter to the faqService create method and test refactor
- Added SYNC_JOIN_LEAVE_GROUP_EVENT environment variable to enable sync between Chat21 (join and leave) and Tiledesk. Default is false. (Also in 2.1.40.32 )
- Added ALLOW_REOPEN_CHAT environment variable to reopen a chat if a user write after a chat is closed  
- Used message.received instead message.create in the messageActionsInterceptor to fix race condition sometime occurs with \close message sent by the bot      
- Please type your reply above this line Only if replyTo is specified
- Webhook origin header fix for webhook


## Email inbound
- EmailService supports custom email config with custom SMTP server settings and custom from email
- Added Tiledesk customer header in the outbound email
- Added Message-ID and sender (message sender fullname) on the outbound email 
- Added project object to sendRequestTranscript function
- Welcome label fix key
- Seamless source page fix

# 2.1.41 
- remove duplicate request script with: 1619185894304-request-remove-duplicated-request-by-request_id--autosync.js
- requestNotification improvement not sending email with empty email field
- Enabled witb DISABLE_SEND_OFFLINE_EMAIL the seamless conversation with email
- signinWithCustomToken endpoint of the auth router now support id_project body parameter for jwt with generic https://www.tiledesk.com audience field (used by tiledesk-smtp-server)
- files download endpoint
- emailService added EMAIL_REPLY_TO parameter;
- Added email notification for new message and new request for email and form channel (ticket) 
- Added microLanguageTransformationInterceptor enabled when message.attributes.microlanguage==true

# 2.1.40.35
- Quota license fix

# 2.1.40.34
- logfix

# 2.1.40.33

- Added setTimeout to resolve race condition for \close event returned by bot 

# 2.1.40.32
- Added SYNC_JOIN_LEAVE_GROUP_EVENT environment variable to enable sync between Chat21 (join and leave) and Tiledesk. Default is false. 

# 2.1.40.31
- Concierge bot fix to reroute only for temp conversation without a bot. Race condition issue when you try manually route a request for example inside a chatbot webhook 

# 2.1.40.30
- logfix

# 2.1.40.29
- --production for npm install within Docker for Enterprise

# 2.1.40.28
- --production for npm install within Docker

# 2.1.40.27
- Added language field to faq_kb and used to specify the language for faq full-text query 

# 2.1.40.26
- Lic ck bug fix for users

# 2.1.40.25 
- microLanguageTransformerInterceptor startup error. It is disabled. Module not present

# 2.1.40.24
- emailService toJSON is not a function fix

# 2.1.40.23
- requestNotification fix and requestUtilRoot lookup endpoint added

# 2.1.40.22
- Inizialize enterprise modules before public modules
- Request Notification fix loading snapshot agents

# 2.1.40.21
- Find user id from user email endpoint

# 2.1.40.20
- MessageRoot endpoint validation fix

# 2.1.40.19 
- Stripe fix with version 1.1.5

# 2.1.40.18
- Messages export csv supported

# 2.1.40.17
- Stripe restored to the previous version 1.1.3

# 2.1.40.16
- added message recipientfullname field to the message entity  to support chat campaigns for direct and group 

# 2.1.40.15
- tag fix

# 2.1.40.14
- requet CSV export fix

# 2.1.40.13 
- Stripe fix for adding new agents

# 2.1.40.12
- Docker image number fix 

# 2.1.40.11
- Docker image number fix 

# 2.1.40.10 
- Docker image number fix 

# 2.1.40.9 
- Added request delete endpoint by id

# 2.1.40.7
- logfix

# 2.1.40.6
- Fix request create if department id is not correct

# 2.1.40.5
- Logfix

# 2.1.40.4
- GLOBAL_SECRET env variable fix

# 2.1.40.3 
- Bugfix first message with an image fix and touchText limited to 30 character or subject
- Removed answer field from the fulltext search of the faqs


# 2.1.40.2 
- log fix

# 2.1.40.1
- Routing round robin fix
- Updated tiledesk-chat-util to 0.8.21
- BugFix route request to another department with the same agents


# 2.1.40
- webhook fix for return empty body
- log fix
- Added hasbot filter for GET requests endpoint

# 2.1.39
- Log fix
- Chat21 presence  webhook error handler fix 

# 2.1.38 -> TILEDESK DASHBOARD v2.1.49.1
- Added PUT /images/users endpoint where you can archive user's image at the root level of the path
- Added DELETE /images/users endpoint to delete an image
- Added PUT /images/users/photo endpoint where you can archive user's avatar at the root level of the path
- Root messages endpoint fixed
- Now RestHook module is public
- Minor deps update

# 2.1.37 

- Trigger module moved to public npm
- Websocket Message limit with environment variable WS_HISTORY_MESSAGES_LIMIT (300 default)
- Chat21Webhook now support then new event_type with values "conversation-archived" and the old "deleted-conversation" (back compatibility). The field recipient_id is renamed to convers_with, but maintained for back compatibility. The project_id is taken from the support-group but also from conversation.attributes for back compatibility.
- Chat21 group sync now create group with group- prefix. If old group exists (before group- prefix) group updating and deleting can create a duplicate entries
- Fix intent_info object for is_fallback false
- Updated dependencies
- Updated snapshot.lead when a lead is updated. Editing a lead requires to refresh the realtime conversation panel.
- Lead PUT endpoint fix for status field
- Websocket error fix when MongoDB is < 4.XX catch snapshot exception
- Added request.attributes.abandoned_by_project_users when a user leave a chat
- Send messages direct endpoint
- Create project_user endpoint by agent (Ticketing) now is with Guest Role
- Bot webhook error now return the standard message and not the error 
- Added WEBHOOK_ORIGIN env variable for each webhook calls


# 2.1.36
- Minor log fix 

# 2.1.35
- Minor ws log fix 

# 2.1.34
- Minor ws log fix 

# 2.1.33
- Disabled sendUser email for requestNotification

# 2.1.32
- Project_user endpoint (/get) now can be obtained by uuid_user field
- Added intent_info to message.attributes sent from bot
- Pending invite email lowercase fix
- Project_user invite email lowercase fix
- Widget endpoint fix for not found project 
- Chat21 WebHook now support also "message-sent" event_type value

# 2.1.31
- Log fix

# 2.1.30 (Requires tiledesk-dashboard 2.1.45+)
- Added Pending Invitation db indexes
- The requests queries with status open (!=1000) are not limited for free accounts.   
- Performance improvment moving request.agents (select false) and availableAgentsCount fields into request.snapshot. Updated @tiledesk-ent/tiledesk-server-triggers:1.1.75. Migration scripts: 1616687831941-trigger_availableAgentsCount_to_snapshot_agents--autosync 1616687831941-trigger_availableAgentsCount_to_snapshot_agents-key--autosync 1616685902635-request_agents_to_snapshot_agents--autosync
- Added event index to increase analytics performance 
- Snapshot.department fix for ticketing (Without a selected department)  
- Websocket query is improved (without lead populate and with lean. it's enabled isAuthenticated field of the request.snapshot.requester)
- Added user object to the event emit method to fix decoded_jwt field of the lead and request
- The Request deletion also deletes messages    

# 2.1.21
- BugFix: request availableAgentsCount performance fix

# 2.1.20
- Default faq fix
- Log fix

# 2.1.19
- Default faq with actions example

# 2.1.18
- Added faq intent_display_name and intent_id. Included database migration script: 1615214914082-faq-intent_id-intent_display_name-fields-added--autosync.js
- Now you can filter the requests by snap_department_routing, req.query.snap_department_default, req.query.snap_department_id_bot, snap_department_id_bot_exists 
- BugFix: Parse FAQ form CSV fix
- You can enabled Smart Assignment by default for new project with SMART_ASSIGNMENT_CHAT_LIMIT_ON_DEFAULT_PROJECT=true (default = false)
- Added snapshot object to the request to store embedded snap objects like department, agents, lead, requester.
- Updated repository dependencies
- Websocket teammates update fix
- Now support node 12.x and docker node 12
- Updated chat21 dependencies (firebase, etc.)
- Added project_user creation endpoint for Ticketing (POST)
- Set participants endpoint supports no_populate query param
- Added request /assing endpoint
- Now a request can be assinged directly to a partipant without a department for ticket use case.
- Added Analytics events
- Added leads filter to retrieve only their with email (with_email=true) and with fullname (with_fullname=true)
- Now the bot can find actions answers by intent_display_name and intent_id
- Project_user deletion only for owner

# 2.1.17
- Log fix

# 2.1.16
- CSV export fix

# 2.1.15


- Automatically close unresponsive bot conversation  (also in 2.1.14.4). You may configure CLOSE_BOT_UNRESPONSIVE_REQUESTS_CRON_EXPRESSION, etc.
- Added _answerid field to the messages replies send from the chatbot under attributes field.
- Added fulltext indexes for request.notes request.tags and request.subject.. 
- Added default language field for pivoting. We disabled pre traslation for EN, IT, FR. So only pivot language is taken into account. Included database migration script:  1604082287722-labels-data-default-fields--autosync.js
- Added status field to project_user collection. Included database migration script: 1603797978971-project_users-status-field-added--autosync.js
- Added channel_type (group or direct) and channel (chat21, whatsapp, etc..) fields to the message model. Included database migration script: 1602847963299-message-channel_type-and-channel-fields-added--autosync.js
- Added posfix $reply_time to WAITING_TIME_FOUND label. Included database migration script: 1604082288723-labels-waiting_time-added_suffix_reply_time--autosync.js
- Added channelOutbound (chat21, whatsapp, etc..) fields to indentify the outboud channel to the request model. Included database migration script: 1603955232377-requests-channel-outbound-fields--autosync.js
- Renamed request field UNSERVED (100) to UNASSIGNED (100) and SERVED (200) to ASSIGNED (200)
- Renamed property max_agent_served_chat to max_agent_assigned_chat of the project.settings object.Included database migration script: project-settings-max_agent_assigned_renamed--autosync
- Renamed property max_served_chat to max_assigned_chat of the project_user object. Included database migration script: project_user-max_assigned_chat-renamed--autosync
- SourcePage and bot answer stats with tiledesk-ent/tiledesk-server-analytics: 1.1.9
- Fix Conversation export to CSV
- Bots statistics with tiledesk-ent/tiledesk-server-analytics: 1.1.8
- Added support to channel selection for resthook module @tiledesk-ent/tiledesk-server-resthook: 1.1.47
- Added supervisor role
- BugFix: Updated jwthistory and queue module with listen function fix (also in 2.1.14.1)
- Department patch method added (also in 2.1.14.2)
- BugFix: Now you can signupWithCustomToken using subject=userexternal and subscription type audience (https://tiledesk.com/subscriptions/subid). It's used by Whatsapp and Facebook Messenger apps (also in 2.1.14.2)
- Chat21 contact detail endpoint
- Added tags field for the lead model
- Added location field to the request model. Auto populate location field from ip
- Update all dependencies to last version
- Image endpoint now return also thumbnail filename
- Added analytics endpoint for messages (also in 2.1.14.2)
- New websocket return also events model (beta)
- Log fix for signup and signin endpoint (also in 2.1.14.2)
- Added email notification setting for each teammate (also in 2.1.14.3)
- Added email notification setting for each project
- Bugfix (@tiledesk-ent/tiledesk-server-triggers":1.1.69) for chatbot invitation race condition with Chat21 createGroup and setMembers method. Now the trigger listens to requestEvent.on("request.support_group.created",..) event and not to requestEvent.on("request.create",..) event. This doen't require data migration for old triggers (also in 2.1.14.4).
- Added plugin to save log to MongoDB (also in 2.1.14.4) with WRITE_LOG_TO_MONGODB=true, LOG_MONGODB_LEVEL, DATABASE_LOG_URI
- Added plugin to save multi-tenant log to MongoDB with WRITE_LOG_MT_TO_MONGODB=true, LOG_MT_MONGODB_LEVEL
- Added DEFAULT_FULLTEXT_INDEX_LANGUAGE env parameter for Faq, Lead, message and requests. Before the index language was Italian.
- Added support to \close action
- Disabled send trascript email for autoclosed conversations #413

# 2.1.14.5 -> Cloud Production
- Winston MongoDB Log fix

# 2.1.14.4
- Automatically close unresponsive bot conversation. You may configure CLOSE_BOT_UNRESPONSIVE_REQUESTS_CRON_EXPRESSION, etc.
- Bugfix (@tiledesk-ent/tiledesk-server-triggers":1.1.69) for chatbot invitation race condition with Chat21 createGroup and setMembers method. Now the trigger listens to requestEvent.on("request.support_group.created",..) event and not to requestEvent.on("request.create",..) event. This doen't require data migration for old triggers.
- Added plugin to save log to MongoDB 

# 2.1.14.3
Added email notification setting for each teammate (also in 2.1.14.3)

# 2.1.14.2
- Department patch method added (ok)
- BugFix: Now you can signupWithCustomToken using subject=userexternal and subscription type audience (https://tiledesk.com/subscriptions/subid). It's used by Whatsapp and Facebook Messenger apps . UNISALENTO TEST
- Added analytics endpoint for messages 
- Log fix for signup and signin endpoint.

# 2.1.14.1
- Updated queue module with listen function fix

# 2.1.14
- Renamed field presence.lastOnlineAt to changedAt
- Added filter presencestatus for project_users endpoint
- Websocket events updated with filters

# 2.1.13
- Added Cors options pre-flight with 
- Fix TD218 Audit log for user invitation already registered

# 2.1.12
- Chat21 engine selection with CHAT21_ENGINE=[mqtt|firebase]
- Schema migration tool with mongoose-migrate. Added env property DISABLE_AUTO_SHEMA_MIGRATION
- #TD-250 Added emoji callout
- Cors fix. Removed alternative cors response header.
- Channel manager refactoring
- Event route fix and ws event endpoint
- WS projectì_user endpoint is now usable by other teammate
- Message text required only for type text messages
- #TD-251 Email lower case fix
- Updated Node default engine to 11.15.0
- Added hasBot query filter to retrive conversations with or without a bot
- Chatbot \frame action command supported
- Supported components: tiledesk-dashboard:2.0.73+ chat21-webwidget:4.0.75+ chat21-ionic:2.0.12

# 2.1.11
- Mongo support for Winston with: WRITE_LOG_TO_MONGODB=true 
- Logfix

# 2.1.10
- Tiledesk Chat21 groups syncronizer. Enable with SYNC_CHAT21_GROUPS="true"
- Built-in faq updated  and chatbot webhook example changed
- Return role: admin if the admin sign-in with email and password
- Default fallback event emitting
- Files and images storage services
- Supported components: tiledesk-dashboard:2.0.70 chat21-webwidget:4.0.73 chat21-ionic:2.0.12

# 2.1.9
- Widget departments fix

# 2.1.8
- SigninWithCustomToken fix for different audience types

# 2.1.7
- Minor fix

# 2.1.6 
- Push notification fix for the first support message and for group joining.

# 2.1.5
- Email template externalization with handlebars under /template/email folder. 
 You can override the email template using EMAIL_ASSIGN_REQUEST_HTML_TEMPLATE, EMAIL_POOLED_REQUEST_HTML_TEMPLATE,
 EMAIL_RESET_PASSWORD_HTML_TEMPLATE, EMAIL_PASSWORD_CHANGED_HTML_TEMPLATE, EMAIL_EXUSER_INVITED_HTML_TEMPLATE,
 EMAIL_NEWUSER_INVITED_HTML_TEMPLATE, EMAIL_VERIFY_HTML_TEMPLATE, EMAIL_SEND_TRANSCRIPT_HTML_TEMPLATE env variables

# 2.1.4
- Email config parameters fix

# 2.1.3
- Language pivot fix

# 2.1.2
- License fix

# 2.1.1
- Minor bug fix

# 2.1.0
- Release

# 2.1.0-beta24
- Minor bug fix

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