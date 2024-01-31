// outdated_mode

import * as core from '@actions/core'
import {COLORS} from './colors'

export async function isOutdated(context, octokit, data) {
  // Check to see if the branch is behind the base branch
  var outdated = false
  // if the mergeStateStatus is not 'BEHIND', then we need to make some comparison API calls to double check in case it is actually behind
  if (data.mergeStateStatus !== 'BEHIND') {
    // Make an API call to compare the base branch and the PR branch
    const compare = await octokit.rest.repos.compareCommits({
      ...context.repo,
      base: data.baseBranch.data.commit.sha,
      head: data.pr.data.head.sha
    })

    // If the PR branch is behind the base branch, set the outdated variable to true
    if (compare.data.behind_by > 0) {
      core.warning(
        `The PR branch is behind the base branch by ${COLORS.highlight}${compare.data.behind_by} commits${COLORS.reset}`
      )
      outdated = true
    } else {
      core.debug(`The PR branch is not behind the base branch - OK`)
      outdated = false
    }

    // If the mergeStateStatus is 'BEHIND' set the outdated variable to true because we know for certain it is behind the target branch we plan on merging into
  } else if (data.mergeStateStatus === 'BEHIND') {
    core.warning(
      `The PR branch is behind the base branch since mergeStateStatus is ${COLORS.highlight}BEHIND${COLORS.reset}`
    )
    outdated = true
  }

  return outdated
}
