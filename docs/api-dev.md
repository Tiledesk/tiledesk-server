# TILEDESK LOCALHOST REST API

## Signup

```
curl -v -X POST -d 'email=andrea.leo@f21.it&password=123456' http://localhost:3000/auth/signup

curl -v -X POST -d 'email=andrea.leo@f22.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup
```


## Signin

```
curl -v -X POST -d 'email=andrea.leo@f21.it&password=123456' http://localhost:3000/auth/signin

curl -v -X POST -d 'email=andrea.leo@f21.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signin
```


## Signin anonymously

```
curl -v -X POST -H 'Content-Type:application/json' -d '{"firstname":"Andrew", "lastname":"Lee", "id_project":"123"}' http://localhost:3000/auth/signinAnonymously
```

curl -v -X POST -H 'Content-Type:application/json' -d '{"id_project":"5e28108c361fbb001729e960"}' https://tiledesk-server-pre.herokuapp.com/auth/signinAnonymously


## Signin custom token


{
  "_id": "123456",
  "firstname": "andrea custom",
  "lastname": "leo custom",
  "email": "email2@email.com",
  "custom1": "val1",
  "attributes": {"c1":"v1"},
  "sub": "userexternal",
  "aud": "https://tiledesk.com/projects/5e28108c361fbb001729e960"
}


custom project secret: 4fa91e0b-bd9a-4025-b672-a5377edb70d9

generato su https://jwt.io/

https://jwt.io/

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIxMjM0NTYiLCJmaXJzdG5hbWUiOiJhbmRyZWEgY3VzdG9tIiwibGFzdG5hbWUiOiJsZW8gY3VzdG9tIiwiZW1haWwiOiJlbWFpbDJAZW1haWwuY29tIiwiY3VzdG9tMSI6InZhbDEiLCJhdHRyaWJ1dGVzIjp7ImMxIjoidjEifSwic3ViIjoidXNlcmV4dGVybmFsIiwiYXVkIjoiaHR0cHM6Ly90aWxlZGVzay5jb20vcHJvamVjdHMvNWUyODEwOGMzNjFmYmIwMDE3MjllOTYwIn0.bkTwyedGSDSKcJan0flhXRk6fvPU31BiFQpqaJT9UGU


curl -v -X POST -H 'Content-Type:application/json' \
 -H "Authorization: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIxMjM0NTYiLCJmaXJzdG5hbWUiOiJhbmRyZWEgY3VzdG9tIiwibGFzdG5hbWUiOiJsZW8gY3VzdG9tIiwiZW1haWwiOiJlbWFpbDJAZW1haWwuY29tIiwiY3VzdG9tMSI6InZhbDEiLCJhdHRyaWJ1dGVzIjp7ImMxIjoidjEifSwic3ViIjoidXNlcmV4dGVybmFsIiwiYXVkIjoiaHR0cHM6Ly90aWxlZGVzay5jb20vcHJvamVjdHMvNWUyODEwOGMzNjFmYmIwMDE3MjllOTYwIn0.bkTwyedGSDSKcJan0flhXRk6fvPU31BiFQpqaJT9UGU" \
 https://tiledesk-server-pre.herokuapp.com/auth/signinWithCustomToken






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

curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText22"}' https://tiledesk-server-pre.herokuapp.com/5df2240cecd41b00173a06bb/requests/support-group-5544/messages


curl -v -X POST -H 'Content-Type:application/json' -u 5fa26a59-6944-43eb-852a-36850086c357@tiledesk.com:a7de28c6-d309-4539-9749-43dd4535fa7c -d '{"text":"firstText22"}' https://tiledesk-server-pre.herokuapp.com/5df2240cecd41b00173a06bb/requests/support-group-554477991/messages


con anonym user
curl -v -X POST -H 'Content-Type:application/json' \
 -H "Authorization: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIwYzI2YmY2Mi1iM2RmLTQ1N2EtYjk1OS0zMGQzNjRiYTA2ZjEiLCJmaXJzdG5hbWUiOiJHdWVzdCIsImlkIjoiMGMyNmJmNjItYjNkZi00NTdhLWI5NTktMzBkMzY0YmEwNmYxIiwiZnVsbE5hbWUiOiJHdWVzdCAiLCJpYXQiOjE1Nzk2ODQ2MDcsImF1ZCI6Imh0dHBzOi8vdGlsZWRlc2suY29tIiwiaXNzIjoiaHR0cHM6Ly90aWxlZGVzay5jb20iLCJzdWIiOiJndWVzdCJ9.iDD_L35WsFI_gq3GXtJets5zjpZswbn4qdrv-kMgZu8" \
 -d '{"text":"firstTextAnon"}' https://tiledesk-server-pre.herokuapp.com/5e28108c361fbb001729e960/requests/support-group-55447799177/messages

con ct user:

curl -v -X POST -H 'Content-Type:application/json' \
 -H "Authorization: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIxMjM0NTYiLCJmaXJzdG5hbWUiOiJhbmRyZWEgY3VzdG9tIiwibGFzdG5hbWUiOiJsZW8gY3VzdG9tIiwiZW1haWwiOiJlbWFpbDJAZW1haWwuY29tIiwiY3VzdG9tMSI6InZhbDEiLCJhdHRyaWJ1dGVzIjp7ImMxIjoidjEifSwic3ViIjoidXNlcmV4dGVybmFsIiwiYXVkIjoiaHR0cHM6Ly90aWxlZGVzay5jb20vcHJvamVjdHMvNWUyODEwOGMzNjFmYmIwMDE3MjllOTYwIn0.bkTwyedGSDSKcJan0flhXRk6fvPU31BiFQpqaJT9UGU" \
 -d '{"text":"firstTextCT"}' https://tiledesk-server-pre.herokuapp.com/5e28108c361fbb001729e960/requests/support-group-5544779917789/messages




curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:123456 -d '{"text":"firstText22"}' https://tiledesk-server-pre.herokuapp.com/5df2240cecd41b00173a06bb/requests/support-group-554477991/messages

=====

con agente ==

curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"hello from api"}' https://tiledesk-server-pre.herokuapp.com/5e2aba4cb4c9f80017d50907/requests/tyuiop112/messages


con anonimo


curl -v -X POST -H 'Content-Type:application/json' -d '{"id_project":"5e2aba4cb4c9f80017d50907", "firstname":"John"}' https://tiledesk-server-pre.herokuapp.com/auth/signinAnonymously



curl -v -X POST -H 'Content-Type:application/json' \
 -H "Authorization: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDVkYzU1MC1kMjNhLTRkMDUtODZlNy04YmY5ZjU1Y2ZhZWUiLCJmaXJzdG5hbWUiOiJKb2huIiwiaWQiOiI2MDVkYzU1MC1kMjNhLTRkMDUtODZlNy04YmY5ZjU1Y2ZhZWUiLCJmdWxsTmFtZSI6IkpvaG4gIiwiaWF0IjoxNTc5ODYwMjkyLCJhdWQiOiJodHRwczovL3RpbGVkZXNrLmNvbSIsImlzcyI6Imh0dHBzOi8vdGlsZWRlc2suY29tIiwic3ViIjoiZ3Vlc3QifQ.qh7W8N6E06uWdcgcwev7MQ8t62rzBtwrDaDxKUftxQE" \
 -d '{"text":"hello from anonym15"}' https://tiledesk-server-pre.herokuapp.com/5e2aba4cb4c9f80017d50907/requests/support-group-55447799154321231215/messages








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



