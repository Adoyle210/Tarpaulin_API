const { DataTypes } = require("sequelize");
const sequelize = require("../lib/sequelize");

const bcrypt = require("bcryptjs");
const { extractValidFields } = require("../lib/validation");

const UserSchema = sequelize.define("user", {
  userID: { type: DataTypes.INTEGER, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: true },
  role: { type: DataTypes.STRING, allowNull: false },
  courseId: { type: DataTypes.STRING, allowNull: true },
});

exports.UserSchema = UserSchema;
exports.UserClientFields = ["userID", "email", "password", "role", "courseId"];

exports.validateCredentials = async function (id, password) {
  //get user by id, including password in return
  const user = await UserSchema.findByPk(id, {});
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
  const user = await UserSchema.findAll({
    where: {
      email: userEmail,
    },
  });
  if (!includePassword) {
    user[0].password = 0;
  }
  return user[0];
};
