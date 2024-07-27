import assert from 'assert/strict'

import { placeholder } from '../src/helper/placeholder.js'

describe('placeholder', () => {
  it('placeholder', () => {
    let res = placeholder('test :user :userId', { user: 'a', userId: 'b' })
    assert.equal(res, 'test a b')
    res = placeholder('test :user :user2Id', { user: 'a', userId: 'b' })
    assert.equal(res, 'test a :user2Id')
    res = placeholder('test :user :user.id :user.test.a.b', { user: { id: 'test' }, userId: 'b' })
    assert.equal(res, 'test [object Object] test :user.test.a.b')
    res = placeholder('test : test', { user: { id: 'test' }, userId: 'b' })
    assert.equal(res, 'test : test')
    res = placeholder('test :user.length test', { user: ['a'] })
    assert.equal(res, 'test 1 test')


    res = placeholder(5 as any as string, { user: ['a'] })
    assert.equal(res, '5')
  })
})

