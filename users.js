let usersRoomData = []


const addUserToRoom = ({ id, name, roomId, listeningOn }) => {
    const existingRoom = usersRoomData.find((room) => room.roomId === roomId)

    // room found with the room ID
    if (existingRoom) {
        // finding existing user in the room
        const existingUser = existingRoom?.users.find(user => user.id === id)
        if (!existingUser) {
            usersRoomData = usersRoomData?.map(room => room?.roomId === roomId ? { ...room, users: [...room?.users, { id, name }] } : room)
        }
    } else {
        // create a room with the first user
        const user = { roomId: roomId, listeningOn, users: [{ id, name }] }
        usersRoomData.push(user)
    }
    return getRoom(roomId)
}

// const removeUserFromRoom = (roomId, userId) => {
//     let numberOfUsersRoom
//     usersRoomData = usersRoomData?.map(room => {
//         if (room.roomId === roomId) {
//             const filterUsers = room?.users?.filter(user => {
//                 return user.id !== userId
//             })
//             numberOfUsersRoom = filterUsers?.length
//             return { ...room, users: filterUsers }
//         } else {
//             return room
//         }
//     })

//     if (numberOfUsersRoom === 0) {
//         usersRoomData = usersRoomData?.filter(room => room.roomId !== roomId)
//     }
//     return getRoom(roomId)
// }

const removeUserFromRoom = (roomId, userId) => {
    console.log(getRoom(roomId), "----------------FIRST")
    let numberOfUsersRoom
    usersRoomData = usersRoomData?.map(room => {
        if (room.roomId === roomId) {
            const filterUsers = room?.users?.filter(user => {
                return user.id !== userId
            })
            numberOfUsersRoom = filterUsers?.length
            if (userId === room.listeningOn) {
                console.log("LEft")
                return {
                    ...room,
                    listeningOn: filterUsers?.length >= 0 && filterUsers[0]?.id,
                    users: filterUsers
                }
            } else {
                return { ...room, users: filterUsers }
            }
        } else {
            return room
        }
    })

    if (numberOfUsersRoom === 0) {
        usersRoomData = usersRoomData?.filter(room => room.roomId !== roomId)
    }
    console.log(getRoom(roomId), "-------------------------LAst")
    return getRoom(roomId)
}

const findRoomWithUserName = (id) => {
    for (var i = 0; i < usersRoomData?.length; i++) {
        for (var j = 0; j < usersRoomData[i]?.users?.length; j++) {
            if (id === usersRoomData[i]?.users[j]?.id) {
                return usersRoomData[i]
            }
        }
    }
}

const getRoom = (id) => usersRoomData.find(room => room.roomId === id)

const changelisteningOnThisDevice = (id, roomId) => {
    usersRoomData = usersRoomData.map(room => {
        if (room.roomId === roomId) {
            return { ...room, listeningOn: id }
        }
        return room
    })
    return getRoom(roomId)
}

module.exports = { removeUserFromRoom, changelisteningOnThisDevice, getRoom, addUserToRoom, findRoomWithUserName }