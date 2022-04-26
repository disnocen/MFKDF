/**
 * @file Multi-factor Key Derivation
 * @copyright Multifactor 2022 All Rights Reserved
 *
 * @description
 * Derive a multi-factor derived key
 *
 * @author Vivek Nair (https://nair.me) <vivek@nair.me>
 */

const Ajv = require('ajv')
const policySchema = require('../../site/schema/v1.0.0/policy.json')
const combine = require('../secrets/combine').combine
const recover = require('../secrets/recover').recover
const kdf = require('../kdf').kdf
const { hkdf } = require('@panva/hkdf')
const xor = require('buffer-xor')
const MFKDFDerivedKey = require('../classes/MFKDFDerivedKey')

/**
   * Derive a key from multiple factors of input
   *
   * @example
   * const key = await mfkdf.derive.key( ... );
   *
   * @param {Object} policy - The key policy for the key being derived
   * @param {Object.<string, MFKDFFactor>} factors - Factors used to derive this key
   * @returns {MFKDFDerivedKey} A multi-factor derived key object
   * @author Vivek Nair (https://nair.me) <vivek@nair.me>
   * @since 0.9.0
   * @async
   * @memberOf derive
   */
async function key (policy, factors) {
  const ajv = new Ajv()
  const valid = ajv.validate(policySchema, policy)
  if (!valid) throw new TypeError('invalid key policy', ajv.errors)
  if (Object.keys(factors).length < policy.threshold) throw new RangeError('insufficient factors provided to derive key')

  const shares = []
  const newFactors = []

  for (const factor of policy.factors) {
    if (factors[factor.id] && typeof factors[factor.id] === 'function') {
      const material = await factors[factor.id](factor.params)
      let share

      if (material.type === 'persisted') {
        share = material.data
      } else {
        if (material.type !== factor.type) throw new TypeError('wrong factor material function used for this factor type')

        const pad = Buffer.from(factor.pad, 'base64')
        let stretched = Buffer.from(await hkdf('sha512', material.data, '', '', policy.size))
        if (Buffer.byteLength(pad) > policy.size) stretched = Buffer.concat([Buffer.alloc(Buffer.byteLength(pad) - policy.size), stretched])

        share = xor(pad, stretched)
      }

      shares.push(share)
      newFactors.push(material.params)
    } else {
      shares.push(null)
      newFactors.push(null)
    }
  }

  if (shares.filter(x => Buffer.isBuffer(x)).length < policy.threshold) throw new RangeError('insufficient factors provided to derive key')

  const secret = combine(shares, policy.threshold, policy.factors.length)
  const key = await kdf(secret, Buffer.from(policy.salt, 'base64'), policy.size, policy.kdf)

  const newPolicy = JSON.parse(JSON.stringify(policy))

  for (const [index, factor] of newFactors.entries()) {
    if (typeof factor === 'function') {
      newPolicy.factors[index].params = await factor({ key })
    }
  }

  const originalShares = recover(shares, policy.threshold, policy.factors.length)

  return new MFKDFDerivedKey(newPolicy, key, secret, originalShares)
}
module.exports.key = key
