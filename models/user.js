const { DataTypes } = require("sequelize");
const sequelize = require("../lib/sequelize");

const bcrypt = require("bcryptjs");
const { extractValidFields } = require("../lib/validation");

const UserSchema = sequelize.define("user", {
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

exports.UserSchema = UserSchema;
exports.UserClientFields = ["name", "email", "password", "role"];
UserClientFieldsWithoutPassword = ["name", "email", "role"];

exports.validateCredentials = async function (email, password) {
  // Find user by email
  const user = await UserSchema.findOne({ where: { email } });
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
  const result = await UserSchema.create(user, exports.UserClientFields);
  return result.id;
};

exports.getUserById = async function (id, includePassword) {
  const user = await UserSchema.findByPk(id);
  if (!includePassword && user) {
    user.password = 0;
  }
  return user;
};

exports.getUserByEmail = async function (userEmail, includePassword) {
  try {
    let attributes = UserClientFieldsWithoutPassword; // Default attributes to select
    if (includePassword) {
      attributes.push("password"); // Include password if required
    }

    const user = await UserSchema.findOne({
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
