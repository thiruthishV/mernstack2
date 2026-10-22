import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Book } from './models/Book.js';
import { User } from './models/User.js';
import { connectDB } from './config/db.js';

dotenv.config();

const rawData = `
1. 💻 Programming
Clean Code
Clean Architecture
Effective Java
Head First Java
Java: The Complete Reference
Core Java
Thinking in Java
Python Crash Course
Learning Python
Fluent Python
Python Cookbook
Automate the Boring Stuff with Python
C Programming Language
Let Us C
C Primer Plus
Programming in ANSI C
C++ Primer
Effective Modern C++
Programming: Principles and Practice
JavaScript: The Definitive Guide
Eloquent JavaScript
You Don't Know JS
JavaScript Patterns
Programming TypeScript
Programming Rust
The Go Programming Language
Kotlin in Action
Programming Kotlin
Grokking Algorithms
The Pragmatic Programmer

2. 🖥️ Computer Science
Computer Science Illuminated
Introduction to Computing
Computer Organization
Computer Architecture
Operating System Concepts
Modern Operating Systems
Software Engineering
Software Engineering: A Practitioner's Approach
Introduction to Algorithms
Algorithms
Data Structures and Algorithms
Computer Graphics
Compiler Design
Theory of Computation
Automata Theory
Discrete Mathematics
Distributed Systems
Cloud Computing
Parallel Computing
Information Systems
Computer Fundamentals
Digital Computer Fundamentals
Advanced Computer Architecture
Embedded Systems
System Design
Design Patterns
Computer Systems
Programming Language Concepts
Computational Thinking
Foundations of Computer Science

3. 📊 Data Science
Python for Data Analysis
Data Science from Scratch
Hands-On Data Science
Practical Statistics for Data Scientists
Data Science for Business
The Data Science Handbook
Doing Data Science
Data Smart
Naked Statistics
Storytelling with Data
Python Data Science Handbook
Data Analysis with Python
Essential Math for Data Science
Machine Learning for Data Science
R for Data Science
Introduction to Data Science
Applied Data Science
Data Mining
Mining of Massive Datasets
Big Data
Big Data Analytics
Fundamentals of Data Science
Data Visualization
Data Analytics Made Accessible
Advanced Data Analytics
Statistical Learning
Applied Predictive Modeling
Feature Engineering for Machine Learning
Building Machine Learning Powered Applications
Data Science Projects

4. 🤖 Artificial Intelligence
Artificial Intelligence: A Modern Approach
Deep Learning
Machine Learning
Machine Learning Yearning
Hands-On Machine Learning
Deep Learning with Python
Pattern Recognition and Machine Learning
Artificial Intelligence Basics
Artificial Intelligence for Beginners
AI Superpowers
Human Compatible
Life 3.0
The Hundred-Page Machine Learning Book
Machine Learning with Python
Practical Artificial Intelligence
Reinforcement Learning
Neural Networks and Deep Learning
Computer Vision
Natural Language Processing
Speech and Language Processing
AI Engineering
Generative Deep Learning
Generative AI
Deep Learning for Computer Vision
AI Algorithms
Robotics and Artificial Intelligence
Intelligent Systems
Knowledge Representation
Computational Intelligence
Foundations of Artificial Intelligence

5. 🌐 Web Development
HTML and CSS
HTML5 and CSS3
JavaScript: The Definitive Guide
Eloquent JavaScript
Learning React
React Up & Running
Fullstack React
Learning Node.js
Node.js Design Patterns
Express in Action
Full Stack Development
Modern Web Development
Web Development with Node and Express
Learning PHP
PHP and MySQL
Laravel Up & Running
Learning Vue.js
Vue.js in Action
Angular Development
Pro Angular
TypeScript Programming
Programming TypeScript
Responsive Web Design
Web Design with HTML and CSS
CSS Secrets
JavaScript Cookbook
Front-End Web Development
Back-End Web Development
Web Performance
Modern Web Design

6. 🗄️ Database
Database System Concepts
Fundamentals of Database Systems
Database Management Systems
SQL Cookbook
Learning SQL
SQL in 10 Minutes
SQL Queries for Mere Mortals
Practical SQL
SQL Pocket Guide
PostgreSQL Up & Running
MongoDB: The Definitive Guide
MongoDB in Action
Learning MongoDB
Redis in Action
Designing Data-Intensive Applications
NoSQL Distilled
Database Design
Database Internals
SQL Antipatterns
High Performance MySQL
MySQL Cookbook
MySQL Crash Course
Oracle Database Administration
Oracle SQL
Microsoft SQL Server
Database Security
Data Modeling
Advanced Database Systems
Distributed Databases
Big Data Database Systems

7. 🌐 Networking
Computer Networks
Computer Networking
Data Communications and Networking
Computer Networks and Internets
TCP/IP Illustrated
Networking Essentials
Network Security Essentials
CCNA Official Cert Guide
CCNA Routing and Switching
Cisco Networking
Internetworking with TCP/IP
Network Warrior
Network Programmability
Wireless Communications
Wireless Networking
Network Analysis
Network Management
Network Protocols
Internet Protocols
IPv6 Essentials
Ethernet Networks
Cloud Networking
Software Defined Networking
Computer Communication Networks
Data Communication
Advanced Computer Networks
Network Design
Network Troubleshooting
Practical Networking
Modern Networking

8. 🔐 Cyber Security
Cybersecurity Essentials
Network Security Essentials
Hacking: The Art of Exploitation
The Web Application Hacker's Handbook
Practical Malware Analysis
Metasploit
Penetration Testing
Black Hat Python
Gray Hat Python
Social Engineering
Security Engineering
Applied Cryptography
Cryptography and Network Security
Computer Security
Ethical Hacking
Web Security
Cloud Security
Cybersecurity for Beginners
Practical Cybersecurity
Incident Response
Digital Forensics
Network Forensics
Malware Analysis
Cyber Threat Intelligence
Information Security
Security+ Guide
Linux Security
Application Security
Data Security
Cybersecurity Operations

9. ⚡ Electronics
Digital Electronics
Electronic Devices
Microelectronic Circuits
Electronic Principles
Fundamentals of Microelectronics
Microelectronics
Digital Design
Digital Logic Design
Microprocessors and Microcontrollers
Embedded Systems
Basic Electronics
Electronic Communication Systems
Communication Systems
Signals and Systems
Control Systems
Analog Electronics
Power Electronics
Semiconductor Devices
Integrated Electronics
Modern Digital Electronics
VLSI Design
CMOS VLSI Design
FPGA Design
Electronic Instrumentation
Measurement Systems
Circuit Analysis
Network Analysis
Linear Integrated Circuits
Microwave Engineering
Antenna Theory

10. 📐 Mathematics
Engineering Mathematics
Higher Engineering Mathematics
Discrete Mathematics
Linear Algebra
Calculus
Differential Equations
Probability and Statistics
Numerical Methods
Real Analysis
Complex Analysis
Abstract Algebra
Number Theory
Graph Theory
Mathematical Statistics
Operations Research
Optimization Techniques
Mathematical Modeling
Advanced Engineering Mathematics
Vector Calculus
Fourier Analysis
Laplace Transforms
Differential Geometry
Linear Programming
Statistics for Engineers
Probability Theory
Combinatorics
Set Theory
Applied Mathematics
Computational Mathematics
Foundations of Mathematics

11. 🎯 Quantitative Aptitude & Competitive Exams
Quantitative Aptitude for Competitive Examinations — R.S. Aggarwal
A Modern Approach to Verbal & Non-Verbal Reasoning — R.S. Aggarwal
Fast Track Objective Arithmetic — Rajesh Verma
Quantitative Aptitude — Arun Sharma
How to Prepare for Quantitative Aptitude for CAT — Arun Sharma
Quantitative Aptitude for CAT — Nishit K. Sinha
Quantitative Aptitude for Competitive Exams — Disha Experts
Objective Arithmetic — R.S. Aggarwal
Magical Book on Quicker Maths — M. Tyra
Quicker Maths — M. Tyra
Practice Book on Quicker Maths — M. Tyra
Quantitative Aptitude for All Competitive Examinations — Abhijit Guha
Quantitative Aptitude for Competitive Examinations — R. Gupta
Mathematics for Competitive Examinations — K.K. Sharma
Verbal Ability and Reading Comprehension — Arun Sharma
Word Power Made Easy — Norman Lewis
Objective General English — S.O. Bakshi
High School English Grammar and Composition — Wren & Martin
Analytical Reasoning — M.K. Pandey
A New Approach to Reasoning — B.S. Sijwali
Logical Reasoning and Data Interpretation — Arun Sharma
How to Prepare for Logical Reasoning — Arun Sharma
Data Interpretation for CAT — Arun Sharma
Data Interpretation and Logical Reasoning — Nishit K. Sinha
Test of Reasoning — Edgar Thorpe
General Intelligence and Reasoning — R.S. Aggarwal
Campus Recruitment Training — Rajesh Verma
Placement Preparation — CareerRide
Quantitative Aptitude and Reasoning — Disha Experts

12. 📖 Fiction
The Alchemist
The Great Gatsby
1984
Animal Farm
The Hobbit
The Kite Runner
Pride and Prejudice
The Book Thief
Life of Pi
The Catcher in the Rye

13. 📕 Non-Fiction
Sapiens
Homo Deus
Factfulness
Outliers
Blink
The Tipping Point
Freakonomics
Thinking, Fast and Slow
The Power of Now
Man's Search for Meaning

14. 🎓 Education & Academic
The Art of Learning
How to Study
Study Skills
Learning How to Learn
The Cambridge Guide to Learning English
Academic Success
Effective Study Skills
Study Smarter
The Learning Habit
College Success

15. 🔬 Science
A Brief History of Time
Cosmos
The Selfish Gene
The Origin of Species
Silent Spring
The Elegant Universe
The Gene
Astrophysics for People in a Hurry
The Fabric of the Cosmos
The Immortal Life of Henrietta Lacks

16. ⚙️ Engineering
Engineering Mechanics
Engineering Mathematics
Engineering Drawing
Basic Electrical Engineering
Engineering Physics
Engineering Chemistry
Fluid Mechanics
Thermodynamics
Strength of Materials
Engineering Materials

17. 🏛️ History & Geography
India's Ancient Past
India's Struggle for Independence
A History of Modern India
India After Gandhi
Discovery of India
World History
Geography of India
Physical Geography
Oxford School Atlas
Prisoners of Geography

18. 📰 Current Affairs & General Knowledge
Manorama Yearbook
Lucent's General Knowledge
General Knowledge Manual
India Year Book
General Knowledge 2025
Current Affairs Yearbook
Objective General Knowledge
General Studies Manual
Encyclopedia of General Knowledge
World General Knowledge

19. 💼 Business & Management
Rich Dad Poor Dad
The Lean Startup
The Intelligent Investor
Good to Great
Zero to One
Think and Grow Rich
The 7 Habits of Highly Effective People
Start With Why
Blue Ocean Strategy
The Hard Thing About Hard Things

20. 🧠 Self-Development
Atomic Habits
The Power of Habit
Think and Grow Rich
How to Win Friends and Influence People
The 7 Habits of Highly Effective People
Deep Work
Essentialism
The Power of Now
Make Your Bed
Can't Hurt Me

21. 👤 Biography & Autobiography
Wings of Fire
Steve Jobs
Long Walk to Freedom
The Diary of a Young Girl
Becoming
My Experiments with Truth
Playing It My Way
Open
Einstein: His Life and Universe
Leonardo da Vinci

22. 🧒 Children's Books
The Very Hungry Caterpillar
Charlotte's Web
Matilda
Charlie and the Chocolate Factory
The Jungle Book
The Little Prince
Alice's Adventures in Wonderland
Peter Pan
The Secret Garden
Winnie-the-Pooh

23. 🗣️ Languages & Literature
Pride and Prejudice
Great Expectations
Hamlet
Macbeth
Romeo and Juliet
The Merchant of Venice
Silas Marner
Oliver Twist
The Odyssey
The Iliad

24. 🏥 Health & Medical
Gray's Anatomy
Guyton and Hall Textbook of Medical Physiology
Robbins Basic Pathology
Medical Microbiology
Human Anatomy
Essentials of Human Physiology
Clinical Medicine
Nutrition and Dietetics
First Aid Manual
Health and Wellness

25. ⚖️ Law & Politics
Indian Constitution
Introduction to the Constitution of India
Indian Penal Code
Indian Contract Act
Administrative Law
Constitutional Law
Law of Torts
Family Law
Environmental Law
Human Rights Law

26. 🌱 Agriculture & Environment
Principles of Agronomy
Fundamentals of Agriculture
Soil Science
Agricultural Economics
Plant Pathology
Environmental Science
Ecology
Sustainable Agriculture
Organic Farming
Introduction to Environmental Engineering

27. 🎨 Arts & Hobbies
The Art Book
Drawing for the Absolute Beginner
The Complete Book of Drawing
Digital Photography
Understanding Exposure
The Art of Cooking
The Joy of Cooking
The Complete Book of Origami
The Complete Guide to Painting
The Art of Calligraphy

28. 📚 Competitive Exams
Quantitative Aptitude
Verbal and Non-Verbal Reasoning
Objective General English
General Knowledge
General Studies Manual
Banking Awareness
SSC Mathematics
SSC English
UPSC Civil Services General Studies
CAT Preparation Guide

29. 🏠 Lifestyle & Hobbies
The Complete Book of Home Gardening
The Joy of Cooking
The Complete Guide to Photography
The Art of Simple Living
The Gardening Book
The Complete Book of Baking
The Home Repair Handbook
The Beginner's Guide to Photography
The Complete Guide to Yoga
The Creative Hobby Book
`;

