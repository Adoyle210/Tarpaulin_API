const { DataTypes } = require("sequelize");
const sequelize = require("../lib/sequelize");

const bcrypt = require("bcryptjs");
const { extractValidFields } = require("../lib/validation");
const { Course } = require("./course");
const Enrollment = require("./enrollment");

const User = sequelize.define("user", {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "student",
    validate: {
      isIn: [["student", "admin", "instructor"]],
    },
  },
});

exports.User = User;
exports.UserClientFields = ["name", "email", "password", "role"];
UserClientFieldsWithoutPassword = ["id", "name", "email", "role"];

// const Enrollment = sequelize.define("enrollment", {});

// User.belongsToMany(Course, { through: Enrollment });
// Course.belongsToMany(User, { through: Enrollment });

exports.validateCredentials = async function (email, password) {
  // Find user by email
  const user = await User.findOne({ where: { email } });
  //decypt pass
  if (user) {
    return bcrypt.compare(password, user.password);
  } else {
    return false;
  }
};

exports.insertNewUser = async function (user) {
  user.password = await bcrypt.hash(user.password, 8);
  console.log("Hashed password:", user.password);
  const result = await User.create(user, exports.UserClientFields);
  return result.id;
};

exports.getUserById = async function (id, includePassword) {
  try {
    let attributes = UserClientFieldsWithoutPassword; // Default attributes to select
    if (includePassword) {
      attributes.push("password"); // Include password if required
    }

    const user = await User.findOne({
      where: {
        id: id,
      },
      attributes: attributes, // Specify attributes to retrieve
    });

    return user ? user.toJSON() : null; // Return user object or null
  } catch (error) {
    console.error("Error in getUserById:", error);
    throw error; // Throw error for handling in the calling function
  }
};

exports.getUserByEmail = async function (userEmail, includePassword) {
  try {
    let attributes = UserClientFieldsWithoutPassword; // Default attributes to select
    if (includePassword) {
      attributes.push("password"); // Include password if required
    }

    const user = await User.findOne({
      where: {
        email: userEmail,
      },
      attributes: attributes, // Specify attributes to retrieve
    });

    return user ? user.toJSON() : null; // Return user object or null
  } catch (error) {
    console.error("Error in getUserByEmail:", error);
    throw error; // Throw error for handling in the calling function
  }
};

// gets user record, different info depending on a users role
// used for get user by id endpoint
exports.getUserRecord = async function (user) {
  const response = {
    user: user,
    courses: null,
  };
  if (user.role === "student") {
    // include courses student is enrolled in
    const enrollment = await Enrollment.findAll({
      where: {
        userId: user.id,
      },
      attributes: ["courseId"],
    });
    response.courses = enrollment;
    return response;
  } else if (user.role === "instructor") {
    // courses where instructor id matches the user id of the user
    const courses = await Course.findAll({
      where: {
        instructorId: user.id,
      },
      attributes: ["id"],
    });
    response.courses = courses;
    return response;
  } else {
    // return admin user unchanged
    return user;
  }
};
