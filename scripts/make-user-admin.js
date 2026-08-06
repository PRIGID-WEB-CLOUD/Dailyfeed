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

async function makeUserAdmin() {
  console.log('\n=== Make Existing User an Admin ===\n');
  
  const email = await new Promise(resolve => {
    rl.question('Enter user email: ', resolve);
  });

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`\n✓ Found user with UID: ${userRecord.uid}`);

    await db.collection('users').doc(userRecord.uid).update({
      roles: [{ id: '1', name: 'Admin' }]
    });

    console.log('✓ User has been granted Admin role');
    console.log('\n=== Success! ===\n');
    console.log(`${email} is now an admin.\n`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
    process.exit(0);
  }
}

makeUserAdmin();
