const moment = require("moment")

function messageFormat(username, text) {
    return {
        username,
        text,
        time: moment().local().format('h:mm a')
    }
}

module.exports = messageFormat;