import courses from "./courseContent";

const database = {
  curriculum: [
    { code: "gh", name: "Ghanaian", isAvailable: true },
    { code: "ng", name: "Nigerian", isAvailable: false },
    { code: "uk", name: "British", isAvailable: false },
    { code: "us", name: "American", isAvailable: false },
    { code: "ke", name: "Kenyan", isAvailable: false },
  ],
  levels: [
    // { code: "gh-jhs1", curriculum: "gh", name: "JHS 1" },
    // { code: "gh-jhs2", curriculum: "gh", name: "JHS 2" },
    // { code: "gh-jhs3", curriculum: "gh", name: "JHS 3" },
    { code: "gh-jhs", curriculum: "gh", name: "JHS" },
    // { code: "gh-shs", curriculum: "gh", name: "SHS" },
  ],
  subject: [
    { code: "01JS03", curriculum: "gh", level: "gh-jhs", name: "JHS English" },
    { code: "01SS15", curriculum: "gh", level: "gh-shs", name: "SHS Elective Maths" },
    {
      code: "01UPS03",
      curriculum: "gh",
      level: "gh-jhs1",
      name: "JHS1 English"
    },
    // { code: "01JS13", curriculum: "gh", level: "gh-jhs", name: "JHS Agric Science" },
    { code: "03UPS09", curriculum: "gh", level: "gh-jhs3", name: "JHS3 RME" },
    // { code: "gh-jhs2-math", curriculum: "gh", level: "gh-jhs", name: "Mathematics" },
    { code: "01UPS08", curriculum: "gh", level: "gh-jhs1", name: "Mathematics" },
    { code: "gh-jhs1-sci", curriculum: "gh", level: "gh-jhs1", name: "Science" },
    { code: "gh-jhs2-eng", curriculum: "gh", level: "gh-jhs2", name: "English" },
    { code: "02UPS08", curriculum: "gh", level: "gh-jhs2", name: "Mathematics" },
    { code: "gh-jhs2-sci", curriculum: "gh", level: "gh-jhs2", name: "Science" },
    { code: "gh-jhs3-eng", curriculum: "gh", level: "gh-jhs3", name: "English" },
    { code: "gh-jhs3-math", curriculum: "gh", level: "gh-jhs3", name: "Mathematics" },
    { code: "gh-jhs3-sci", curriculum: "gh", level: "gh-jhs3", name: "Science" },
    { code: "gh-jhs3-rme", curriculum: "gh", level: "gh-jhs3", name: "RME" },
    { code: "23", curriculum: "gh", level: "gh-shs", name: "Mathematics" },
    {
      code: "01SS01",
      curriculum: "gh",
      level: "gh-shs",
      name: "Integrated Science"
    },
  ],
  // courseContent: courses,
};

export default database;
