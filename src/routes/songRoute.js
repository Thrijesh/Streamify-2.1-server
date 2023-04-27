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
        bucketName: 'songs'
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
                    bucketName: 'songs',
                }
                resolve(fileInfo)
            })
        })
    }
})

const upload = multer({ storage })

router.post('/upload-song', upload.single('song'), (req, res) => {
    const { file } = req
    res.json(file)
})

// Download the song
// router.get("/song/:filename", async (req, res) => {
//     const { filename } = req.params
//     await gridFSBucket.s._filesCollection.findOne({ "filename": filename }).then(song => {
//         if (!song) {
//             return res.json({ song, res: 'faliuure' })
//         }
//         gridFSBucket.openDownloadStreamByName(filename).pipe(res)
//     })
// })

// Streaming the song
router.get("/song/:filename", async (req, res) => {
    const { filename } = req.params
    await gridFSBucket.s._filesCollection.findOne({ "filename": filename }).then(song => {
        if (!song) {
            return res.json({ song, res: 'faliuure' })
        }
        let range
        if (req.headers.range !== undefined) {
            range = req.headers.range
        } else {
            range = 'bytes=0-'
        }
        console.log(req.headers.range)

        const songSize = song.length
        const start = Number(range.replace(/\D/g, ""))
        const end = songSize - 1
        const contentLength = end - start + 1

        const headers = {
            "Content-Range": `bytes ${start}-${end}/${songSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": contentLength,
            "Content-Type": song.contentType,
        }

        // HTTP Status 206 for Partial Content
        res.writeHead(206, headers);

        // Stream 
        const readStream = gridFSBucket.openDownloadStreamByName(filename, { start }).end(songSize)

        readStream.pipe(res)
        readStream.on('end', () => {
            res.end()
        })
    })
})

router.get("/song/delete/:filename", async (req, res) => {
    const { filename } = req.params
    await gridFSBucket.s._filesCollection.findOne({ "filename": filename }).then(song => {
        if (!song) {
            return res.json({ song, res: 'Image is found in databases.' })
        }
        gridFSBucket.delete(song._id)
        return res.status(201).json({ message: "Deleted song.", song })
    })
})

module.exports = router