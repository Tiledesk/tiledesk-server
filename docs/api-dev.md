# TILEDESK LOCALHOST REST API

## Signup

```
curl -v -X POST -H 'Content-Type:application/json' -d '{"firstname":"Andrew", "lastname":"Lee", "email":"andrea.leo@f21.it","password":"123456"}' http://localhost:3000/auth/signup
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
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"sender":"io", "sender_fullname":"Andrea Leo", "text":"firstText"}' http://localhost:3000/5ea800091147f28c72b90c5e/requests/req123456999/messages
```

curl -v -X GET -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456  http://localhost:3000/5e80c27549605db3eff5be3a/requests/

curl -v -X PATCH -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"rating":2, "rating_message":"Andrea Leo"}' http://localhost:3000/5e80c27549605db3eff5be3a/requests/req123456999/rating


curl -v -X PATCH -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"rating":2, "rating_message":"Andrea Leo"}' https://tiledesk-server-pre.herokuapp.com/5e8f56764aef0900178113b5/requests/support-group-M4VA5Eqx38lGRmZWMuB/rating



curl -v -X PATCH -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"rating":2, "rating_message":"Andrea Leo"}' https://tiledesk-server-pre.herokuapp.com/5e8f56764aef0900178113b5/requests/support-group-M4VA5Eqx38lGRmZWMuB/rating



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
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{ "text":"text"}' http://localhost:4000/5ca366fdee19dbc72e98e96f/requests
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

# Add note
```
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"text":"note1"}' http://localhost:3000/5e5f6f7d791b4bc5a1c0b7b5/requests/req123456/notes
```

