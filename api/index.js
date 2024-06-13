const { Router } = require("express");
const { User, getUserByEmail } = require("../models/user");
const { Course, getCourseById } = require("../models/course");
const { getSubmissionById } = require("../models/submission");
const { getAssignmentById } = require("../models/assignment");
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

const { generateAuthToken, requireAuthentication, requireInstructorAuth } = require("../lib/auth");

//GET //media/submissions/:filename
//Download a Submission's associated file.  Only an authenticated User with 'admin' role or an
//authenticated 'instructor' User whose ID matches the instructorId of the associated course can update a Submission.

// router.get("/media/submissions/:id", requireAuthentication, async function (req, res, next){

//     const usr = await getUserByEmail(req.userEmail)

//     const sub = await getSubmissionById(req.params.id);

//     const assign = await getAssignmentById(sub.assignmentID);

//     const course = await getCourseById(assign.courseId);

//     if (usr && (usr.role === 'admin' || usr.id === course.instructorId)) {
        
//         try {
//             //if (sub) {
//                 const filename = sub.file.split(".")
    
//                 url = `/media/submissions/${filename[0]}`
//                 res.status(200).send(url)
//             //}
//             } catch (err) {
//                 res.status(400).send(err)
//             }
//     }else{
//         res.status(401).send({error: 'Unauthorized'})
//     }


// })

router.use("/media/submissions", requireAuthentication, requireInstructorAuth, express.static(`${__dirname}/submissions`))