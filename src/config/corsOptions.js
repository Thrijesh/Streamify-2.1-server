const whiteList = [
    'http://localhost:3000',
    'https://streamify-seven.vercel.app',
    'http://localhost:3001',
    'https://spiffy-sherbet-f7bcba.netlify.app'
]

const corsOptions = {
    origin: (origin, callback) => {
        if(whiteList.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS.'))
        }
    },
    optionsSuccessStatus: 200,
    credentials: true
}

module.exports = corsOptions
