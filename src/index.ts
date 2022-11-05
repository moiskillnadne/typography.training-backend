import express, { Request, Response } from 'express'
import chalk from 'chalk'
import bodyparser from 'body-parser'
import axios from 'axios'
import env from 'dotenv'
import { v4 as uuidv4 } from 'uuid'
import { MongoClient } from 'mongodb'
import cors from 'cors'
import { CreateBill, Cources, PaymentPesponse } from './types/bill.entity'
import Mongoose from 'mongoose'
import { Payment } from './entity/payment'
import { TaskProgress, TaskMark } from './entity/taskProgress'

env.config()
const mongouri = `mongodb+srv://victor_ryabkov:${process.env.DB_PASSWORD}@cluster0.xupy9.mongodb.net/cluster0?retryWrites=true&w=majority`;
const PORT = 5555

const app = express()
const client = new MongoClient(mongouri);
Mongoose.connect(mongouri)

connectDatabase().catch(console.dir)
client.addListener('connectionCreated', (res) => {
    console.log('Connection successfully to server')
})

app.use(cors())
app.use(bodyparser.json())
app.use(bodyparser.text({ type: 'text/plain' }))

app.get('/', (req, res) => {
    res.send('Hello **adwawd')
})

app.post('/testapi', (req: Request, res: Response) => {
    const body = req.body

    res.send(body)
})

app.post('/api/sendemailcode', async (req: Request, response: Response) => {
    const { email } = req.body
    
    const token = uuidv4()
    const database = await client.db('cluster0')
    const collection = await database.collection('users')

    const user = await collection.findOne({ email })

    if(user && user) {
        sendEmail(user.email, user.token).then(async (res) => {
            response.json({
                email,
            })
        })
        .catch(err => {
            response.status(500).send('Internal server error')
        })
    } else {
        sendEmail(email, token).then(async res => {
            if(res.status === 200) {
                await collection.insertOne({
                    email: email,
                    token: token,
                    isConfirm: false
                })
                response.json({
                    email,
                })
            }
        })
        .catch(err => {
            response.status(500).send('Internal server error')
        })
    }
})

app.post('/api/verifyToken', async (req, res) => {
    const { token } = req.body

    const database = await client.db('cluster0')
    const collection = await database.collection('users')
    
    const user = await collection.findOne({ token: token })

    if(user) {
        await collection.updateOne({ token: token }, {
            $set: {
                isConfirm: true
            }
        })
    }


    res.send(user)
})

app.post('/api/createBill', async (req, res) => {
    const { title, price } = req.body

    console.log(title, price)

    const bill = createBill(price, title)
    const key = uuidv4()

    await axios({
        method: 'POST',
        url: 'https://api.yookassa.ru/v3/payments',
        headers: {
            'Content-Type': 'application/json',
            'Idempotence-Key': key
        },
        auth: {
            username: `${process.env.UKASSA_USERNAME}`,
            password: `${process.env.UKASSA_PASSWORD}`
        },
        data: JSON.stringify(bill)
    })
    .then(resp => {
        console.log(resp.data)
        res.send(resp.data)
    })
    .catch((err) => {
        console.log(err)
    })

})

app.post('/api/checkPayment', async (req, res) => {
    const { paymentToken, email, lesson } = req.body

    const database = await client.db('cluster0')
    const collection = await database.collection('payment')

    const result = await checkPaymentById(paymentToken)

    if(result.status === 'succeeded' || result.status === 'canceled') {
        await collection.insertOne({
            user: email,
            lesson: lesson,
            payment: result
        })
    }

    res.send(result)
})

app.post('/api/getPaidLessons', async (req, res) => {
    console.log(req.body)
    const { email } = req.body

    console.log(email)

    const payments = await Payment.find({ user: email, 'payment.paid': true }).exec()
    const lessons = payments.map((payment) => ({
        email: payment.user,
        lesson: payment.lesson
    }))

    const lessonsMap = new Map()

    lessons.forEach(((lesson) => {
        lessonsMap.set(lesson.lesson, lesson)
    }))
    const uniqLesson = Array.from(lessonsMap.values())

    res.send(uniqLesson)
})

app.post('/api/createCourseProgress', async (req, res) => {
    const { email, lessonTitle } = req.body

    const newTask = new TaskProgress({
        user: email,
        title: lessonTitle,
        tasks: []
    })

    const result = await newTask.save()
    res.send(result)
})

app.post('/api/addTaskToCourse', async (req, res) => {
    const { id, mark, isDone, email, lessonTitle } = req.body

    const newMark = new TaskMark({
        id,
        mark, 
        isDone
    })

    const courseProgress = await TaskProgress.findOne({ user: email, title: lessonTitle })

    const tasksArray = [...courseProgress.tasks, newMark]
    const result = await TaskProgress.update({ user: email, title: lessonTitle }, { tasks: tasksArray })


    res.send(result)
})

app.post('/api/getCourseProgress', async (req, res) => {
    const { email, lessonTitle } = req.body

    const course = await TaskProgress.find({ user: email, title: lessonTitle })

    res.send(course)
})

app.delete('/api/removeAllCourseTasks', async (req, res) => {
    const { email, lessonTitle } = req.body

    console.log(email)
    console.log(lessonTitle)

    const result = await TaskProgress.findOneAndUpdate({ user: email, title: lessonTitle }, { tasks: [] })
    console.log(result)

    res.send(result)
})



app.listen(PORT, () => {
    console.log(chalk.green(`Application listening at http://localhost:${PORT}..`))
})

async function checkPaymentById(paymentId: string): Promise<PaymentPesponse> {
    const result = await axios({
        method: 'GET',
        url: `https://api.yookassa.ru/v3/payments/${paymentId}`,
        auth: {
            username: `${process.env.UKASSA_USERNAME}`,
            password: `${process.env.UKASSA_PASSWORD}`
        }
    })

    const paymentObject = result.data as PaymentPesponse
    console.log(result.data)

    if(paymentObject.status === 'pending' || paymentObject.status === 'waiting_for_capture') {
        return checkPaymentById(paymentId)
    }

    return paymentObject
}



async function connectDatabase() {
    try {
        await client.connect(err => {
            chalk.green(`Database connected.`)
          });

        await client.db('cluster0').command({ ping: 1 })

        console.log(chalk.green('Connection successfully to server'))
    } catch(err) {

    }
    finally {
        await client.close()
    }
}

function sendEmail(email: string, token: string) {
    return axios.post('https://api.emailjs.com/api/v1.0/email/send', {
        service_id: process.env.SERVICE_ID,
        template_id: process.env.TEMPLATE_ID,
        user_id: process.env.EMAILJS_TOKEN,
        template_params: {
            'fromName': 'typography team',
            'toName': email,
            'generatedLink': `https://typography.training?token=${token}`,
        }
    })
}

function createBill(price: string, title: Cources, currency = 'RUB'): CreateBill {
    return {
        amount: {
            value: `${price}.00`,
            currency
        },
        confirmation: {
            type: "embedded"
        },
        capture: true,
        description: `Покупка "${title}"`
    } as CreateBill
}