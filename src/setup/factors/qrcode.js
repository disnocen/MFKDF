/**
 * @file MFKDF QRcode Factor Setup
 * @copyright Multifactor 2022 All Rights Reserved
 *
 * @description
 * Setup QRcode factor for multi-factor key derivation
 *
 * @author Vivek Nair (https://nair.me) <vivek@nair.me>
 */
const defaults = require("../../defaults");
const zxcvbn = require("zxcvbn");
const crypto = require("crypto");

/**
 * Setup an MFKDF Security QRcode factor
 *
 * @example
 * // setup key with security QRcode factor
 * const setup = await mfkdf.setup.key([
 *   await mfkdf.setup.factors.qrcode('@disnocen')
 * ], {size: 8})
 *
 * // derive key with security QRcode factor
 * const derive = await mfkdf.derive.key(setup.policy, {
 *   QRcode: mfkdf.derive.factors.qrcode('@disnocen')
 * })
 *
 * setup.key.toString('hex') // -> 01d0c7236adf2516
 * derive.key.toString('hex') // -> 01d0c7236adf2516
 *
 * @param {string} username - The username from which to derive an MFKDF factor
 * @param {string} salt - The salt from which to derive an MFKDF factor
 * @param {Object} [options] - Configuration options
 * @param {string} [options.id='qrcode'] - Unique identifier for this factor
 * @returns {MFKDFFactor} MFKDF factor information
 * @author Vivek Nair (https://nair.me) <vivek@nair.me>
 * @since 1.0.0
 * @async
 * @memberof setup.factors
 */
async function qrcode(username, options) {
  if (typeof username !== "string")
    throw new TypeError("username must be a string");
  if (username.length === 0) throw new RangeError("username cannot be empty");
  const saltSize = 32; // in bytes
  const salt = crypto.randomBytes(saltSize).toString("hex");

  console.log(
    "Be sure to save this salt, since it will be required later and cannot be recovered. you will lose access to it if you ever lose it.\n",
    salt
  );
  if (typeof salt !== "string") throw new TypeError("salt must be a string");
  if (salt.length === 0) throw new RangeError("salt cannot be empty");

  options = Object.assign(Object.assign({}, defaults.qrcode), options);
  if (typeof options.id !== "string")
    throw new TypeError("id must be a string");
  if (options.id.length === 0) throw new RangeError("id cannot be empty");

  if (typeof options.qrcode === "undefined") options.qrcode = "";
  if (typeof options.qrcode !== "string")
    throw new TypeError("qrcode must be a string");

  const data = username + salt;
  const strength = zxcvbn(data);

  return {
    type: "qrcode",
    id: options.id,
    entropy: Math.log2(strength.guesses),
    data: Buffer.from(data),
    params: async () => {
      return {};
    },
    output: async () => {
      return { strength };
    },
  };
}
module.exports.qrcode = qrcode;
