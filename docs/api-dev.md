# TILEDESK LOCALHOST REST API

## Signup

```
curl -v -X POST -d 'email=andrea.leo@f21.it&password=123456' http://localhost:3000/auth/signup

curl -v -X POST -d 'email=andrea.leo@f22.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup
```


## Signin

```
curl -v -X POST -d 'email=andrea.leo@f21.it&password=123456' http://localhost:3000/auth/signin

curl -v -X POST -d 'email=andrea.leo@frontiere21.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signin
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

curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"text":"firstText22"}' https://tiledesk-server-pre.herokuapp.com/5df2240cecd41b00173a06bb/requests/support-group-5544/messages


curl -v -X POST -H 'Content-Type:application/json' -u 5fa26a59-6944-43eb-852a-36850086c357@tiledesk.com:a7de28c6-d309-4539-9749-43dd4535fa7c -d '{"text":"firstText22"}' https://tiledesk-server-pre.herokuapp.com/5df2240cecd41b00173a06bb/requests/support-group-554477991/messages


con anonym user
curl -v -X POST -H 'Content-Type:application/json' \
 -H "Authorization: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIwYzI2YmY2Mi1iM2RmLTQ1N2EtYjk1OS0zMGQzNjRiYTA2ZjEiLCJmaXJzdG5hbWUiOiJHdWVzdCIsImlkIjoiMGMyNmJmNjItYjNkZi00NTdhLWI5NTktMzBkMzY0YmEwNmYxIiwiZnVsbE5hbWUiOiJHdWVzdCAiLCJpYXQiOjE1Nzk2ODQ2MDcsImF1ZCI6Imh0dHBzOi8vdGlsZWRlc2suY29tIiwiaXNzIjoiaHR0cHM6Ly90aWxlZGVzay5jb20iLCJzdWIiOiJndWVzdCJ9.iDD_L35WsFI_gq3GXtJets5zjpZswbn4qdrv-kMgZu8" \
 -d '{"text":"firstTextAnon"}' https://tiledesk-server-pre.herokuapp.com/5e28108c361fbb001729e960/requests/support-group-55447799177/messages

con ct user:

curl -v -X POST -H 'Content-Type:application/json' \
 -H "Authorization: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIxMjM0NTYiLCJmaXJzdG5hbWUiOiJhbmRyZWEgY3VzdG9tIiwibGFzdG5hbWUiOiJsZW8gY3VzdG9tIiwiZW1haWwiOiJlbWFpbDJAZW1haWwuY29tIiwiY3VzdG9tMSI6InZhbDEiLCJhdHRyaWJ1dGVzIjp7ImMxIjoidjEifSwic3ViIjoidXNlcmV4dGVybmFsIiwiYXVkIjoiaHR0cHM6Ly90aWxlZGVzay5jb20vcHJvamVjdHMvNWUyODEwOGMzNjFmYmIwMDE3MjllOTYwIn0.bkTwyedGSDSKcJan0flhXRk6fvPU31BiFQpqaJT9UGU" \
 -d '{"text":"firstTextCT"}' https://tiledesk-server-pre.herokuapp.com/5e28108c361fbb001729e960/requests/support-group-5544779917789/messages




curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"text":"firstText22"}' https://tiledesk-server-pre.herokuapp.com/5df2240cecd41b00173a06bb/requests/support-group-554477991/messages

=====

con agente ==

curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"text":"hello from api"}' https://tiledesk-server-pre.herokuapp.com/5e2aba4cb4c9f80017d50907/requests/tyuiop112/messages


con anonimo


curl -v -X POST -H 'Content-Type:application/json' -d '{"id_project":"5e2aba4cb4c9f80017d50907", "firstname":"John"}' https://tiledesk-server-pre.herokuapp.com/auth/signinAnonymously



curl -v -X POST -H 'Content-Type:application/json' \
 -H "Authorization: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJkNWYwZjZiOS1iYWM5LTQ5NGEtOWVmMy03YjBjZTc0OGM2MTkiLCJmaXJzdG5hbWUiOiJKb2huIiwiaWQiOiJkNWYwZjZiOS1iYWM5LTQ5NGEtOWVmMy03YjBjZTc0OGM2MTkiLCJmdWxsTmFtZSI6IkpvaG4gIiwiaWF0IjoxNTc5OTU2OTU1LCJhdWQiOiJodHRwczovL3RpbGVkZXNrLmNvbSIsImlzcyI6Imh0dHBzOi8vdGlsZWRlc2suY29tIiwic3ViIjoiZ3Vlc3QifQ.ISnrH7rixeQoNLdrdFVIIBTJsJkAtkaIMYSn_SBR8L0" \
 -d '{"text":"hello my name is John and I need help"}' https://tiledesk-server-pre.herokuapp.com/5e2c35c8f0dbc10017bb3aac/requests/support-group-27df7cbf-3946-4ca4-9b17-dc16114108f10/messages








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

curl -v -X GET -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 https://tiledesk-server-pre.herokuapp.com/5df26badde7e1c001743b63c/requests/?limit=10

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
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 http://localhost:3000/5bc7678f3cbc8921530fffbb/requests/request_id-waitingTimeRequest/share/email?to=andrea.leo@f21.it
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





curl -v -X GET -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 http://localhost:3000/5bedbbd18b9ed53a6a3f3dd3/events





curl -v -X POST -H 'Content-Type:application/json' -d '{"id_project":"5e37f45c4d82de00178b96ad"}' https://tiledesk-server-pre.herokuapp.com/auth/signinAnonymously

curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"name":"e1", "attributes": {"attr1":"val1"}}' https://tiledesk-server-pre.herokuapp.com/5e37f45c4d82de00178b96ad/events



curl -v -X POST -H 'Content-Type:application/json' \
 -H "Authorization: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJiNmFiNTFlMS05NWQ0LTQ3YTAtYjg2ZC0xMWU4OGY2MWMxMmMiLCJmaXJzdG5hbWUiOiJHdWVzdCIsImlkIjoiYjZhYjUxZTEtOTVkNC00N2EwLWI4NmQtMTFlODhmNjFjMTJjIiwiZnVsbE5hbWUiOiJHdWVzdCAiLCJpYXQiOjE1ODA3MjkxNjIsImF1ZCI6Imh0dHBzOi8vdGlsZWRlc2suY29tIiwiaXNzIjoiaHR0cHM6Ly90aWxlZGVzay5jb20iLCJzdWIiOiJndWVzdCJ9.0Xv0461DP7LLaJ9l1dMiWXlF7f69LBeofsrngvgQTIQ" \
  -d '{"name":"e1", "attributes": {"attr1":"val1"}}' https://tiledesk-server-pre.herokuapp.com/5e37f45c4d82de00178b96ad/events




curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"name":"e1","attributes": {"id_user":"mBmETIl7uWPn5L2LzUTlxQO6re62", "fullname":"uccio","email":"4@4.it","attr1":"val1"}}' https://tiledesk-server-pre.herokuapp.com/5e37f45c4d82de00178b96ad/events


curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"text":"firstText22"}' https://tiledesk-server-pre.herokuapp.com/5e37f45c4d82de00178b96ad/requests/support-group-2dd08a5d-73b3-4aed-bb58-7580fef2d03c/messages




curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"event":"message.create", "target":"https://tiledesk.requestcatcher.com/test"}' https://tiledesk-server-pre.herokuapp.com/5e37f45c4d82de00178b96ad/subscriptions

curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"event":"request.create", "target":"https://tiledesk.requestcatcher.com/test"}' https://tiledesk-server-pre.herokuapp.com/5e37f45c4d82de00178b96ad/subscriptions

curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"event":"request.update", "target":"https://tiledesk.requestcatcher.com/test"}' https://tiledesk-server-pre.herokuapp.com/5e37f45c4d82de00178b96ad/subscriptions



curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"event":"request.create", "target":"https://webservice.claybox.dc.pype.engineering/v3/tiledesk/message"}' https://tiledesk-server-pre.herokuapp.com/5e37f45c4d82de00178b96ad/subscriptions






curl -v -X GET -u andrea.leo@f21.it:123456  https://tiledesk-server-pre.herokuapp.com/5e37f45c4d82de00178b96ad/subscriptions/history

curl -v -X GET -u andrea.leo@f21.it:XXXXX https://tiledesk-server-pre.herokuapp.com/<PROJECT_ID>/subscriptions/history





curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"event":"project_user.invite", "target":"https://tiledesk.requestcatcher.com/test"}' https://tiledesk-server-pre.herokuapp.com/5e20a68e7c2e640017f2f40f/subscriptions

curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"event":"project_user.update", "target":"https://tiledesk.requestcatcher.com/test"}' https://tiledesk-server-pre.herokuapp.com/5e20a68e7c2e640017f2f40f/subscriptions
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"event":"project_user.delete", "target":"https://tiledesk.requestcatcher.com/test"}' https://tiledesk-server-pre.herokuapp.com/5e20a68e7c2e640017f2f40f/subscriptions





curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"event":"department.create", "target":"https://tiledesk.requestcatcher.com/test"}' https://tiledesk-server-pre.herokuapp.com/5e20a68e7c2e640017f2f40f/subscriptions
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"event":"department.update", "target":"https://tiledesk.requestcatcher.com/test"}' https://tiledesk-server-pre.herokuapp.com/5e20a68e7c2e640017f2f40f/subscriptions
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"event":"department.delete", "target":"https://tiledesk.requestcatcher.com/test"}' https://tiledesk-server-pre.herokuapp.com/5e20a68e7c2e640017f2f40f/subscriptions



curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"event":"group.create", "target":"https://tiledesk.requestcatcher.com/test"}' https://tiledesk-server-pre.herokuapp.com/5e20a68e7c2e640017f2f40f/subscriptions
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"event":"group.update", "target":"https://tiledesk.requestcatcher.com/test"}' https://tiledesk-server-pre.herokuapp.com/5e20a68e7c2e640017f2f40f/subscriptions
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"event":"group.delete", "target":"https://tiledesk.requestcatcher.com/test"}' https://tiledesk-server-pre.herokuapp.com/5e20a68e7c2e640017f2f40f/subscriptions








curl -v -X GET -H 'Content-Type:application/json' \
 -H "Authorization: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YWIxMWM2YjgzZGMyNDAwMTRkNDYwOTUiLCJlbWFpbCI6ImFuZHJlYS5sZW9AZjIxLml0IiwiZmlyc3RuYW1lIjoiYW5kcmVhIiwiaWF0IjoxNTgxMTgzNDk4LCJhdWQiOiJodHRwczovL3RpbGVkZXNrLmNvbSIsImlzcyI6Imh0dHBzOi8vdGlsZWRlc2suY29tIiwic3ViIjoidXNlciIsImp0aSI6IjMwMDQ5YWRmLWY5NzEtNGI2Ni05Y2JhLTMwMmQwMGNhZmVjMSJ9.o63BsK4_mSNnS_dp5T2jbJgvy_GhyN81zO8Gpvx8sIM" \
   http://localhost:3000/5e3e9f51b44414f76a4c5c22/events





curl -v -X GET -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 http://localhost:3000/jwt/history

curl -v -X DELETE -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 http://localhost:3000/jwt/history/4691a1e0-9b25-4c81-a1f2-b63b8ba8fec6


curl -v -X PUT -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"user_available":false}' http://localhost:3000/5e3e9f51b44414f76a4c5c22/project_users/



curl -v -X GET  -u andrea.leo@f21.it:123456 http://localhost:3000/projects/







curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"text":"test"}' http://localhost:3000/5e54f53bb1d39805a52042cd/canned/

curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:123456 -d '{"text":"test"}' https://tiledesk-server-pre.herokuapp.com/5e20a68e7c2e640017f2f40f/canned/




curl -v -X GET -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456  http://localhost:3000/5e54f53bb1d39805a52042cd/canned/


curl -v -X GET -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:123456 https://tiledesk-server-pre.herokuapp.com/5e20a68e7c2e640017f2f40f/canned/



curl -v -X PUT -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"text":"test2"}' http://localhost:3000/5e54f53bb1d39805a52042cd/canned/5e54f545b1d39805a52042d1


curl -v -X PUT -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:123456 -d '{"text":"test2"}' https://tiledesk-server-pre.herokuapp.com/5e20a68e7c2e640017f2f40f/canned/5e54f89bf2b494001723c53c



curl -v -X DELETE -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456  http://localhost:3000/5e54f53bb1d39805a52042cd/canned/5e54f545b1d39805a52042d1


curl -v -X DELETE -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:123456  https://tiledesk-server-pre.herokuapp.com/5e20a68e7c2e640017f2f40f/canned/5e54f89bf2b494001723c53c


curl -v -X DELETE -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456  http://localhost:3000/5e54f53bb1d39805a52042cd/canned/5e54f545b1d39805a52042d1/physical


curl -v -X DELETE -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:123456  https://tiledesk-server-pre.herokuapp.com/5e20a68e7c2e640017f2f40f/canned/5e54f89bf2b494001723c53c/physical