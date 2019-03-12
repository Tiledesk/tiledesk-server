# TILEDESK REST API

## Introduction

Tiledesk is a live chat solution that helps businesses increase sales conversion by engaging important leads on their websites. It is our goal to help many of these businesses use the Tiledesk API (the "API") to automate and enhance their customer support with Tiledesk.

## The API
This is the documentation for the Tiledesk REST API. Read the contents of this page carefully, including the Restrictions and Responsibilities, to understand how to be a good API citizen.

Endpoints are documented with the HTTP method for the request and a partial resource identifier. Example:

GET /v1/
Prepend https://api.tiledesk.com to the resource identifier to get the full endpoint URL:

https://api.tiledesk.com/v1/

The examples in the docs are cURL statements. You can run the statements on a command line to try out different API requests. To learn more, see Installing and using cURL. In Windows, you'll need to modify some of the examples in the docs to make them work. See Using cURL in Windows.

## Security and Authentication
This API is an SSL-only API, regardless of how you may have your account configured. You must be a Tiledesk user to make API requests.


### Basic authentication

Use the following authentication format with your email address and password:

{email_address}:{password}

#### Example

```
curl -v -X GET -u andrea.leo@f21.it:123456 https://api.tiledesk.com/v1/5ab0f32757066e0014bfd718/departments
```


### JWT authentication

Use the following authentication format with a JWT token.


### Obtein JWT Token

#### Example
```
curl -v -X POST -d 'email=andrea.leo@f21.it&password=123456' https://api.tiledesk.com/v1/auth/signin
```

#### Example

```
curl -v -X GET -H 'Authorization: JWT <JWT_TOKEN>' https://api.tiledesk.com/v1/5ab0f32757066e0014bfd718/departments
```


#### Rate Limiting
This API is rate limited. We only allow a certain number of requests per minute. We reserve the right to adjust the rate limit for given endpoints in order to provide a high quality of service for all clients. As an API consumer, you should expect to be able to make at least 200 requests per minute.

If the rate limit is exceeded, Tiledesk will respond with a HTTP 429 Too Many Requests response code and a body that details the reason for the rate limiter kicking in.

#### Request Format
This is a JSON-only API. You must supply a Content-Type: application/json header on PUT and POST requests. You must set an Accept: application/json header on all requests. You may get a text/plain response in case of an error such as a bad request. You should treat this as an error you need to take action on.

#### Response Format
Tiledesk responds to successful requests with HTTP status codes in the 200 or 300 range. 
When you create or update a resource, Tiledesk renders the resulting JSON representation in the response body.
Time stamps use UTC time and their format is ISO8601.
We respond to unsuccessful requests with HTTP status codes in the 400 range. The response may be "text/plain" content type for API level error messages (such as when trying to call the API without SSL). If you see a response from a known endpoint that looks like plain text, you probably made a syntax error in your REST call. If you ever experience responses with status codes in the 500 range, Tiledesk may be experiencing internal issues or having a scheduled maintenance (during which we send a 503 Service Unavailable status code). Please check the status page in such cases for any known issues.

When building an API client, we recommend treating any 500 status codes as a warning or temporary state. However, if the status persists and we don't have a publicly announced maintenance or service disruption, contact us at info@frontiere21.it


### Legal notices
Restrictions and responsibilities
Your use and access to the API is expressly conditioned on your compliance with the policies, restrictions, and other provisions related to the API set forth in our API Restrictions and Responsibilities and the other documentation we provide you. You must also comply with the restrictions set forth in the Terms of Service and the Privacy Policy that apply to your use of the Tiledesk Service, in all uses of the API. If Tiledesk believes that you have or attempted to violate any term, condition or the spirit of these policies or agreements, your right to access and use the API may be temporarily or permanently revoked.

Change Policy
Tiledesk may modify the attributes and resources available to the API and our policies related to access and use of the API from time to time without advance notice. Tiledesk will use commercially reasonable efforts to notify you of any modifications to the API or policies through notifications or posts on the Tiledesk Website. Modification of the API may have an adverse effect on Tiledesk Applications, including but not limited to changing the manner in which Tiledesk Applications communicate with the API and display or transmit Your Data. Tiledesk will not be liable to you or any third party for such modifications or any adverse effects resulting from such modifications.





## Leads
You can use the API to get or set lead information.

### Get all leads
GET /v1/leads

Allows an account to list all the leads.

```
curl -v -X GET -H 'Content-Type: application/json' -u andrea.leo@f21.it:123456 https://api.tiledesk.com/v1/5b55e806c93dde00143163dd/leads
```

### Get a lead
GET /v1/leads/{lead_id}

Fetches a lead by his or her Lead ID

```
curl -v -X GET -H 'Content-Type: application/json' -u andrea.leo@f21.it:123456 https://api.tiledesk.com/v1/5b55e806c93dde00143163dd/leads/5c81593adf767b0017d1aa66
```


### Create a Lead
POST /v1/leads

Allows to add more leads.

```
curl -v -X POST -H 'Content-Type: application/json' -u andrea.leo@f21.it:123456  -d '{"fullanem":"andrea", "lead_id":"123456"}' https://api.tiledesk.com/v1/5b55e806c93dde00143163dd/leads
```



## Requests
You can use the API to get or set request information.


### Get all requests
GET /v1/requests

Allows an account owner/administrator to list all the requests for the project.


```
curl -v -X GET -H 'Content-Type: application/json' -u andrea.leo@f21.it:123456 https://api.tiledesk.com/v1/5b55e806c93dde00143163dd/requests
```



### Get a request
GET /v1/requests/{request_id}

Fetches a lead by his or her Request ID

```
curl -v -X GET -H 'Content-Type: application/json' -u andrea.leo@f21.it:123456 https://api.tiledesk.com/v1/5b55e806c93dde00143163dd/requests/support-group-L_OG76RYhR0XFiMf2PK
```





