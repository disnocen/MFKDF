/**
 * @file MFKDF qrcode Factor Derivation
 * @copyright Multifactor 2022 All Rights Reserved
 *
 * @description
 * Derive qrcode factor for multi-factor key derivation
 *
 * @author Vivek Nair (https://nair.me) <vivek@nair.me>
 */
const zxcvbn = require("zxcvbn");

/**
 * Derive an MFKDF Security qrcode factor
 *
 * @example
 * // setup key with security qrcode factor
 * const setup = await mfkdf.setup.key([
 *   await mfkdf.setup.factors.qrcode('@disnocen')
 * ], {size: 8})
 *
 * // derive key with security qrcode factor
 * const derive = await mfkdf.derive.key(setup.policy, {
 *   qrcode: mfkdf.derive.factors.qrcode('@disnocen', '0x34281abc')
 * })
 *
 * setup.key.toString('hex') // -> 01d0c7236adf2516
 * derive.key.toString('hex') // -> 01d0c7236adf2516
 *
 * @param {string} username - The username  from which to derive an MFKDF factor
 * @param {string} salt - The salt  from which to derive an MFKDF factor
 * @returns {function(config:Object): Promise<MFKDFFactor>} Async function to generate MFKDF factor information
 * @author Vivek Nair (https://nair.me) <vivek@nair.me>
 * @since 1.0.0
 * @memberof derive.factors
 */
function qrcode(username, salt) {
  if (typeof username !== "string")
    throw new TypeError("username must be a string");
  if (username.length === 0) throw new RangeError("username cannot be empty");

  if (typeof salt !== "string") throw new TypeError("salt must be a string");
  if (salt.length === 0) throw new RangeError("salt cannot be empty");

  username = username + salt;

  const strength = zxcvbn(username);

  return async (params) => {
    return {
      type: "qrcode",
      data: Buffer.from(username),
      params: async () => {
        return params;
      },
      output: async () => {
        return { strength };
      },
    };
  };
}
module.exports.qrcode = qrcode;
