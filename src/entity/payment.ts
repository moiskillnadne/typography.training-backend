import Mongoose from "mongoose";


const PaymentSchema = new Mongoose.Schema({
    user: String,
    lesson: String,
    payment: Object
})

export const Payment = Mongoose.model('payment', PaymentSchema, 'payment')
