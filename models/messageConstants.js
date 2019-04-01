module.exports = {
    CHAT_MESSAGE_STATUS : {
        FAILED : -100,
        SENDING : 0,
        SENT : 100, //saved into sender timeline
        DELIVERED : 150, //delivered to recipient timeline
        RECEIVED : 200, //received from the recipient client
        RETURN_RECEIPT: 250, //return receipt from the recipient client
        SEEN : 300 //seen

    }
}
    