// Helper map for category cover images
const categoryCovers = {
  Programming: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600',
  'Computer Science': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600',
  'Data Science': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
  'Artificial Intelligence': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600',
  'Web Development': 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=600',
  Database: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=600',
  Networking: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=600',
  'Cyber Security': 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=600',
  Electronics: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600',
  Mathematics: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=600',
  'Competitive Exams': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600',
  Fiction: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
  'Non-Fiction': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600',
  'Education & Academic': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600',
  Science: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600',
  Engineering: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&q=80&w=600',
  'History & Geography': 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=600',
  'Current Affairs & GK': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=600',
  'Business & Management': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600',
  'Self-Development': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600',
  Biography: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=600',
  "Children's Books": 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
  'Languages & Literature': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600',
  'Health & Medical': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=600',
  'Law & Politics': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600',
  'Agriculture & Environment': 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&q=80&w=600',
  'Arts & Hobbies': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=600',
  'Lifestyle & Hobbies': 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600',
};

// Known famous authors for common titles
const famousAuthors = {
  'Clean Code': 'Robert C. Martin',
  'Clean Architecture': 'Robert C. Martin',
  'Effective Java': 'Joshua Bloch',
  'Head First Java': 'Kathy Sierra & Bert Bates',
  'Java: The Complete Reference': 'Herbert Schildt',
  'Core Java': 'Cay S. Horstmann',
  'Thinking in Java': 'Bruce Eckel',
  'Python Crash Course': 'Eric Matthes',
  'Learning Python': 'Mark Lutz',
  'Fluent Python': 'Luciano Ramalho',
  'Python Cookbook': 'David Beazley & Brian K. Jones',
  'Automate the Boring Stuff with Python': 'Al Sweigart',
  'C Programming Language': 'Brian W. Kernighan & Dennis M. Ritchie',
  'Let Us C': 'Yashavant Kanetkar',
  'C Primer Plus': 'Stephen Prata',
  'Programming in ANSI C': 'E. Balagurusamy',
  'C++ Primer': 'Stanley B. Lippman',
  'Effective Modern C++': 'Scott Meyers',
  'Programming: Principles and Practice': 'Bjarne Stroustrup',
  'JavaScript: The Definitive Guide': 'David Flanagan',
  'Eloquent JavaScript': 'Marijn Haverbeke',
  "You Don't Know JS": 'Kyle Simpson',
  'JavaScript Patterns': 'Stoyan Stefanov',
  'Programming TypeScript': 'Boris Cherny',
  'Programming Rust': 'Jim Blandy & Jason Orendorff',
  'The Go Programming Language': 'Alan A. A. Donovan & Brian W. Kernighan',
  'Kotlin in Action': 'Dmitry Jemerov & Svetlana Isakova',
  'Programming Kotlin': 'Venkat Subramaniam',
  'Grokking Algorithms': 'Aditya Bhargava',
  'The Pragmatic Programmer': 'David Thomas & Andrew Hunt',
  'Operating System Concepts': 'Abraham Silberschatz, Peter B. Galvin',
  'Modern Operating Systems': 'Andrew S. Tanenbaum',
  'Introduction to Algorithms': 'Thomas H. Cormen, Charles E. Leiserson',
  'Computer Networks': 'Andrew S. Tanenbaum',
  'Computer Networking': 'James F. Kurose & Keith W. Ross',
  'Database System Concepts': 'Abraham Silberschatz & Henry F. Korth',
  'Designing Data-Intensive Applications': 'Martin Kleppmann',
  'Artificial Intelligence: A Modern Approach': 'Stuart Russell & Peter Norvig',
  'Deep Learning': 'Ian Goodfellow, Yoshua Bengio & Aaron Courville',
  'Hands-On Machine Learning': 'Aurélien Géron',
  'Python for Data Analysis': 'Wes McKinney',
  'Sapiens': 'Yuval Noah Harari',
  'Homo Deus': 'Yuval Noah Harari',
  'The Alchemist': 'Paulo Coelho',
  'The Great Gatsby': 'F. Scott Fitzgerald',
  '1984': 'George Orwell',
  'Animal Farm': 'George Orwell',
  'The Hobbit': 'J.R.R. Tolkien',
  'The Kite Runner': 'Khaled Hosseini',
  'Pride and Prejudice': 'Jane Austen',
  'The Book Thief': 'Markus Zusak',
  'Life of Pi': 'Yann Martel',
  'The Catcher in the Rye': 'J.D. Salinger',
  'Rich Dad Poor Dad': 'Robert T. Kiyosaki',
  'The Lean Startup': 'Eric Ries',
  'The Intelligent Investor': 'Benjamin Graham',
  'Good to Great': 'Jim Collins',
  'Zero to One': 'Peter Thiel',
  'Think and Grow Rich': 'Napoleon Hill',
  'The 7 Habits of Highly Effective People': 'Stephen R. Covey',
  'Atomic Habits': 'James Clear',
  'The Power of Habit': 'Charles Duhigg',
  'Deep Work': 'Cal Newport',
  'Thinking, Fast and Slow': 'Daniel Kahneman',
  'Wings of Fire': 'A.P.J. Abdul Kalam',
  'Steve Jobs': 'Walter Isaacson',
  'Long Walk to Freedom': 'Nelson Mandela',
  'The Diary of a Young Girl': 'Anne Frank',
  'My Experiments with Truth': 'Mahatma Gandhi',
  'A Brief History of Time': 'Stephen Hawking',
  'Cosmos': 'Carl Sagan',
  'The Selfish Gene': 'Richard Dawkins',
  'The Origin of Species': 'Charles Darwin',
  "Gray's Anatomy": 'Henry Gray',
};

