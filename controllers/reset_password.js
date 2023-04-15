import { body } from 'express-validator'
import jwt from 'jsonwebtoken'

import sendmail from '../lib/sendmail.js'

import User from '../models/user.js'

export const resetPasswordValidation = [
  body('email')
    .isEmail().withMessage('Email is invalid')
    .normalizeEmail(),
]

export default async (req, res) => {
  try {
    //#region  //*=========== Parse request ===========
    const { email } = req.body
    //#endregion  //*======== Parse request ===========

    //#region  //*=========== Find user ===========
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        message: 'User does not exist'
      })
    }
    //#endregion  //*======== Find user ===========

    //#region  //*=========== Send token to the user ===========
    const token = jwt.sign({ email }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' })
    await sendmail({
      destination: email,
      subject: 'Reset Password',
      content: `<p>click here <a href='${process.env.FRONTEND_NEW_PASSWORD_URL}?token=${token}'>link</a></p>`
    })
    //#endregion  //*======== Send token to the user ===========

    return res.status(200).json({
      message: `Reset password link is sent to ${email}`,
      data: { email },
    })

  } catch (e) {
    console.log(e)
    return res.status(500).json({
      message: 'Internal Server Error'
    })
  }
}