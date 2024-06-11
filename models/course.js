const { DataTypes } = require("sequelize");
const { UserSchema } = require("./user");

const sequelize = require("../lib/sequelize");

const Course = sequelize.define("course", {
  courseID: { type: DataTypes.STRING, allowNull: false },
  subject: { type: DataTypes.STRING, allowNull: false },
  number: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  term: { type: DataTypes.STRING, allowNull: false },
  instructorId: { type: DataTypes.INTEGER, allowNull: false },
});

exports.Course = Course;
exports.CourseClientField = [
  "courseID",
  "subject",
  "number",
  "title",
  "term",
  "instructorId",
];

// Course.belongsToMany(UserSchema, { through: "Enrollment" });
// UserSchema.belongsToMany(Course, { through: "Enrollment" });

exports.insertNewCourse = async function (course) {
  const result = await Course.create(course, exports.CourseClientField);
  return result.id;
};

exports.getCourseById = async function (id) {
  const course = await Course.findByPk(id);
  return course;
};
