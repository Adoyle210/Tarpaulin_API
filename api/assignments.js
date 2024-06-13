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

//GET
router.get("/", async function (req, res) {
  let page = parseInt(req.query.page) || 1;
  page = page < 1 ? 1 : page;
  const numPerPage = 10;
  const offset = (page - 1) * numPerPage;

  const result = await Assignment.findAndCountAll({
    limit: numPerPage,
    offset: offset,
  });

  const lastPage = Math.ceil(result.count / numPerPage);
  const links = {};
  if (page < lastPage) {
    links.nextPage = `/assignments?page=${page + 1}`;
    links.lastPage = `/assignments?page=${lastPage}`;
  }
  if (page > 1) {
    links.prevPage = `/assignments?page=${page - 1}`;
    links.firstPage = "/assignments?page=1";
  }

  res.status(200).json({
    assignments: result.rows,
    pageNumber: page,
    totalPages: lastPage,
    pageSize: numPerPage,
    totalCount: result.count,
    links: links,
  });
});

//POST //assignments
//Create and store a new Assignment with specified data and adds it to the application's database.
//Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose ID matches the instructorId
//of the Course corresponding to the Assignment's courseId can create an Assignment.
router.post("/", requireAuthentication, async function (req, res, next) {
  try {
    const { courseId, title, points, due } = req.body;
    const userEmail = req.user;
    const dbUser = await User.findOne({ where: { email: userEmail }, attributes: ['id', 'email', 'password', 'role'] });

    let getUser = null; // Initialize getUser as null

    if (dbUser) {
      console.log('dbUser:', dbUser.dataValues);
      getUser = dbUser.dataValues; // Assign dbUser.dataValues to getUser
      console.log('getUser.id:', getUser.id);
      console.log('getUser.role:', getUser.role);
    } else {
      console.log('User not found');
    }

    // Check if req.user.id is defined
    if (!req.user || !getUser || !getUser.id) {
      return res.status(401).send({ error: 'Unauthorized no user or id' });
    }

    if (getUser.role === "instructor" || getUser.role === "admin") {
      // Check if the course exists
      const course = await Course.findOne({ where: { id: courseId }, attributes: ['instructorId'] });
      if (!course) {
        return res.status(404).send({ error: 'Course not found' });
      }
      console.log(getUser.id);
      console.log(course.instructorId);
      if (getUser.id === course.instructorId){
        const assignment = await Assignment.create(req.body, AssignmentClientFields);
        res.status(201).send({ id: assignment.id });
      }else {
        return res.status(401).send({ error: 'Unauthorized for teachers without matching id' });
      }

    } else {
      return res.status(401).send({ error: 'Unauthorized for students' });
    }
  } catch (e) {
    if (e instanceof ValidationError) {
      res.status(400).send({ error: e.message });
    } else {
      throw e;
    }
  }
});

//GET //assignments/:id/submissions?page=1&studentId=<integer>
// Returns the list of all Submissions for an Assignment.  This list should be paginated.
//Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose ID matches the instructorId of the Course
//corresponding to the Assignment's courseId can fetch the Submissions for an Assignment.
router.get(
  '/:id/submissions', 
  requireAuthentication, 
  async function (req, res, next) {
  const userEmail = req.user;
  const dbUser = await User.findOne({ where: { email: userEmail }, attributes: ['id', 'email', 'password', 'role'] });

  let getUser = null; // Initialize getUser as null

  if (dbUser) {
    console.log('dbUser:', dbUser.dataValues);
    getUser = dbUser.dataValues; // Assign dbUser.dataValues to getUser
    console.log('getUser.id:', getUser.id);
    console.log('getUser.role:', getUser.role);
  } else {
    console.log('User not found');
  }

  // Check if req.user.id is defined
  if (!req.user || !getUser || !getUser.id) {
    return res.status(401).send({ error: 'Unauthorized no user or id' });
  }

  if(getUser.role == "instructor" || getUser.role == "admin") {
      let page = parseInt(req.query.page) || 1
      page = page < 1 ? 1 : page
      const numPerPage = 10
      const offset = (page - 1) * numPerPage

      const result = await Submission.findAndCountAll({
          where: {assignmentId: req.params.id},
          limit: numPerPage,
          offset: offset
      })

      const lastPage = Math.ceil(result.count / numPerPage)
      const links = {}
      if (page < lastPage) {
          links.nextPage = `/businesses?page=${page + 1}`
          links.lastPage = `/businesses?page=${lastPage}`
      }
      if (page > 1) {
          links.prevPage = `/businesses?page=${page - 1}`
          links.firstPage = '/businesses?page=1'
      }

      res.status(200).json({
          submission: result.rows,
          pageNumber: page,
          totalPages: lastPage,
          pageSize: numPerPage,
          totalCount: result.count,
          links: links
      })
  } else {
      res.status(403).send({ error: "Only a user with the admin or instructor role can access this information" })
  }
})

    

