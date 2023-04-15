import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { body } from 'express-validator'

import User from '../models/user.js'

export const newPasswordValidation = [
  body('token')
    .exists().withMessage('Token is required'),
  body('password')
    .isLength({min: 8}).withMessage('password must be 8 characters length minimum')
]

export default async (req, res) => {
  try {
    //#region  //*=========== Parse request ===========
    const { password, token } = req.body
    //#endregion  //*======== Parse request ===========
    
    //#region  //*=========== Verify the given token ===========
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY)
    if (!decodedToken) {
      return res.status(401).json({
        message: 'unauthenticated'
      })
    }
    //#endregion  //*======== Verify the given token ===========

    //#region  //*=========== Find user ===========
    const { email } = decodedToken
    const user = await User.findOne({ email })
    if (!user) {
      return res.json({
        message: 'user not found (weird)'
      })
    }
    //#endregion  //*======== Find user ===========

    //#region  //*=========== Update user password ===========
    user.password = await bcrypt.hash(password, 12)
    const savedUser = await user.save()
    //#endregion  //*======== Update user password ===========

    return res.status(201).json({
      message: 'Password has been changed',
      data: {
        user: savedUser
      },
    })
  } catch (e) {
    console.log(e)
    return res.status(500).json({
      message: 'Internal Server Error'
    })
  }
}