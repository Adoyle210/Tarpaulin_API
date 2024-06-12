const { Router } = require("express");
const { ValidationError } = require("sequelize");

//adding models
const {
  Assignment,
  AssignmentClientFields,
  getAssignmentById,
} = require("../models/assignment");
const {
  Submission,
  SubmissionClientField,
  insertNewSubmission,
  getSubmissionById
} = require("../models/submission");
const { Course, getCourseById } = require("../models/course");

const { User, getUserById, getUserByEmail } = require("../models/user");

//adding auth
const { generateAuthToken, requireAuthentication } = require("../lib/auth");

const router = Router();

//PATCH //submissions/:id
// Performs a partial update on the data for the Submission.  This is the only way to assign a grade to a Submission.  Only an authenticated User with 'admin'
//role or an authenticated 'instructor' User whose ID matches the instructorId of the associated course can update a Submission.
router.patch("/:id", requireAuthentication, async function (req, res, next) {
  const submissionId = req.params.submissionId;

  const usr = await getUserByEmail(req.userEmail);
  console.log('User details from getUserByEmail:', usr); // Log the user details

  const sub = await getSubmissionById(submissionId);

  const assign = await getAssignmentById(sub.assignmentId);

  const course = await getCourseById(assign.courseId);

  if (usr && (usr.role === 'admin' || usr.id === course.instuctorId)) {

    const result = await Submission.update(req.body, {
      where: { id: submissionId },
      fields: SubmissionClientField,
    });

    if (result[0] > 0) {
      res.status(204).send();
    } else {
      next();
    }
  } else {
    console.log('User is not an admin or the instructor of the course associated with this submission!:', usr);
    res.status(403).send({ err: 'You do not have permissions to perform this action' });
  }
});

//GET //media/submissions/:filename
//Download a Submission's associated file.  Only an authenticated User with 'admin' role or an
//authenticated 'instructor' User whose ID matches the instructorId of the associated course can update a Submission.

module.exports = router;
