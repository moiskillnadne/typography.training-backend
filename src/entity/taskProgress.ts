import Mongoose from 'mongoose';

const TaskMarkSchema = new Mongoose.Schema({
    id: Number,
    mark: Number,
    isDone: Boolean
})

const TaskProgressSchema = new Mongoose.Schema({
    user: String,
    title: String,
    tasks: [TaskMarkSchema]
})

export const TaskProgress = Mongoose.model('progress', TaskProgressSchema, 'progress')
export const TaskMark = Mongoose.model('TaskMark', TaskMarkSchema)