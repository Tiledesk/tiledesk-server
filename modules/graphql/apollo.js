const  ApolloServer  = require('apollo-server').ApolloServer;
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

const apolloServer = new ApolloServer({ typeDefs, resolvers });
const PORT = 4000;

apolloServer.listen({ port: PORT }, () => {
        console.log(`🚀 Server ready at http://localhost:${PORT}${apolloServer.graphqlPath}`);
        console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${apolloServer.subscriptionsPath}`);
    }
);