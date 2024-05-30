const { Router } = require("express");
const { ValidationError } = require("sequelize");
const bcrypt = require("bcryptjs");

//adding models
const {
  Assignment,
  AssignmentClientFields,
  getAssignmentById,
} = require("../models/assignment"); //dont think you will need this
const {
  Submission,
  SubmissionClientField,
  insertNewSubmission,
} = require("../models/submission"); // or this
const {
  UserSchema,
  getUserById,
  validateCredentials,
} = require("../models/user");
const { Course, getCourseById } = require("../models/course"); // or this

//adding auth
const {
  generateAuthToken,
  requireAuthentication,
  checkIfAdmin,
} = require("../lib/auth");

const router = Router();

//POST //users
// Create and store a new application User with specified data and adds it to the application's database.
// Only an authenticated User with 'admin' role can create users with the 'admin' or 'instructor' roles.
router.post("/", checkIfAdmin, async function (req, res, next) {
  try {
    // deal with password hashing here
    const hash = await bcrypt.hash(req.body.password, 8);
    console.log("the hash!::: ", hash);
    //
    const user = await UserSchema.create(
      { ...req.body, password: hash },
      UserClientFields
    );
    res.status(201).send({ id: user.id });
  } catch (e) {
    if (e instanceof ValidationError) {
      res.status(400).send({ error: e.message });
    } else {
      next(e);
    }
  }
});

//POST //users/login
// Authenticate a specific User with their email address and password.
router.post("/login", async function (req, res, next) {
  try {
    const auth = await validateCredentials(req.body.id, req.body.password);
    if (auth) {
      const token = generateAuthToken(req.body.id);
      res.status(200).send({
        token: token,
      });
    } else {
      res.status(401).send({
        error: "Invalid Authentication Credentials",
      });
    }
  } catch (e) {
    next(e);
  }
});

//GET //users/:id
// Returns information about the specified User.  If the User has the 'instructor' role, the response should include a list of the IDs of the
//Courses the User teaches (i.e. Courses whose instructorId field matches the ID of this User).  If the User has the 'student' role, the response
//should include a list of the IDs of the Courses the User is enrolled in.  Only an authenticated User whose ID matches the ID of the requested User
//can fetch this information.
router.get("/:userId", requireAuthentication, async function (req, res, next) {
  // get user based on userid, then check admin for authorization check
  const user = await getUserById(req.user);
  if (!user.admin) {
    if (req.user != req.params.userId) {
      res.status(403).send({
        error: "Not Authorized to Access",
      });
    }
  }
  const userId = req.params.userId;
  try {
    const user = await UserSchema.findByPk(userId, {
      // exclude field named password
      attributes: { exclude: ["password"] },
    });
    if (user) {
      res.status(200).send(user);
    } else {
      next();
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
