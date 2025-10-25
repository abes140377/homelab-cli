import {expect} from 'chai';

import {WorkspaceSchema} from '../../src/models/schemas/workspace.schema.js';
import {WorkspaceRepository} from '../../src/repositories/workspace.repository.js';

describe('WorkspaceRepository', () => {
  let repository: WorkspaceRepository;

  beforeEach(() => {
    repository = new WorkspaceRepository();
  });

  describe('findAll', () => {
    it('should return success Result', async () => {
      const result = await repository.findAll();

      expect(result.success).to.be.true;
    });

    it('should return exactly 3 workspaces', async () => {
      const result = await repository.findAll();

      if (result.success) {
        expect(result.data).to.have.lengthOf(3);
      } else {
        expect.fail('Expected success result');
      }
    });

    it('should return workspaces with all required fields', async () => {
      const result = await repository.findAll();

      if (result.success) {
        for (const workspace of result.data) {
          expect(workspace).to.have.property('id');
          expect(workspace).to.have.property('name');
          expect(workspace).to.have.property('createdAt');
          expect(workspace).to.have.property('updatedAt');
        }
      } else {
        expect.fail('Expected success result');
      }
    });

    it('should return workspaces that pass Zod schema validation', async () => {
      const result = await repository.findAll();

      if (result.success) {
        const validationResult = WorkspaceSchema.array().safeParse(result.data);
        expect(validationResult.success).to.be.true;
      } else {
        expect.fail('Expected success result');
      }
    });

    it('should return consistent data across multiple calls', async () => {
      const result1 = await repository.findAll();
      const result2 = await repository.findAll();

      if (result1.success && result2.success) {
        expect(result1.data).to.have.lengthOf(result2.data.length);
        expect(result1.data[0].id).to.equal(result2.data[0].id);
        expect(result1.data[0].name).to.equal(result2.data[0].name);
      } else {
        expect.fail('Expected success results');
      }
    });

    it('should return immutable data (copy not reference)', async () => {
      const result1 = await repository.findAll();
      const result2 = await repository.findAll();

      if (result1.success && result2.success) {
        // Verify we get copies, not the same reference
        expect(result1.data).to.not.equal(result2.data);
      } else {
        expect.fail('Expected success results');
      }
    });
  });
});
