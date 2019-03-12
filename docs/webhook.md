# Introduction
Webhooks are a powerful resource that you can use to automate your use cases and improve your productivity.

Unlike the API resources, which represent static data that you can create, update and retrieve as needed, webhooks represent dynamic resources. You can configure them to automatically notify you when for example a new request occurXXX.


# Use cases
Typical use case for webhook integration is connecting Tiledesk to external CRM, marketing automation tools or data analytics platforms.

Follow this tutorial if you’re developing a Tiledesk integration that reacts to internal Tiledesk events, such as new incoming chat or queued visitor.

For instance if you’re integrating a marketing automation tool, you could add a new contact every time a Tiledesk visitor starts a chat.



# Getting started

To use this tool you need to have basic knowledge about webhooks and Tiledesk authorization protocol.

This tutorial is will not be helpful for integration that pulls data on demand (not in reaction to some Tiledesk event). If you just want to pull Tiledesk reports on user request, you’d rather just use REST API.

## Prerequisites
You’ll need a Tiledesk Account. Sign up to your Dashboard.


# Webhooks
Tiledesk can send notifications when some particular action is performed. Such a notification is called a webhook – it’s just a simple HTTP request that Tiledesk sends to your server when a particular event occurs. 

Each webhook consists of the following properties:

* Event – determines when the webhook is sent to your web server.
* Target URL – address of your web server the webhook will be sent to.


# Webhook format

Each webhook is a HTTP POST request made to the URL that you provide. The request’s POST body contains webhook information in JSON format.

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


Each webhook contains the following properties:

* hook – tells you the event that triggered the webhook. Possible values: chat_started, chat_ended, visitor_queued.

* token and license_id – your authentication credentials that let you call LiveChat’s REST API methods. You won’t need to use them unless you want to make a call to LiveChat’s API right when you receive a webhook. In that case, you just need to pass these token and license_id credentials in your API call. Here’s an example.

* payload – please read the Webhook data types section.

When your server receives a webhook from Tiledesk, it should respond with HTTP 200 response. Otherwise, Tiledesk will retry sending the webhook to your service for a number of times unless it receives the correct HTTP 200 response.

Note: Tiledesk webhooks are sent with Content-Type: application/json header, so please make sure that your service can handle such requests.


# Webhook Models
## Webhook topics

The following Events are available and you can be notified when an action relating to that event occurs. You just need to tell us where to send the notification.


| Event           | Description                                   |
|-----------------|-----------------------------------------------|
| request.created | Subscribe to user and lead initiated messages |
|                 |                                               |
|                 |                                               |


## Webhook Notification object
A notification object contains the following fields

A notification object contains the following fields

## Handling webhook notifications
When you setup a subscription you will receive notifications on your chosen topics. How you handle those notifications, i.e. the HTTP status code returned, will determine the subsequent state of that subscription. Please see below for a list of how a subscription will respond to these status codes

## Signed Notifications
Each webhook notification is signed by Intercom via an X-Hub-Signature header. We do this so that you can verify the notification came from Intercom by decoding the signature.

The value of this X-Hub-Signature header is computed by creating a signature using the body of the JSON request and your app's client_secret value, which you can find on the Basic Info page of your app.

The signature is the hexadecimal (40-byte) representation of a SHA-1 signature computed using the HMAC algorithm as defined in RFC2104.

