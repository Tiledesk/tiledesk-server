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

#### Create

```
curl -v -X POST -u andrea.leo@f21.it:123456 -d '{"name":"testbot"}' https://api.tiledesk.com/v1/5ab0f32757066e0014bfd718/faq_kb
```

## Analytics
```
curl -v -X GET -u andrea.leo@f21.it:123456 https://api.tiledesk.com/v1/5ad5bd52c975820014ba900a/analytics/requests/count

```

```
curl -v -X GET -u andrea.leo@f21.it:123456 https://api.tiledesk.com/v1/5ad5bd52c975820014ba900a/analytics/requests/waiting

```

```
curl -v -X GET -u andrea.leo@f21.it:123456 https://api.tiledesk.com/v1/5ad5bd52c975820014ba900a/analytics/requests/waiting/day/last
```

```
curl -v -X GET -u andrea.leo@f21.it:123456 https://api.tiledesk.com/v1/5ad5bd52c975820014ba900a/analytics/requests/waiting/month
```


```
curl -v -X GET -u andrea.leo@f21.it:123456 https://api.tiledesk.com/v1/5ad5bd52c975820014ba900a/analytics/requests/aggregate/dayoftheweek/hours
```