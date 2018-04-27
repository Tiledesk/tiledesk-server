# Prerequisites

* Nodejs and npm installed 
* MongoDB installed and running on localhost

# Installation and running
Step to run locally:

* Clone this repo
* Install dependencies with 'npm install'

* Run the app with the command 'npm start' or with 'nodemon' if you want monitoring and auto reload.

        Install nodemon with 'npm install -g nodemon'

# Deploy on Heroku

To see the log run : 'heroku logs --tail -a chat21-api-nodejs'

To use a custom domain with AWS Route 53 see https://devcenter.heroku.com/articles/route-53

 # Usage 
 
 ## On localhost

### Signup

```
curl -v -X POST -d 'email=andrea.leo@f21.it&password=123456' http://localhost:3000/auth/signup
```


### Signin

```
curl -v -X POST -d 'email=andrea.leo@f21.it&password=123456' http://localhost:3000/auth/signin
```


### Firebase signin

```
curl -v -X POST -d 'email=andrea.leo@f21.it&password=123456' http://localhost:3000/firebase/auth/signin
```

### Requests 

#### Create 

```
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"requester_id":"io", "requester_fullname":"Andrea Leo", "first_text":"firstText", "support_status":200}' http://localhost:3000/5ab0f32757066e0014bfd718/requests
```


### Departments 

#### Create 

```
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"name":"testdepartment","id_bot":"idbot"}' http://localhost:3000/5ab0f32757066e0014bfd718/departments
```

#### List

```
curl -v -X GET -u andrea.leo@f21.it:123456 http://localhost:3000/5ab0f32757066e0014bfd718/departments
```

#### Create a default department

```
curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"name":"default","id_bot":"","default":true}' http://localhost:3000/5ab0f32757066e0014bfd718/departments
```

#### Get default department

```
curl -v -X GET -u andrea.leo@f21.it:123456 http://localhost:3000/5ab0f32757066e0014bfd718/departments/default
```

#### Get the available operator for a specific department
```
curl -X GET -u andrea.leo@f21.it:123456 http://localhost:3000/5ad706aa7009f70267089951/departments/5ad706db7009f70267089955/operators
```

### Bots 

#### List

```
curl -v -X GET -u andrea.leo@f21.it:123456 http://localhost:3000/5ab0f32757066e0014bfd718/faq_kb
```

 ## On Chat21.org

### Signup

```
curl -v -X POST -d 'email=andrea.leo@f21.it&password=123456' http://api.chat21.org/auth/signup
```

### Signin

```
curl -v -X POST -d 'email=andrea.leo@f21.it&password=123456' http://api.chat21.org/auth/signin
```

### Firebase signin

```
curl -v -X POST -d 'email=andrea.leo@f21sdadsadasdwqeq.it&password=123456' http://api.chat21.org/firebase/auth/signin
```

### Departments 

```
curl -v -X GET -u andrea.leo@f21.it:123456 http://api.chat21.org/5ab0f32757066e0014bfd718/departments
```

#### Get the available operator for a specific department
```
curl -v -X GET -u andrea.leo@frontiere21.it:123456 http://api.chat21.org/5ad4c101e774ac0014ae0d07/departments/5ad5c2c9c975820014ba901b/operators
```



### Bots 

#### List

```
curl -v -X GET -u andrea.leo@f21.it:123456 http://api.chat21.org/5ab0f32757066e0014bfd718/faq_kb
```
