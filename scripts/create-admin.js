const admin = require('firebase-admin');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
});

const db = admin.firestore();

async function createAdminUser() {
  console.log('\n=== Create Admin User ===\n');
  
  const email = await new Promise(resolve => {
    rl.question('Enter admin email: ', resolve);
  });
  
  const password = await new Promise(resolve => {
    rl.question('Enter admin password (min 6 characters): ', resolve);
  });
  
  const name = await new Promise(resolve => {
    rl.question('Enter admin name: ', resolve);
  });

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    console.log(`\n✓ Firebase Auth user created with UID: ${userRecord.uid}`);

    const userDoc = {
      name,
      email,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      avatar: 'avatar1',
      roles: [{ id: '1', name: 'Admin' }],
      badges: [{ id: 'badge-1', assignedAt: admin.firestore.Timestamp.now() }],
      followingAuthors: [],
      followingTags: [],
      readingList: [],
      linkInBio: {
        enabled: false,
        name: name,
        bio: '',
        links: [],
        theme: 'default',
      },
      referrals: 0,
      signups: 0,
      earnings: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('users').doc(userRecord.uid).set(userDoc);

    console.log('✓ User document created in Firestore with Admin role');
    console.log('\n=== Admin Account Created Successfully! ===\n');
    console.log(`Email: ${email}`);
    console.log(`You can now sign in at /admin/login\n`);
    
  } catch (error) {
    console.error('Error creating admin user:', error.message);
  } finally {
    rl.close();
    process.exit(0);
  }
}

createAdminUser();
