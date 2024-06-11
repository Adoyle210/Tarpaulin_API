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
} = require("../models/submission");
const { User, getUserById } = require("../models/user");
const { Course, getCourseById } = require("../models/course");

//adding auth
const { generateAuthToken, requireAuthentication } = require("../lib/auth");

const router = Router();

//PATCH //submissions/:id
// Performs a partial update on the data for the Submission.  This is the only way to assign a grade to a Submission.  Only an authenticated User with 'admin'
//role or an authenticated 'instructor' User whose ID matches the instructorId of the associated course can update a Submission.

//GET //media/submissions/:filename
//Download a Submission's associated file.  Only an authenticated User with 'admin' role or an
//authenticated 'instructor' User whose ID matches the instructorId of the associated course can update a Submission.

module.exports = router;