# delete note
```
curl -v -X DELETE -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 http://localhost:3000/5e5f6f7d791b4bc5a1c0b7b5/requests/req123456/notes/5e5f719f791b4bc5a1c0b7c1
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




# Canned


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














# Tags


curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"tag":"test"}' http://localhost:3000/5e54f53bb1d39805a52042cd/tags/


curl -v -X GET -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456  http://localhost:3000/5e54f53bb1d39805a52042cd/tags/5e5e9b13919c7c51078cf0b5


curl -v -X GET -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456  http://localhost:3000/5e54f53bb1d39805a52042cd/tags/

curl -v -X PUT -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"tag":"test2"}' http://localhost:3000/5e54f53bb1d39805a52042cd/tags/5e5e9b13919c7c51078cf0b5


curl -v -X DELETE -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456  http://localhost:3000/5e54f53bb1d39805a52042cd/tags/5e5e9b13919c7c51078cf0b5






curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"event":"request.create", "target":"https://tiledesk-queues.herokuapp.com/webhook"}' https://tiledesk-server-pre.herokuapp.com/5e4d0478fa669b0017c96817/subscriptions


curl -v -X GET -u andrea.leo@f21.it:123456 http://localhost:3000/5e5fb940c397af3d5aeee56e/requests



curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"sender":"io", "sender_fullname":"Andrea Leo", "text":"firstText"}' http://localhost:3000/5e5fb940c397af3d5aeee56e/requests/req123456/messages



curl -v -X GET -u andrea.leo@f21.it:123456 http://localhost:3000/5e5fb940c397af3d5aeee56e/departments/5e5fb941c397af3d5aeee570/operators



curl -v -X GET  -u andrea.leo@frontiere21.it:258456 https://tiledesk-server-pre.herokuapp.com/5e4d0478fa669b0017c96817/departments/5e4ebae1c84c6200170a98f4/operators


curl -v -X GET -H "Authorization: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWNyZXQiOiI2NzhlNTI4ZC05ODk2LTQ2NzEtODhmNC05M2Q3MDcwZTEzOTQiLCJfaWQiOiI1ZTVkNGU0Y2JkMGE5YjAwMTc5ZmYzZTAiLCJ0YXJnZXQiOiJodHRwOi8vdGlsZWRlc2stcXVldWVzLmhlcm9rdWFwcC5jb20vd2ViaG9vayIsImV2ZW50IjoicmVxdWVzdC5jcmVhdGUiLCJpZF9wcm9qZWN0IjoiNWU1ZDQwYjJiZDBhOWIwMDE3OWZmM2NkIiwiY3JlYXRlZEJ5IjoiNWUwOWQxNmQ0ZDM2MTEwMDE3NTA2ZDdmIiwiY3JlYXRlZEF0IjoiMjAyMC0wMy0wMlQxODoxOTo1Ni44NjZaIiwidXBkYXRlZEF0IjoiMjAyMC0wMy0wMlQxODoxOTo1Ni44NjZaIiwiX192IjowLCJpYXQiOjE1ODM0MzMxNTcsImF1ZCI6Imh0dHBzOi8vdGlsZWRlc2suY29tL3N1YnNjcmlwdGlvbnMvNWU1ZDRlNGNiZDBhOWIwMDE3OWZmM2UwIiwiaXNzIjoiaHR0cHM6Ly90aWxlZGVzay5jb20iLCJzdWIiOiJzdWJzY3JpcHRpb24ifQ.L9vGCNlbdkIYmYVIyHDnfmPwLWgn8VHoodVUCnqNN9g" \
 https://tiledesk-server-pre.herokuapp.com/5e5d40b2bd0a9b00179ff3cd/departments/5e5d40b2bd0a9b00179ff3cf/operators






curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"event":"request.create", "target":"https://tiledesk-queues.herokuapp.com/webhook"}' https://tiledesk-server-pre.herokuapp.com/5e5d40b2bd0a9b00179ff3cd/subscriptions


curl -v -X GET -H "Authorization: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZWNyZXQiOiJjZmUyNDVhNS03ZmYyLTQ3ZDItYjYxMS0yYTMzYmNmNDMxOWMiLCJfaWQiOiI1ZTY1MDc5M2M3YTU5MzAwMTczNGY2OTEiLCJ0YXJnZXQiOiJodHRwczovL3dlYmhvb2suc2l0ZS84NTNlNGU1ZS0xOGY4LTQ1ZTYtYTM2Ni1kYTBjNjM0NzBlZDYiLCJldmVudCI6InJlcXVlc3QuY3JlYXRlIiwiaWRfcHJvamVjdCI6IjVlNWQ0MGIyYmQwYTliMDAxNzlmZjNjZCIsImNyZWF0ZWRCeSI6IjVhYWE5OTAyNGMzYjExMDAxNGI0NzhmMCIsImNyZWF0ZWRBdCI6IjIwMjAtMDMtMDhUMTQ6NTY6MTkuMDQwWiIsInVwZGF0ZWRBdCI6IjIwMjAtMDMtMDhUMTQ6NTY6MTkuMDQwWiIsIl9fdiI6MCwiaWF0IjoxNTgzNjc5Mzk1LCJhdWQiOiJodHRwczovL3RpbGVkZXNrLmNvbS9zdWJzY3JpcHRpb25zLzVlNjUwNzkzYzdhNTkzMDAxNzM0ZjY5MSIsImlzcyI6Imh0dHBzOi8vdGlsZWRlc2suY29tIiwic3ViIjoic3Vic2NyaXB0aW9uIn0.b0A125LkxUaXYLqJhzR5uEXtKF_KuXd9l4dET4jPgpc" https://tiledesk-server-pre.herokuapp.com/5e5d40b2bd0a9b00179ff3cd/requests






curl -v -X GET -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 http://localhost:3000/5e667419003835ec4a690e05/project_users/

curl -v -X PATCH -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"user_available":false}' http://localhost:3000/5e667419003835ec4a690e05/project_users/




curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"member":"5aaa99024c3b110014b478f0"}' https://tiledesk-server-pre.herokuapp.com/5e667981aa70910017b915a2/requests/support-group-3de2cbb9-d061-4388-b3e0-f51ccadd1e9b/participants/



curl -v -X PUT -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '[]' https://tiledesk-server-pre.herokuapp.com/5e5d40b2bd0a9b00179ff3cd/requests/support-group-3de2cbb9-d061-4388-b3e0-f51ccadd1e9b/participants/





curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"event":"request.create", "target":"https://webhook.site/853e4e5e-18f8-45e6-a366-da0c63470ed6"}' https://tiledesk-server-pre.herokuapp.com/5e667981aa70910017b915a2/subscriptions



curl -v -X GET -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 https://tiledesk-server-pre.herokuapp.com/5e5d40b2bd0a9b00179ff3cd/requests?limit=1




curl -v -X PUT -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"max_served_chat":199}' https://tiledesk-server-pre.herokuapp.com/5e5d40b2bd0a9b00179ff3cd/project_users/





curl -v -X GET -H "Authorization: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTY3NTI1NTdiM2I3MzAwMTcxNDViN2YiLCJ0YXJnZXQiOiJodHRwczovL3dlYmhvb2suc2l0ZS84NTNlNGU1ZS0xOGY4LTQ1ZTYtYTM2Ni1kYTBjNjM0NzBlZDYiLCJldmVudCI6InJlcXVlc3QuY3JlYXRlIiwiaWRfcHJvamVjdCI6IioiLCJjcmVhdGVkQnkiOiI1YWFhOTkwMjRjM2IxMTAwMTRiNDc4ZjAiLCJjcmVhdGVkQXQiOiIyMDIwLTAzLTEwVDA4OjM5OjQ5Ljc3NloiLCJ1cGRhdGVkQXQiOiIyMDIwLTAzLTEwVDA4OjM5OjQ5Ljc3NloiLCJfX3YiOjAsImlhdCI6MTU4Mzg2MzQyNywiYXVkIjoiaHR0cHM6Ly90aWxlZGVzay5jb20iLCJpc3MiOiJodHRwczovL3RpbGVkZXNrLmNvbSIsInN1YiI6InN1YnNjcmlwdGlvbiJ9.vw9uQGtuhEwkMy3_BM73R0cx6vGJH0giOeTvNd8CBTk" https://tiledesk-server-pre.herokuapp.com/5e5d40b2bd0a9b00179ff3cd/requests



curl -v -X GET -H "Authorization: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTY3NTI1NTdiM2I3MzAwMTcxNDViN2YiLCJ0YXJnZXQiOiJodHRwczovL3dlYmhvb2suc2l0ZS84NTNlNGU1ZS0xOGY4LTQ1ZTYtYTM2Ni1kYTBjNjM0NzBlZDYiLCJldmVudCI6InJlcXVlc3QuY3JlYXRlIiwiaWRfcHJvamVjdCI6IioiLCJjcmVhdGVkQnkiOiI1YWFhOTkwMjRjM2IxMTAwMTRiNDc4ZjAiLCJjcmVhdGVkQXQiOiIyMDIwLTAzLTEwVDA4OjM5OjQ5Ljc3NloiLCJ1cGRhdGVkQXQiOiIyMDIwLTAzLTEwVDA4OjM5OjQ5Ljc3NloiLCJfX3YiOjAsImlhdCI6MTU4Mzg2MzQyNywiYXVkIjoiaHR0cHM6Ly90aWxlZGVzay5jb20iLCJpc3MiOiJodHRwczovL3RpbGVkZXNrLmNvbSIsInN1YiI6InN1YnNjcmlwdGlvbiJ9.vw9uQGtuhEwkMy3_BM73R0cx6vGJH0giOeTvNd8CBTk" http://localhost:3000/5e667419003835ec4a690e05/leads





curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"name":"testprj"}' http://localhost:3000/projects


curl -v -X GET -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 http://localhost:3000/5e68b20a990b7729583d463b/project_users/

curl -v -X PUT -H 'Content-Type:application/json' -H "Authorization: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTY3NTI1NTdiM2I3MzAwMTcxNDViN2YiLCJ0YXJnZXQiOiJodHRwczovL3dlYmhvb2suc2l0ZS84NTNlNGU1ZS0xOGY4LTQ1ZTYtYTM2Ni1kYTBjNjM0NzBlZDYiLCJldmVudCI6InJlcXVlc3QuY3JlYXRlIiwiaWRfcHJvamVjdCI6IioiLCJjcmVhdGVkQnkiOiI1YWFhOTkwMjRjM2IxMTAwMTRiNDc4ZjAiLCJjcmVhdGVkQXQiOiIyMDIwLTAzLTEwVDA4OjM5OjQ5Ljc3NloiLCJ1cGRhdGVkQXQiOiIyMDIwLTAzLTEwVDA4OjM5OjQ5Ljc3NloiLCJfX3YiOjAsImlhdCI6MTU4Mzg2MzQyNywiYXVkIjoiaHR0cHM6Ly90aWxlZGVzay5jb20iLCJpc3MiOiJodHRwczovL3RpbGVkZXNrLmNvbSIsInN1YiI6InN1YnNjcmlwdGlvbiJ9.vw9uQGtuhEwkMy3_BM73R0cx6vGJH0giOeTvNd8CBTk" -d '{"user_available":true}' http://localhost:3000/5e68b20a990b7729583d463b/project_users/5e68b20a990b7729583d463c







curl -v -X PUT -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '[]' https://tiledesk-server-pre.herokuapp.com/5e5d40b2bd0a9b00179ff3cd/requests/support-group-340edb31-aab1-465d-921f-8c776abf7bca/participants




curl -v -X GET -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 http://localhost:3000/5e77d1a339d2034ca6d3244e/requests/req123456999/history








curl -v -X POST -d 'email=andrea.leo@f23.it&password=123456' http://localhost:3000/auth/signup
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f23.it:123456 -d '{"name":"testprj"}' http://localhost:3000/projects
curl -v -X DELETE -H 'Content-Type:application/json' -u andrea.leo@f23.it:123456 http://localhost:3000/users/




db.users.update(
  {},
  { $set: {"status": 100} },
  false,
  true
)


db.projects.update(
  {},
  { $set: {"status": 100} },
  false,
  true
)





curl -v -X DELETE -H 'Content-Type:application/json' -u cristina@cristina.it https://tiledesk-server-pre.herokuapp.com/users/


curl -v -X POST -d 'email=andrea.leo@f21.it&password=123456' http://localhost:3000/auth/signup
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"name":"testprj"}' http://localhost:3000/projects
curl -v -X GET -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 http://localhost:3000/5e7a3a6a3ad6f8cd4fb19474/events

curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"name":"e1", "attributes": {"attr1":"val1"}}' http://localhost:3000/5e7a3a6a3ad6f8cd4fb19474/events

curl -X GET -u andrea.leo@f21.it:123456 http://localhost:3000/5e79e725ecb9230ac1f5b4a2/departments/5e79e725ecb9230ac1f5b4a4/operators




curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"event":"event.emit.typing.start", "target":"https://webhook.site/fae496ca-c0a5-4eff-b9aa-53c01585150a"}' https://tiledesk-server-pre.herokuapp.com/5e708a2dd6f080001763928c/subscriptions


curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"event":"event.emit.typing.start", "target":"https://webhook.site/fae496ca-c0a5-4eff-b9aa-53c01585150a"}' http://localhost:3000/5e7a3a6a3ad6f8cd4fb19474/subscriptions



curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{ "text":"text"}' http://localhost:3000/5e79e725ecb9230ac1f5b4a2/requests

curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{ "text":"text1"}' https://tiledesk-server-pre.herokuapp.com/5e7b6135cb50cc00178a1eba/requests






curl -v -X GET -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 https://tiledesk-server-pre.herokuapp.com/5e6fabbad6f080001763891d/requests/support-group-33e3fe3e-7e26-47c9-9a51-d70f94489e65/history








```
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"text":"firstText"}' http://localhost:3000/5ea800091147f28c72b90c5e/requests
```


```
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests

