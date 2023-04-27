require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')

const connectDB = require('./src/config/dbConnection')
const corsOptions = require('./src/config/corsOptions')
const errorHandler = require('./src/middlewares/errorHandler')

const imageRoute = require('./src/routes/imageRoute')
const userRoute = require('./src/routes/userRoutes')
const songRoute = require('./src/routes/songRoute')
const { removeUserFromRoom, changelisteningOnThisDevice, addUserToRoom, findRoomWithUserName } = require("./users")

const app = express()
const http = require('https').createServer(app)
const io = require('socket.io')(http, {cors: {origin: "*"}})
const PORT = 5000

// Cross Origin Resource Sharing
app.use(cors(corsOptions))

// Connect to Mongo DB
connectDB()

// express json
app.use(express.json())

// express built-in middleware to handle url encoded form data
app.use(express.urlencoded({ extended: true }))

// middleware for cookies
app.use(cookieParser())

// routes
app.use('/api', imageRoute)
app.use('/api', userRoute)
app.use('/api', songRoute)

// Error Handler 
app.use(errorHandler)

// socket.io connection - will fire for every new websocket connection
io.on("connection", (socket) => {
    // client connection id 
    console.log(`User Connected: ${socket.id}`)

    // joining user to the room
    socket.on('join_room', (roomId, data) => {
        const addUser = addUserToRoom({ id: socket.id, name: data.deviceName, roomId, listeningOn: socket.id })
        socket.join(roomId)
        io.to(roomId).emit('room_data', addUser)
        console.log(`User with ID: ${socket.id} connected to room ${roomId}`)
    })

    socket.on('new_device_detected_sending_music_data_except_for_sender', ({ isPaused, position, volume, duration, musicData, roomId }) => {
        console.log(isPaused, position, volume, duration, musicData, roomId)
        const state = { isPaused, position, volume: volume * 10 , duration, musicData }
        if(roomId) {
            socket.to(roomId).emit('new_device_detected_receiving_music_data_except_for_sender', state)
        }
    })

    // sending song data to all members including the sender
    socket.on('send_song_data', (song, room) => {
        io.sockets.in(room).emit('receive_song_data', song)
    })

    // sending song metadata once the song is loaded
    socket.on('send_music_meta_data', (data, room) => {
        // console.log(data)
        io.sockets.in(room).emit('receive_music_meta_data', data)
    })

    // sending play/pause with the postion of audioplayer
    socket.on('send_pause_play_state_audioplayer', (data, room) => {
        io.sockets.in(room).emit('receive_pause_play_state_audioplayer', data)
        console.log(data, room)
    })

    // sending play/pause from mock audioplayer
    socket.on('send_pause_play_state_mock_audioplayer', (data, room) => {
        io.sockets.in(room).emit('receive_pause_play_state_mock_audioplayer', data)
        console.log(data, room)
    })

    // volume
    socket.on('send_volume', (volume, room) => {
        // console.log(volume, room)
        io.sockets.in(room).emit('receive_volume', volume)
    })

    // seek
    socket.on('send_seek', (state, room) => {
        socket.to(room).emit('receive_seek', state)
    })

    // listening on 
    socket.on('change_listening_on', (id, room) => {
        const change = changelisteningOnThisDevice(id, room)
        io.sockets.in(room).emit('listening_on_has_changed', id, change)
    })

    // client disconnected 
    socket.on('disconnect', () => {
        const foundRoom = findRoomWithUserName(socket.id)
        // console.log(foundRoom, "FOUND USERS -------------------------Userss")
        if (foundRoom) {
            const user = removeUserFromRoom(foundRoom.roomId, socket.id)
            // console.log(user, "DELETED -------------------------Userss")
            socket.to(foundRoom.roomId).emit('user_disconnecting', user)
        }
        console.log(`User Disonnected: ${socket.id}`)
    })
})

mongoose.connection.once('open', () => {
    http.listen(PORT, () => {
        console.log(`Server in on ${PORT}`)
        console.log('Connected to Mongo DB')
    })
})

