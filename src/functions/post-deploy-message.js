import * as core from '@actions/core'
import {checkInput} from './check-input'
import dedent from 'dedent-js'
import {readFileSync, existsSync} from 'fs'

// Helper function construct a post deployment message
// :param input: The input to check
// :returns: The input if it is valid, null otherwise
export async function postDeployMessage() {
  const environment_url_in_comment =
    core.getInput('environment_url_in_comment') === 'true'

  const tmp = core.getInput('tmp', {required: true})
  const deploy_message_filename = await checkInput(
    core.getInput('deploy_message_filename')
  )

  var deployMessagePath
  if (deploy_message_filename) {
    deployMessagePath = `${tmp}/${deploy_message_filename}`
    core.debug(`deployMessagePath: ${deployMessagePath}`)
  } else {
    core.debug('deploy_message_filename not set, setting to null')
    deployMessagePath = null
  }

  const deployMessageEnvVar = process.env.DEPLOY_MESSAGE

  // open the deployMessagePath file if it is set
  var deployMessage
  if (deployMessagePath) {
    if (existsSync(deployMessagePath)) {
      deployMessage = readFileSync(deployMessagePath, 'utf8')
      core.debug(`deployMessage: ${deployMessage}`)
    } else {
      core.debug('deployMessagePath does not exist, setting to null')
      deployMessage = null
    }
  }

  var deployTypeString = ' ' // a single space as a default

  // Set the mode and deploy type based on the deployment mode
  if (noop === 'true') {
    deployTypeString = ' **noop** '
  }

  // Dynamically set the message text depending if the deployment succeeded or failed
  var message
  var deployStatus
  if (status === 'success') {
    message = `**${context.actor}** successfully${deployTypeString}deployed branch \`${ref}\` to **${environment}**`
    deployStatus = '✅'
  } else if (status === 'failure') {
    message = `**${context.actor}** had a failure when${deployTypeString}deploying branch \`${ref}\` to **${environment}**`
    deployStatus = '❌'
  } else {
    message = `Warning:${deployTypeString}deployment status is unknown, please use caution`
    deployStatus = '⚠️'
  }

  // Conditionally format the message body
  var message_fmt
  if (customMessage && customMessage.length > 0) {
    const customMessageFmt = customMessage
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
    message_fmt = dedent(`
    ### Deployment Results ${deployStatus}

    ${message}
  
    <details><summary>Show Results</summary>
  
    ${customMessageFmt}
  
    </details>
    `)
  } else {
    message_fmt = dedent(`
    ### Deployment Results ${deployStatus}
  
    ${message}
    `)
  }

  // Conditionally add the environment url to the message body
  // This message only gets added if the deployment was successful, and the noop mode is not enabled, and the environment url is not empty
  if (
    environment_url &&
    status === 'success' &&
    noop !== 'true' &&
    environment_url_in_comment === true
  ) {
    const environment_url_short = environment_url
      .replace('https://', '')
      .replace('http://', '')
    message_fmt += `\n\n> **Environment URL:** [${environment_url_short}](${environment_url})`
  }
}
