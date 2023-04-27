const { validationResult, check } = require('express-validator')

exports.validationUserSignInRequest = [
    check('email').isEmail().withMessage("Valid email required.")
]

exports.isValidateRequestSuccess = (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors?.array()[0]?.msg });
    }

    next()
}