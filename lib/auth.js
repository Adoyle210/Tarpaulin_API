const jwt = require("jsonwebtoken");
const { getUserById, getUserByEmail } = require("../models/user");

const { Submission } = require("../models/submission");
const { getAssignmentById } = require("../models/assignment");
const { getCourseById } = require("../models/course");

const secretKey = "SuperSecret";

exports.generateAuthToken = function (email) {
  const payload = {
    sub: email,
  };
  return jwt.sign(payload, secretKey, { expiresIn: "24h" });
};

/*exports.requireAuthentication = function (req, res, next) {
  const authHeader = req.get("Authorization") || "";
  const authHeaderParts = authHeader.split(" ");
  const token = authHeaderParts[0] === "Bearer" ? authHeaderParts[1] : null;

  try {

    if (!token) throw new Error("No token provided");

    const payload = jwt.verify(token, secretKey);
    req.user = payload.sub;
    next();
  } catch (e) {
    res.status(401).send({
      error: "Valid authentication token required",
    });
  }
};*/

exports.requireAuthentication = async function (req, res, next) {
  const authHeader = req.get("Authorization") || "";
  const authHeaderParts = authHeader.split(" ");
  const token = authHeaderParts[0] === "Bearer" ? authHeaderParts[1] : null;

  try {
    if (!token) throw new Error("No token provided");

    const payload = jwt.verify(token, secretKey);
    console.log("Payload:", payload); // Log the payload
    req.userEmail = payload.sub; // Set req.userEmail to the email from the token payload
    next();
  } catch (e) {
    console.error("Authentication error:", e); // Log the error
    res.status(401).send({
      error: "Valid authentication token required",
    });
  }
};

exports.requireInstructorAuth = async function (req, res, next) {

  usr = await getUserByEmail(req.userEmail)

  console.log(usr)

    if(usr.role == 'admin'){
      console.log(usr)
      next();
    }
    else if(usr.role == "instructor"){

      fileurl = req.url

      file = fileurl.replace("/", "")

      console.log(file)
  
      const submission = await Submission.findOne({
        where: { file: file }
      });

      console.log(submission)

      if(submission){
        const assignment = await getAssignmentById(submission.assignmentID)
  
        const course = await getCourseById(assignment.courseId)

        if(usr.id == course.instructorId){
          next();
        }
        else{
          res.status(403).send({
            error:
              "Incorrect Permissions",
          })
        }
      }
      else{
        res.status(404).send({message: "Couldnt find submission"})
      }
    }
    else{
      res.status(403).send({
        error:
          "Incorrect Permissions",
      })
    }
  }


