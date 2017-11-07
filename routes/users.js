// Dependencies
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const expressValidator = require('express-validator');
const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');

// Express validator middleware
router.use(expressValidator())

// Connect to mongodb using mongoose
mongoose.connect('mongodb://carlo:Dittoenbram1234@carlo-shard-00-00-nwaxe.mongodb.net:27017,carlo-shard-00-01-nwaxe.mongodb.net:27017,carlo-shard-00-02-nwaxe.mongodb.net:27017/test?ssl=true&replicaSet=carlo-shard-0&authSource=admin', {
  useMongoClient: true,
  /* other options */
});

// Create mongoose userShema
var userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

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
var User = mongoose.model('user', userSchema);

// Route: send back all users
// For testing purposes
router.get('/all', function(req, res) {
    User.find(function(err, users) {
        if (err) {
            console.log(err);
        }

        if (users) {
            res.setHeader('Content-Type', 'application/json')
            res.status(200).json(users);
        }
    });
});

/*

    Routes

*/

// Register a user
var register = function(req, res) {
    // Req parameters
    var email = req.body.email;
    var password = req.body.password;
    var name = req.body.name;

    // Validation
    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email not valid').isEmail();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password', 'Password is too short, it must be 8 characters or longer!').isLength({ min: 8 });

    var registerUser = function(result) {
        if (result.isEmpty() == false) {
            // Throw validationresult error
            result.array().forEach((error) => {
                res.status(400).send(error.msg);
            })
        } else {
            //Create new user
            var newUser = User({
                name: name,
                email: email,
                password: password
            });

            //Save user into db and send back the token
            newUser.save().then(function() {
                var token = signToken(newUser.id);
                res.status(200).json({ token: token, userId: newUser.id })
            });
        }
    }

    // Check validation result
    req.getValidationResult().then(registerUser);
}

// Log in a user
var login = function(req, res) {
    // Req parameters
    var email = req.body.email;
    var password = req.body.password;

    // Validation
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();

    var loginUser = function(result) {
        if (result.isEmpty() == false) {
            // Throw validationresult error
            result.array().forEach((error) => {
                res.status(400).send(error.msg);
                res.end();
            });
        } else {
            // Find a user with the corresponding email
            User.findOne({"email": email}, function(err, user) {
                if (err) {
                    // Throw error
                    console.log(err);
                    res.end();
                } else {
                    if (user) {
                        // Compare the encrypted pw to the input pw
                        user.comparePassword(password, function(err, isMatch) {
                            if (err) {
                                // Throw error
                                console.log(err);
                                res.status(400).send(err);
                                res.end();
                            }

                            if (isMatch) {
                                // Send back userId
                                console.log('Logged in');
                                var token = signToken(user.id)
                                res.status(200).json({ token: token, userId: user.id })
                                res.end();
                            } else {
                                console.log('Wrong password');
                                res.status(400).send('Wrong password');
                                res.end();
                            }
                        })
                    } else {
                        console.log('Email not valid');
                        res.status(400).send("Email not valid");
                        res.end();
                    }
                }
            });
        }
    }

    // Check validation result
    req.getValidationResult().then(loginUser);
}

// Get user with user id
var get = function(req, res) {
    // Req parameters
    var userId = req.params.userId;

    // Find a user with the corresponding email
    User.findOne({"_id": userId}, function(err, user) {
        if (err) {
            // Throw error
            console.log(err);
            res.end();
        } else {
            if (user) {
                res.status(200).json(user);
                res.end();
            } else {
                console.log('No user found');
                res.status(400).send("No user found");
                res.end();
            }
        }
    });
}

// Delete a user
//TODO: Require password for deletion of account
 var del = function(req, res) {
    // Req parameters
    var id = req.body.id;

    // Validation
    req.checkBody('id', 'Id is required').notEmpty();

    var deleteVoot = function(result) {
        if (result.isEmpty() == false) {
            // Throw validationresult error
            result.array().forEach((error) => {
                res.status(400).send(error.msg);
            });
        } else {
            // Delete user with corresponding id
            User.findOneAndRemove({_id: id}, function(err, user, result) {
                if (err) {
                    res.status(400).send(err);
                    res.end();
                }
                console.log('User removed');
                res.status(200).send('User removed');
                res.end();
            });
        }
    }

    // Check validation result
    req.getValidationResult().then(deleteVoot);
}

// Sign a JWT token with a userId
function signToken(userId) {
    return JWT.sign({
        iss: 'Voots',
        sub: userId,
        iat: new Date().getTime(), // Current time
        exp: new Date().setDate(new Date().getDate() + 1) // Current time + one day
    }, 'myawesomejwtsecret');

    return token;
}

// console.log(signToken('59e4a65eb1677b1e41e75ffd'))

// Register a new user with email, name and password
router.post('/register', register);
// Login the user using email and password
router.post('/login', login);
// Get user info with userId
router.get('/:userId', get);
// Delete account
router.delete('/delete', del);

// Don't forget this in the future!
module.exports = router;
