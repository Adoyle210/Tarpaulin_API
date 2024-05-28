const { Router } = require('express')
const { ValidationError } = require('sequelize')

//adding models 
const { Assignment, AssignmentClientFields, getAssignmentById } = require('../models/assignment') //dont think you will need this 
const { Submission, SubmissionClientField, insertNewSubmission } = require('../models/submission') // or this 
const { UserSchema, getUserById } = require('../models/user')
const { Course, getCourseById } = require('../models/course') // or this 

//adding auth 
const { generateAuthToken, requireAuthentication } = require('../lib/auth')

const router = Router()

//POST //users
// Create and store a new application User with specified data and adds it to the application's database.  
// Only an authenticated User with 'admin' role can create users with the 'admin' or 'instructor' roles.

//POST //users/login
// Authenticate a specific User with their email address and password.

//GET //users/:id
// Returns information about the specified User.  If the User has the 'instructor' role, the response should include a list of the IDs of the 
//Courses the User teaches (i.e. Courses whose instructorId field matches the ID of this User).  If the User has the 'student' role, the response 
//should include a list of the IDs of the Courses the User is enrolled in.  Only an authenticated User whose ID matches the ID of the requested User 
//can fetch this information.



module.exports = router