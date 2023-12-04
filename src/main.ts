import * as core from '@actions/core';
import { getOctokit, context } from '@actions/github';
import { PayloadRepository } from '@actions/github/lib/interfaces';

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const { graphql } = getOctokit(
      core.getInput('github-token', { required: true })
    );

    const response = await graphql<PayloadRepository>(
      `
        query ($owner: String!, $name: String!, $number: Int!) {
          repository(owner: $owner, name: $name) {
            pullRequest(number: $number) {
              id
              closingIssuesReferences(first: 10) {
                nodes {
                  number
                  title
                }
              }
            }
          }
        }
      `,
      {
        owner: context.repo.owner,
        name: context.repo.repo,
        number: context.issue.number
      }
    );

    const issues = response.repository.pullRequest.closingIssuesReferences
      .nodes as {
      number: number;
      title: string;
    }[];

    core.startGroup('Issues to close');

    for (const issue of issues) {
      core.info(`#${issue.number} ${issue.title}`);
    }

    core.endGroup();

    core.setOutput('issues', JSON.stringify(issues));
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}
