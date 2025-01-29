-- Classroom Data
INSERT INTO classrooms (id, name, org_id, org_name, created_at, student_team_name)
VALUES
(1, 'Spring 2025', 182810684, 'NUSpecialProjects', NOW(), 'spring-2025-students-MOCK'),
(2, 'Fall 2025', 182810684, 'NUSpecialProjects', NOW(), 'fall-2025-students-MOCK');
SELECT setval('classrooms_id_seq', (SELECT MAX(id) FROM classrooms));

-- User Data
INSERT INTO users (id, first_name, last_name, github_username, github_user_id)
VALUES
(1, 'Kenny', 'Chen', 'kennybc', 54950614),
(2, 'Alex', 'Angione', 'alexangione419', 111721125),
(3, 'Nick', 'Tietje2', 'NickTietje', 183017928),
(4, 'Seby', 'Tremblay', 'sebytremblay', 91509344),
(5, 'Cam', 'Plume', 'CamPlume1', 116120547),
(6, 'Nick', 'Tietje', 'ntietje1', 124538220),
(7, 'Nandini', 'Ghosh', 'nandini-ghosh', 93226556),
(8, 'Mark', 'Fontenot', 'MarkFontenot', 1777629);
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Classroom Membership Data
INSERT INTO classroom_membership (user_id, classroom_id, classroom_role, created_at, status)
VALUES
(1, 1, 'PROFESSOR', NOW(), 'ACTIVE'),
(2, 1, 'PROFESSOR', NOW(), 'ACTIVE'),
(3, 1, 'TA', NOW(), 'ACTIVE'),
(4, 1, 'PROFESSOR', NOW(), 'ACTIVE'),
(5, 1, 'STUDENT', NOW(), 'ACTIVE'),
(6, 1, 'STUDENT', NOW(), 'ACTIVE'),
(7, 1, 'STUDENT', NOW(), 'ACTIVE'),
(8, 1, 'PROFESSOR', NOW(), 'ACTIVE'),
(1, 2, 'STUDENT', NOW(), 'ACTIVE'),
(2, 2, 'PROFESSOR', NOW(), 'ACTIVE'),
(3, 2, 'STUDENT', NOW(), 'ACTIVE'),
(4, 2, 'STUDENT', NOW(), 'ACTIVE'),
(5, 2, 'TA', NOW(), 'ACTIVE'),
(6, 2, 'TA', NOW(), 'ACTIVE'),
(7, 2, 'TA', NOW(), 'ACTIVE'),
(8, 2, 'PROFESSOR', NOW(), 'ACTIVE');

-- Rubric Data
INSERT INTO rubrics (id, name, org_id, classroom_id, reusable) VALUES 
(1, 'Generic Assignment Rubric', 1, 1, true);
SELECT setval('rubrics_id_seq', (SELECT MAX(id) FROM rubrics));

-- Rubric Item Data
INSERT INTO rubric_items (id, rubric_id, point_value, explanation, created_at)
VALUES
(1, 1, 1, 'The code works well', NOW()),
(2, 1, -1, 'The code is really bad', NOW()),
(3, 1, 0, 'You wrote code', NOW());
SELECT setval('rubric_items_id_seq', (SELECT MAX(id) FROM rubric_items));

-- Assignment Template Data
INSERT INTO assignment_templates (template_repo_owner, template_repo_id, created_at, template_repo_name)
VALUES
('NUSpecialProjects', 876747485, NOW(), 'testing-template');

-- Assignment Base Repo Data
INSERT INTO assignment_base_repos (base_repo_owner, base_repo_id, created_at, base_repo_name)
VALUES
('NUSpecialProjects', 898583618, NOW(), 'nuspecialprojects-spring-2025-spring2025mockassignment'),
('NUSpecialProjects', 898617287, NOW(), 'nuspecialprojects-fall-2025-fall2025mockassignment');


-- Assignment Outline Data
INSERT INTO assignment_outlines (id, template_id, base_repo_id, created_at, released_at, name, rubric_id, classroom_id, group_assignment)
VALUES
(1, 876747485, 898583618, NOW(), NULL, 'Spring2025MockAssignment', 1, 1, false),
(2, 876747485, 898617287, NOW(), NULL, 'Fall2025MockAssignment', NULL, 2, false);
SELECT setval('assignment_outlines_id_seq', (SELECT MAX(id) FROM assignment_outlines));

-- Student Works Data
INSERT INTO student_works (id, assignment_outline_id, repo_name, work_state, created_at)
VALUES
(1, 2, 'fall-2025-fall2025mockassignment-alexangione419', 'ACCEPTED', NOW()),
(2, 2, 'fall-2025-fall2025mockassignment-sebytremblay', 'ACCEPTED', NOW()),
(3, 1, 'spring-2025-spring2025mockassignment-ntietje1', 'ACCEPTED', NOW()),
(4, 1, 'spring-2025-spring2025mockassignment-camplume1', 'ACCEPTED', NOW()),
(5, 1, 'spring-2025-spring2025mockassignment-nandini-ghosh', 'ACCEPTED', NOW());
SELECT setval('student_works_id_seq', (SELECT MAX(id) FROM student_works));

-- Student Works Contributors Data
INSERT INTO work_contributors (user_id, student_work_id, created_at)
VALUES
(2, 1, NOW()),
(4, 2, NOW()),
(6, 3, NOW()),
(7, 5, NOW()),
(5, 4, NOW());
