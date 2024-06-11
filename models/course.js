const { DataTypes } = require('sequelize')
const { UserSchema } = require("./user")

const sequelize = require('../lib/sequelize')
const { Enrollment } = require("./enrollment");

const Course = sequelize.define('course', {
  courseID:{ type: DataTypes.STRING, allowNull: false },
  subject:{type: DataTypes.STRING, allowNull: false },
  number: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  term: { type: DataTypes.STRING, allowNull: false },
  instructorId: { type: DataTypes.INTEGER, allowNull: false }
})

exports.Course = Course
exports.CourseClientField = [
  'courseID',
  'subject',
  'number',
  'title',
  'term',
  'instructorId',
]


exports.insertNewCourse = async function (course) {
  const result = await Course.create(course, exports.CourseClientField)
  return result.id
}

exports.getCourseById = async function (id) {
  const course = await Course.findByPk(id)
  return course
}

exports.getEnrolledStudents = async function (courseId) {
  const enrollments = await Enrollment.findAll({ where: { courseId } });
  return enrollments.map(enrollment => enrollment.userId);
}

exports.enrollStudents = async function (courseId, studentIds) {
  const enrollments = studentIds.map(studentId => ({ courseId, studentId }));
  await Enrollment.bulkCreate(enrollments, { ignoreDuplicates: true });
}

exports.unenrollStudents = async function (courseId, studentIds) {
  await Enrollment.destroy({
    where: {
      courseId,
      studentId: studentIds
    }
  })
}
