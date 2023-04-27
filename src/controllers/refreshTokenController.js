const jwt = require('jsonwebtoken')

const User = require('../models/User')

exports.handleRefreshToken = async (req, res) => {
    const { cookies } = req
    if(!cookies?.jwt) return res.status(401).json({ message: `Session expired. Please login.`, success: false })
    const refreshToken = cookies?.jwt
    // find user with refresh token
    const foundUser = await User.findOne({ refreshToken }).exec()
    if(!foundUser) return res.status(401).json({ message: `Session expired. Please login.`, success: false })

    // evaluate jwt
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_JWT_SECRET, (err, decoded) => {
        if(err) return res.status(401).json({ message: `Session expired. Please login.`, success: false })
        const accessToken = jwt.sign(
            { username: decoded.username, _id: decoded._id },
            process.env.ACCESS_TOKEN_JWT_SECRET,
            { expiresIn: '1h' }
        )
        res.status(201).json({ accessToken, userId: decoded._id })
    })
}