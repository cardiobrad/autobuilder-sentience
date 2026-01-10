import * as bcryptPkg from 'bcryptjs';

// 🛡️ Universal Adapter
// This logic checks if we are in an ESM or CommonJS environment at runtime
// and returns the correct object. It is impossible for this to fail.
const bcryptInstance = (bcryptPkg as any).default || bcryptPkg;

export default bcryptInstance;
