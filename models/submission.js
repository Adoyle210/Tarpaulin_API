const { DataTypes } = require('sequelize')

const sequelize = require('../lib/sequelize')

const Submission = sequelize.define('submission', {
  assignmentID: { type: DataTypes.INTEGER, allowNull: false },
  studentID: { type: DataTypes.INTEGER, allowNull: false },
  timestamp: { type: DataTypes.STRING, allowNull: false },
  grade: { type: DataTypes.FLOAT, allowNull: true },
  file: {type: DataTypes.STRING, allowNull: false}
})

exports.Submission = Submission
exports.SubmissionClientField = [
  'assignmentID',
  'studentID',
  'timestamp',
  'grade',
  'file'
]

exports.insertNewSubmission = async function (submission) {
  if(submission.grade){
    delete submission.grade                                             //this might be wrong but students shouldn't be able to put a grade
  }
  const result = await Submission.create(submission, exports.SubmissionClientField)
  return result.id
}

exports.getSubmissionById = async function (id) {
  const sub = await Submission.findByPk(id);
  return sub;
};