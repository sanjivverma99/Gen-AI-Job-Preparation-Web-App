const multer = require("multer")


const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, callback) => {
        if (file.mimetype !== "application/pdf") {
            const error = new Error("Please upload a PDF resume.")
            error.status = 400
            return callback(error)
        }

        callback(null, true)
    }
})


module.exports = upload