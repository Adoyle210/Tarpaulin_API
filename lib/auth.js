const jwt = require("jsonwebtoken");
const { getUserById, getUserByEmail } = require("../models/user");

const secretKey = "SuperSecret";

exports.generateAuthToken = function (email) {
  const payload = {
    sub: email,
  };
  return jwt.sign(payload, secretKey, { expiresIn: "24h" });
};

exports.requireAuthentication = function (req, res, next) {
  const authHeader = req.get("Authorization") || "";
  const authHeaderParts = authHeader.split(" ");
  const token = authHeaderParts[0] === "Bearer" ? authHeaderParts[1] : null;

  try {
    const payload = jwt.verify(token, secretKey);
    req.user = payload.sub;
    next();
  } catch (e) {
    res.status(401).send({
      error: "Valid authentication token required",
    });
  }
};

// -- used for user creation to check credentials of logged in user against the user role type being created
// to create admin or instructor logged in user must be admin
// students can create students ?
// admins can create students ?
// -- also checks if user level is valid name
// -- also checks if email address is unique
exports.postUserVerification = async function (req, res, next) {
  if (
    req.body.role === "student" ||
    req.body.role === "admin" ||
    req.body.role === "instructor"
  ) {
    userByEmail = await getUserByEmail(req.body.email, false);
    if (!userByEmail) {
      if (req.body.role === "student") {
        next();
      } else {
        const authHeader = req.get("Authorization") || "";
        const authHeaderParts = authHeader.split(" ");
        const token =
          authHeaderParts[0] == "Bearer" ? authHeaderParts[1] : null;
        try {
          const payload = jwt.verify(token, secretKey);
          //get user based on payload.sub.. if user.role is admin, continue
          user = await getUserByEmail(payload.sub, false);
          console.log(user);
          if (user.role === "admin") {
            next();
          } else {
            res.status(403).send({
              error:
                "Incorrect Permissions to Create Admin/Instructor Level User",
            });
          }
        } catch (e) {
          res.status(403).send({
            error: "Valid Authentication Token Required",
          });
        }
      }
    } else {
      res.status(400).send({
        error: "Email Already in Use",
      });
    }
  } else {
    res.status(400).send({
      error: "Invalid Role Name",
    });
  }
};
