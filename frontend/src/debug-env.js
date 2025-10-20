// Temporary debug file to check environment variables
console.log('=== ENVIRONMENT DEBUG ===');
console.log('REACT_APP_API_BASE:', process.env.REACT_APP_API_BASE);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('All env vars:', Object.keys(process.env).filter(k => k.startsWith('REACT_APP_')));
console.log('========================');
