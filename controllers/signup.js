import { body } from 'express-validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

import sendmail from '../lib/sendmail.js'

import User from '../models/user.js'

export const signupValidation = [
  body('email')
    .isEmail().withMessage('Email is invalid')
    .normalizeEmail(),
  body('full_name')
    .notEmpty().withMessage('Full name cannot be empty'),
  body('password')
    .isLength({ min: 8 }).withMessage('password must be 8 characters length minimum'),
  body('password2')
    .isLength({ min: 8 }).withMessage('confirm password must be 8 characters length minimum'),
]

export default async (req, res) => {
  const session = await mongoose.startSession()
  try {
    session.startTransaction()

    //#region  //*=========== Parse request ===========
    const {full_name, email, password, password2} = req.body
    //#endregion  //*======== Parse request ===========

    //#region  //*=========== Check if password is the same as confirm password ===========
    if (password !== password2) {
      return res.status(422).json({
        messages: 'passwords are not the same'
      })
    }
    //#endregion  //*======== Check if password is the same as confirm password ===========
    
    //#region  //*=========== Find user by email ===========
    const user = await User.findOne({ email })
    if (user) {
      return res.status(200).json({
        message: 'email has been registered in this app'
      })
    }
    //#endregion  //*======== Find user by email ===========

    //#region  //*=========== Create new user ===========
    const hashedPassword = await bcrypt.hash(password, 12)
    const newUser = await User.create([{
      full_name,
      email,
      password: hashedPassword,
    }], { session })
    //#endregion  //*======== Create new user ===========

    //#region  //*=========== Send verify token to the new user ===========
    const verifyToken = jwt.sign({ email }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' })
    await sendmail({
      destination: email,
      subject: 'Verify Account',
      content: `<p>click here <a href='${process.env.FRONTEND_VERIFY_URL}?token=${verifyToken}'>link</a></p>`
    })
    //#endregion  //*======== Send verify token to the new user ===========

    await session.commitTransaction()

    return res.status(201).json({
      message: 'User has been created',
      data: {
        user: newUser[0]
      },
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