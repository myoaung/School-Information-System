# Myanmar Basic Education Structure

This document defines the education levels, grades, and subjects for the Myanmar Basic Education Curriculum. It is intended to be used as the foundation for the Learning Management System (LMS).

---

# Education Levels

| Code | Name | Grades |
|------|------|--------|
| KG | Kindergarten | KG |
| PRI | Primary School | Grade 1 - Grade 5 |
| LS | Lower Secondary School | Grade 6 - Grade 9 |
| US | Upper Secondary School | Grade 10 - Grade 12 |

---

# Grades

| Grade Code | Grade Name | Education Level |
|------------|------------|-----------------|
| KG | Kindergarten | Kindergarten |
| G1 | Grade 1 | Primary School |
| G2 | Grade 2 | Primary School |
| G3 | Grade 3 | Primary School |
| G4 | Grade 4 | Primary School |
| G5 | Grade 5 | Primary School |
| G6 | Grade 6 | Lower Secondary School |
| G7 | Grade 7 | Lower Secondary School |
| G8 | Grade 8 | Lower Secondary School |
| G9 | Grade 9 | Lower Secondary School |
| G10 | Grade 10 | Upper Secondary School |
| G11 | Grade 11 | Upper Secondary School |
| G12 | Grade 12 | Upper Secondary School |

---

# Subject Master

| Code | Subject Name | Category |
|------|--------------|----------|
| MM | Myanmar | Language |
| ENG | English | Language |
| MATH | Mathematics | Mathematics |
| SCI | Science | Science |
| PHY | Physics | Science |
| CHEM | Chemistry | Science |
| BIO | Biology | Science |
| HIST | History | Social Science |
| GEO | Geography | Social Science |
| ECO | Economics | Social Science |
| SS | Social Studies | Social Science |
| MCE | Moral & Civic Education | General |
| PE | Physical Education | General |
| LS | Life Skills | General |
| ART | Art & Music | Arts |
| LC | Local Curriculum | Local |
| ENV | Environmental Studies | Kindergarten |
| CRA | Creative Arts | Kindergarten |
| MUSIC | Music | Kindergarten |
| PA | Physical Activities | Kindergarten |

---

# Curriculum by Grade

## Kindergarten (KG)

| Code | Subject |
|------|---------|
| MM | Myanmar |
| ENG | English |
| MATH | Mathematics Readiness |
| ENV | Environmental Studies |
| CRA | Creative Arts |
| MUSIC | Music |
| PA | Physical Activities |
| LS | Life Skills |

---

## Grade 1

| Code | Subject |
|------|---------|
| MM | Myanmar |
| ENG | English |
| MATH | Mathematics |
| SCI | Science |
| SS | Social Studies |
| MCE | Moral & Civic Education |
| PE | Physical Education |
| LS | Life Skills |
| ART | Art & Music |
| LC | Local Curriculum |

---

## Grade 2

Same subjects as Grade 1.

---

## Grade 3

Same subjects as Grade 1.

---

## Grade 4

Same subjects as Grade 1.

---

## Grade 5

Same subjects as Grade 1.

---

## Grade 6

| Code | Subject |
|------|---------|
| MM | Myanmar |
| ENG | English |
| MATH | Mathematics |
| SCI | Science |
| HIST | History |
| GEO | Geography |
| MCE | Moral & Civic Education |
| PE | Physical Education |
| LS | Life Skills |
| ART | Art & Music |
| LC | Local Curriculum |

---

## Grade 7

Same subjects as Grade 6.

---

## Grade 8

Same subjects as Grade 6.

---

## Grade 9

Same subjects as Grade 6.

---

## Grade 10

| Code | Subject |
|------|---------|
| MM | Myanmar |
| ENG | English |
| MATH | Mathematics |
| PHY | Physics |
| CHEM | Chemistry |
| BIO | Biology |
| HIST | History |
| GEO | Geography |
| ECO | Economics |
| MCE | Moral & Civic Education |
| PE | Physical Education |
| LC | Local Curriculum |

---

## Grade 11

Same subjects as Grade 10.

---

## Grade 12

Same subjects as Grade 10.

---

# Curriculum Summary

| Education Level | Grades | Subjects |
|-----------------|--------|----------|
| Kindergarten | KG | Myanmar, English, Mathematics Readiness, Environmental Studies, Creative Arts, Music, Physical Activities, Life Skills |
| Primary School | G1 - G5 | Myanmar, English, Mathematics, Science, Social Studies, Moral & Civic Education, Physical Education, Life Skills, Art & Music, Local Curriculum |
| Lower Secondary School | G6 - G9 | Myanmar, English, Mathematics, Science, History, Geography, Moral & Civic Education, Physical Education, Life Skills, Art & Music, Local Curriculum |
| Upper Secondary School | G10 - G12 | Myanmar, English, Mathematics, Physics, Chemistry, Biology, History, Geography, Economics, Moral & Civic Education, Physical Education, Local Curriculum |

---

# Recommended Database Structure

```text
EducationLevels
---------------
id
code
name

Grades
------
id
education_level_id
code
name
display_order

Subjects
--------
id
code
name
category
description

GradeSubjects
-------------
id
grade_id
subject_id
academic_year
weekly_periods
is_required

Teachers
--------
id
...

TeacherSubjects
---------------
teacher_id
subject_id
grade_id

Students
--------
id
...

StudentEnrollments
------------------
student_id
grade_id
section_id
academic_year
```

---

# Recommended Folder Structure

```
Curriculum
│
├── Kindergarten
│   ├── Myanmar
│   ├── English
│   ├── Mathematics Readiness
│   ├── Environmental Studies
│   ├── Creative Arts
│   ├── Music
│   ├── Physical Activities
│   └── Life Skills
│
├── Primary School
│   ├── Grade 1
│   ├── Grade 2
│   ├── Grade 3
│   ├── Grade 4
│   └── Grade 5
│
├── Lower Secondary School
│   ├── Grade 6
│   ├── Grade 7
│   ├── Grade 8
│   └── Grade 9
│
└── Upper Secondary School
    ├── Grade 10
    ├── Grade 11
    └── Grade 12
```

---

# Notes

- Subjects should **not** be hardcoded in the application.
- Use the `GradeSubjects` mapping table to associate subjects with grades.
- The **Local Curriculum (LC)** may differ by State or Region and should be configurable.
- Grade 11 and Grade 12 may support elective or stream-specific subjects in future curriculum revisions.
- The schema is designed to support government, private, and international schools with minimal changes.
