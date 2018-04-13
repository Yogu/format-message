/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const parse = require('..')
const SyntaxError = parse.SyntaxError

describe('parse()', function () {
  it('coerces pattern to a string', function () {
    expect(parse()).to.deep.equal([ 'undefined' ])
    expect(parse(null)).to.deep.equal([ 'null' ])
    expect(parse(12.34)).to.deep.equal([ '12.34' ])
    expect(parse({ toString: function () { return '' } })).to.deep.equal([])
  })

  it('can parse "Hello, World!"', function () {
    const msg = 'Hello, World!'
    expect(parse(msg)).to.deep.equal([ msg ])
  })

  it('can parse "Hello, {name}!"', function () {
    expect(parse('Hello, {name}!')).to.deep.equal([
      'Hello, ',
      [ 'name' ],
      '!'
    ])
  })

  it('can parse "{n,number}"', function () {
    expect(parse('{n,number}')).to.deep.equal([
      [ 'n', 'number' ]
    ])
  })

  it('can parse "{num, number, percent }"', function () {
    expect(parse('{num, number, percent }')).to.deep.equal([
      [ 'num', 'number', 'percent' ]
    ])
  })

  it('can parse "{numPhotos, plural, =0{no photos} =1{one photo} other{# photos}}"', function () {
    const msg = '{numPhotos, plural, =0{no photos} =1{one photo} other{# photos}}'
    expect(parse(msg)).to.deep.equal([
      [ 'numPhotos', 'plural', 0, {
        '=0': [ 'no photos' ],
        '=1': [ 'one photo' ],
        'other': [ [ '#' ], ' photos' ]
      } ]
    ])
  })

  it('can parse "{numGuests, plural, offset:1 =0{no party} one{host and a guest} other{# guests}}"', function () {
    const msg = '{numGuests, plural, offset:1 =0{no party} one{host and a guest} other{# guests}}'
    expect(parse(msg)).to.deep.equal([
      [ 'numGuests', 'plural', 1, {
        '=0': [ 'no party' ],
        'one': [ 'host and a guest' ],
        'other': [ [ '#' ], ' guests' ]
      } ]
    ])
  })

  it('can parse "{rank, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}"', function () {
    const msg = '{rank, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}'
    expect(parse(msg)).to.deep.equal([
      [ 'rank', 'selectordinal', 0, {
        one: [ [ '#' ], 'st' ],
        two: [ [ '#' ], 'nd' ],
        few: [ [ '#' ], 'rd' ],
        other: [ [ '#' ], 'th' ]
      } ]
    ])
  })

  it('can parse "{gender, select, female {woman} male {man} other {person}}"', function () {
    const msg = '{gender, select, female {woman} male {man} other {person}}'
    expect(parse(msg)).to.deep.equal([
      [ 'gender', 'select', {
        female: [ 'woman' ],
        male: [ 'man' ],
        other: [ 'person' ]
      } ]
    ])
  })

  it('can parse "{a, custom, one}"', function () {
    expect(parse('{a, custom, one}')).to.deep.equal([
      [ 'a', 'custom', 'one' ]
    ])
  })

  it('can parse("{<0/>,</>,void}")', function () {
    expect(parse('{<0/>,</>,void}')).to.deep.equal([
      [ '<0/>', '</>', 'void' ]
    ])
  })

  it('can parse "{a,<,>{click here}}"', function () {
    expect(parse('{a,<,>{click here}}')).to.deep.equal([
      [ 'a', '<', {
        '>': [ 'click here' ]
      } ]
    ])
  })

  describe('tokens', function () {
    it('can parse "Hello, World!"', function () {
      const tokens = []
      const msg = 'Hello, World!'
      expect(parse(msg, tokens)).to.deep.equal([ msg ])
      expect(tokens).to.deep.equal([ [ 'text', msg ] ])
    })

    it('can parse "Hello, {name}!"', function () {
      const tokens = []
      expect(parse('Hello, {name}!', tokens)).to.deep.equal([
        'Hello, ',
        [ 'name' ],
        '!'
      ])
      expect(tokens).to.deep.equal([
        [ 'text', 'Hello, ' ],
        [ '{', '{' ],
        [ 'id', 'name' ],
        [ '}', '}' ],
        [ 'text', '!' ]
      ])
    })

    it('can parse "{n,number}"', function () {
      const tokens = []
      expect(parse('{n,number}', tokens)).to.deep.equal([
        [ 'n', 'number' ]
      ])
      expect(tokens).to.deep.equal([
        [ '{', '{' ],
        [ 'id', 'n' ],
        [ ',', ',' ],
        [ 'type', 'number' ],
        [ '}', '}' ]
      ])
    })

    it('can parse "{num, number, percent }"', function () {
      const tokens = []
      expect(parse('{num, number, percent }', tokens)).to.deep.equal([
        [ 'num', 'number', 'percent' ]
      ])
      expect(tokens).to.deep.equal([
        [ '{', '{' ],
        [ 'id', 'num' ],
        [ ',', ',' ],
        [ 'space', ' ' ],
        [ 'type', 'number' ],
        [ ',', ',' ],
        [ 'space', ' ' ],
        [ 'style', 'percent' ],
        [ 'space', ' ' ],
        [ '}', '}' ]
      ])
    })

    it('can parse "{numPhotos, plural, =0{no photos} =1{one photo} other{# photos}}"', function () {
      const tokens = []
      const msg = '{numPhotos, plural, =0{no photos} =1{one photo} other{# photos}}'
      expect(parse(msg, tokens)).to.deep.equal([
        [ 'numPhotos', 'plural', 0, {
          '=0': [ 'no photos' ],
          '=1': [ 'one photo' ],
          'other': [ [ '#' ], ' photos' ]
        } ]
      ])
      expect(tokens).to.deep.equal([
        [ '{', '{' ],
        [ 'id', 'numPhotos' ],
        [ ',', ',' ],
        [ 'space', ' ' ],
        [ 'type', 'plural' ],
        [ ',', ',' ],
        [ 'space', ' ' ],
        [ 'selector', '=0' ],
        [ '{', '{' ],
        [ 'text', 'no photos' ],
        [ '}', '}' ],
        [ 'space', ' ' ],
        [ 'selector', '=1' ],
        [ '{', '{' ],
        [ 'text', 'one photo' ],
        [ '}', '}' ],
        [ 'space', ' ' ],
        [ 'selector', 'other' ],
        [ '{', '{' ],
        [ '#', '#' ],
        [ 'text', ' photos' ],
        [ '}', '}' ],
        [ '}', '}' ]
      ])
    })

    it('can parse "{numGuests, plural, offset:1 =0{no party} one{host and a guest} other{# guests}}"', function () {
      const tokens = []
      const msg = '{numGuests, plural, offset:1 =0{no party} one{host and a guest} other{# guests}}'
      expect(parse(msg, tokens)).to.deep.equal([
        [ 'numGuests', 'plural', 1, {
          '=0': [ 'no party' ],
          'one': [ 'host and a guest' ],
          'other': [ [ '#' ], ' guests' ]
        } ]
      ])
      expect(tokens).to.deep.equal([
        [ '{', '{' ],
        [ 'id', 'numGuests' ],
        [ ',', ',' ],
        [ 'space', ' ' ],
        [ 'type', 'plural' ],
        [ ',', ',' ],
        [ 'space', ' ' ],
        [ 'offset', 'offset' ],
        [ ':', ':' ],
        [ 'number', '1' ],
        [ 'space', ' ' ],
        [ 'selector', '=0' ],
        [ '{', '{' ],
        [ 'text', 'no party' ],
        [ '}', '}' ],
        [ 'space', ' ' ],
        [ 'selector', 'one' ],
        [ '{', '{' ],
        [ 'text', 'host and a guest' ],
        [ '}', '}' ],
        [ 'space', ' ' ],
        [ 'selector', 'other' ],
        [ '{', '{' ],
        [ '#', '#' ],
        [ 'text', ' guests' ],
        [ '}', '}' ],
        [ '}', '}' ]
      ])
    })

    it('can parse "{a,b,c,d}"', function () {
      const tokens = []
      expect(parse('{a,b,c,d}', tokens)).to.deep.equal([
        [ 'a', 'b', 'c,d' ]
      ])
      expect(tokens).to.deep.equal([
        [ '{', '{' ],
        [ 'id', 'a' ],
        [ ',', ',' ],
        [ 'type', 'b' ],
        [ ',', ',' ],
        [ 'style', 'c,d' ],
        [ '}', '}' ]
      ])
    })
  })

  describe('whitespace', function () {
    it('should allow whitespace in and around text elements', function () {
      const msg = '   some random test   '
      const ast = parse(msg)
      expect(ast[0]).to.equal(msg)
    })

    it('should allow whitespace in argument elements', function () {
      expect(parse('{  num , number,percent  }')).to.deep.equal([
        [ 'num', 'number', 'percent' ]
      ])
    })

    it('should consider lots of kinds of whitespace', function () {
      const white = ' \t\v\r\n\u0085\u00A0\u180E\u2001\u2028\u2029\u202F\u205F\u2060\u3000\uFEFF'
      const msg = white + '{' + white + 'p}'
      const tokens = []
      expect(parse(msg, tokens)).to.deep.equal([
        white,
        [ 'p' ]
      ])
      expect(tokens).to.deep.equal([
        [ 'text', white ],
        [ '{', '{' ],
        [ 'space', white ],
        [ 'id', 'p' ],
        [ '}', '}' ]
      ])
    })
  })

  describe('escaping', function () {
    it('should allow escaping of syntax chars via `\'`', function () {
      expect(parse("'{'")[0]).to.equal('{')
      expect(parse("'}'")[0]).to.equal('}')
      expect(parse("''")[0]).to.equal("'")
      expect(parse("'{'''")[0]).to.equal("{'")
      expect(parse('#')[0]).to.equal('#')
      expect(parse("'")[0]).to.equal("'")

      expect(parse("{n,plural,other{#'#'}}")).to.deep.equal([
        [ 'n', 'plural', 0, {
          other: [ [ '#' ], '#' ]
        } ]
      ])
    })

    it('should always start an escape with `\'` in style text', function () {
      expect(parse("{n,date,'a style'}")).to.deep.equal([
        [ 'n', 'date', 'a style' ]
      ])
    })
  })

  it('throws on extra closing brace', function () {
    expect(function () { parse('}') })
      .to.throw(SyntaxError, 'Unexpected } found')
  })

  it('throws on empty placeholder', function () {
    const tokens = []
    expect(function () { parse('{}', tokens) })
      .to.throw(SyntaxError, 'Expected placeholder id but found }')
    expect(tokens).to.deep.equal([
      [ '{', '{' ]
    ])
  })

  it('throws on open brace in placeholder', function () {
    const tokens = []
    expect(function () { parse('{n{', tokens) })
      .to.throw(SyntaxError, 'Expected , or } but found {')
    expect(tokens).to.deep.equal([
      [ '{', '{' ],
      [ 'id', 'n' ]
    ])
  })

  it('throws on missing type', function () {
    const tokens = []
    expect(function () { parse('{n,}', tokens) })
      .to.throw(SyntaxError, 'Expected placeholder type but found }')
    expect(tokens).to.deep.equal([
      [ '{', '{' ],
      [ 'id', 'n' ],
      [ ',', ',' ]
    ])
  })

  it('throws on open brace after type', function () {
    const tokens = []
    expect(function () { parse('{n,d{', tokens) })
      .to.throw(SyntaxError, 'Expected , or } but found {')
    expect(tokens).to.deep.equal([
      [ '{', '{' ],
      [ 'id', 'n' ],
      [ ',', ',' ],
      [ 'type', 'd' ]
    ])
  })

  it('throws on missing style', function () {
    const tokens = []
    expect(function () { parse('{n,t,}', tokens) })
      .to.throw(SyntaxError, 'Expected placeholder style name but found }')
    expect(tokens).to.deep.equal([
      [ '{', '{' ],
      [ 'id', 'n' ],
      [ ',', ',' ],
      [ 'type', 't' ],
      [ ',', ',' ]
    ])
  })

  it('throws on missing sub-messages for select', function () {
    expect(function () { parse('{n,select}') })
      .to.throw(SyntaxError, 'Expected select sub-messages but found }')
  })

  it('throws on missing sub-messages for selectordinal', function () {
    expect(function () { parse('{n,selectordinal}') })
      .to.throw(SyntaxError, 'Expected selectordinal sub-messages but found }')
  })

  it('throws on missing sub-messages for plural', function () {
    expect(function () { parse('{n,plural}') })
      .to.throw(SyntaxError, 'Expected plural sub-messages but found }')
  })

  it('throws on missing other for select', function () {
    expect(function () { parse('{n,select,}') })
      .to.throw(SyntaxError, '"other" sub-message must be specified in select')
  })

  it('throws on missing other for selectordinal', function () {
    expect(function () { parse('{n,selectordinal,}') })
      .to.throw(SyntaxError, '"other" sub-message must be specified in selectordinal')
  })

  it('throws on missing other for plural', function () {
    expect(function () { parse('{n,plural,}') })
      .to.throw(SyntaxError, '"other" sub-message must be specified in plural')
  })

  it('throws on missing selector', function () {
    expect(function () { parse('{n,select,{a}}') })
      .to.throw(SyntaxError, 'Expected sub-message selector but found {')
  })

  it('throws on missing { for sub-message', function () {
    expect(function () { parse('{n,select,other a}') })
      .to.throw(SyntaxError, 'Expected { to start sub-message but found a')
  })

  it('throws on missing } for sub-message', function () {
    expect(function () { parse('{n,select,other{a') })
      .to.throw(SyntaxError, 'Expected } to end sub-message but found end of message pattern')
  })

  it('throws on missing offset number', function () {
    const tokens = []
    expect(function () { parse('{n,plural,offset:}', tokens) })
      .to.throw(SyntaxError, 'Expected offset number but found }')
    expect(tokens).to.deep.equal([
      [ '{', '{' ],
      [ 'id', 'n' ],
      [ ',', ',' ],
      [ 'type', 'plural' ],
      [ ',', ',' ],
      [ 'offset', 'offset' ],
      [ ':', ':' ]
    ])
  })

  it('throws on missing closing brace', function () {
    const tokens = []
    expect(function () { parse('{a,b,c', tokens) })
      .to.throw(SyntaxError, 'Expected } but found end of message pattern')
    expect(tokens).to.deep.equal([
      [ '{', '{' ],
      [ 'id', 'a' ],
      [ ',', ',' ],
      [ 'type', 'b' ],
      [ ',', ',' ],
      [ 'style', 'c' ]
    ])
  })
})