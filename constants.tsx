import React from 'react';
import { Users, CheckSquare, Zap, Shield } from 'lucide-react';
import { Course, Grade, EducationLevel, Exam, Stream } from './types';

const getThumb = (subject: string, id: number) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=400&sig=${subject}`;

const CURRENT_YEAR = new Date().getFullYear();

export const NATIONAL_CENTER_INFO = {
  name: "IFTU National Digital Sovereign Education Center",
  shortName: "IFTU NDC",
  location: "Ethiopia, Oromia region, West Arsi Zone, Kore woreda",
  coordinates: { lat: 7.15, lng: 39.05 },
  mapsLink: "https://www.google.com/maps/search/Kore+woreda+West+Arsi+Zone+Oromia+Ethiopia/",
  authorizedBy: "Jemal Fano Haji",
  founderPhoto: "https://images.unsplash.com/photo-1531384441138-2736e62e0919?q=80&w=1000&auto=format&fit=crop"
};

export const MOCK_COURSES: Course[] = [
  { 
    id: 'g11-phys-core', 
    title: 'Grade 11 Core Physics', 
    code: 'PHYS-G11-C', 
    grade: Grade.G11, 
    stream: Stream.NATURAL_SCIENCE, 
    level: EducationLevel.SECONDARY, 
    thumbnail: "https://images.unsplash.com/photo-1635070041012-9169624d3c48?q=80&w=1000&auto=format&fit=crop", 
    description: 'Foundational mechanics and thermodynamics required for advanced studies.', 
    instructor: 'Dr. Tesfaye', 
    instructorEmail: 'dr.tesfaye@iftu.edu.et', 
    subject: 'Physics', 
    lessons: [
      { id: 'p11-l1', title: 'Kinematics', duration: '20m', content: 'Linear motion basics.', type: 'video', contentType: 'video', videoUrl: 'https://www.youtube.com/watch?v=5UfG_5iK_N8' },
      { id: 'p11-l2', title: 'Dynamics & Forces', duration: '25m', content: 'Newton\'s laws of motion and gravitational force calculation.', type: 'reading', contentType: 'reading' },
      { id: 'p11-l3', title: 'Energy & Work', duration: '30m', content: 'Conservation of energy and mechanical work principles.', type: 'quiz', contentType: 'quiz', questions: [
        { id: 'q-p11-1', text: 'What is the unit of Work?', type: 'multiple-choice', options: ['Newton', 'Joule', 'Watt', 'Pascal'], correctAnswer: 1, points: 10, category: 'Physics' }
      ]}
    ]
  },
  { 
    id: 'g12-phys-adv', 
    title: 'Grade 12 Advanced Physics', 
    code: 'PHYS-G12-A', 
    grade: Grade.G12, 
    stream: Stream.NATURAL_SCIENCE, 
    level: EducationLevel.SECONDARY, 
    thumbnail: getThumb('quantum', 1451810166861), 
    description: 'Quantum mechanics and electromagnetism. Requires Core Physics mastery.', 
    instructor: 'Dr. Tesfaye', 
    instructorEmail: 'dr.tesfaye@iftu.edu.et', 
    subject: 'Physics', 
    prerequisites: ['g11-phys-core'],
    lessons: [
      { id: 'p12-l1', title: 'Quantum Duality', duration: '45m', content: 'Advanced wave-particle duality.', type: 'reading', contentType: 'reading', pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { id: 'p12-l2', title: 'Electromagnetism', duration: '40m', content: 'Maxwell\'s equations and electromagnetic waves.', type: 'video', contentType: 'video', videoUrl: 'https://www.youtube.com/watch?v=5UfG_5iK_N8' }
    ]
  },
  { 
    id: 'tvet-auto-l3', 
    title: 'Automotive Systems L3', 
    code: 'AUTO-L3', 
    grade: Grade.TVET_LEVEL_3, 
    stream: Stream.GENERAL, 
    level: EducationLevel.TVET, 
    thumbnail: getThumb('car', 1511919884224), 
    description: 'Advanced engine diagnostics and hybrid systems. Includes Live Oral Assessment.', 
    instructor: 'Kebede J.', 
    instructorEmail: 'kebede.j@iftu.edu.et', 
    subject: 'Automotive', 
    lessons: [
      { id: 'auto-l3-intro', title: 'Hybrid Components', duration: '30m', content: 'Introduction to high-voltage batteries and inverters.', type: 'reading', contentType: 'reading' },
      { id: 'auto-l3-oral', title: 'Technical Interview: Hybrid Safety', duration: '15m', content: 'You will participate in a live oral examination with an AI Auditor regarding High-Voltage safety protocols.', type: 'quiz', contentType: 'quiz' }
    ] 
  },
  { 
    id: 'g9-12-chem-core', 
    title: 'Grade 9-12 Core Chemistry', 
    code: 'CHEMS-9,10,11,12', 
    grade: Grade.G12, 
    stream: Stream.NATURAL_SCIENCE, 
    level: EducationLevel.SECONDARY, 
    thumbnail: "https://images.unsplash.com/photo-1532187863486-abbf71d50228?q=80&w=1000&auto=format&fit=crop", 
    description: 'Comprehensive chemistry curriculum covering atomic structure, chemical reactions, and organic chemistry for high school levels.', 
    instructor: 'Abebe C.', 
    instructorEmail: 'abebe.c@iftu.edu.et', 
    subject: 'Chemistry', 
    lessons: [
      { id: 'c9-l1', title: 'Atomic Theory', duration: '25m', content: 'Introduction to atoms and subatomic particles.', type: 'reading', contentType: 'reading' },
      { id: 'c9-l2', title: 'Chemical Bonding', duration: '30m', content: 'Ionic and covalent bonding principles.', type: 'video', contentType: 'video', videoUrl: 'https://www.youtube.com/watch?v=5UfG_5iK_N8' }
    ] 
  }
];

export const MOCK_EXAMS: Exam[] = [
  {
    id: 'exam-mock-g9-general',
    title: 'Grade 9 General Education Mock',
    courseCode: 'GEN-G9-MOCK',
    grade: Grade.G9,
    stream: Stream.GENERAL,
    academicYear: CURRENT_YEAR,
    durationMinutes: 60,
    totalPoints: 100,
    status: 'published',
    type: 'mock-eaes',
    semester: 1,
    subject: 'General Science & Social',
    categories: ['Biology', 'Chemistry', 'Physics', 'History', 'Geography'],
    questions: [
      { id: 'g9q1', text: 'Which cell organelle is known as the "powerhouse" of the cell?', type: 'multiple-choice', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Vacuole'], correctAnswer: 1, points: 10, category: 'Biology' },
      { id: 'g9q2', text: 'What is the chemical symbol for Gold?', type: 'multiple-choice', options: ['Ag', 'Au', 'Pb', 'Fe'], correctAnswer: 1, points: 10, category: 'Chemistry' },
      { id: 'g9q3', text: 'Newton\'s First Law is also known as the Law of:', type: 'multiple-choice', options: ['Acceleration', 'Inertia', 'Action-Reaction', 'Gravity'], correctAnswer: 1, points: 10, category: 'Physics' },
      { id: 'g9q4', text: 'In which year did the Battle of Adwa take place?', type: 'multiple-choice', options: ['1886', '1896', '1906', '1936'], correctAnswer: 1, points: 10, category: 'History' },
      { id: 'g9q5', text: 'What is the capital of Ethiopia?', type: 'multiple-choice', options: ['Dire Dawa', 'Addis Ababa', 'Gondar', 'Hawassa'], correctAnswer: 1, points: 10, category: 'Geography' },
      { id: 'g9q6', text: 'Which planet is known as the Red Planet?', type: 'multiple-choice', options: ['Venus', 'Jupiter', 'Mars', 'Saturn'], correctAnswer: 2, points: 10, category: 'General Science' },
      { id: 'g9q7', text: 'What is the value of 2 + 3 * 4?', type: 'multiple-choice', options: ['20', '14', '16', '12'], correctAnswer: 1, points: 10, category: 'Mathematics' },
      { id: 'g9q8', text: 'Who interpreted the concept of Gravitation?', type: 'multiple-choice', options: ['Einstein', 'Newton', 'Galileo', 'Tesla'], correctAnswer: 1, points: 10, category: 'Physics' },
      { id: 'g9q9', text: 'The Nile river flows into which sea?', type: 'multiple-choice', options: ['Red Sea', 'Mediterranean Sea', 'Caspian Sea', 'Dead Sea'], correctAnswer: 1, points: 10, category: 'Geography' },
      { id: 'g9q10', text: 'Which component of the computer is the "brain"?', type: 'multiple-choice', options: ['RAM', 'Monitor', 'CPU', 'Hard Drive'], correctAnswer: 2, points: 10, category: 'IT' }
    ]
  },
  {
    id: 'exam-mock-g11-natural',
    title: 'Grade 11 Natural Science Complex Mock',
    courseCode: 'NAT-G11-MOCK',
    grade: Grade.G11,
    stream: Stream.NATURAL_SCIENCE,
    academicYear: CURRENT_YEAR,
    durationMinutes: 120,
    totalPoints: 110,
    status: 'published',
    type: 'mock-eaes',
    semester: 1,
    subject: 'Natural Science Stream',
    categories: ['Physics', 'Chemistry', 'Biology', 'Maths', 'English', 'IT'],
    questions: [
      { id: 'g11nq1', text: 'The rate of change of momentum is equal to:', type: 'multiple-choice', options: ['Velocity', 'Work', 'Force', 'Kinetic Energy'], correctAnswer: 2, points: 10, category: 'Physics' },
      { id: 'g11nq2', text: 'Which subatomic particle has no charge?', type: 'multiple-choice', options: ['Proton', 'Electron', 'Neutron', 'Positron'], correctAnswer: 2, points: 10, category: 'Chemistry' },
      { id: 'g11nq3', text: 'What is the functional unit of heredity?', type: 'multiple-choice', options: ['Chromosome', 'DNA', 'Gene', 'Nucleus'], correctAnswer: 2, points: 10, category: 'Biology' },
      { id: 'g11nq4', text: 'Find the derivative of x^2.', type: 'multiple-choice', options: ['x', '2x', '2', 'x^3/3'], correctAnswer: 1, points: 10, category: 'Mathematics' },
      { id: 'g11nq5', text: 'Choose the correct synonym for "Benevolent":', type: 'multiple-choice', options: ['Cruel', 'Greedy', 'Kind', 'Fast'], correctAnswer: 2, points: 10, category: 'English' },
      { id: 'g11nq6', text: 'What is the primary function of an Operating System?', type: 'multiple-choice', options: ['Word Processing', 'Managing Hardware', 'Designing Graphics', 'Sending Emails'], correctAnswer: 1, points: 10, category: 'IT' },
      { id: 'g11nq7', text: 'What is the molar mass of Water (H2O)?', type: 'multiple-choice', options: ['16g/mol', '18g/mol', '20g/mol', '2g/mol'], correctAnswer: 1, points: 10, category: 'Chemistry' },
      { id: 'g11nq8', text: 'The law of conservation of energy states that energy:', type: 'multiple-choice', options: ['Can be created', 'Can be destroyed', 'Cannot be created or destroyed', 'Is always lost as heat'], correctAnswer: 2, points: 10, category: 'Physics' },
      { id: 'g11nq9', text: 'Where does photosynthesis primarily occur in a plant cell?', type: 'multiple-choice', options: ['Mitochondria', 'Chloroplast', 'Cytoplasm', 'Wall'], correctAnswer: 1, points: 10, category: 'Biology' },
      { id: 'g11nq10', text: 'Which protocol is used to browse websites?', type: 'multiple-choice', options: ['FTP', 'SMTP', 'HTTP', 'SSH'], correctAnswer: 2, points: 10, category: 'IT' },
      { id: 'g11nq11', text: 'According to Faraday\'s Law of induction, the induced EMF in a conductor is proportional to the rate of change of:', type: 'multiple-choice', options: ['Magnetic Flux', 'Magnetic Field', 'Electric Field', 'Current'], correctAnswer: 0, points: 10, category: 'Physics' }
    ]
  },
  {
    id: 'exam-mock-g11-social',
    title: 'Grade 11 Social Science Complex Mock',
    courseCode: 'SOC-G11-MOCK',
    grade: Grade.G11,
    stream: Stream.SOCIAL_SCIENCE,
    academicYear: CURRENT_YEAR,
    durationMinutes: 120,
    totalPoints: 110,
    status: 'published',
    type: 'mock-eaes',
    semester: 1,
    subject: 'Social Science Stream',
    categories: ['History', 'Geography', 'Economics', 'Maths', 'English', 'IT'],
    questions: [
      { id: 'g11sq1', text: 'The League of Nations was established after which war?', type: 'multiple-choice', options: ['Napoleonic Wars', 'World War I', 'World War II', 'Cold War'], correctAnswer: 1, points: 10, category: 'History' },
      { id: 'g11sq2', text: 'Which is the largest desert in the world?', type: 'multiple-choice', options: ['Gobi', 'Kalahari', 'Sahara', 'Antarctica'], correctAnswer: 3, points: 10, category: 'Geography' },
      { id: 'g11sq3', text: 'The fundamental economic problem is:', type: 'multiple-choice', options: ['Inflation', 'Scarcity', 'Unemployment', 'Poverty'], correctAnswer: 1, points: 10, category: 'Economics' },
      { id: 'g11sq4', text: 'What is the median of 3, 7, 2, 9, 11?', type: 'multiple-choice', options: ['2', '7', '9', '6.4'], correctAnswer: 1, points: 10, category: 'Mathematics' },
      { id: 'g11sq5', text: 'Which word is the antonym of "Diligent"?', type: 'multiple-choice', options: ['Hardworking', 'Lazy', 'Smart', 'Active'], correctAnswer: 1, points: 10, category: 'English' },
      { id: 'g11sq6', text: 'What does URL stand for?', type: 'multiple-choice', options: ['Universal Resource Locator', 'Uniform Resource Locator', 'United Resource Line', 'User Resource List'], correctAnswer: 1, points: 10, category: 'IT' },
      { id: 'g11sq7', text: 'Which civilization developed the pyramid?', type: 'multiple-choice', options: ['Greek', 'Roman', 'Egyptian', 'Mesopotamian'], correctAnswer: 2, points: 10, category: 'History' },
      { id: 'g11sq8', text: 'GDP stands for:', type: 'multiple-choice', options: ['Gross Domestic Product', 'General Development Plan', 'Global Distribution Process', 'Government Debt Percentage'], correctAnswer: 0, points: 10, category: 'Economics' },
      { id: 'g11sq9', text: 'What is the prime meridian?', type: 'multiple-choice', options: ['0° Longitude', '0° Latitude', '180° Longitude', '90° Latitude'], correctAnswer: 0, points: 10, category: 'Geography' },
      { id: 'g11sq10', text: 'Which of these is a social media platform?', type: 'multiple-choice', options: ['Photoshop', 'LinkedIn', 'Word', 'Excel'], correctAnswer: 1, points: 10, category: 'IT' },
      { id: 'g11sq11', text: 'The primary goal of the United Nations is to:', type: 'multiple-choice', options: ['Promote global peace and security', 'Increase fossil fuel use', 'Start space colonies', 'Regulate internet memes'], correctAnswer: 0, points: 10, category: 'Citizenship' }
    ]
  },
  {
    id: 'exam-mock-g12-natural',
    title: 'Grade 12 National Natural Science Mock',
    courseCode: 'PHYS-G12-A',
    grade: Grade.G12,
    stream: Stream.NATURAL_SCIENCE,
    academicYear: CURRENT_YEAR,
    durationMinutes: 120,
    totalPoints: 110,
    status: 'published',
    type: 'mock-eaes',
    semester: 2,
    subject: 'Natural Science Intensive',
    categories: ['Physics', 'Chemistry', 'Biology', 'Maths', 'English', 'IT'],
    questions: [
      { id: 'g12nq1', text: 'What is the escape velocity of Earth?', type: 'multiple-choice', options: ['9.8 km/s', '11.2 km/s', '7.9 km/s', '15.0 km/s'], correctAnswer: 1, points: 10, category: 'Physics' },
      { id: 'g12nq2', text: 'Which functional group is present in Alcohols?', type: 'multiple-choice', options: ['-COOH', '-CHO', '-OH', '-CO-'], correctAnswer: 2, points: 10, category: 'Chemistry' },
      { id: 'g12nq3', text: 'Mendel\'s second law is the law of:', type: 'multiple-choice', options: ['Segregation', 'Dominance', 'Independent Assortment', 'Inheritance'], correctAnswer: 2, points: 10, category: 'Biology' },
      { id: 'g12nq4', text: 'Integrate the function f(x) = 2x.', type: 'multiple-choice', options: ['x^2 + C', '2 + C', 'x + C', '2x^2 + C'], correctAnswer: 0, points: 10, category: 'Mathematics' },
      { id: 'g12nq5', text: 'Complete the sentence: "If I _____ harder, I would have passed."', type: 'multiple-choice', options: ['study', 'studied', 'had studied', 'will study'], correctAnswer: 2, points: 10, category: 'English' },
      { id: 'g12nq6', text: 'What is the main advantage of Fiber Optic cable?', type: 'multiple-choice', options: ['Cheap', 'No speed limit', 'High Bandwidth', 'Easy to install'], correctAnswer: 2, points: 10, category: 'IT' },
      { id: 'g12nq7', text: 'What is the oxidation state of Oxygen in most compounds?', type: 'multiple-choice', options: ['+2', '0', '-2', '-1'], correctAnswer: 2, points: 10, category: 'Chemistry' },
      { id: 'g12nq8', text: 'According to Einstein\'s E=mc^2, "c" represents:', type: 'multiple-choice', options: ['Constant', 'Cooling rate', 'Speed of light', 'Charge'], correctAnswer: 2, points: 10, category: 'Physics' },
      { id: 'g12nq9', text: 'Double fertilization is a characteristic of:', type: 'multiple-choice', options: ['Bryophytes', 'Pteridophytes', 'Gymnosperms', 'Angiosperms'], correctAnswer: 3, points: 10, category: 'Biology' },
      { id: 'g12nq10', text: 'Which HTML tag is used for the largest heading?', type: 'multiple-choice', options: ['<head>', '<h6>', '<heading>', '<h1>'], correctAnswer: 3, points: 10, category: 'IT' },
      { id: 'g12nq11', text: 'Faraday\'s Law of Induction states that the induced EMF in any closed circuit is equal to:', type: 'multiple-choice', options: ['The negative rate of change of magnetic flux through the circuit', 'The total current flowing through the circuit', 'The product of resistance and inductance', 'The density of the magnetic field'], correctAnswer: 0, points: 10, category: 'Physics' }
    ]
  },
  {
    id: 'exam-mock-g12-social',
    title: 'Grade 12 National Social Science Mock',
    courseCode: 'SOC-G12-MOCK',
    grade: Grade.G12,
    stream: Stream.SOCIAL_SCIENCE,
    academicYear: CURRENT_YEAR,
    durationMinutes: 120,
    totalPoints: 110,
    status: 'published',
    type: 'mock-eaes',
    semester: 2,
    subject: 'Social Science Intensive',
    categories: ['History', 'Geography', 'Economics', 'Maths', 'English', 'IT'],
    questions: [
      { id: 'g12sq1', text: 'The Berlin Conference of 1884-85 was about:', type: 'multiple-choice', options: ['Ending Slavery', 'Partition of Africa', 'Industrial Revolution', 'French Revolution'], correctAnswer: 1, points: 10, category: 'History' },
      { id: 'g12sq2', text: 'Which type of rock is formed from cooled magma?', type: 'multiple-choice', options: ['Sedimentary', 'Metamorphic', 'Igneous', 'Sandstone'], correctAnswer: 2, points: 10, category: 'Geography' },
      { id: 'g12sq3', text: 'A market structure with only one seller is:', type: 'multiple-choice', options: ['Monopoly', 'Oligopoly', 'Perfect Competition', 'Monopsony'], correctAnswer: 0, points: 10, category: 'Economics' },
      { id: 'g12sq4', text: 'Solve for x: log10(x) = 2.', type: 'multiple-choice', options: ['10', '100', '20', '2'], correctAnswer: 1, points: 10, category: 'Mathematics' },
      { id: 'g12sq5', text: 'Identify the passive voice: "The chef cooked dinner."', type: 'multiple-choice', options: ['The chef is cooking.', 'Dinner was cooked by the chef.', 'Chef dinner cooked.', 'Dinner cooked the chef.'], correctAnswer: 1, points: 10, category: 'English' },
      { id: 'g12sq6', text: 'Which software is best for managing complex databases?', type: 'multiple-choice', options: ['Notepad', 'PowerPoint', 'MySQL', 'Paint'], correctAnswer: 2, points: 10, category: 'IT' },
      { id: 'g12sq7', text: 'The Cold War was primarily a struggle between:', type: 'multiple-choice', options: ['UK & France', 'USA & USSR', 'China & Japan', 'Germany & Italy'], correctAnswer: 1, points: 10, category: 'History' },
      { id: 'g12sq8', text: 'Which sector of the economy involves raw material extraction?', type: 'multiple-choice', options: ['Primary', 'Secondary', 'Tertiary', 'Quaternary'], correctAnswer: 0, points: 10, category: 'Economics' },
      { id: 'g12sq9', text: 'Plate tectonics theory explains:', type: 'multiple-choice', options: ['Weather patterns', 'Continental drift', 'Global warming', 'Tides'], correctAnswer: 1, points: 10, category: 'Geography' },
      { id: 'g12sq10', text: 'What is the purpose of a Firewall?', type: 'multiple-choice', options: ['Accelerate internet', 'Store passwords', 'Block unauthorized access', 'Clean dust'], correctAnswer: 2, points: 10, category: 'IT' },
      { id: 'g12sq11', text: 'Which theory in Economics states that "Supply creates its own demand"?', type: 'multiple-choice', options: ['Say\'s Law', 'Keynesian Theory', 'Malthusian Theory', 'Ricardian Theory'], correctAnswer: 0, points: 10, category: 'Economics' }
    ]
  },
  {
    id: 'exam-mock-tvet-l1',
    title: 'TVET Level 1 Technical Mock',
    courseCode: 'TVET-L1-MOCK',
    grade: Grade.TVET_LEVEL_1,
    stream: Stream.GENERAL,
    academicYear: CURRENT_YEAR,
    durationMinutes: 60,
    totalPoints: 100,
    status: 'published',
    type: 'tvet-exit',
    semester: 1,
    subject: 'Technical Foundation',
    categories: ['HRMS', 'Technical Drawing', 'Accounting', 'IT'],
    questions: [
      { id: 'tl1q1', text: 'In HRMS, what does HR stand for?', type: 'multiple-choice', options: ['High Resource', 'Human Resource', 'Hardware Repair', 'Help Registry'], correctAnswer: 1, points: 10, category: 'HRMS' },
      { id: 'tl1q2', text: 'Which tool is essential for drawing a straight line?', type: 'multiple-choice', options: ['Compass', 'Protractor', 'Ruler', 'Eraser'], correctAnswer: 2, points: 10, category: 'Technical Drawing' },
      { id: 'tl1q3', text: 'Accounting: "Assets = Liabilities + ____"', type: 'multiple-choice', options: ['Income', 'Equity', 'Expense', 'Cash'], correctAnswer: 1, points: 10, category: 'Accounting' },
      { id: 'tl1q4', text: 'Which device is used for typing?', type: 'multiple-choice', options: ['Mouse', 'Printer', 'Keyboard', 'Webcam'], correctAnswer: 2, points: 10, category: 'IT' },
      { id: 'tl1q5', text: 'Drawing: What type of line is used for hidden edges?', type: 'multiple-choice', options: ['Solid', 'Dashed', 'Thick', 'Zigzag'], correctAnswer: 1, points: 10, category: 'Technical Drawing' },
      { id: 'tl1q6', text: 'What is the primary goal of HRM?', type: 'multiple-choice', options: ['Selling products', 'Managing people', 'Repairing machines', 'Coding'], correctAnswer: 1, points: 10, category: 'HRMS' },
      { id: 'tl1q7', text: 'Accounting: A ledger is used to:', type: 'multiple-choice', options: ['Draw plans', 'Record transactions', 'Send emails', 'Play games'], correctAnswer: 1, points: 10, category: 'Accounting' },
      { id: 'tl1q8', text: 'What does PC stand for?', type: 'multiple-choice', options: ['Private Call', 'Personal Computer', 'Professional Core', 'Processing Center'], correctAnswer: 1, points: 10, category: 'IT' },
      { id: 'tl1q9', text: 'Which scale is 1:1?', type: 'multiple-choice', options: ['Enlargement', 'Reduction', 'Full Scale', 'Half Scale'], correctAnswer: 2, points: 10, category: 'Technical Drawing' },
      { id: 'tl1q10', text: 'What software is used for spreadsheets?', type: 'multiple-choice', options: ['Chrome', 'Word', 'Excel', 'VLC'], correctAnswer: 2, points: 10, category: 'IT' }
    ]
  },
  {
    id: 'exam-mock-tvet-l4',
    title: 'TVET Level 4 Advanced Professional Mock',
    courseCode: 'TVET-L4-MOCK',
    grade: Grade.TVET_LEVEL_4,
    stream: Stream.GENERAL,
    academicYear: CURRENT_YEAR,
    durationMinutes: 90,
    totalPoints: 100,
    status: 'published',
    type: 'tvet-exit',
    semester: 1,
    subject: 'Professional Leadership',
    categories: ['HRMS', 'Design Drawing', 'Management Accounting', 'Advanced IT'],
    questions: [
      { id: 'tl4q1', text: 'Strategic HRM focuses on:', type: 'multiple-choice', options: ['Payroll only', 'Long-term goals', 'Hiring daily', 'Cleaning office'], correctAnswer: 1, points: 10, category: 'HRMS' },
      { id: 'tl4q2', text: 'In CAD, what does it stand for?', type: 'multiple-choice', options: ['Computer Aided Design', 'Common Auto Design', 'Call And Draw', 'Construct All data'], correctAnswer: 0, points: 10, category: 'Design Drawing' },
      { id: 'tl4q3', text: 'What is a Balance Sheet used for?', type: 'multiple-choice', options: ['Profit projection', 'Financial position', 'Daily sales', 'Staff attendance'], correctAnswer: 1, points: 10, category: 'Management Accounting' },
      { id: 'tl4q4', text: 'Which concept is vital for Cloud Computing?', type: 'multiple-choice', options: ['Virtualization', 'Hardware upgrade', 'Physical cables', 'Dial-up'], correctAnswer: 0, points: 10, category: 'Advanced IT' },
      { id: 'tl4q5', text: 'HRMS: Performance Appraisal is for:', type: 'multiple-choice', options: ['Firing people', 'Evaluating work', 'Taking photos', 'Buying lunch'], correctAnswer: 1, points: 10, category: 'HRMS' },
      { id: 'tl4q6', text: 'In 3D modeling, "Extrude" means:', type: 'multiple-choice', options: ['Delete', 'Flatten', 'Add thickness', 'Rotate'], correctAnswer: 2, points: 10, category: 'Design Drawing' },
      { id: 'tl4q7', text: 'GAAP stands for:', type: 'multiple-choice', options: ['General Accounting and Audit', 'Generally Accepted Accounting Principles', 'Global Account Access Port', 'Government Audit and Policy'], correctAnswer: 1, points: 10, category: 'Management Accounting' },
      { id: 'tl4q8', text: 'What is Big Data characterized by?', type: 'multiple-choice', options: ['Small size', 'High Variety/Volume', 'Low speed', 'Paper storage'], correctAnswer: 1, points: 10, category: 'Advanced IT' },
      { id: 'tl4q9', text: 'Conflict resolution is a skill for:', type: 'multiple-choice', options: ['Accountants only', 'Engineers only', 'Managers/Leaders', 'IT Techs'], correctAnswer: 2, points: 10, category: 'HRMS' },
      { id: 'tl4q10', text: 'What is a relational database?', type: 'multiple-choice', options: ['A music folder', 'Data stored in tables', 'A text file', 'A single image'], correctAnswer: 1, points: 10, category: 'Advanced IT' }
    ]
  }
];

export const MOCK_NEWS = [
  { id: 'n1', date: `Feb 22, ${CURRENT_YEAR}`, tag: 'Infrastructure', title: 'IFTU National Server Cluster Upgraded', summary: 'Improved latency for remote proctoring.', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=600', content: 'The upgrade ensures stable connections for students in all regions.' },
  { 
    id: 'n2', 
    date: `March 1, ${CURRENT_YEAR}`, 
    tag: 'Exams', 
    title: `${CURRENT_YEAR} Ethiopian National Exam Registration Schedule`, 
    summary: 'Official registration dates for regular and private candidates have been announced.', 
    content: `The Ethiopian Educational Assessment and Examinations Service (EAES) has officially announced the registration schedule for the ${CURRENT_YEAR} National Examinations.\n\n• Regular Registration: Starts March 20, ${CURRENT_YEAR} and ends April 15, ${CURRENT_YEAR}.\n• Private Candidate Registration: Starts April 1, ${CURRENT_YEAR} and ends April 30, ${CURRENT_YEAR}.\n\nAll candidates must complete their registration through the official portal before the strict deadlines. Late registrations will not be accepted under any circumstances.`, 
    image: 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?auto=format&fit=crop&q=80&w=600' 
  }
];

export const SUMMER_STATS = [
  { label: 'ACTIVE LEARNERS', value: '450K+', color: '#3b82f6', icon: <Users size={48} /> },
  { label: 'MODULES COMPLETED', value: '1.2M', color: '#009b44', icon: <CheckSquare size={48} /> },
  { label: 'SYSTEM UPTIME', value: '99.9%', color: '#ffcd00', icon: <Zap size={48} /> },
  { label: 'EXAM INTEGRITY', value: '100%', color: '#ef3340', icon: <Shield size={48} /> }
];

export const SUMMER_ACTIVITIES = [
  { title: 'STEM Innovation Fair', date: 'August 15', desc: 'National exhibition of student projects.', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600', tag: 'Innovation' },
  { title: 'Digital Bootcamps', date: 'July - Aug', desc: 'Coding and engineering for TVET.', image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600', tag: 'Skills' }
];

export const ACADEMIC_SUBJECTS: Record<string, string[]> = {
  // Grade 9 & 10: General Stream
  'Grade 9-General': ['Biology', 'Chemistry', 'Physics', 'Mathematics', 'English', 'Geography', 'History', 'Citizenship', 'IT', 'Amharic', 'Afan Oromo'],
  'Grade 10-General': ['Biology', 'Chemistry', 'Physics', 'Mathematics', 'English', 'Geography', 'History', 'Citizenship', 'IT', 'Amharic', 'Afan Oromo'],
  
  // Grade 11 & 12: Natural Science
  'Grade 11-Natural Science': ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'IT', 'Agricultural Science', 'HPE', 'Afan Oromo'],
  'Grade 12-Natural Science': ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'IT', 'Agricultural Science', 'HPE', 'Afan Oromo'],
  
  // Grade 11 & 12: Social Science
  'Grade 11-Social Science': ['History', 'Geography', 'Economics', 'Mathematics', 'English', 'Citizenship', 'IT', 'Accounting', 'Business', 'Afan Oromo'],
  'Grade 12-Social Science': ['History', 'Geography', 'Economics', 'Mathematics', 'English', 'Citizenship', 'IT', 'Accounting', 'Business', 'Afan Oromo'],
  
  // Teaching College / TVET
  'TVET Level 1-General': ['Communication', 'Basics of Computing', 'Mathematics', 'English', 'Occupational Safety'],
  'TVET Level 2-General': ['Communication', 'Basics of Computing', 'Mathematics', 'English', 'Occupational Safety'],
  'TVET Level 3-General': ['Customer Service', 'Information Systems', 'English', 'Professional Ethics'],
  'TVET Level 4-General': ['Management', 'Strategy', 'English', 'Advanced Ethics'],
};

export const getSubjectsBySelection = (grade: Grade, stream: Stream) => {
  const key = `${grade}-${stream}`;
  return ACADEMIC_SUBJECTS[key] || ['General Education', 'Pedagogy', 'Special Foundations'];
};
