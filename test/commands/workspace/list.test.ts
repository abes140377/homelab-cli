import {runCommand} from '@oclif/test';
import {expect} from 'chai';

describe('workspace list', () => {
  it('runs workspace list successfully', async () => {
    const {stdout} = await runCommand('workspace list');

    expect(stdout).to.contain('ID');
    expect(stdout).to.contain('NAME');
    expect(stdout).to.contain('CREATED AT');
    expect(stdout).to.contain('UPDATED AT');
  });

  it('displays workspace names from mock data', async () => {
    const {stdout} = await runCommand('workspace list');

    expect(stdout).to.contain('production');
    expect(stdout).to.contain('staging');
    expect(stdout).to.contain('development');
  });

  it('displays workspace IDs from mock data', async () => {
    const {stdout} = await runCommand('workspace list');

    expect(stdout).to.contain('550e8400-e29b-41d4-a716-446655440001');
    expect(stdout).to.contain('550e8400-e29b-41d4-a716-446655440002');
    expect(stdout).to.contain('550e8400-e29b-41d4-a716-446655440003');
  });

  it('formats output as table with headers', async () => {
    const {stdout} = await runCommand('workspace list');

    const lines = stdout.split('\n');

    // Check for header line
    expect(lines[0]).to.contain('ID');
    expect(lines[0]).to.contain('NAME');

    // Check for separator line
    expect(lines[1]).to.match(/^─+$/);

    // Check that we have data rows
    expect(lines.length).to.be.greaterThan(3);
  });
});
