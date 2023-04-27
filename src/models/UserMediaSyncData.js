const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userMediaSyncData = Schema({
    userRefId: mongoose.Types.ObjectId,
    position: Number,
    paused: Boolean,
    songSource: String
})

module.exports = mongoose.model('UserMediaSyncData', userMediaSyncData) 