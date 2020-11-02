const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const mongoose = require("mongoose")
const dotenv = require('dotenv')
dotenv.config()

const storyRoutes = require('./routes/storyRouter')
const authRoutes = require('./routes/authRouter')
const userRoutes = require('./routes/userRouter')
const tagRoutes = require('./routes/tagRouter')
const partRoutes = require('./routes/partRouter')
const contactRoutes = require('./routes/contactRouter')
const gameModeRoutes = require('./routes/gameModeRouter')


const app = express()

mongoose
	.connect(process.env.DATABASE, { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false})
	.then(() => console.log("MongoDB Connected!"))
	.catch(err => {
		console.log(err)
	})


app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(cookieParser())


if (process.env.NODE_ENV === 'development') {
	app.use(cors({origin: `${process.env.CLIENT_URL}`}))
}
app.use(cors())


app.use('/api', storyRoutes)
app.use('/api', authRoutes)
app.use('/api', userRoutes)
app.use('/api', tagRoutes)
app.use('/api', partRoutes)
app.use('/api', contactRoutes)
app.use('/api', gameModeRoutes)


const port = process.env.PORT || 8000

app.listen(port, () => {
	console.log(`Server is running insanely well on port ${port}`)
})