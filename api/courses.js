const { Router } = require("express");
const { ValidationError } = require("sequelize");

//adding models
const { Assignment, AssignmentClientFields, getAssignmentById } = require("../models/assignment");
const { User, getUserById, getUserByEmail } = require("../models/user");
const { Course, getCourseById, insertNewCourse } = require("../models/course");
const { Enrollment } = require('../models/enrollment');
const sequelize = require('../lib/sequelize');
const { parse } = require('json2csv'); // Import json2csv

//adding auth
const { generateAuthToken, requireAuthentication } = require("../lib/auth");

const router = Router();

//GET
router.get("/:id", async function (req, res, next) {
  const courseid = req.params.id;
  try {
    const course = await getCourseById(courseid);
    if (course) {
      res.status(201).send(course);
    } else {
      res.status(404).send({ err: "course does not exist" });
    }
  } catch (e) {
    if (e instanceof ValidationError) {
      res.status(400).send({ error: e.errors });
    } else {
      throw e;
    }
  }
});

//POST //courses
//Creates a new Course with specified data and adds it to the application's database.
// Only an authenticated User with 'admin' role can create a new Course.
router.post('/', requireAuthentication, async function (req, res, next) {
  try {
    console.log('User email from req.userEmail:', req.userEmail); // Log the user email from req.userEmail

    const usr = await getUserByEmail(req.userEmail);
    console.log('User details from getUserByEmail:', usr); // Log the user details

    if (usr && usr.role === 'admin') {
      try {
        const courseid = await insertNewCourse(req.body);
        res.status(201).send({ id: courseid });
      } catch (e) {
        if (e instanceof ValidationError) {
          console.log(e);
          res.status(400).send({ error: 'Invalid request body supplied' });
        } else {
          throw e;
        }
      }
    } else {
      console.log('User does not have admin role:', usr);
      res.status(403).send({ err: 'You do not have permissions to perform this action' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

//GET //courses/:id/students
// Returns a list containing the User IDs of all students currently enrolled in the Course.  Only an authenticated User with 'admin' role or an authenticated
//'instructor' User whose ID matches the instructorId of the Course can fetch the list of enrolled students.
router.get('/:id/students', requireAuthentication, async function (req, res, next) {
  const courseId = req.params.id;

  try {
    const user = await sequelize.query(
      'SELECT id, role FROM users WHERE email = :email',
      { 
        replacements: { email: req.userEmail }, 
        type: sequelize.QueryTypes.SELECT 
      }
    );
    const currentUser = user[0]; // Get the first user from the result

    const course = await getCourseById(courseId);

    console.log('User details from getUserByEmail:', currentUser); // Log the user details

    if (currentUser && (currentUser.role === 'admin' || currentUser.id === course.instructorId)) {
      const course = await sequelize.query(
        'SELECT id FROM courses WHERE id = :id',
        { 
          replacements: { id: courseId }, 
          type: sequelize.QueryTypes.SELECT 
        }
      );
      
      if (course.length > 0) {
        const students = await sequelize.query(
          `SELECT users.id, users.name, users.email FROM users 
           INNER JOIN enrollment ON users.id = enrollment.userId 
           WHERE enrollment.courseId = :courseId AND users.role = 'student'`,
          { 
            replacements: { courseId: courseId }, 
            type: sequelize.QueryTypes.SELECT 
          }
        );

        res.status(200).send({ students });
      } else {
        res.status(404).send({ error: 'Course not found' });
      }
    } else {
      res.status(403).send({ error: 'Permission denied' });
    }
  } catch (e) {
    console.error('Error fetching students:', e);
    res.status(500).send({ error: 'Server error' });
  }
});

//POST //courses/:id/students
// Enrolls and/or unenrolls students from a Course.  Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose ID matches the
//instructorId of the Course can update the students enrolled in the Course.
router.post('/:id/students', requireAuthentication, async function (req, res, next) {
  const courseId = req.params.id;

  try {
    const user = await sequelize.query(
      'SELECT id, role FROM users WHERE email = :email',
      { 
        replacements: { email: req.userEmail }, 
        type: sequelize.QueryTypes.SELECT 
      }
    );
    const currentUser = user[0]; // Get the first user from the result

    const course = await getCourseById(courseId);

    console.log('User details from getUserByEmail:', currentUser); // Log the user details

    if (currentUser && (currentUser.role === 'admin' || currentUser.id === course.instructorId)) {
      const course = await sequelize.query(
        'SELECT id FROM courses WHERE id = :id',
        { 
          replacements: { id: courseId }, 
          type: sequelize.QueryTypes.SELECT 
        }
      );
      
      if (course.length > 0) {
        const { enroll, unenroll } = req.body.id;
        const currentTime = new Date();

        if (enroll) {
          for (const studentId of enroll) {
            const student = await sequelize.query(
              'SELECT id FROM users WHERE id = :id AND role = "student"',
              { 
                replacements: { id: studentId }, 
                type: sequelize.QueryTypes.SELECT 
              }
            );

            if (student.length > 0) {
              await sequelize.query(
                'INSERT INTO enrollment (userId, courseId, createdAt, updatedAt) VALUES (:userId, :courseId, :createdAt, :updatedAt)',
                { 
                  replacements: { userId: studentId, courseId: courseId, createdAt: currentTime, updatedAt: currentTime }, 
                  type: sequelize.QueryTypes.INSERT 
                }
              );
            }
          }
        }
        if (unenroll) {
          for (const studentId of unenroll) {
            await sequelize.query(
              'DELETE FROM enrollment WHERE userId = :userId AND courseId = :courseId',
              { 
                replacements: { userId: studentId, courseId: courseId }, 
                type: sequelize.QueryTypes.DELETE 
              }
            );
          }

          res.status(200).send({ message: "Enrollment updated successfully" });
        } else {
          res.status(403).send({ error: "Permission denied" });
        }
      } else {
        res.status(404).send({ error: 'Course not found' });
      }
    } else {
      res.status(403).send({ error: 'Permission denied' });
    }
  } catch (e) {
    console.error('Error enrolling students:', e);
    res.status(500).send({ error: 'Server error' });
  }
});


// GET //courses/:id/roster
// Returns a CSV file containing information about all of the students currently enrolled in the Course, including names, IDs, and email addresses.
// Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose ID matches the instructorId of the Course can fetch the course roster.
router.get('/:id/roster', requireAuthentication, async function (req, res, next) {
  const courseId = req.params.id;

  try {
    const user = await sequelize.query(
      'SELECT id, role FROM users WHERE email = :email',
      { 
        replacements: { email: req.userEmail }, 
        type: sequelize.QueryTypes.SELECT 
      }
    );
    const currentUser = user[0]; // Get the first user from the result

    console.log('User details from getUserByEmail:', currentUser); // Log the user details

    if (currentUser && (currentUser.role === 'admin' || currentUser.id === courseId)) {
      const course = await sequelize.query(
        'SELECT id FROM courses WHERE id = :id',
        { 
          replacements: { id: courseId }, 
          type: sequelize.QueryTypes.SELECT 
        }
      );
      
      if (course.length > 0) {
        const students = await sequelize.query(
          `SELECT users.id, users.name, users.email FROM users 
           INNER JOIN enrollment ON users.id = enrollment.userId 
           WHERE enrollment.courseId = :courseId AND users.role = 'student'`,
          { 
            replacements: { courseId: courseId }, 
            type: sequelize.QueryTypes.SELECT 
          }
        );

        const studentData = students.map((student) => ({
          id: student.id,
          name: student.name,
          email: student.email,
        }));

        const csv = parse(studentData); // Convert JSON to CSV

        res.header("Content-Type", "text/csv");
        res.attachment(`course_${courseId}_roster.csv`);
        res.status(200).send(csv);
      } else {
        res.status(404).send({ error: 'Course not found' });
      }
    } else {
      res.status(403).send({ error: 'Permission denied' });
    }
  } catch (e) {
    console.error('Error fetching roster:', e);
    res.status(500).send({ error: 'Server error' });
  }
});

// GET //courses/:id/assignments
// Returns a list containing the Assignment IDs of all Assignments for the Course.

router.get('/:id/assignments', requireAuthentication, async function (req, res, next) {
  const courseId = req.params.id;

  try {
    const course = await Course.findByPk(courseId);

    if (course) {
      const assignments = await Assignment.findAll({
        where: { courseId },
        attributes: ['id']
      });
      const assignmentIds = assignments.map(assignment => assignment.id);
      res.status(200).send({ assignmentIds });
    } else {
      res.status(404).send({ error: 'Course not found' });
    }
  } catch (e) {
    console.error('Error fetching assignments:', e);
    res.status(500).send({ error: 'Server error' });
  }
});

// GET //courses/:id
//Returns summary data about the Course, excluding the list of students enrolled in the course and the list of Assignments for the course.

router.get('/:id', requireAuthentication, async function (req, res, next) {
  const courseId = req.params.id;

  try {
    const course = await Course.findByPk(courseId, {
      attributes: ['id', 'subject', 'number', 'title', 'term', 'instructorId'] // Exclude students and assignments
    });

    if (course) {
      res.status(200).send(course);
    } else {
      res.status(404).send({ error: 'Course not found' });
    }
  } catch (e) {
    console.error('Error fetching course:', e);
    res.status(500).send({ error: 'Server error' });
  }
});

// PATCH //courses/:id
//Performs a partial update on the data for the Course.  Note that enrolled students and assignments cannot be modified via this endpoint.
//Only an authenticated User with 'admin' role or an authenticated 'instructor' User whose ID matches the instructorId of the Course can update Course information.

router.patch('/:id', requireAuthentication, async function (req, res, next) {
  const courseId = req.params.id;
  const updatedData = req.body;

  try {
    const course = await Course.findByPk(courseId);

    if (!course) {
      return res.status(404).send({ error: 'Course not found' });
    }

    const loggedInUser = await User.findOne({
      where: { email: req.userEmail },
      attributes: ['id', 'role']
    });

    if (!loggedInUser) {
      return res.status(401).send({ error: 'Authentication required' });
    }

    if (loggedInUser.role !== 'admin' && loggedInUser.id !== course.instructorId) {
      return res.status(403).send({ error: 'Permission denied' });
    }

    // Perform the partial update, excluding modifications to enrolled students and assignments
    const updatableFields = ['subject', 'number', 'title', 'term', 'instructorId'];
    const fieldsToUpdate = {};
    
    updatableFields.forEach(field => {
      if (updatedData.hasOwnProperty(field)) {
        fieldsToUpdate[field] = updatedData[field];
      }
    });

    await course.update(fieldsToUpdate);
    
    res.status(200).send({ message: 'Course updated successfully', course });
  } catch (e) {
    console.error('Error updating course:', e);
    res.status(500).send({ error: 'Server error' });
  }
});


//DELETE //courses/:id
//Completely removes the data for the specified Course, including all enrolled students, all Assignments, etc.
//Only an authenticated User with 'admin' role can remove a Course.

router.delete('/:id', requireAuthentication, async function (req, res, next) {
  const courseId = req.params.id;

  try {
    const loggedInUser = await User.findOne({
      where: { email: req.userEmail },
      attributes: ['id', 'role']
    });

    if (!loggedInUser) {
      return res.status(401).send({ error: 'Authentication required' });
    }

    if (loggedInUser.role !== 'admin') {
      return res.status(403).send({ error: 'Permission denied' });
    }

    const course = await Course.findByPk(courseId);

    if (!course) {
      return res.status(404).send({ error: 'Course not found' });
    }

    // Start a transaction
    const transaction = await sequelize.transaction();

    try {
      // Delete all assignments associated with the course
      console.log('Deleting assignments for course ID:', courseId);
      await sequelize.query(
        'DELETE FROM assignments WHERE courseId = :courseId',
        { replacements: { courseId: course.id }, transaction }
      );

      // If the enrollments table is named differently, change 'enrollments' to the correct table name
      console.log('Deleting enrollments for course ID:', courseId);
      await sequelize.query(
        'DELETE FROM enrollment WHERE courseId = :courseId',
        { replacements: { courseId: course.id }, transaction }
      );

      // Delete the course
      console.log('Deleting course ID:', courseId);
      await sequelize.query(
        'DELETE FROM courses WHERE id = :courseId',
        { replacements: { courseId: course.id }, transaction }
      );

      // Commit the transaction
      await transaction.commit();

      res.status(200).send({ message: 'Course deleted successfully' });
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      console.error('Error deleting course:', error);
      res.status(500).send({ error: 'Server error' });
    }
  } catch (e) {
    console.error('Error deleting course:', e);
    res.status(500).send({ error: 'Server error' });
  }
});



//GET //courses?page=1&subject=<string>&number=<string>&term=<string>
//Returns the list of all Courses.  This list should be paginated.
//The Courses returned should not contain the list of students in the Course or the list of Assignments for the Course.
router.get('/', requireAuthentication, async function (req, res, next) {
  const { page = 1, subject, number, term } = req.query;
  const limit = 10; // Number of courses per page
  const offset = (page - 1) * limit;

  try {
    const filters = {};
    if (subject) filters.subject = subject;
    if (number) filters.number = number;
    if (term) filters.term = term;

    const { count, rows: courses } = await Course.findAndCountAll({
      where: filters,
      attributes: ['id', 'subject', 'number', 'title', 'term', 'instructorId'], // Exclude students and assignments
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).send({
      courses,
      page: parseInt(page, 10),
      totalPages,
      totalCourses: count
    });
  } catch (e) {
    console.error('Error fetching courses:', e);
    res.status(500).send({ error: 'Server error' });
  }
});

module.exports = router;
