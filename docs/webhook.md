# Introduction
Webhooks are a powerful resource that you can use to automate your use cases and improve your productivity.

Unlike the API resources, which represent static data that you can create, update and retrieve as needed, webhooks represent dynamic resources. You can configure them to automatically notify you when for example a new request occurs.


# Use cases
Typical use case for webhook integration is connecting Tiledesk to external CRM, marketing automation tools or data analytics platforms.

Follow this tutorial if you’re developing a Tiledesk integration that reacts to internal Tiledesk events, such as new incoming chat or queued visitor.

For instance if you’re integrating a marketing automation tool, you could add a new contact every time a Tiledesk visitor starts a chat.



# Getting started

To use this tool you need to have basic knowledge about webhooks and Tiledesk authorization protocol.

This tutorial is will not be helpful for integration that pulls data on demand (not in reaction to some Tiledesk event). If you just want to pull Tiledesk reports on user request, you’d rather just use REST API.

## Prerequisites
You’ll need a Tiledesk Account. Sign up to your Dashboard.

# RESTHooks
Tiledek use RestHook patterns. REST Hooks itself is not a specification, it is a collection of patterns that treat webhooks like subscriptions. These subscriptions are manipulated via a REST API just like any other resource. 
More info here: http://resthooks.org

Tiledesk can send notifications when some particular action is performed. Such a notification is called a webhook – it’s just a simple HTTP request that Tiledesk sends to your server when a particular event occurs. 

To use RestHook you must create a Subscription. Each Subscription consists of the following properties:

* event – determines when the webhook is sent to your web server.
* target – address of your web server the webhook will be sent to.


## Subscription

### Create a subscription

```
curl -v -X POST -H 'Content-Type:application/json' -u <email>:<password> -d '{"event":"<event>", "target":"<target>"}' https://api.tiledesk.com/v1/<project_id>/subscriptions
```

Example:

```
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"event":"request.create", "target":"https://webhook.site/c312005b-5042-49e9-a769-0f3ba4245b51"}' https://api.tiledesk.com/v1/5b55e806c93dde00143163dd/subscriptions
```

Response example:

```
{
   "__v":0,
   "updatedAt":"2019-03-12T12:01:56.462Z",
   "createdAt":"2019-03-12T12:01:56.462Z",
   "target":"https://webhook.site/c312005b-5042-49e9-a769-0f3ba4245b51",
   "event":"request.create",
   "id_project":"5b55e806c93dde00143163dd",
   "createdBy":"5ab11c6b83dc240014d46095",
   "_id":"5c879fb4f1ae6600173b8c75",
   "secret":"56c189c8-33ae-4930-bd98-410a12aa45ce"
}
```

# Webhook format

Each webhook is a HTTP POST request made to the URL that you provide. The request’s POST body contains webhook information in JSON format.


```
{
   "hook":{
      "_id":"5c4f1c2e081bde0016cd61d4",
      "updatedAt":"2019-01-28T15:13:50.807Z",
      "createdAt":"2019-01-28T15:13:50.807Z",
      "target":"https://webhook.site/xyzxyz",
      "event":"request.close",
      "id_project":"5ad5bd52c975820014ba9234",
      "createdBy":"5aaa99024c3b110014b478f0",
      "__v":0
   },
   "timestamp":1549035233858,
   "payload":{
      "_id":"5c542239721b190016a50538",
      "request_id":"support-group-LXcdORkb1Kp21ucGNEH",
      "requester_id":"5beda319507c7500150b1b80",
      "first_text":"hello",
      "department":"5b8eb4955ca4d300141fb2cc",
      "sourcePage":"http://localhost:4200/#/login",
      "id_project":"5ad5bd52c975820014ba9234",
       ...
   }
}
```

Each webhook request contains the following properties:

* hook – return the subscription object that triggered the webhook. 

* token – your authentication credentials that let you call Tiledesk’s REST API methods. You won’t need to use them unless you want to make a call to Tiledesk’s API right when you receive a webhook. In that case, you just need to pass these token credentials in your API call. 

* payload – It contains the data of the webhook.

When your server receives a webhook from Tiledesk, it should respond with HTTP 200 response. Otherwise, Tiledesk will retry sending the webhook to your service for a number of times unless it receives the correct HTTP 200 response.

Note: Tiledesk webhooks are sent with Content-Type: application/json header, so please make sure that your service can handle such requests.


# Webhook Models
## Webhook events

The following Events are available and you can be notified when an action relating to that event occurs. 

| Event          | Description                        |
|----------------|------------------------------------|
| request.create | Subscribe to requests creations    |
| request.update | Subscribe to request being updated |
| request.close  | Subscribe to request being closed  |
| message.create | Subscribe to messages creations    |


## Webhook Notification object
A notification object contains the following fields:
TODO


## Signed Notifications
Each webhook notification is signed by Tiledesk via an x-hook-secret header. We do this so that you can verify the notification came from Tiledesk.

