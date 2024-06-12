const { Router } = require("express");
const { User } = require("../models/user");
const { Course } = require("../models/course");
const router = Router();

router.use("/users", require("./users"));
router.use("/assignments", require("./assignments"));
router.use("/courses", require("./courses"));
router.use("/submissions", require("./submissions"));

// Define the many-to-many relationship between User and Course
User.belongsToMany(Course, { through: "enrollment" });
Course.belongsToMany(User, { through: "enrollment" });

module.exports = router;
