import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { body } from 'express-validator'

import User from '../models/user.js'

export const signinValidationHandlers = [
  body('email')
    .isEmail().withMessage('Email is invalid')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('password must be 8 characters length minimum'),
]

export default async (req, res) => {
  try {
    //#region  //*=========== Parse request ===========
    const { email, password } = req.body
    //#endregion  //*======== Parse request ===========

    //#region  //*=========== Find user ===========
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({
        message: 'Invalid authentication'
      })
    }
    //#endregion  //*======== Find user ===========

    //#region  //*=========== Compare user password with given password ===========
    const isEqual = await bcrypt.compare(password, user.password)
    if (!isEqual) {
      return res.status(401).json({
        message: 'Invalid authentication'
      })
    }
    //#endregion  //*======== Compare user password with given password ===========

    //#region  //*=========== Check if user is verified ===========
    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Account is not verified'
      })
    }
    //#endregion  //*======== Check if user is verified ===========

    //#region  //*=========== Create JSON web token ===========
    const token = jwt.sign({ user_id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' })
    return res.json({
      message: 'Sign in succeed',
      data: {
        user,
        token
      }
    })
    //#endregion  //*======== Create JSON web token ===========

  } catch (e) {
    console.log(e)
    return res.status(500).json({
      message: 'Internal Server Error'
    })
  }
}

