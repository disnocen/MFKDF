/**
 * @file Multi-factor Derived Key Setup
 * @copyright Multifactor 2022 All Rights Reserved
 *
 * @description
 * Validate and setup a configuration for a multi-factor derived key
 *
 * @author Vivek Nair (https://nair.me) <vivek@nair.me>
 */
const defaults = require('../defaults')
const kdfSetup = require('./kdf').kdf
const kdf = require('../kdf').kdf
const crypto = require('crypto')
const { v4: uuidv4 } = require('uuid')
const { hkdf } = require('@panva/hkdf')
const share = require('../secrets/share').share
const xor = require('buffer-xor')
const MFKDFDerivedKey = require('../classes/MFKDFDerivedKey')

/**
 * Validate and setup a configuration for a multi-factor derived key
 *
 * @example
 * // setup 16 byte 2-of-3-factor multi-factor derived key with a password, HOTP code, and UUID recovery code
 * const setup = await mfkdf.setup.key([
 *   await mfkdf.setup.factors.password('password'),
 *   await mfkdf.setup.factors.hotp({ secret: Buffer.from('hello world') }),
 *   await mfkdf.setup.factors.uuid({ id: 'recovery', uuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' })
 * ], {threshold: 2, size: 16})
 *
 * // derive key using 2 of the 3 factors
 * const derive = await mfkdf.derive.key(setup.policy, {
 *   password: mfkdf.derive.factors.password('password'),
 *   hotp: mfkdf.derive.factors.hotp(365287)
 * })
 *
 * setup.key.toString('hex') // -> 34d20ced439ec2f871c96ca377f25771
 * derive.key.toString('hex') // -> 34d20ced439ec2f871c96ca377f25771
 *
 * @param {Array.<MFKDFFactor>} factors - Array of factors used to derive this key
 * @param {Object} [options] - Configuration options
 * @param {string} [options.id] - Unique identifier for this key; random UUIDv4 generated by default
 * @param {number} [options.size=32] - Size of derived key, in bytes
 * @param {number} [options.threshold] - Number of factors required to derive key; factors.length by default (all required)
 * @param {Buffer} [options.salt] - Cryptographic salt; generated via secure PRG by default (recommended)
 * @param {string} [options.kdf='argon2id'] - KDF algorithm to use; pbkdf2, bcrypt, scrypt, argon2i, argon2d, or argon2id
 * @param {number} [options.pbkdf2rounds=310000] - Number of rounds to use if using pbkdf2
 * @param {string} [options.pbkdf2digest='sha256'] - Hash function to use if using pbkdf2; one of sha1, sha256, sha384, or sha512
 * @param {number} [options.bcryptrounds=10] - Number of rounds to use if using bcrypt
 * @param {number} [options.scryptcost=16384] - Iterations count (N) to use if using scrypt
 * @param {number} [options.scryptblocksize=8] - Block size (r) to use if using scrypt
 * @param {number} [options.scryptparallelism=1] - Parallelism factor (p) to use if using scrypt
 * @param {number} [options.argon2time=2] - Iterations to use if using argon2
 * @param {number} [options.argon2mem=24576] - Memory to use if using argon2
 * @param {number} [options.argon2parallelism=1] - Parallelism to use if using argon2
 * @returns {MFKDFDerivedKey} A multi-factor derived key object
 * @author Vivek Nair (https://nair.me) <vivek@nair.me>
 * @since 0.8.0
 * @async
 * @memberOf setup
 */
async function key (factors, options) {
  if (!Array.isArray(factors)) throw new TypeError('factors must be an array')
  if (factors.length === 0) throw new RangeError('factors must not be empty')

  options = Object.assign(Object.assign({}, defaults.key), options)

  const policy = {
    $schema: 'https://mfkdf.com/schema/v1.0.0/policy.json'
  }

  // id
  if (options.id === undefined) options.id = uuidv4()
  if (typeof options.id !== 'string') throw new TypeError('id must be a string')
  if (options.id.length === 0) throw new RangeError('id must not be empty')
  policy.$id = options.id

  // size
  if (!Number.isInteger(options.size)) throw new TypeError('key size must be an integer')
  if (!(options.size > 0)) throw new RangeError('key size must be positive')
  policy.size = options.size

  // threshold
  if (options.threshold === undefined) options.threshold = factors.length
  if (!Number.isInteger(options.threshold)) throw new TypeError('threshold must be an integer')
  if (!(options.threshold > 0)) throw new RangeError('threshold must be positive')
  if (!(options.threshold <= factors.length)) throw new RangeError('threshold cannot be greater than number of factors')
  policy.threshold = options.threshold

  // salt
  if (options.salt === undefined) options.salt = crypto.randomBytes(policy.size)
  if (!(Buffer.isBuffer(options.salt))) throw new TypeError('salt must be a buffer')
  policy.salt = options.salt.toString('base64')

  // kdf
  policy.kdf = kdfSetup(options)

  // check factor correctness
  for (const factor of factors) {
    // type
    if (typeof factor.type !== 'string') throw new TypeError('factor type must be a string')
    if (factor.type.length === 0) throw new RangeError('factor type must not be empty')

    // id
    if (typeof factor.id !== 'string') throw new TypeError('factor id must be a string')
    if (factor.id.length === 0) throw new RangeError('factor id must not be empty')

    // data
    if (!Buffer.isBuffer(factor.data)) throw new TypeError('factor data must be a buffer')
    if (factor.data.length === 0) throw new RangeError('factor data must not be empty')

    // params
    if (typeof factor.params !== 'function') throw new TypeError('factor params must be a function')
  }

  // id uniqueness
  const ids = factors.map(factor => factor.id)
  if ((new Set(ids)).size !== ids.length) throw new RangeError('factor ids must be unique')

  // generate secret key material
  const secret = crypto.randomBytes(policy.size)
  const key = await kdf(secret, Buffer.from(policy.salt, 'base64'), policy.size, policy.kdf)
  const shares = share(secret, policy.threshold, factors.length)

  // process factors
  policy.factors = []
  const outputs = {}
  const theoreticalEntropy = []
  const realEntropy = []

  for (const [index, factor] of factors.entries()) {
    // stretch to key length via HKDF/SHA-512
    const share = shares[index]

    theoreticalEntropy.push(factor.data.byteLength * 8)
    realEntropy.push(factor.entropy)

    let stretched = Buffer.from(await hkdf('sha512', factor.data, '', '', policy.size))
    if (Buffer.byteLength(share) > policy.size) stretched = Buffer.concat([Buffer.alloc(Buffer.byteLength(share) - policy.size), stretched])

    const pad = xor(share, stretched)
    const params = await factor.params({ key })
    outputs[factor.id] = await factor.output()
    policy.factors.push({
      id: factor.id,
      type: factor.type,
      pad: pad.toString('base64'),
      params
    })
  }

  const result = new MFKDFDerivedKey(policy, key, secret, shares, outputs)

  theoreticalEntropy.sort((a, b) => a - b)
  const theoretical = theoreticalEntropy.slice(0, policy.threshold).reduce((a, b) => a + b, 0)

  realEntropy.sort((a, b) => a - b)
  const real = realEntropy.slice(0, policy.threshold).reduce((a, b) => a + b, 0)

  result.entropyBits = { theoretical, real }

  return result
}
module.exports.key = key
