loadtest http://localhost:7357/ -t 20 -c 10









// db.getCollection('requests').find({"id_project":"5ea800091147f28c72b90c5e","status":{"$lt":1000},"$or":[{"preflight":false},{"preflight":{"$exists":false}}]}).explain("executionStats")
// db.getCollection('requests').find({"id_project":"5ea800091147f28c72b90c5e","status":{"$lt":1000},"$or":[{"agents.id_user":"5e79e711ecb9230ac1f5b49f"},{"participants":"5e79e711ecb9230ac1f5b49f"}]}).explain("executionStats")




// db.getCollection('requests').find({"id_project":"5e7fc0d5045a6a5021a7e4be","status":{"$lt":1000},"$or":[{"agents.id_user":"5e8a1eac904f2c304f9e8076"},{"participants":"5e8a1eac904f2c304f9e8076"}]}).explain("executionStats")



2|www      | end ws 100 2020-05-03T07:43:17.240Z 2020-05-03T07:43:11.491Z
 end ws 100 2020-05-03T07:43:17.504Z 2020-05-03T07:43:12.385Z
 3|www  | end ws 100 2020-05-03T07:45:11.904Z 2020-05-03T07:45:05.716Z


                     2020-05-03T07:48:51.595Z 6secondi
13|www  | end ws 100 2020-05-03T07:48:57.593Z 
 


| end ws 100 { id_project: '5e7fc0d5045a6a5021a7e4be',
0|www  |   '$or':
0|www  |    [ { 'agents.id_user': '5e9eab435170bc3889c948ce' },
0|www  |      { participants: '5e9eab435170bc3889c948ce' } ] } 2020-05-03T07:56:23.415Z 2020-05-03T07:56:17.476Z 5 secondi

1|www  | end ws 100 { id_project: '5e7fc0d5045a6a5021a7e4be',
1|www  |   '$or':
1|www  |    [ { 'agents.id_user': '5e8a1eac904f2c304f9e8076' },
1|www  |      { participants: '5e8a1eac904f2c304f9e8076' } ] } 2020-05-03T07:56:23.673Z 2020-05-03T07:56:18.147Z 6secondi


| end ws 100 { id_project: '5e7fc0d5045a6a5021a7e4be',
14|www |   '$or':
14|www |    [ { 'agents.id_user': '5e8a1eac904f2c304f9e8076' },
14|www |      { participants: '5e8a1eac904f2c304f9e8076' } ] } 2020-05-03T08:15:10.192Z 2020-05-03T08:15:04.816Z 6secondi




ws 13 secondi se tolgo query or

15|www | end ws 100 { id_project: '5e7fc0d5045a6a5021a7e4be' } 2020-05-03T08:23:37.938Z 2020-05-03T08:23:33.266Z 4secondi




end ws 10 { id_project: '5e7fc0d5045a6a5021a7e4be',
14|www |   '$or':
14|www |    [ { 'agents.id_user': '5e8a1eac904f2c304f9e8076' },
14|www |      { participants: '5e8a1eac904f2c304f9e8076' } ] } 2020-05-03T08:30:59.632Z 2020-05-03T08:30:59.115Z 


https://apixat.uv.es/5e7fc0d5045a6a5021a7e4be/requests?&page=0&limit=100

con tutto 
14|www | finish 2020-05-03T12:41:23.892Z 2020-05-03T12:41:25.456Z
su browser 16 secondi 500k gzip

senza populate senza sort
7|www  | finish 2020-05-03T12:43:08.060Z 2020-05-03T12:43:08.396Z
su browser 1,6 secondi 41k gzip

senza populate con sort
8|www  | finish 2020-05-03T12:44:28.098Z 2020-05-03T12:44:29.486Z
su browser 15 secondi 500k gzip