//POST //assignments/:id/submissions
// Create and store a new Assignment with specified data and adds it to the application's database.
//Only an authenticated User with 'student' role who is enrolled in the Course corresponding to the Assignment's courseId can create a Submission.
router.post('/:id/submissions', requireAuthentication, async function (req,res,next){
  const getUser = await getUserById(req.user)
  const getAssignment = await(getAssignmentById(req.params.id))
  
  const result = await Course.findOne({
      where: { id: getAssignment.courseId},
      include: User
  })
  
  const enrolled = result.users
  enrolled.filter(enrolled => enrolled.user === getUser)

  let authenticated = false
  for(let i = 0; i < enrolled.length; i++){
      if(enrolled[i].dataValues.id === getUser.id){
          authenticated = true
      }
      
  }
  if(authenticated == false) {
      res.status(403).send({error: "Only an authenticated student who is enrolled in this course can post a submission"})
  } else {
      try {
          const submission = await Submission.create(req.body, SubmissionClientField)
          res.status(201).send({ id: submission.id })
      } catch (e) {
          if (e instanceof ValidationError) {
              res.status(400).send({ error: e.message })
          } else {
              throw e
          }
      }
  }
})

//GET //assignments/:id
// Returns summary data about the Assignment, excluding the list of Submissions.
router.get("/:id", requireAuthentication, async function (req, res, next) {
  const assignmentId = req.params.id;
  const assignment = await Assignment.findByPk(assignmentId, {});
  if (assignment) {
    res.status(200).send(assignment);
  } else {
    res.status(404).send({ error: "the assigment does not exits" }) 
  }
});

//PATCH //assignments/:id
// Performs a partial update on the data for the Assignment.  Note that submissions cannot be modified via this endpoint.
//Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose ID matches the instructorId of the
//Course corresponding to the Assignment's courseId can update an Assignment.
router.patch("/:id", requireAuthentication, async function (req, res, next) {
  const userEmail = req.user;
  const dbUser = await User.findOne({ where: { email: userEmail }, attributes: ['id', 'email', 'password', 'role'] });

  let getUser = null; // Initialize getUser as null

  if (dbUser) {
    console.log('dbUser:', dbUser.dataValues);
    getUser = dbUser.dataValues; // Assign dbUser.dataValues to getUser
    console.log('getUser.id:', getUser.id);
    console.log('getUser.role:', getUser.role);
  } else {
    console.log('User not found');
  }

  // Check if req.user.id is defined
  if (!req.user || !getUser || !getUser.id) {
    return res.status(401).send({ error: 'Unauthorized no user or id' });
  }
  if(getUser.role == "instructor" || getUser.role == "admin") {
    const assignmentId = req.params.id;
    const result = await Assignment.update(req.body, {
      where: { id: assignmentId },
      fields: AssignmentClientFields,
    });
    if (result[0] > 0) {
      res.status(204).send();
    } else {
      next();
    }
  }else {
    res.status(403).send({ error: "Only a user with the admin or instructor role can access thhis information" })
  }
});

//DELETE //assignments/:id
// Completely removes the data for the specified Assignment, including all submissions.  Only an authenticated User with 'admin' role or an authenticated 'instructor'
//User whose ID matches the instructorId of the Course corresponding to the Assignment's courseId can delete an Assignment.
router.delete("/:id", requireAuthentication, async function (req, res, next) {
  try {
    const userEmail = req.user;
    const dbUser = await User.findOne({ where: { email: userEmail }, attributes: ['id', 'email', 'password', 'role'] });

    let getUser = null; // Initialize getUser as null

    if (dbUser) {
      console.log('dbUser:', dbUser.dataValues);
      getUser = dbUser.dataValues; // Assign dbUser.dataValues to getUser
      console.log('getUser.id:', getUser.id);
      console.log('getUser.role:', getUser.role);
    } else {
      console.log('User not found');
    }

  // Check if req.user.id is defined
  if (!req.user || !getUser || !getUser.id) {
    return res.status(401).send({ error: 'Unauthorized no user or id' });
  }
  if(getUser.role == "instructor" || getUser.role == "admin") {
    const assignmentId = req.params.id;

    // Find the assignment by ID
    const assignment = await Assignment.findByPk(assignmentId);

    if (!assignment) {
      return res.status(404).send({ error: "Assignment not found" });
    }

    // Find the course associated with the assignment
    const course = await Course.findByPk(assignment.courseId);

    if (!course) {
      return res.status(404).send({ error: "Course not found" });
    }

    // Delete the assignment
    const result = await Assignment.destroy({ where: { id: assignmentId } });

    if (result > 0) {
      res.status(204).send();
    } else {
      next();
    }
  }else {
    res.status(403).send({ error: "Only a user with the admin or instructor role can access thhis information" })
  }
  } catch (e) {
    next(e);
  }
});


module.exports = router;
