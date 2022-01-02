import  Mongoose from "mongoose";

const UserSchema = new Mongoose.Schema({
    email: String,
    token: String,
    isConfirm: Boolean
})

export const User = Mongoose.model('users', UserSchema)