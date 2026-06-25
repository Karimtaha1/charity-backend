const { testConnection, closeDB } = require('./config/database');

async function runTest() {
    console.log('🔍 Testing SQL Server Connection...\n');
    const success = await testConnection();

    if (success) {
        console.log('\n✅ Ready to start the server!');
        console.log('   Run: npm run dev');
    } else {
        console.log('\n❌ Please fix the connection issues above.');
        console.log('   See database/fix-ssl-error.sql for solutions.');
    }

    await closeDB();
    process.exit(success ? 0 : 1);
}

runTest();
