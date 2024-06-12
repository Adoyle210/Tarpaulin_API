const { DataTypes } = require('sequelize')

const sequelize = require('../lib/sequelize')


const Assignment = sequelize.define('assignment', {
  //assignmentID: { type: DataTypes.INTEGER, allowNull: false },
  courseId: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  points: { type: DataTypes.INTEGER, allowNull: false },
  due: { type: DataTypes.STRING, allowNull: false }
})

exports.Assignment = Assignment
exports.AssignmentClientFields = [
  //'assignmentID',
  'courseId',
  'title',
  'points',
  'due'
]

exports.getAssignmentById = async function (id) {
  const submissions = await Assignment.findByPk(id)
   return submissions
}