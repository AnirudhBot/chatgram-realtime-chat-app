const chatMsgInput = document.querySelector('.inputMsg')
const submitBtn = document.querySelector('.submitBtn')
const messages = document.querySelector('.messages')
const channelName = document.querySelector('.channel-name')
const userList = document.querySelector('.participant-list')
const socket = io()

// Getting username and room from the URL
const {username, channel} = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

// Join channel
socket.emit('joinChannel', {username, channel})

// Get users and channel-name
socket.on('channelStatus', ({channel, users})=> {
    manipulateChannelName(channel)
    manipulateUsers(users)
})

// Listening messages from server
socket.on('message', message => {
    manipulateMessages(message)
})

// Enter key functionality while submitting a message
chatMsgInput.addEventListener("keyup", (e)=> {
    if(e.keyCode === 13) {
        e.preventDefault()
        submitBtn.click()
        chatMsgInput.value = ''
    }
})

// getting the chatMessage from the user
submitBtn.addEventListener('click', (e)=>{
    e.preventDefault()
    const chatMsg = chatMsgInput.value

    if(chatMsg != '') {
        // Emit chatMessage to server
        socket.emit('chatMessage', chatMsg)
        
        // Clear the input field after the message is sent
        chatMsgInput.value = ''
    }
})



/* -----------Functions----------- */

//Add channel name to interface
function manipulateChannelName(channel) {
    channelName.innerHTML = channel
}

//Add users to interface(participants)
function manipulateUsers(users) {
    let html = ''
    for(let i=0; i<users.length; i++) {
        html += `<div class="participant">
                    ${users[i].username}
                </div>
                <br>`
    }
    
    userList.innerHTML = ''
    userList.innerHTML += html
}

//Add chat messages to interface
function manipulateMessages(message) {
    let html = ''
    html += `<div class="message">
                <span class="name">${message.username}</span>
                <span class="time">${message.time}</span>
                <div class="text">
                    ${message.text}
                </div>
            </div>`

    messages.innerHTML += html

    // Scroll down to the latest message
    messages.scrollTop = messages.scrollHeight
}