import { body, header } from 'express-validator'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

import sendmail from '../lib/sendmail.js'

import User from '../models/user.js'
import mongoose from 'mongoose'

export const changePasswordValidation = [
  header('Authorization')
    .matches(/^Bearer .+$/).withMessage('Authorization must be provided with bearer token'),
  body('old_password')
    .isLength({min: 8}).withMessage('password must be 8 characters length minimum'),
  body('new_password')
    .isLength({min: 8}).withMessage('password must be 8 characters length minimum'),
]

export default async (req, res) => {
  const session = await mongoose.startSession()
  try {
    session.startTransaction()

    //#region  //*=========== Parse reuqest ===========
    const { old_password, new_password } = req.body
    console.log(old_password)
    const { authorization } = req.headers
    //#endregion  //*======== Parse reuqest ===========

    //#region  //*=========== Verify the given token ===========
    const token = authorization.split(' ')[1]
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY)
    if (!decodedToken) {
      return res.status(401).json({ message: 'unauthenticated' })
    }
    //#endregion  //*======== Verify the given token ===========

    //#region  //*=========== Find user ===========
    const { user_id } = decodedToken
    const user = await User.findById(user_id)
    if (!user) {
      return res.json({
        message: 'user not found (weird)'
      })
    }
    //#endregion  //*======== Find user ===========

    //#region  //*=========== Check if user password is the same as the given one ===========
    console.log(old_password)
    console.log(user.password)
    const isEqual = await bcrypt.compare(old_password, user.password)
    if (!isEqual) {
      return res.status(400).json({
        message: 'Invalid authentication'
      })
    }
    //#endregion  //*======== Check if user password is the same as the given one ===========

    //#region  //*=========== Update user password ===========
    const hashedPassword = await bcrypt.hash(new_password, 12)
    const savedUser = await User.findByIdAndUpdate(
      user_id,
      { password: hashedPassword },
      { new: true, session },
    )
    //#endregion  //*======== Update user password ===========

    //#region  //*=========== Send email to user ===========
    await sendmail({
      destination: user.email,
      subject: 'Change Password',
      content: `<p>your password is changed</p>`
    })
    //#endregion  //*======== Send email to user ===========

    await session.commitTransaction()

    return res.status(201).json({
      message: 'Password changed',
      data: savedUser,
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