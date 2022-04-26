/**
 * @file MFKDF HMAC-SHA1 Factor Setup
 * @copyright Multifactor 2022 All Rights Reserved
 *
 * @description
 * Setup an HMAC-SHA1 challenge-response factor for multi-factor key derivation
 *
 * @author Vivek Nair (https://nair.me) <vivek@nair.me>
 */
const defaults = require('../../defaults')
const crypto = require('crypto')
const xor = require('buffer-xor')

/**
 * Setup a YubiKey-compatible MFKDF HMAC-SHA1 challenge-response factor
 *
 * @example
 * const HMACsha1 = mfkdf.setup.factors.hmacsha1(...);
 *
 * @param {Object} [options] - Configuration options
 * @param {string} [options.id='hmacsha1'] - Unique identifier for this factor
 * @param {Buffer} [options.secret] - HMAC secret to use; randomly generated by default
 * @returns {MFKDFFactor} MFKDF factor information
 * @author Vivek Nair (https://nair.me) <vivek@nair.me>
 * @since 0.21.0
 * @async
 * @memberof setup.factors
 */
async function hmacsha1 (options) {
  options = Object.assign(Object.assign({}, defaults.hmacsha1), options)

  if (typeof options.id !== 'string') throw new TypeError('id must be a string')
  if (options.id.length === 0) throw new RangeError('id cannot be empty')

  if (typeof options.secret === 'undefined') options.secret = crypto.randomBytes(20)
  if (!Buffer.isBuffer(options.secret)) throw new TypeError('secret must be a buffer')
  if (Buffer.byteLength(options.secret) !== 20) throw new RangeError('secret must be 20 bytes')

  return {
    type: 'hmacsha1',
    id: options.id,
    data: options.secret,
    entropy: 160,
    params: async ({ key }) => {
      const challenge = crypto.randomBytes(64)
      const response = crypto.createHmac('sha1', options.secret).update(challenge).digest()
      const pad = xor(response.subarray(0, 20), options.secret)
      return {
        challenge: challenge.toString('hex'),
        pad: pad.toString('hex')
      }
    },
    output: async () => {
      return { secret: options.secret }
    }
  }
}
module.exports.hmacsha1 = hmacsha1
