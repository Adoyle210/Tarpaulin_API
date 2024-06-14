# Tarpaulin API
Tarpaulin is a lightweight course management tool that’s an “alternative” to Canvas. In particular, Tarpaulin allows users (instructors and students) to see information about the courses they’re teaching/taking. It allows instructors to create assignments for their courses, and it allows students to submit solutions to those assignments.

## Actions and Endpoints
| Method | Path | Description |
| --- | --- | --- |
| POST | /users | Create a new User. |
| POST | /users/login | Log in a User. |
| GET | /users/{id} | Fetch data about a specific User. |
| GET | /courses | Fetch the list of all Courses. |
| POST | /courses | Create a new course. |
| GET | /courses/{id} | Fetch data about a specific Course. |
| PATCH | /courses/{id} | Update data for a specific Course. |
| DELETE | /courses/{id} | Remove a specific Course from the database. |
| GET | /courses/{id}/students | Fetch a list of the students enrolled in the Course. |
| POST | /courses/{id}/students | Update enrollment for a Course. |
| GET | /courses/{id}/roster | Fetch a CSV file containing list of the students enrolled in the Course. |
| GET | /courses/{id}/assignments | Fetch a list of the Assignments for the Course. |
| POST | /assignments | Create a new Assignment. |
| GET | /assignments/{id} | Fetch data about a specific Assignment. |
| PATCH | /assignments/{id}] | Update data for a specific Assignment. |
| DELETE | /assignments/{id} | Remove a specific Assignment from the database. |
| GET | /assignments/{id}/submission | Fetch the list of all Submissions for an Assignment. |
| POST | /assignments/{id}/submissions | Create a new Submission for an Assignment. |
| PATCH | /submissions/{id} | Update data for a submission. |
| GET | /media/submissions/{filename} | Get submission file. |
