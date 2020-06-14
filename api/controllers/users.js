const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.create_user = (req, res, next) => {
    User.find({email: req.body.email})
        .exec()
        .then(user => {
            if(user.length >= 1){
                return res.status(409).json({
                    message: 'Email already in use'
                });
            } else {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if(err){
                        return res.status(500).json({
                            error: err
                        });
                    } else {
                        const user = new User({
                            _id: new mongoose.Types.ObjectId(),
                            email: req.body.email,
                            password: hash
                        });
                        user.save()
                            .then(result => {
                                res.status(201).json({
                                    message: 'User created'
                                });
                            })
                            .catch(err =>{
                                const error = new Error(err);
                                error.status = 500;
                                next(error);
                            });
                    }
                });
            }
        });
};

exports.login_create_token = (req, res, next) => {
    User.find({email: req.body.email})
        .exec()
        .then(users => {
            if(users.length<1){
                return res.status(401).json({
                    message: 'Auth failed'
                });
            }
            bcrypt.compare(req.body.password, users[0].password, (err, result) => {
                if (err){
                    return res.status(401).json({
                        message: 'Auth failed'
                    });
                }
                if(result) {
                    const token = jwt.sign(
                        {
                            email: users[0].email,
                            userId: users[0]._id
                        },
                        process.env.JWT_SECRET,
                        {
                            expiresIn: "1h"
                        },
                    );
                    return res.status(200).json({
                        message: 'Auth successful',
                        token: token
                    });
                }
                res.status(401).json({
                    message: 'Auth failed'
                });
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.status = 500;
            next(error);
        });
};

exports.delete_user = (req, res, next) =>{
    const id = req.params.userId;
    User.deleteOne({_id: id})
        .exec()
        .then(result => {
            res.status(200).json({
                message: "User deleted"
            });
        })
        .catch(err=>{
            const error = new Error(err);
            error.status = 500;
            next(error);
        });
};
