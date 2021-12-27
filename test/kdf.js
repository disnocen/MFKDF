/* eslint no-unused-expressions: "off" */
require('chai').should()
const mfkdf = require('../src')
const { suite, test } = require('mocha')

suite('kdf', () => {
  test('pbkdf2/sha1', async () => {
    const key = await mfkdf.kdf('password', 'salt', {
      kdf: 'pbkdf2',
      size: 16,
      pbkdf2rounds: 25555,
      pbkdf2digest: 'sha1'
    })
    key.should.equal('8ee4a527b20aa8feeb78d70447d84e20')
  })

  test('pbkdf2/sha512', async () => {
    const key = await mfkdf.kdf('secret', 'salt', {
      kdf: 'pbkdf2',
      size: 64,
      pbkdf2rounds: 100000,
      pbkdf2digest: 'sha512'
    })
    key.should.equal('3745e482c6e0ade35da10139e797157f4a5da669dad7d5da88ef87e47471cc47ed941c7ad618e827304f083f8707f12b7cfdd5f489b782f10cc269e3c08d59ae')
  })

  test('pbkdf2/default', async () => {
    const key1 = await mfkdf.kdf('test', '', {
      kdf: 'pbkdf2'
    })
    const key2 = await mfkdf.kdf('test', '', {
      kdf: 'pbkdf2',
      size: 32,
      pbkdf2rounds: 310000,
      pbkdf2digest: 'sha256'
    })
    key1.should.equal(key2)
  })

  test('bcrypt/same', async () => {
    const key1 = await mfkdf.kdf('password1', 'salt1', { kdf: 'bcrypt' })
    const key2 = await mfkdf.kdf('password1', 'salt1', { kdf: 'bcrypt' })
    key1.should.equal(key2)
  })

  test('bcrypt/inputdiff', async () => {
    const key1 = await mfkdf.kdf('password1', 'salt1', { kdf: 'bcrypt' })
    const key2 = await mfkdf.kdf('password2', 'salt1', { kdf: 'bcrypt' })
    key1.should.not.equal(key2)
  })

  test('bcrypt/saltdiff', async () => {
    const key1 = await mfkdf.kdf('password1', 'salt1', { kdf: 'bcrypt' })
    const key2 = await mfkdf.kdf('password1', 'salt2', { kdf: 'bcrypt' })
    key1.should.not.equal(key2)
  })

  test('bcrypt/rounddiff', async () => {
    const key1 = await mfkdf.kdf('password1', 'salt1', { kdf: 'bcrypt', bcryptrounds: 10 })
    const key2 = await mfkdf.kdf('password1', 'salt2', { kdf: 'bcrypt', bcryptrounds: 11 })
    key1.should.not.equal(key2)
  })

  test('bcrypt/length', async () => {
    const key16 = await mfkdf.kdf('password', 'salt', { kdf: 'bcrypt', size: 16 })
    Buffer.byteLength(Buffer.from(key16, 'hex')).should.equal(16)

    const key32 = await mfkdf.kdf('password', 'salt', { kdf: 'bcrypt', size: 32 })
    Buffer.byteLength(Buffer.from(key32, 'hex')).should.equal(32)

    const key64 = await mfkdf.kdf('password', 'salt', { kdf: 'bcrypt', size: 64 })
    Buffer.byteLength(Buffer.from(key64, 'hex')).should.equal(64)
  })

  test('bcrypt/known', async () => {
    const observed = await mfkdf.kdf('password', 'salt', { kdf: 'bcrypt' })
    observed.should.equal('cb36d3d02d502acdf10dfc2d022bf3c024f16a368ba2df4456fbf97291f64334')
  })
})
