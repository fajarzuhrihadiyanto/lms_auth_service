import jwt from 'jsonwebtoken'
import { body } from 'express-validator'

import User from '../models/user.js'

export const verifyValidation = [
  body('token')
    .exists().withMessage('Token is required')
]

export default async (req, res) => {
  try {
    //#region  //*=========== Parse request ===========
    const { token } = req.body
    //#endregion  //*======== Parse request ===========
    
    //#region  //*=========== Verify the given token ===========
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY)
    if (!decodedToken) {
      return res.status(401).json({
        message: 'unauthenticated'
      })
    }
    //#endregion  //*======== Verify the given token ===========

    //#region  //*=========== Get user data ===========
    const { email } = decodedToken
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({
        message: 'unauthenticated'
      })
    }
    //#endregion  //*======== Get user data ===========

    //#region  //*=========== Update user data ===========
    user.isVerified = true
    const verifiedUser = await user.save()
    //#endregion  //*======== Update user data ===========

    return res.json({
      message: 'user is verified',
      data: {
        user: verifiedUser
      }
    })

  } catch (e) {
    console.log(e)
    return res.status(500).json({
      message: 'Internal Server Error'
    })
  }
}