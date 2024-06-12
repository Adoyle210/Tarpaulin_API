// models/enrollment.js
const { DataTypes } = require('sequelize');
const sequelize = require('../lib/sequelize');

const Enrollment = sequelize.define('Enrollment', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'User',
      key: 'id'
    }
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Course',
      key: 'id'
    }
  }
}, {
  tableName: 'enrollment',
  timestamps: false
});

module.exports = Enrollment;
