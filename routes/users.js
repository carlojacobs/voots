// Dependencies
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose')
var expressValidator = require('express-validator')
var bcrypt = require('bcrypt')
router.use(expressValidator())

// Connect to mongodb using mongoose
// mongoose.connect('localhost:27017/voots')
mongoose.connect('mongodb://carlo:Dittoenbram1234@carlo-shard-00-00-nwaxe.mongodb.net:27017,carlo-shard-00-01-nwaxe.mongodb.net:27017,carlo-shard-00-02-nwaxe.mongodb.net:27017/test?ssl=true&replicaSet=carlo-shard-0&authSource=admin')

// Create mongoose userShema
var userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
})

//Pre save fro encrypting the password
userSchema.pre('save', function (next) {
    var user = this;
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err);
            }
            bcrypt.hash(user.password, salt, function (err, hash) {
                if (err) {
                    return next(err);
                }
                user.password = hash;
                next();
            });
        });
    } else {
        return next();
    }
});

// Compare pw function
userSchema.methods.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};


// Create mongoose model
var User = mongoose.model('user', userSchema)

// Route: send back all users
// router.get('/', function(req, res, next) {
//     User.find(function(err, users) {
//         if (err) {
//             console.log(err);
//         }
//
//         if (users) {
//             res.setHeader('Content-Type', 'application/json')
//             res.status(200).json(users)
//         }
//     })
// })

// Register a new user with email, name and password
router.post('/register', function(req, res, next) {
    // Req parameters
    var email = req.body.email
    var password = req.body.password
    var name = req.body.name

    // Validation
    req.checkBody('name', 'Name is required').notEmpty()
    req.checkBody('email', 'Email is required').notEmpty()
    req.checkBody('email', 'Email not valid').isEmail()
    req.checkBody('password', 'Password is required').notEmpty()
    req.checkBody('password', 'Password is too short, it must be 8 characters or longer!').isLength({ min: 8 })

    // Check validation result
    req.getValidationResult()
        .then(function(result) {
            if (result.isEmpty() == false) {
                // Throw validationresult error
                result.array().forEach((error) => {
                    res.status(400).send(error.msg)

                })
            } else {
                //Create new user
                var newUser = User({
                    name: name,
                    email: email,
                    password: password
                })

                //Save user into db
                newUser.save()
                res.status(200).send('Registered successfully')
                res.end()
            }
        })
})

// Login the user using email and password
router.post('/login', function(req, res, next) {
    // Req parameters
    var email = req.body.email
    var password = req.body.password

    // Validation
    req.checkBody('email', 'Email is required').notEmpty()
    req.checkBody('password', 'Password is required').notEmpty()

    // Check validation result
    req.getValidationResult()
        .then(function(result) {
            if (result.isEmpty() == false) {
                // Throw validationresult error
                result.array().forEach((error) => {
                    res.status(400).send(error.msg)
                    res.end()
                })
            } else {
                // Find a user with the corresponding email
                User.findOne({"email": email}, function(err, user) {
                    if (err) {
                        // Throw error
                        console.log(err);
                        res.end()
                    } else {
                        if (user) {
                            // Compare the encrypted pw to the input pw
                            user.comparePassword(password, function(err, isMatch) {
                                if (err) {
                                    // Throw error
                                    console.log(err);
                                    res.status(400).send(err)
                                    res.end()
                                }

                                if (isMatch) {
                                    // Send back userId
                                    console.log('Logged in');
                                    res.status(200).send(user.id)
                                    res.end()
                                } else {
                                    console.log('Wrong password');
                                    res.status(400).send('Wrong password')
                                    res.end()
                                }
                            })
                        } else {
                            console.log('Email not valid');
                            res.status(400).send("Email not valid")
                            res.end()
                        }
                    }
                })
            }
        })
})

// Delete account
router.post('/delete', function(req, res, next) {
    // Req parameters
    var id = req.body.id

    // Validation
    req.checkBody('id', 'Id is required').notEmpty()

    // Check validation result
    req.getValidationResult()
        .then(function(result) {
            if (result.isEmpty() == false) {
                // Throw validationresult error
                result.array().forEach((error) => {
                    res.status(400).send(error.msg)
                })
            } else {
                // Delete user with corresponding id
                User.findByIdAndRemove(id).exec()
                console.log('User removed');
                res.status(200).send('User removed')
                res.end()
            }
        })
})

module.exports = router;
