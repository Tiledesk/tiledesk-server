// const { ApolloServer, gql } = require('apollo-server');
const  gql  = require('apollo-server').gql;

const typeDefs = gql`
   type Request {
       id: String!,
       first_text: String!,
       createdBy: String!, 
   }
   type Message {
        id: String!,
        text: String!,
        createdBy: String!, 
   }
   type Query {
       requests: [Request]
       messages: [Message]
       fetchMessage(id: Int!): Message
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
       requestCreated: Request
       messageCreated: Message
       messageUpdated(id: Int!): Message
   }
`;

module.exports = typeDefs;