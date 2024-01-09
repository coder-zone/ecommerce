

let fieldValidation = async (req, res, next) => {

    if (!req.id) {
        res.send({ code: 400, err: "error" });
    }
    next()
}


module.exports = {
    fieldValidation: fieldValidation
}