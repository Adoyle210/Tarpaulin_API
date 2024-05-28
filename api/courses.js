const { Router } = require('express')
const { ValidationError } = require('sequelize')

//adding models 
const { Assignment, AssignmentClientFields, getAssignmentById } = require('../models/assignment')
const { UserSchema, getUserById } = require('../models/user')
const { Course, getCourseById } = require('../models/course')

//adding auth 
const { generateAuthToken, requireAuthentication } = require('../lib/auth')

const router = Router()

//GET 
router.get('/:id', async function (req, res, next) {
    const courseid = req.params.courseid
    try {
      const course = await getCourseById(courseid)
      if (course) {
        res.status(201).send(course)
      } else {
        res.status(404).send({ err: "course does not exist" })
      }
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).send({ error: e.errors })
      } else {
        throw e
      }
    }
})

//POST //courses
//Creates a new Course with specified data and adds it to the application's database. 
// Only an authenticated User with 'admin' role can create a new Course.
router.post('/', requireAuthentication, async function (req, res, next) { 
    const usr = await getUserById(req.user)

    if (usr.role == "admin") {
        try {
        const courseid = await insertNewCourse(req.body)
        res.status(201).send({ id: courseid })
        } catch (e) {
        if (e instanceof ValidationError) {
            console.log(e);
            res.status(400).send({ error: "Invalid request body supplied" })
        } else {
            throw e
        }
        }
    } else {
        res.status(403).send({ err: "You do not have permissions to perform this action" })
    }

})

//GET //courses/:id/students
// Returns a list containing the User IDs of all students currently enrolled in the Course.  Only an authenticated User with 'admin' role or an authenticated 
//'instructor' User whose ID matches the instructorId of the Course can fetch the list of enrolled students.


//POST //courses/:id/students
// Enrolls and/or unenrolls students from a Course.  Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose ID matches the 
//instructorId of the Course can update the students enrolled in the Course.

// GET //courses/:id/roster
// Returns a CSV file containing information about all of the students currently enrolled in the Course, including names, IDs, and email addresses.  
// Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose ID matches the instructorId of the Course can fetch the course roster.

// GET //courses/:id/assignments
// Returns a list containing the Assignment IDs of all Assignments for the Course.

// GET //courses/:id
//Returns summary data about the Course, excluding the list of students enrolled in the course and the list of Assignments for the course.

// PATCH //courses/:id
//Performs a partial update on the data for the Course.  Note that enrolled students and assignments cannot be modified via this endpoint.  
//Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose ID matches the instructorId of the Course can update Course information.

//DELETE //courses/:id
//Completely removes the data for the specified Course, including all enrolled students, all Assignments, etc. 
//Only an authenticated User with 'admin' role can remove a Course.

//GET //courses?page=1&subject=<string>&number=<string>&term=<string>
//Returns the list of all Courses.  This list should be paginated.  
//The Courses returned should not contain the list of students in the Course or the list of Assignments for the Course.




module.exports = router