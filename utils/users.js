const users = []

// Add user to database
function userJoin (id, username, channel) {
    const user = {id, username, channel}
    users.push(user)

    return user
}

// Current user
function currentUser (id) {
    return users.find(user => user.id === id)
}

// User who leaves the channel
function leftUser (id) {
    const index = users.findIndex(user => user.id === id)

    if(index !== -1) {
        return users.splice(index, 1)[0]
    }
}

// Get all users in specific channel
function channelUsers (channel) {
    return users.filter(user => user.channel === channel)
}


module.exports = {userJoin,currentUser,leftUser,channelUsers}