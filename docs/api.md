# TILEDESK REST API

## Signup

```
curl -v -X POST -d 'email=andrea.leo@f21.it&password=123456' https://api.tiledesk.com/v1/auth/signup
```

### Signin

```
curl -v -X POST -d 'email=andrea.leo@f21.it&password=123456' https://api.tiledesk.com/v1/auth/signin
```

### Firebase signin

```
curl -v -X POST -d 'email=andrea.leo@f21.it&password=123456' https://api.tiledesk.com/v1/firebase/auth/signin
```

### Departments 

```
curl -v -X GET -u andrea.leo@f21.it:123456 https://api.tiledesk.com/v1/5ab0f32757066e0014bfd718/departments
```

#### Get the available operator for a specific department
```
curl -v -X GET -u andrea.leo@frontiere21.it:123456 https://api.tiledesk.com/v1/5ad4c101e774ac0014ae0d07/departments/5ad5c2c9c975820014ba901b/operators
```



### Bots 

#### List

```
curl -v -X GET -u andrea.leo@f21.it:123456 https://api.tiledesk.com/v1/5ab0f32757066e0014bfd718/faq_kb
```


## Analytics
```
curl -v -X GET -u andrea.leo@f21.it:123456 https://api.tiledesk.com/v1/5ad5bd52c975820014ba900a/analytics/requests/count

```

```
curl -v -X GET -u andrea.leo@f21.it:123456 https://api.tiledesk.com/v1/5ad5bd52c975820014ba900a/analytics/requests/waiting

```


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

## Requests 

### Create 

```
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"requester_id":"io", "requester_fullname":"Andrea Leo", "first_text":"firstText"}' http://localhost:3000/5ab0f32757066e0014bfd718/requests
```


```
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"requester_id":"io", "requester_fullname":"Andrea Leo", "first_text":"firstText", "first_message": {"sender": "123", "senderFullname":"Andrea leo", "recipient":"321", "recipientFullname":"Nicola","text":"ciao"}}' http://localhost:3000/5ab0f32757066e0014bfd718/requests
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






