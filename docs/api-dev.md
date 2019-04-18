# TILEDESK LOCALHOST REST API

## Signup

```
curl -v -X POST -d 'email=andrea.leo@f21.it&password=123456' http://localhost:3000/auth/signup
```


## Signin

```
curl -v -X POST -d 'email=andrea.leo@f21.it&password=123456' http://localhost:3000/auth/signin
```


## Firebase signin

```
curl -v -X POST -d 'email=andrea.leo@f21.it&password=123456' http://localhost:3000/firebase/auth/signin
```

## Firebase createtoken

```
curl -v -X POST -u andrea.leo@f21.it:123456 http://localhost:3000/firebase/createtoken
```

## Projects

### Create

```
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"name":"testprj"}' http://localhost:3000/projects
```


## Messages 



### Create 

```
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"sender":"io", "sender_fullname":"Andrea Leo", "text":"firstText"}' http://localhost:3000/5ca366fdee19dbc72e98e96f/requests/req123456/messages
```
### Get
```
smessages/5beeb3835d34344cd4962a8c
```




## Requests 

### Create 

```
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"request_id":"request_id", "requester_id":"requester_id", "text":"text"}' http://localhost:3000/5ca366fdee19dbc72e98e96f/requests
```


### List

```
curl -v -X GET -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 http://localhost:3000/5bedbbd18b9ed53a6a3f3dd3/requests/req123456/
```


### Get

```

### List

```
curl -v -X GET -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 http://localhost:3000/5ab0f32757066e0014bfd718/requests/
```


### Patch 

```
curl -v -X PATCH -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"rating":5, "rating_message":"Great"}' http://localhost:3000/5ab0f32757066e0014bfd718/requests/5b800a7f52ee93a525ca0d8c
```

### Share by email
```
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 http://localhost:3000/5bc7678f3cbc8921530fffbb/requests/request_id-waitingTimeRequest/share/email?to=andrea.leo@frontiere21.it
```

## Departments 

### Create 

```
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"name":"testdepartment","id_bot":"idbot"}' http://localhost:3000/5ab0f32757066e0014bfd718/departments
```

### List

```
curl -v -X GET -u andrea.leo@f21.it:123456 http://localhost:3000/5ab0f32757066e0014bfd718/departments
```

### Create a default department

```
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"name":"default","id_bot":"","default":true}' http://localhost:3000/5ab0f32757066e0014bfd718/departments
```

### Get default department

```
curl -v -X GET -u andrea.leo@f21.it:123456 http://localhost:3000/5ab0f32757066e0014bfd718/departments/default
```

### Get the available operator for a specific department
```
curl -X GET -u andrea.leo@f21.it:123456 http://localhost:3000/5ad706aa7009f70267089951/departments/5ad706db7009f70267089955/operators
```

## Bots 

### List

```
curl -v -X GET -u andrea.leo@f21.it:123456 http://localhost:3000/5ab0f32757066e0014bfd718/faq_kb
```

#### Create

```
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"name":"testbot"}' http://localhost:3000/5bedbbd18b9ed53a6a3f3dd3/faq_kb
```


### ASK

```
curl -v -X POST  -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"question":"test","doctype":"normal","min_score":"0.0","remote_faqkb_key":"c9970cc1-a211-4390-b7d0-cdf154d464a9"}' http://localhost:3000/5bedbbd18b9ed53a6a3f3dd3/faq/askbot
```


## WebHook Subscription

### Create
```
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"event":"message.create", "target":"https://tiledesk.requestcatcher.com/test"}' http://localhost:3000/5bedbbd18b9ed53a6a3f3dd3/subscriptions
```



