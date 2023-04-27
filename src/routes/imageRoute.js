const router = require('express').Router()
const multer = require('multer')
const { GridFsStorage } = require('multer-gridfs-storage')
const crypto = require('crypto')
const path = require('path')
const mongoose = require('mongoose')

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
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err)
                }
                const randomUUID = crypto.randomBytes(16).toString("hex")
                const filename = buf.toString('hex') + path.extname(file.originalname) + randomUUID + Date.now()

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

router.post('/upload-image', upload.single('image'), (req, res) => {
    const { file } = req
    res.json(file)
})

router.get("/image/:filename", async (req, res) => {
    const { filename } = req.params
    await gridFSBucket.s._filesCollection.findOne({ "filename": filename }).then(image => {
        if (!image) {
            return res.json({ image, res: 'faliuure' })
        }
        gridFSBucket.openDownloadStreamByName(filename).pipe(res)
    })
})

router.get("/image/delete/:filename", async (req, res) => {
    const { filename } = req.params
    await gridFSBucket.s._filesCollection.findOne({ "filename": filename }).then(image => {
        if (!image) {
            return res.json({ image, res: 'Image is found in databases.' })
        }
        gridFSBucket.delete(image._id)
        return res.status(201).json({ message: "Deleted image.", image })
    })
})

module.exports = router