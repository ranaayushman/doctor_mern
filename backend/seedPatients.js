require('dotenv').config();
const { connectDB, disconnectDB } = require('./src/config/database');
const User = require('./src/models/User');

const seedPatients = [
  {
    firstName: 'Arjun',
    lastName: 'Singh',
    email: 'arjun.singh@email.com',
    phone: '9876543220',
    password: 'Password123',
    gender: 'Male',
    dateOfBirth: new Date('1985-03-15'),
    bloodGroup: 'O+',
    address: {
      street: '123, Park Avenue',
      city: 'Delhi',
      state: 'Delhi',
      zipCode: '110001',
      country: 'India',
    },
    medicalHistory: {
      allergies: ['Penicillin', 'Shellfish'],
      surgeries: [
        {
          name: 'Appendectomy',
          date: new Date('2015-06-20'),
          description: 'Appendix removal due to inflammation',
        },
      ],
      chronicDiseases: ['Hypertension'],
      medications: [
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
        },
      ],
    },
    profilePicture: '/profile-pics/patients/arjun.jpg',
    isActive: true,
    emailVerified: true,
    emergencyContact: {
      name: 'Priya Singh',
      phone: '9876543111',
      relation: 'Wife',
    },
  },
  {
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'priya.patel@email.com',
    phone: '9876543221',
    password: 'Password123',
    gender: 'Female',
    dateOfBirth: new Date('1990-07-22'),
    bloodGroup: 'A+',
    address: {
      street: '456, Bandra Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400050',
      country: 'India',
    },
    medicalHistory: {
      allergies: ['Aspirin'],
      surgeries: [],
      chronicDiseases: [],
      medications: [],
    },
    profilePicture: '/profile-pics/patients/priya.jpg',
    isActive: true,
    emailVerified: true,
    emergencyContact: {
      name: 'Rajesh Patel',
      phone: '9876543222',
      relation: 'Brother',
    },
  },
  {
    firstName: 'Rohan',
    lastName: 'Gupta',
    email: 'rohan.gupta@email.com',
    phone: '9876543223',
    password: 'Password123',
    gender: 'Male',
    dateOfBirth: new Date('1988-11-08'),
    bloodGroup: 'B+',
    address: {
      street: '789, Park Lane',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560001',
      country: 'India',
    },
    medicalHistory: {
      allergies: [],
      surgeries: [],
      chronicDiseases: ['Type 2 Diabetes'],
      medications: [
        {
          name: 'Metformin',
          dosage: '500mg',
          frequency: 'Twice daily',
        },
      ],
    },
    profilePicture: '/profile-pics/patients/rohan.jpg',
    isActive: true,
    emailVerified: true,
    emergencyContact: {
      name: 'Sneha Gupta',
      phone: '9876543224',
      relation: 'Sister',
    },
  },
  {
    firstName: 'Anjali',
    lastName: 'Verma',
    email: 'anjali.verma@email.com',
    phone: '9876543225',
    password: 'Password123',
    gender: 'Female',
    dateOfBirth: new Date('1992-05-30'),
    bloodGroup: 'O-',
    address: {
      street: '321, Sector 7',
      city: 'Hyderabad',
      state: 'Telangana',
      zipCode: '500032',
      country: 'India',
    },
    medicalHistory: {
      allergies: ['Latex', 'Nuts'],
      surgeries: [
        {
          name: 'Cesarean Section',
          date: new Date('2020-08-15'),
          description: 'Delivery of baby via C-section',
        },
      ],
      chronicDiseases: [],
      medications: [],
    },
    profilePicture: '/profile-pics/patients/anjali.jpg',
    isActive: true,
    emailVerified: true,
    emergencyContact: {
      name: 'Vikram Verma',
      phone: '9876543226',
      relation: 'Husband',
    },
  },
  {
    firstName: 'Nikhil',
    lastName: 'Iyer',
    email: 'nikhil.iyer@email.com',
    phone: '9876543227',
    password: 'Password123',
    gender: 'Male',
    dateOfBirth: new Date('1987-09-12'),
    bloodGroup: 'AB+',
    address: {
      street: '654, Medical Lane',
      city: 'Pune',
      state: 'Maharashtra',
      zipCode: '411001',
      country: 'India',
    },
    medicalHistory: {
      allergies: [],
      surgeries: [],
      chronicDiseases: [],
      medications: [],
    },
    profilePicture: '/profile-pics/patients/nikhil.jpg',
    isActive: true,
    emailVerified: true,
    emergencyContact: {
      name: 'Meera Iyer',
      phone: '9876543228',
      relation: 'Mother',
    },
  },
  {
    firstName: 'Divya',
    lastName: 'Sharma',
    email: 'divya.sharma@email.com',
    phone: '9876543229',
    password: 'Password123',
    gender: 'Female',
    dateOfBirth: new Date('1995-01-25'),
    bloodGroup: 'A-',
    address: {
      street: '987, Health Street',
      city: 'Chennai',
      state: 'Tamil Nadu',
      zipCode: '600001',
      country: 'India',
    },
    medicalHistory: {
      allergies: ['Dairy'],
      surgeries: [],
      chronicDiseases: [],
      medications: [],
    },
    profilePicture: '/profile-pics/patients/divya.jpg',
    isActive: true,
    emailVerified: true,
    emergencyContact: {
      name: 'Arun Sharma',
      phone: '9876543230',
      relation: 'Father',
    },
  },
];

(async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Delete existing patients (optional - comment out to keep existing data)
    // await User.deleteMany({});
    // console.log('Deleted existing patients');

    // Insert patients
    const insertedPatients = await User.insertMany(seedPatients);
    console.log(`✓ Successfully seeded ${insertedPatients.length} patients!`);
    console.log('\nSeeded Patient IDs:');
    insertedPatients.forEach((patient, index) => {
      console.log(
        `${index + 1}. ${patient.firstName} ${patient.lastName} (${patient.email}) - ID: ${
          patient._id
        }`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding patients:', error);
    process.exit(1);
  }
})();
