import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

import signinController, {signinValidationHandlers} from './controllers/signin.js'
import signupController, {signupValidation} from './controllers/signup.js'
import verifyController, {verifyValidation} from './controllers/verify.js'
import resetPasswordController, {resetPasswordValidation} from './controllers/reset_password.js'
import newPasswordController, {newPasswordValidation} from './controllers/new_password.js'
import changeEmailController, {changeEmailValidation} from './controllers/change_email.js'
import changePasswordController, {changePasswordValidation} from './controllers/change_password.js'

import validationErrorHandler from './middlewares/validationErrorHandler.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.post('/sign-in', ...signinValidationHandlers, validationErrorHandler, signinController)
app.post('/sign-up', ...signupValidation, validationErrorHandler, signupController)
app.post('/verify', ...verifyValidation, validationErrorHandler, verifyController)
app.post('/reset-password', ...resetPasswordValidation, validationErrorHandler, resetPasswordController)
app.post('/new-password', ...newPasswordValidation, validationErrorHandler, newPasswordController)
app.post('/change-email', ...changeEmailValidation, validationErrorHandler, changeEmailController)
app.post('/change-password', ...changePasswordValidation, validationErrorHandler, changePasswordController)

mongoose.connect(process.env.DATABASE_URL)
  .then(() => {
    app.listen(Number(process.env.PORT || 3000))
  })
  .catch(error => {
    console.log(error)
  })