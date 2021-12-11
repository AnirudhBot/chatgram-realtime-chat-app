const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const messageFormat = require('./utils/messages')
const {userJoin,currentUser,leftUser,channelUsers} = require('./utils/users')

//Anti-toxicity tensorflow model
require('@tensorflow/tfjs')
const toxicity = require('@tensorflow-models/toxicity')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

//Static folder
app.use(express.static(path.join(__dirname, 'public')))

//On User connection
io.on('connection', socket => {
    socket.on('joinChannel', ({username, channel})=> {

        const user = userJoin(socket.id, username, channel)

        socket.join(user.channel)

        //emit message to only the user who has connected
        socket.emit('message', messageFormat(`--Chatgram Bot--`,'Welcome to Chatgram!'))

        //broadcast on a user connection
        socket.broadcast.to(user.channel).emit('message',  messageFormat('--Chatgram Bot--',`${user.username} has joined the chat`))

        //Send users and channel-name
        io.to(user.channel).emit('channelStatus', {
            channel: user.channel,
            users: channelUsers(user.channel)
        })

    })

    //Listening chatMessage
    socket.on('chatMessage', msg=> {
        const user = currentUser(socket.id)

        //Toxicity check
        const threshold = 0.9
        toxicity.load(threshold).then(model => {
            model.classify([msg]).then(predictions => {
                for(let i=0; i<predictions.length; i++) {
                    if(predictions[i].results[0].match === true) {
                        return socket.emit('message', messageFormat(`--Chatgram Bot--`,'Chatgram finds your text toxic. Please try to be respectful to others !'))
                    }            
                }
            })
        })

        io.to(user.channel).emit('message', messageFormat(user.username, msg))

    })

    //Broadcast on a user disconnection
    socket.on('disconnect', ()=> {
        const user = leftUser(socket.id)

        if(user) {
            socket.broadcast.to(user.channel).emit('message',  messageFormat('--Chatgram Bot--',`${user.username} has left the chat`))

            //Send users and channel-name
            io.to(user.channel).emit('channelStatus', {
                channel: user.channel,
                users: channelUsers(user.channel)
            })
        }
    })

})


const PORT = 3000 || process.env.PORT

server.listen(PORT, () =>{
    console.log(`server running on port ${PORT}`)
})