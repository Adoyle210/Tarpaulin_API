const { Router } = require('express')
const { ValidationError } = require('sequelize')

//adding models 
const { Assignment, AssignmentClientFields, getAssignmentById } = require('../models/assignment')
const { Submission, SubmissionClientField, insertNewSubmission } = require('../models/submission')
const { UserSchema, getUserById } = require('../models/user')
const { Course, getCourseById } = require('../models/course')

//adding auth 
const { generateAuthToken, requireAuthentication } = require('../lib/auth')

const router = Router()

//GET  
router.get('/', async function (req, res) {
    let page = parseInt(req.query.page) || 1
    page = page < 1 ? 1 : page
    const numPerPage = 10
    const offset = (page - 1) * numPerPage

    const result = await Assignment.findAndCountAll({
        limit: numPerPage,
        offset: offset
    })

    const lastPage = Math.ceil(result.count / numPerPage)
    const links = {}
    if (page < lastPage) {
        links.nextPage = `/assignments?page=${page + 1}`
        links.lastPage = `/assignments?page=${lastPage}`
    }
    if (page > 1) {
        links.prevPage = `/assignments?page=${page - 1}`
        links.firstPage = '/assignments?page=1'
    }

    res.status(200).json({
        assignments: result.rows,
        pageNumber: page,
        totalPages: lastPage,
        pageSize: numPerPage,
        totalCount: result.count,
        links: links
    })
})

//POST //assignments
//Create and store a new Assignment with specified data and adds it to the application's database.  
//Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose ID matches the instructorId 
//of the Course corresponding to the Assignment's courseId can create an Assignment.

router.post('/', requireAuthentication, async function (req, res, next) {
    try {
        const assignment = await Assignment.create(req.body, AssignmentClientFields)
        res.status(201).send({ id: assignment.id })
    } catch (e) {
        if (e instanceof ValidationError) {
        res.status(400).send({ error: e.message })
        } else {
        throw e
        }
    }
})

//GET //assignments/:id/submissions?page=1&studentId=<integer>
// Returns the list of all Submissions for an Assignment.  This list should be paginated.  
//Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose ID matches the instructorId of the Course 
//corresponding to the Assignment's courseId can fetch the Submissions for an Assignment.
router.get('/:id/submissons', requireAuthentication, async function (req, res, next) {
    
})


//POST //assignments/:id/submissions
// Create and store a new Assignment with specified data and adds it to the application's database.  
//Only an authenticated User with 'student' role who is enrolled in the Course corresponding to the Assignment's courseId can create a Submission.
router.post('/:id/submissions', requireAuthentication, async function (req,res,next){
    const getUser = await getUserById(req.user)
    const getAssignment = await(getAssignmentById(req.params.id))
    
    const result = await Course.findOne({
        where: { id: getAssignment.courseId},
        include: UserSchema 
    })


    // NEEDS TO BE COMPLETED 

})


//GET //assignments/:id
// Returns summary data about the Assignment, excluding the list of Submissions.
router.get('/:id', requireAuthentication, async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    const assignment = await Assignment.findByPk(assignmentId, {
        
    })
    if (assignment) {
      res.status(200).send(assignment)
    } else {
      next()
    }
})

//PATCH //assignments/:id
// Performs a partial update on the data for the Assignment.  Note that submissions cannot be modified via this endpoint. 
//Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose ID matches the instructorId of the 
//Course corresponding to the Assignment's courseId can update an Assignment.
router.patch('/:id', requireAuthentication, async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    const result = await Assignment.update(req.body, {
        where: { id: assignmentId },
        fields: AssignmentClientFields
    })
    if (result[0] > 0) {
        res.status(204).send()
    } else {
        next()
    }
})

//DELETE //assignments/:id
// Completely removes the data for the specified Assignment, including all submissions.  Only an authenticated User with 'admin' role or an authenticated 'instructor' 
//User whose ID matches the instructorId of the Course corresponding to the Assignment's courseId can delete an Assignment.
router.delete('/:id', requireAuthentication, async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    const result = await Assignment.destroy({ where: { id: assignmentId }})
    if (result > 0) {
        res.status(204).send()
    } else {
        next()
    }
})



module.exports = router