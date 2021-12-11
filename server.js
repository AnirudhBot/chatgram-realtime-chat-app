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
        let index = 0

        //Toxicity check
        const threshold = 0.9
        toxicity.load(threshold).then(model => {
            model.classify([msg]).then(predictions => {
                for(let i=0; i<predictions.length; i++) {
                    if(predictions[i].results[0].match === true) {
                        index = 1
                        return socket.emit('message', messageFormat(`--Chatgram Bot--`,'Your message has been deleted as it violates our anti-toxicity guidelines. Please try to be respectful to others !'))
                    }            
                }

                if(index === 0) {
                    io.to(user.channel).emit('message', messageFormat(user.username, msg))
                }
            })
        })

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


const PORT = process.env.PORT || 3000

server.listen(PORT, () =>{
    console.log(`server running on port ${PORT}`)
})