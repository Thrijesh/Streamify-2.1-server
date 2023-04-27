const User = require('../models/User')

exports.handleLogout = async (req, res) => {
    // On client, also delete cookies

    const { cookies } = req
    if (!cookies?.jwt) return res.status(400).json({ message: "Failed to log out.", success: false })
    const refreshToken = cookies?.jwt

    // find user with refresh token
    const foundUser = await User.findOne({ refreshToken }).exec()
    if (!foundUser) {
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 24 * 60 * 60 * 1000 })
        return res.sendStatus(204)// No Content
    }

    //  Delete the refresh token in DB
    foundUser.refreshToken = ''
    const result = await foundUser.save()   

    res.clearCookie('jwt', { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 24 * 60 * 60 * 1000 })
    return res.sendStatus(204) // No Content
}