```



curl -v -X POST -d 'email=andrea.leo@f21.it&password=123456' http://192.168.99.100:30269/auth/signup

curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"name":"testprj"}' http://192.168.99.100:30269/projects







curl -v -X POST -d 'email=w1@w1.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup
curl -v -X POST -d 'email=w2@w2.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup
curl -v -X POST -d 'email=w3@w3.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup
curl -v -X POST -d 'email=w4@w4.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup
curl -v -X POST -d 'email=w5@w5.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup
curl -v -X POST -d 'email=w6@w6.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup
curl -v -X POST -d 'email=w7@w7.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup
curl -v -X POST -d 'email=w8@w8.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup
curl -v -X POST -d 'email=w9@w9.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup
curl -v -X POST -d 'email=w10@w10.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup
curl -v -X POST -d 'email=w11@w11.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup
curl -v -X POST -d 'email=w12@w12.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup




curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"w1@w1.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/project_users/invite


curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"w2@w2.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/project_users/invite

curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"w3@w3.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/project_users/invite




curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"w4@w4.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/project_users/invite
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"w5@w5.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/project_users/invite
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"w6@w6.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/project_users/invite
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"w7@w7.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/project_users/invite
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"w8@w8.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/project_users/invite



curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"w9@w9.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/project_users/invite
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"w10@w10.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/project_users/invite
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"w11@w11.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/project_users/invite
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"w12@w12.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/project_users/invite
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"w131@w131.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/project_users/invite


curl -v -X POST -d 'email=w13@w13.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup
curl -v -X POST -d 'email=w14@w14.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup
curl -v -X POST -d 'email=w15@w15.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup
curl -v -X POST -d 'email=w16@w16.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup
curl -v -X POST -d 'email=w17@w17.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup
curl -v -X POST -d 'email=w18@w18.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup
curl -v -X POST -d 'email=w19@w19.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup
curl -v -X POST -d 'email=w20@w20.it&password=123456' https://tiledesk-server-pre.herokuapp.com/auth/signup

curl -v -X POST -d 'email=w201@w201.it&password=123456&firstname=a&lastname=b' https://tiledesk-server-pre.herokuapp.com/auth/signup


curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"w14@w14.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/project_users/invite

curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"w15@w15.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/project_users/invite

curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"w16@w16.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/project_users/invite


curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"w17@w17.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/project_users/invite


curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"w18@w18.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/project_users/invite

curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"w19@w19.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/project_users/invite

curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"w20@w20.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/project_users/invite

curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"email":"andrea@w20.it","role":"agent","user_available":true}' https://tiledesk-server-pre.herokuapp.com/5df26badde7e1c001743b63c/project_users/invite







curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText1"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText2"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText3"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText4"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText5"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText6"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText7"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText8"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText9"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests


curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText10"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText11"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText12"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText13"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText14"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText15"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText16"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText17"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText18"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText19"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText20"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests







curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText1"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests
curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText2"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests
curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText3"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests
curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText4"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests
curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText5"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests
curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText6"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests
curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText7"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests
curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText8"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests
curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText9"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests
curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText10"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests
curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText11"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests
curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText12"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests
curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText13"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests
curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText14"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests
curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText15"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests
curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText16"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests
curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText17"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests
curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText18"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests
curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText19"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests
curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText20"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests




ws count 23 2020-05-05T10:17:45.939Z 2020-05-05T10:17:46.674Z


 {"id_project": "5eb1116b4ec80100176671d2","status": { "$lt": 1000 },
 "$or":[ { "agents.id_user": "5eb07ab54ec8010017666523" },  { "participants": "5eb07ab54ec8010017666523" } ] }
  23 




  db.getCollection('requests').find( {"id_project": "5eb1116b4ec80100176671d2","status": { "$lt": 1000 }, "$or":[ { "agents.id_user": ObjectId("5eb116f54ec8010017667718") }, {"participants": "5eb116f54ec8010017667718" }] })


    db.getCollection('requests').find( {"id_project": "5eb1116b4ec80100176671d2","status": { "$lt": 1000 } })


db.getCollection('requests').find( {"id_project": "5eb1116b4ec80100176671d2","status": { "$lt": 1000 } }).sort( { "updatedAt": -1 } )


  db.getCollection('requests').find( {"id_project": "5eb1116b4ec80100176671d2","status": { "$lt": 1000 }, "$or":[ { "agents.id_user": ObjectId("5eb116f54ec8010017667718") }, {"participants": "5eb116f54ec8010017667718" }] }).sort( { "updatedAt": -1 } )








 ws count { id_project: '5eb1116b4ec80100176671d2',
2020-05-05T10:37:00.500941+00:00 app[web.1]:   status: { '$lt': 1000 },
2020-05-05T10:37:00.500943+00:00 app[web.1]:   '$or': [ { preflight: false }, { preflight: [Object] } ] } 23 2020-05-05T10:36:59.889Z 2020-05-05T10:37:00.500Z





2020-05-05T11:26:45.800050+00:00 app[web.1]: ws count { id_project: '5eb1116b4ec80100176671d2',
2020-05-05T11:26:45.800060+00:00 app[web.1]:   status: { '$lt': 1000 },
2020-05-05T11:26:45.800061+00:00 app[web.1]:   '$or': [ { preflight: false }, { preflight: [Object] } ] } 42 2020-05-05T11:26:45.203Z 2020-05-05T11:26:45.799Z 596





curl -v -X POST -H 'Content-Type:application/json' -u load@load.it:123456 -d '{"text":"firstText"}' https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests

https://api.tiledesk.com/v2/5eb56e211f9e1f0012d6227b/requests
ù






curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText20"}' https://tiledesk-server-pre.herokuapp.com/5eb1116b4ec80100176671d2/requests
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 -d '{"text":"firstText20"}' https://tiledesk-server-pre.herokuapp.com/5ebae6f21aee9b0034511f65/requests




curl -v -X PUT -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"name":"testprj2"}' http://localhost:3000/projects/5ea800091147f28c72b90c5e






curl -v -X GET -H 'Content-Type:application/json'  http://localhost:3000/5ecf82d45c9a741d9c17bf42/labels


curl -v -X POST -H 'Content-Type:application/json' -u andrealeo@tiledesk.com:258456td -d '{"event":"project.create", "target":"https://tiledesk-queues.herokuapp.com/webhook"}' https://api.tiledesk.com/v2/5ec688ed13400f0012c2edc2/subscriptions

curl -v -X POST -H 'Content-Type:application/json' -u andrealeo@tiledesk.com:258456td -d '{"event":"project.update", "target":"https://tiledesk-queues.herokuapp.com/webhook"}' https://api.tiledesk.com/v2/5ec688ed13400f0012c2edc2/subscriptions


curl -v -X POST -H 'Content-Type:application/json' -u andrealeo@tiledesk.com:258456td -d '{"event":"message.create", "target":"https://webhook.site/bbb5ec7b-1dd2-4b27-8cce-c0fad2b29fe6"}' https://api.tiledesk.com/v2/5ec688ed13400f0012c2edc2/subscriptions

curl -v -X POST -H 'Content-Type:application/json' -u andrealeo@tiledesk.com:258456td -d '{"event":"project.update", "target":"https://webhook.site/bbb5ec7b-1dd2-4b27-8cce-c0fad2b29fe6"}' https://api.tiledesk.com/v2/5ec688ed13400f0012c2edc2/subscriptions




curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"name":"testprj"}' http://localhost:3000/projects

curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"name":"new_conversation", "attributes": {"attr1":"val1"}}' http://localhost:3000/5ed77c22c9ad019b18984954/events




JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiJQVEFUU1Q2OUgxNEQ4NjJVIiwiZmlyc3RuYW1lIjoiUGVyc29uYWxlIiwibGFzdG5hbWUiOiJUZXN0IFBvcnRhbGUiLCJuYW1lIjoiVXRlbnRlIHRlc3QgcG9ydGFsZSBQVEEiLCJlbWFpbCI6InBlcnNvbmFsZS50ZXN0cG9ydGFsZUBzdHVkZW50aS51bmlzYWxlbnRvLml0IiwibWF0cmljb2xhZGlwZW5kZW50ZSI6IjE5OTk5OTkiLCJtYXRyaWNvbGFzdHVkZW50ZSI6bnVsbCwiY29kaWNlZmlzY2FsZSI6IlBUQVRTVDY5SDE0RDg2MlUiLCJzdWIiOiJ1c2VyZXh0ZXJuYWwiLCJhdWQiOiJodHRwczpcL1wvdGlsZWRlc2suY29tXC9wcm9qZWN0c1wvNWVjNjg4ZWQxMzQwMGYwMDEyYzJlZGMyIiwiaWF0IjoxNTkxMTgyMjcwLCJleHAiOjE1OTExODIzOTB9.IVoQYIS-TvsiQf4ZLIytqX2qsn3oyt7aC3usyf-4cCo




JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiJQVEFUU1Q2OUgxNEQ4NjJVIiwiZmlyc3RuYW1lIjoiUGVyc29uYWxlIiwibGFzdG5hbWUiOiJUZXN0IFBvcnRhbGUiLCJuYW1lIjoiVXRlbnRlIHRlc3QgcG9ydGFsZSBQVEEiLCJlbWFpbCI6InBlcnNvbmFsZS50ZXN0cG9ydGFsZUBzdHVkZW50aS51bmlzYWxlbnRvLml0IiwibWF0cmljb2xhZGlwZW5kZW50ZSI6IjE5OTk5OTkiLCJtYXRyaWNvbGFzdHVkZW50ZSI6bnVsbCwiY29kaWNlZmlzY2FsZSI6IlBUQVRTVDY5SDE0RDg2MlUiLCJzdWIiOiJ1c2VyZXh0ZXJuYWwiLCJhdWQiOiJodHRwczpcL1wvdGlsZWRlc2suY29tXC9wcm9qZWN0c1wvNWVjNjg4ZWQxMzQwMGYwMDEyYzJlZGMyIiwiaWF0IjoxNTkxMTgyMjcwLCJleHAiOjE1OTExODIzOTB9.IVoQYIS-TvsiQf4ZLIytqX2qsn3oyt7aC3usyf-4cCo




JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiJQVEFUU1Q2OUgxNEQ4NjJVIiwiZmlyc3RuYW1lIjoiUGVyc29uYWxlIiwibGFzdG5hbWUiOiJUZXN0IFBvcnRhbGUiLCJuYW1lIjoiVXRlbnRlIHRlc3QgcG9ydGFsZSBQVEEiLCJlbWFpbCI6InBlcnNvbmFsZS50ZXN0cG9ydGFsZUBzdHVkZW50aS51bmlzYWxlbnRvLml0IiwibWF0cmljb2xhZGlwZW5kZW50ZSI6IjE5OTk5OTkiLCJtYXRyaWNvbGFzdHVkZW50ZSI6bnVsbCwiY29kaWNlZmlzY2FsZSI6IlBUQVRTVDY5SDE0RDg2MlUiLCJzdWIiOiJ1c2VyZXh0ZXJuYWwiLCJhdWQiOiJodHRwczpcL1wvdGlsZWRlc2suY29tXC9wcm9qZWN0c1wvNWVjNjg4ZWQxMzQwMGYwMDEyYzJlZGMyIiwiaWF0IjoxNTkxMTgyMjcwLCJleHAiOjE1OTExODIzOTB9.IVoQYIS-TvsiQf4ZLIytqX2qsn3oyt7aC3usyf-4cCo









curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"name":"testprj"}' http://localhost:3000/projects


curl -v -X GET -H 'Content-Type:application/json' -H "Authorization: JWT eyJhbGciOiJIUzI1NiJ9.eyJfaWQiOiIxMjMiLCJmaXJzdG5hbWUiOiJtYXJpbyIsImxhc3RuYW1lIjoicm9zc2kiLCJlbWFpbCI6Im1hcmlvcm9zc2lAZW1haWwuY29tIiwiY3VzdG9tQXR0ciI6ImMxIiwic3ViIjoidXNlcmV4dGVybmFsIiwiYXVkIjoiaHR0cHM6Ly90aWxlZGVzay5jb20vcHJvamVjdHMvNWVkOGI1Mjk0YWU1ZDBiZGUxNjNiYzA3In0.ePxJlIRre7i4s51DBWlLkfAYYjawXUCj9Eav-4r6s0A" http://localhost:3000/5ed8b5294ae5d0bde163bc07/labels/









curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@frontiere21.it:258456 https://tiledesk-server-pre.herokuapp.com/chat21/native/auth/createCustomToken





curl -v -X POST -H 'Content-Type:application/json' -u admin@tiledesk.com:adminadmin -d '{"name":"testprj"}' http://localhost:3000/projects

curl -v -X POST -H 'Content-Type:application/json' -u admin@tiledesk.com:adminadmin  -d '{ "name":"segment1", "filters": [{"field":"field1","operator":"=","value":"ciao2"}]}' http://localhost:3000/651446eeaf0e4e333f86db6d/segments


curl -v -X POST -H 'Content-Type:application/json' -u admin@tiledesk.com:adminadmin -d '{"text":"firstText"}' http://localhost:3000/651446eeaf0e4e333f86db6d/requests/req123456999-651446eeaf0e4e333f86db6d/messages


curl -v -X GET -u admin@tiledesk.com:adminadmin  http://localhost:3000/651446eeaf0e4e333f86db6d/leads?segment=651448cc39405451f2165a80


number

curl -v -X POST -H 'Content-Type:application/json' -u admin@tiledesk.com:adminadmin  -d '{ "name":"segment1", "filters": [{"field":"field1","operator":"=","value":44}]}' http://localhost:3000/651446eeaf0e4e333f86db6d/segments

curl -v -X GET -u admin@tiledesk.com:adminadmin  http://localhost:3000/651446eeaf0e4e333f86db6d/leads?segment=6515a7e0066727cb94bccd5c




sudo systemctl start mongod




curl -v -X PUT -H 'Content-Type:application/json' -u admin@tiledesk.com:adminadmin  -d '{ "name":"segment2", "filters": [{"field":"field1","operator":"=","value":"ciao2"}]}' http://localhost:3000/651446eeaf0e4e333f86db6d/segments/6516eb0a11e143e3548b8dd6



curl -v -X GET -H 'Content-Type:application/json' -u admin@tiledesk.com:adminadmin  http://localhost:3000/651446eeaf0e4e333f86db6d/segments/6516eb0a11e143e3548b8dd6


curl -v -X GET -H 'Content-Type:application/json' -u admin@tiledesk.com:adminadmin  http://localhost:3000/651446eeaf0e4e333f86db6d/segments/


curl -v -X DELETE -H 'Content-Type:application/json' -u admin@tiledesk.com:adminadmin  http://localhost:3000/651446eeaf0e4e333f86db6d/segments/6516eb0a11e143e3548b8dd6