use tiledesk
switched to db tiledesk
> db.requests.getIndexes()
[
	{
		"v" : 2,
		"key" : {
			"_id" : 1
		},
		"name" : "_id_",
		"ns" : "tiledesk.requests"
	},
	{
		"v" : 2,
		"key" : {
			"request_id" : 1
		},
		"name" : "request_id_1",
		"background" : true,
		"ns" : "tiledesk.requests"
	},
	{
		"v" : 2,
		"key" : {
			"requester" : 1
		},
		"name" : "requester_1",
		"ns" : "tiledesk.requests",
		"background" : true
	},
	{
		"v" : 2,
		"key" : {
			"status" : 1
		},
		"name" : "status_1",
		"ns" : "tiledesk.requests",
		"background" : true
	},
	{
		"v" : 2,
		"key" : {
			"participants" : 1
		},
		"name" : "participants_1",
		"ns" : "tiledesk.requests",
		"background" : true
	},
	{
		"v" : 2,
		"key" : {
			"department" : 1
		},
		"name" : "department_1",
		"ns" : "tiledesk.requests",
		"background" : true
	},
	{
		"v" : 2,
		"key" : {
			"tags" : 1
		},
		"name" : "tags_1",
		"ns" : "tiledesk.requests",
		"background" : true
	},
	{
		"v" : 2,
		"key" : {
			"notes.text" : 1
		},
		"name" : "notes.text_1",
		"ns" : "tiledesk.requests",
		"background" : true
	},
	{
		"v" : 2,
		"key" : {
			"agents.id_project" : 1
		},
		"name" : "agents.id_project_1",
		"background" : true,
		"ns" : "tiledesk.requests"
	},
	{
		"v" : 2,
		"key" : {
			"agents.id_user" : 1
		},
		"name" : "agents.id_user_1",
		"background" : true,
		"ns" : "tiledesk.requests"
	},
	{
		"v" : 2,
		"key" : {
			"agents.uuid_user" : 1
		},
		"name" : "agents.uuid_user_1",
		"ns" : "tiledesk.requests",
		"background" : true
	},
	{
		"v" : 2,
		"key" : {
			"agents.role" : 1
		},
		"name" : "agents.role_1",
		"ns" : "tiledesk.requests",
		"background" : true
	},
	{
		"v" : 2,
		"key" : {
			"agents.user_available" : 1
		},
		"name" : "agents.user_available_1",
		"background" : true,
		"ns" : "tiledesk.requests"
	},
	{
		"v" : 2,
		"key" : {
			"id_project" : 1
		},
		"name" : "id_project_1",
		"ns" : "tiledesk.requests",
		"background" : true
	},
	{
		"v" : 2,
		"key" : {
			"createdAt" : 1,
			"type" : -1
		},
		"name" : "createdAt_1_type_-1",
		"ns" : "tiledesk.requests",
		"background" : true
	},
	{
		"v" : 2,
		"key" : {
			"id_project" : 1,
			"type" : -1
		},
		"name" : "id_project_1_type_-1",
		"ns" : "tiledesk.requests",
		"background" : true
	},
	{
		"v" : 2,
		"key" : {
			"_fts" : "text",
			"_ftsx" : 1
		},
		"name" : "request_fulltext",
		"default_language" : "italian",
		"ns" : "tiledesk.requests",
		"language_override" : "dummy",
		"background" : true,
		"weights" : {
			"rating_message" : 1,
			"transcript" : 1
		},
		"textIndexVersion" : 2
	},
	{
		"v" : 2,
		"key" : {
			"id_project" : 1,
			"status" : 1,
			"updatedAt" : 1
		},
		"name" : "id_project_1_status_1_updatedAt_1",
		"ns" : "tiledesk.requests",
		"background" : true
	},
    db.requests.dropIndex( "id_project_1_status_1_updatedAt_1" )
    db.requests.createIndex( { "id_project": 1, "status": 1, "updatedAt": -1 } )

	{
		"v" : 2,
		"key" : {
			"agents.number_assigned_requests" : 1
		},
		"name" : "agents.number_assigned_requests_1",
		"ns" : "tiledesk.requests",
		"background" : true
	}
]
> 







fai indice su toni createdAt e updatedAt  <----------->