const parseBookList = () => {
  const lines = rawData.split('\n');
  let currentCategory = 'General';
  const books = [];
  const seenTitles = new Set();
  let bookCounter = 1000;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Check if line is a category header (e.g. "1. 💻 Programming")
    const categoryMatch = line.match(/^\d+\.\s*[\p{Emoji}\s]*(.+)$/u);
    if (categoryMatch) {
      let rawCat = categoryMatch[1].trim();
      // Normalize category names
      if (rawCat.includes('Programming')) currentCategory = 'Programming';
      else if (rawCat.includes('Computer Science')) currentCategory = 'Computer Science';
      else if (rawCat.includes('Data Science')) currentCategory = 'Data Science';
      else if (rawCat.includes('Artificial Intelligence')) currentCategory = 'Artificial Intelligence';
      else if (rawCat.includes('Web Development')) currentCategory = 'Web Development';
      else if (rawCat.includes('Database')) currentCategory = 'Database';
      else if (rawCat.includes('Networking')) currentCategory = 'Networking';
      else if (rawCat.includes('Cyber Security')) currentCategory = 'Cyber Security';
      else if (rawCat.includes('Electronics')) currentCategory = 'Electronics';
      else if (rawCat.includes('Mathematics')) currentCategory = 'Mathematics';
      else if (rawCat.includes('Competitive')) currentCategory = 'Competitive Exams';
      else if (rawCat.includes('Fiction')) currentCategory = 'Fiction';
      else if (rawCat.includes('Non-Fiction')) currentCategory = 'Non-Fiction';
      else if (rawCat.includes('Education')) currentCategory = 'Education & Academic';
      else if (rawCat.includes('Science')) currentCategory = 'Science';
      else if (rawCat.includes('Engineering')) currentCategory = 'Engineering';
      else if (rawCat.includes('History')) currentCategory = 'History & Geography';
      else if (rawCat.includes('Current Affairs')) currentCategory = 'Current Affairs & GK';
      else if (rawCat.includes('Business')) currentCategory = 'Business & Management';
      else if (rawCat.includes('Self-Development')) currentCategory = 'Self-Development';
      else if (rawCat.includes('Biography')) currentCategory = 'Biography';
      else if (rawCat.includes("Children")) currentCategory = "Children's Books";
      else if (rawCat.includes('Languages') || rawCat.includes('Literature')) currentCategory = 'Languages & Literature';
      else if (rawCat.includes('Health') || rawCat.includes('Medical')) currentCategory = 'Health & Medical';
      else if (rawCat.includes('Law') || rawCat.includes('Politics')) currentCategory = 'Law & Politics';
      else if (rawCat.includes('Agriculture') || rawCat.includes('Environment')) currentCategory = 'Agriculture & Environment';
      else if (rawCat.includes('Arts')) currentCategory = 'Arts & Hobbies';
      else if (rawCat.includes('Lifestyle')) currentCategory = 'Lifestyle & Hobbies';
      else currentCategory = rawCat;
      continue;
    }

    // Book Line
    let title = line;
    let author = famousAuthors[title] || null;

    // Check if author is attached with "—" or "-"
    if (line.includes('—')) {
      const parts = line.split('—');
      title = parts[0].trim();
      author = parts[1].trim();
    } else if (line.includes(' - ') && !line.includes('1984')) {
      const parts = line.split(' - ');
      title = parts[0].trim();
      author = parts[1].trim();
    }

    // Default author if still unknown
    if (!author) {
      author = famousAuthors[title] || `${currentCategory} Editorial Board`;
    }

    // Deduplicate title
    const normalizedKey = title.toLowerCase();
    if (seenTitles.has(normalizedKey)) {
      continue;
    }
    seenTitles.add(normalizedKey);

    bookCounter++;

    // Generate unique ISBN
    const isbn = `978-0${String(bookCounter).padStart(5, '0')}-${(bookCounter % 9) + 1}`;

    // Generate rack code based on category
    const catPrefix = currentCategory.substring(0, 3).toUpperCase();
    const rackNumber = (bookCounter % 15) + 1;
    const shelfLocation = `Rack ${catPrefix}-${String(rackNumber).padStart(2, '0')}`;

    // Available copies calculation:
    // Approximately 20% of books will have 0 copies available so users can pre-book/queue test!
    // Remaining have 2 to 6 copies with 1 to 4 available!
    const isOutOfStock = bookCounter % 5 === 0;
    const totalCopies = (bookCounter % 5) + 2;
    const availableCopies = isOutOfStock ? 0 : Math.max(1, totalCopies - ((bookCounter % 3) + 1));

    const coverImage =
      categoryCovers[currentCategory] ||
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600';

    books.push({
      title,
      author,
      isbn,
      category: currentCategory,
      description: `Comprehensive edition of "${title}" covering essential principles, in-depth reference, and practical applications in ${currentCategory}.`,
      coverImage,
      totalCopies,
      availableCopies,
      shelfLocation,
      publicationYear: 2020 + (bookCounter % 5)
    });
  }

  return books;
};

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Parsing book list...');
    const parsedBooks = parseBookList();
    console.log(`Parsed ${parsedBooks.length} unique books across all categories.`);

    // Check existing books to prevent duplicate ISBNs
    console.log('Inserting or updating books in MongoDB collection...');
    let insertedCount = 0;
    let updatedCount = 0;

    for (const bookData of parsedBooks) {
      const existing = await Book.findOne({
        $or: [{ title: bookData.title }, { isbn: bookData.isbn }]
      });

      if (existing) {
        existing.category = bookData.category;
        existing.author = bookData.author;
        existing.shelfLocation = bookData.shelfLocation;
        existing.coverImage = bookData.coverImage;
        await existing.save();
        updatedCount++;
      } else {
        await Book.create(bookData);
        insertedCount++;
      }
    }

    const totalInDb = await Book.countDocuments();
    const categoriesCount = (await Book.distinct('category')).length;

    console.log('====================================================');
    console.log(`✅ Library Catalog Expanded Successfully!`);
    console.log(`📥 Newly Inserted: ${insertedCount}`);
    console.log(`🔄 Updated: ${updatedCount}`);
    console.log(`📚 Total Books in Library: ${totalInDb}`);
    console.log(`🏷️ Total Categories: ${categoriesCount}`);
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
