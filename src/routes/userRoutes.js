const router = require('express').Router()
const multer = require('multer')
const { GridFsStorage } = require('multer-gridfs-storage')
const crypto = require('crypto')
const path = require('path')
const mongoose = require('mongoose')

const { registerUser, handleLogin, getUserMediaSyncData, postUserMediaSyncData, findUser, findUserByID } = require('../controllers/userController')
const { validationUserSignInRequest, isValidateRequestSuccess } = require('../validators/authenticationValidator')
const { handleRefreshToken } = require('../controllers/refreshTokenController')
const { handleLogout } = require('../controllers/logoutController')
const UserMediaSyncData = require('../models/UserMediaSyncData')
const { verifyJWT } = require('../middlewares/verifyJWT')

// connection
let gridFSBucket

mongoose.connection.once('open', () => {
    gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'images'
    })
})

const storage = new GridFsStorage({
    url: process.env.DB_URI,
    file: (req, file) => {
        if (!file) return new Error("No file attached")
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err)
                }
                const randomUUID = crypto.randomBytes(16).toString("hex")
                const filename = buf.toString('hex') + randomUUID + Date.now() + path.extname(file.originalname)

                const fileInfo = {
                    filename: filename,
                    bucketName: 'images',
                }
                resolve(fileInfo)
            })
        })
    }
})

const upload = multer({ storage })

router.get('/user/refresh', handleRefreshToken)
router.get('/user/logout', handleLogout)
router.post('/user/post-media-state', postUserMediaSyncData)
router.post('/user/get-media-state', getUserMediaSyncData)
router.post('/user/register', upload.single('image'), registerUser)
router.post('/user/find-user', findUser) // used in sign  up page
router.post('/user/find-user-by-id', verifyJWT, findUserByID) 

router.post('/user/login', validationUserSignInRequest, isValidateRequestSuccess, handleLogin)

module.exports = router