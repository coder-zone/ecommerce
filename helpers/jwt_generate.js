var jwt = require("jsonwebtoken");
require('dotenv').config();

exports.emaillinktoken = function (email) {
  try {
    let token = jwt.sign(
      { email: email },
      (SECRETE_KEY = process.env.JWT_KEY),
      { expiresIn: process.env.JWT_TIMEOUT }
    );
    console.log(token);
    return token;
  } catch (err) {
    console.log(err);
    return err;
  }
};

exports.tokenverify = function (token) {
  try {
    var decoded = jwt.verify(token, process.env.JWT_KEY);
    return decoded;
  } catch (err) {
    console.log(err);
    return err;
  }
};



exports.generateToken = function (user_id) {
  try {
    let token = jwt.sign(
      { user_id: user_id },
      (SECRETE_KEY = process.env.JWT_KEY),
      { expiresIn: process.env.JWT_TIMEOUT }
    );
    console.log(token);
    return token;
  } catch (err) {
    console.log(err);
    return err;
  }
};
exports.apiVerify = function (req, res, next) {
  var token;
  if ('token' in req.headers) {
    token = req.headers['token']

    if (!token) {
      // res.send({ STATUS: 401, MESSAGE: 'token failed' })
      res.sendStatus(401);
    }
    else {
      jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
        console.log(err)
        if (err) {
          // res.sendStatus(401);
          res.send({ status: 404, message: 'invalid token' })
        } else {
          next();
        }

      })
    }
  } else {
    res.send({ status: 400, message: "access token is required" })
  }
}


