const { DataTypes } = require('sequelize');
const sequelize = require('../lib/sequelize');

const Enrollment = sequelize.define('enrollment', {
  courseId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false }
});

exports.Enrollment = Enrollment;
