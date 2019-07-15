// const { ApolloServer, gql } = require('apollo-server');
const  gql  = require('apollo-server').gql;

/*
query{
    requests(id_project:"5d2a600039fc8e04ae4ffaee") {
      id,
      first_text,
      requester {
        id,
        role
      }
    }
  }


  mutation {
  createMessage(text: "Daniele Zurico", createdBy:"123", id_project:"123",recipient:"123",sender:"12312312" ) {
    text
    id
  }
}

curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"sender":"io", "sender_fullname":"Andrea Leo", "text":"firstText"}' http://localhost:3000/5d2a600039fc8e04ae4ffaee/requests/req123456789/messages
curl -v -X PUT -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456  http://localhost:3000/5d2a600039fc8e04ae4ffaee/requests/req123456789/close

subscription {
  requestCreated(id_project: "5d2a600039fc8e04ae4ffaee") {
     id,
    first_text
  }
}

subscription {
  requestUpdated(id_project: "5d2a600039fc8e04ae4ffaee") {
     id,
    first_text,
    status
  }
  
}

subscription {
  userPresenceOnline(id_project: "1234") {
    userid
  }
}

*/

const typeDefs = gql`
   type Request {
       id: String!,
       request_id: String!,
       requester: ProjectUser!,
       status: Int!,
       first_text: String!,
       createdBy: String!, 
   }
   type Message {
        id: String!,
        text: String!,
        createdBy: String!, 
   }
   type ProjectUser {
        id: String!,
        role: String!,
        createdBy: String!, 
    }
    type Presence {
        userid: String!,       
   }
   type Query {
       requests(id_project: String!): [Request]
       messages: [Message]
       fetchMessage(id: String!): Message
   }
   type Mutation {
       createMessage (
           text: String!
           createdBy: String!
           id_project: String!
           recipient: String!
           sender: String!
       ): Message
       updateMessage (
           id: Int!
           text: String!
           isFavorite: Boolean!
       ): Message
   },
   type Subscription {
       requestCreated(id_project: String!): Request
       requestUpdated(id_project: String!): Request
       requestClosed(id_project: String!): Request
       requestReopened(id_project: String!): Request
       messageCreated: Message
       messageUpdated(id: Int!): Message
       userPresenceOnline(id_project: String!): Presence 
       presenceOnline: Presence    
   }
`;

   
module.exports = typeDefs;