import 'dotenv/config'
import connectDB from './db/index.js'
import app from './app.js'

const port = process.env.PORT || 8000

connectDB()
.then(()=>{
    app.listen(port, ()=>{
        console.log(`Server is running on ${port}`)
    })
})
.catch((error)=>{
    console.log(`MongoDB connection error!`,error)
})

/*
import mongoose from 'mongoose'
import { DB_NAME } from './constants.js'
import express from 'express'

const app = express()

;(async()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/`)
        app.on('Error',(error)=>{
            console.error('Error:',error)
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App is running on port ${process.env.PORT} and mongoDB connected`)
        })
    }
    catch(error){
        console.error("Error:",error)
        throw err
    }
})()
*/