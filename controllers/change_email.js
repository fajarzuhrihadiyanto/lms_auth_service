import { body, header } from 'express-validator'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

import sendmail from '../lib/sendmail.js'

import User from '../models/user.js'

export const changeEmailValidation = [
  header('Authorization')
    .matches(/^Bearer .+$/).withMessage('Authorization must be provided with bearer token'),
  body('new_email')
    .isEmail().withMessage('New email is invalid')
    .normalizeEmail()
]

export default async (req, res) => {
  const session = await mongoose.startSession()
  try {
    session.startTransaction()

    //#region  //*=========== Parse request ===========
    const { new_email } = req.body
    const { authorization } = req.headers
    //#endregion  //*======== Parse request ===========

   //#region  //*=========== Verify the given token ===========
    const token = authorization.split(' ')[1]
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY)
    if (!decodedToken) {
      return res.status(401).json({ message: 'unauthenticated' })
    }
   //#endregion  //*======== Verify the given token ===========

    //#region  //*=========== Find and update user ===========
    const { user_id } = decodedToken
    const user = await User.findByIdAndUpdate(
      user_id,
      { email: new_email, isVerified: false },
      { session }
    )
    //#endregion  //*======== Find and update user ===========

    //#region  //*=========== Send message to user ===========
    const verifyToken = jwt.sign({ email: new_email }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' })
    await Promise.all([
      sendmail({
        destination: user.email,
        subject: 'Change Email',
        content: `<p>your email is changed to ${new_email}</p>`
      }),
      sendmail({
        destination: new_email,
        subject: 'Change Email',
        content: `<p>click here <a href='${process.env.FRONTEND_VERIFY_URL}?token=${verifyToken}'>link</a></p>`
      })
    ])
    //#endregion  //*======== Send message to user ===========

    await session.commitTransaction()

    return res.status(201).json({
      message: 'Email changed',
      data: { email: new_email }
    })

  } catch (e) {
    console.log(e)
    await session.abortTransaction()
    return res.status(500).json({
      message: 'Internal Server Error'
    })
  } finally {
    await session.endSession()
  }
}