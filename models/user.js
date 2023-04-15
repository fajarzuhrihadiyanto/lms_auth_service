import mongoose from 'mongoose'

const Schema = mongoose.Schema

const userSchema = new Schema({
  full_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    required: true,
    default: false
  }
})

export default mongoose.model('User', userSchema)