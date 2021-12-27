/**
 * @file Safe MFKDF Defaults
 * @copyright Multifactor 2021 All Rights Reserved
 *
 * @description
 * Secure default configuration for multi-factor key derivation function (MFKDF) and MFKDF factor constructions
 *
 * @author Vivek Nair (https://nair.me) <vivek@nair.me>
 */

module.exports.kdf = {
  size: 32, // key size (bytes); outputs 256-bit key by default
  kdf: 'argon2id', // pbkdf2, bcrypt, scrypt, argon2i, argon2d, or argon2id (default)
  pbkdf2rounds: 310000, // owasp recommendation
  pbkdf2digest: 'sha256', // sha256 and sha512 are common; see crypto.getHashes() for options
  bcryptrounds: 10, // owasp recommendation
  scryptcost: 16384, // 2**14; scrypt paper recommendation
  scryptblocksize: 8, // recommended value
  scryptparallelism: 1, // disable parallelism
  argon2time: 2, // owasp recommendation
  argon2mem: 24576, // 24 MiB; slightly more than owasp recommendation
  argon2parallelism: 1 // disable parallelism
}

module.exports.passwordFactor = {
  size: 32,
  digest: 'sha256',
  salt: ''
}
