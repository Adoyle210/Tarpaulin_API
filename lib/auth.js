const jwt = require("jsonwebtoken");

const secretKey = "SuperSecret";

exports.generateAuthToken = function (userId) {
  const payload = {
    sub: userId,
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

// if an admin permission is needed, use this to check if admin credentials are valid
// continues if good, returns error if not
exports.checkIfAdmin = async function (req, res, next) {
  if (req.body.admin == true) {
    const authHeader = req.get("Authorization") || "";
    const authHeaderParts = authHeader.split(" ");
    const token = authHeaderParts[0] == "Bearer" ? authHeaderParts[1] : null;
    try {
      const payload = jwt.verify(token, secretKey);
      //get user based on payload.sub.. if user.admin is true, continue
      user = await getUserById(payload.sub);
      if (user.admin) {
        next();
      } else {
        res.status(401).send({
          error: "Incorrect Permissions to Create Admin Level User",
        });
      }
    } catch (e) {
      res.status(401).send({
        error: "Valid Authentication Token Required",
      });
    }
  } else {
    next();
  }
};
