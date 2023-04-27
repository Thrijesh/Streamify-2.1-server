const mongoose = require('mongoose')

const connectDB = () => {
    try {
        mongoose.connect(process.env.DB_URI, {
            useUnifiedTopology: true,
            useNewUrlParser: true
        })
    } catch (error) {
        console.log(error)
    }
}

module.exports = connectDB