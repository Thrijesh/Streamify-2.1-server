const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const User = require('../models/User')
const UserMediaSyncData = require('../models/UserMediaSyncData')

exports.registerUser = async (req, res) => {
    const { file } = req
    const { username, password, email } = req.body
    const gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'images'
    })

    if (!username || !password || !email) {
        // Deleting the image since no input data is found. 
        await gridFSBucket.s._filesCollection.findOne({ "filename": file?.filename }).then(image => {
            
            if (!image) {
                return res.status(400).json({ message: 'Please fill all the necessary fields.', success: false })
            }
            gridFSBucket.delete(image._id)
            return res.status(400).json({ message: 'Please fill all the necessary fields.', success: false })
        })
    } else {
        // check for duplicate usernames in DB
        const duplicate = await User.findOne({ email }).exec()
        if (duplicate) {
            // found user with same email. deleting the image from the DB
            await gridFSBucket.s._filesCollection.findOne({ "filename": file?.filename }).then(image => {
                if (!image) {
                    return res.status(400).json({ message: 'This email is already connected to an account.', success: false })
                }
                gridFSBucket.delete(image._id)
                return res.status(409).json({ message: `This email is already connected to an account.`, success: false }) //Conflict
            })
        } else {
            try {
                // encrypt the password
                const hashPassword = await bcrypt.hash(password, 10)

                // Create and store the new user
                const user = await User.create({
                    username,
                    password: hashPassword,
                    email,
                    profilePicture: file?.filename
                })

                return res.status(201).json({ message: "You're successfully registered with us. Shortly you'll be logged in and redirected.", success: true })
            } catch (error) {
                await gridFSBucket.s._filesCollection.findOne({ "filename": file?.filename }).then(image => {
                    if (!image) {
                        return res.status(400).json({ message: 'Something went wrong. Please try again.', success: false })
                    }
                    gridFSBucket.delete(image._id)
                    return res.status(400).json({ message: `Something went wrong. Please try again. ${error.message}`, success: false })
                })
            }
        }
    }
}

exports.handleLogin = async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.', success: false })

    try {
        const foundUser = await User.findOne({ email }).exec()
        if (!foundUser) return res.status(400).json({ message: 'User not found, please check your email.', success: false })

        // Evaluating the password
        const match = await bcrypt.compare(password, foundUser?.password)
        if (match) {
            // create JWT
            const accessToken = jwt.sign(
                { username: foundUser.username, _id: foundUser._id },
                process.env.ACCESS_TOKEN_JWT_SECRET,
                { expiresIn: '1h' }
            )
            const refreshToken = jwt.sign(
                { username: foundUser.username, _id: foundUser._id },
                process.env.REFRESH_TOKEN_JWT_SECRET,
                { expiresIn: '1d' }
            )
            // saving the refresh token with current user
            foundUser.refreshToken = refreshToken
            const result = await foundUser.save()
            // deleting the password before sending it to the client
            const user = {
                username: result.username,
                profilePicture: result.profilePicture,
                email: result.email,
                _id: result._id
            }
            res.cookie('jwt', refreshToken, {
                httpOnly: true,
                sameSite: 'none',
                secure: true,
                maxAge: 24 * 60 * 60 * 1000
            })
            return res.status(201).json({ user, accessToken, userId: user._id, message: 'Successfully logged in.', success: true })
        } else {
            return res.status(401).json({ message: 'Unauthorized, incorrect username or password.', success: false }) // Unauthorized
        }
    } catch (error) {
        return res.status(400).json({ message: `Error, ${error?.message}`, success: false })
    }
}

exports.findUser = async (req, res) => {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required.', success: false })

    try {
        const foundUser = await User.findOne({ email }).exec()
        if (foundUser) return res.status(200).json({ message: 'This email is already connected to an account.', success: false })
        return res.status(400).json({ message: 'No user found.', success: false })
    } catch (error) {
        return res.status(400).json({ message: 'Error. Try again.', success: false })
    }
}

exports.findUserByID = async (req, res) => {
    const { id } = req.body
    if (!id) return res.status(400).json({ message: 'User ID is required.', success: false })

    try {
        const foundUser = await User.findOne({ _id: id }).exec()
        if (foundUser) return res.status(200).json({ foundUser, message: 'User found.', success: false })
        return res.status(400).json({ message: 'No user found.', success: false })
    } catch (error) {
        return res.status(400).json({ message: 'Error. Try again.', success: false })
    }
}

exports.postUserMediaSyncData = async (req, res) => {
    const { songSource, position, userRefId, paused } = req.body
    try {
        // finding a user to update or create document
        const foundUser = await UserMediaSyncData.findOne({ userRefId }).exec()
        if (foundUser) {
            // updating the document
            foundUser.position = position
            foundUser.paused = paused
            foundUser.songSource = songSource

            const result = await foundUser.save()
            return res.status(201).json({ message: "Song sync data is updated.", success: true, result })
        } else {
            // creating the new document
            const user = await UserMediaSyncData.create({
                userRefId,
                position,
                paused,
                songSource
            })
            return res.status(201).json({ message: "Song sync data is created", success: true, user })
        }
    } catch (error) {
        return res.status(400).json({ message: `Something wrong`, success: false })
    }
}

exports.getUserMediaSyncData = async (req, res) => {
    const { userRefId } = req.body
    try {
        // finding a user to update or create document
        const foundUser = await UserMediaSyncData.findOne({ userRefId }).exec()
        if (foundUser) {
            return res.status(201).json({ message: "Song sync data is found.", success: true, foundUser })
        }
    } catch (error) {
        return res.status(400).json({ message: `Error, ${error?.message}`, success: false })
    }
}