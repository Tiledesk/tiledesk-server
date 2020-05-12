== 

npm run test:int

== Run specific test ==

npm test --  --grep 'Subscription./requests.create'



mocha trigger.js   --grep 'Trigger.EventEmit'

mocha trigger.js   --grep 'Trigger.EventEmitCreateRequest'


mocha ./test/authenticationJwt.js    --grep 'AuthenticationJWT.signinJWt-Project-external-user-YESAudYesSubject'

mocha ./test/requestRoute.js    --grep 'RequestRoute.getbyidWithPartecipatingBots'

mocha ./test/requestRoute.js    --grep 'RequestRoute.create'

mocha trigger.js   --grep 'Trigger.EventEmitCreateRequest'


mocha messageService.js   --grep 'messageService.createMessageMultiLanguage'



mocha authentication.js   --grep 'signInAnonymously.signInAnonymouslyReLogin'




 mocha subscriptionRequest.js   --grep 'Subscription.request.update-removeparticipant:'


 mocha requestService.js   --grep 'RequestService.addparticipant'