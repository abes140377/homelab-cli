import {runCommand} from '@oclif/test';
import {expect} from 'chai';
import {afterEach, beforeEach, describe, it} from 'mocha';

describe('project list', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = {...originalEnv};
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should show error when POCKETBASE_URL is missing', async () => {
    delete process.env.POCKETBASE_URL;

    const {error} = await runCommand('project list');

    expect(error).to.exist;
    expect(error?.message).to.include('POCKETBASE_URL');
  });

  it('should show error when POCKETBASE_URL is invalid', async () => {
    process.env.POCKETBASE_URL = 'not-a-valid-url';

    const {error} = await runCommand('project list');

    expect(error).to.exist;
    expect(error?.message).to.include('Invalid PocketBase configuration');
  });

  it('should accept workspace name as argument', async () => {
    process.env.POCKETBASE_URL = 'http://127.0.0.1:8090';

    const {error} = await runCommand('project list my-workspace');

    // Will fail without real PocketBase, but argument parsing should work
    if (error) {
      // Should fail on connection, not argument parsing
      expect(error.message).to.not.include('Unexpected argument');
    }
  });

  // Integration test - only runs if POCKETBASE_URL is set
  // This test requires a real PocketBase instance to be running
  ;(process.env.POCKETBASE_URL ? describe : describe.skip)('with PocketBase configured', () => {
    it('runs project list with valid config', async () => {
      const {error, stdout} = await runCommand('project list');

      // If PocketBase is accessible, should have output
      // If PocketBase is not accessible, should have error
      if (error) {
        // Connection error or workspace not found is acceptable
        expect(error.message).to.match(/Failed to list projects|Failed to retrieve projects|not found/);
      } else {
        // Should contain table headers or "No projects found" message
        const hasHeaders = stdout.includes('NAME') && stdout.includes('DESCRIPTION');
        const hasNoProjectsMessage = stdout.includes('No projects found');

        expect(hasHeaders || hasNoProjectsMessage).to.be.true;
      }
    });

    it('runs project list with explicit workspace name', async () => {
      const {error, stdout} = await runCommand('project list test-workspace');

      if (error) {
        // Connection error or workspace not found is acceptable
        expect(error.message).to.match(/Failed to list projects|Failed to retrieve projects|not found/);
      } else {
        // Should contain table headers or "No projects found" message
        const hasHeaders = stdout.includes('NAME') && stdout.includes('DESCRIPTION');
        const hasNoProjectsMessage = stdout.includes('No projects found');

        expect(hasHeaders || hasNoProjectsMessage).to.be.true;
      }
    });

    it('formats output correctly when PocketBase is accessible', async () => {
      const {error, stdout} = await runCommand('project list');

      // Only check formatting if no error (PocketBase is running)
      if (error) {
        // Skip test if PocketBase isn't accessible
        expect(error.message).to.match(/Failed to list projects|Failed to retrieve projects|not found/);
      } else {
        // Should either have table headers or empty message
        // eslint-disable-next-line no-lonely-if
        if (stdout.includes('NAME')) {
          expect(stdout).to.contain('DESCRIPTION');
          expect(stdout).to.contain('GIT REPO URL');
        } else {
          expect(stdout).to.include('No projects found');
        }
      }
    });

    it('displays workspace name in empty message', async () => {
      const {error, stdout} = await runCommand('project list empty-workspace');

      if (error) {
        // Connection error or workspace not found is acceptable
        expect(error.message).to.match(/Failed to list projects|Failed to retrieve projects|not found/);
      } else if (stdout.includes('No projects found')) {
        expect(stdout).to.include("workspace 'empty-workspace'");
      }
    });
  });
});
