import {expect} from 'chai'

import {ModuleSchema} from '../../../src/models/schemas/module.schema.js'

describe('ModuleSchema', () => {
  describe('valid data', () => {
    it('should validate module with name and gitRepoUrl', () => {
      const validData = {
        gitRepoUrl: 'git@github.com:user/module.git',
        name: 'my-module',
      }

      const result = ModuleSchema.safeParse(validData)

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.deep.equal(validData)
      }
    })

    it('should allow empty gitRepoUrl for modules without remote', () => {
      const validData = {
        gitRepoUrl: '',
        name: 'local-module',
      }

      const result = ModuleSchema.safeParse(validData)

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data.gitRepoUrl).to.equal('')
      }
    })
  })

  describe('invalid data', () => {
    it('should reject data with missing name', () => {
      const invalidData = {
        gitRepoUrl: 'git@github.com:user/module.git',
      }

      const result = ModuleSchema.safeParse(invalidData)

      expect(result.success).to.be.false
    })

    it('should reject data with empty name', () => {
      const invalidData = {
        gitRepoUrl: 'git@github.com:user/module.git',
        name: '',
      }

      const result = ModuleSchema.safeParse(invalidData)

      expect(result.success).to.be.false
    })

    it('should reject data with missing gitRepoUrl', () => {
      const invalidData = {
        name: 'my-module',
      }

      const result = ModuleSchema.safeParse(invalidData)

      expect(result.success).to.be.false
    })

    it('should reject data with wrong types', () => {
      const invalidData = {
        gitRepoUrl: 123,
        name: true,
      }

      const result = ModuleSchema.safeParse(invalidData)

      expect(result.success).to.be.false
    })
  })
})
