const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: process.env.CLIENT_URL ? new URL(process.env.CLIENT_URL).origin : undefined,
    credentials: true
}))

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

app.use((err, req, res, next) => {
    console.error(err)

    if (res.headersSent) {
        return next(err)
    }

    if (err.name === "MulterError" && err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
            message: "The resume file must be 5MB or smaller."
        })
    }

    const status = err.status && err.status < 500 ? err.status : 500
    const message = status < 500
        ? err.message
        : err.publicMessage || "Failed to process the request. Please try again."

    res.status(status).json({ message })
})


module.exports = app