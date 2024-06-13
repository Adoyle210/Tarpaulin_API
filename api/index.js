const { Router } = require("express");
const { User, getUserByEmail } = require("../models/user");
const { Course } = require("../models/course");
const { getSubmissionById } = require("../models/submission");
const router = Router();
const express = require('express');

router.use("/users", require("./users"));
router.use("/assignments", require("./assignments"));
router.use("/courses", require("./courses"));
router.use("/submissions", require("./submissions"));

// Define the many-to-many relationship between User and Course
User.belongsToMany(Course, { through: "enrollment" });
Course.belongsToMany(User, { through: "enrollment" });

module.exports = router;

const { generateAuthToken, requireAuthentication } = require("../lib/auth");

//GET //media/submissions/:filename
//Download a Submission's associated file.  Only an authenticated User with 'admin' role or an
//authenticated 'instructor' User whose ID matches the instructorId of the associated course can update a Submission.

router.get("/media/submissions/:id", requireAuthentication, async function (req, res, next){

    const usr = await getUserByEmail(req.email)

    const sub = await getSubmissionById(submissionId);

    const assign = await getAssignmentById(sub.assignmentId);

    const course = await getCourseById(assign.courseId);

    if (usr && (usr.role === 'admin' || usr.id === course.instuctorId)) {
        
        try {
            if (sub) {
                //const filename = sub.filename.split(".")
    
                sub.url = `/media/photos/${submission.filename}`
                res.status(200).send(sub)
            }
            } catch (err) {
                next(err)
            }
        }


})

router.use("/media/submissions", express.static(`${__dirname}/submissions`))