import * as core from '@actions/core'
import * as io from '@actions/io'
import * as inputHelper from 'checkout/lib/input-helper'
import {GitCommandManager} from './git-command-manager'
import * as gitSourceProvider from 'checkout/lib/git-source-provider'
import * as inputValidator from './input-validator'
import {PullsHelper} from './pulls-helper'
import {RebaseHelper} from './rebase-helper'
import {inspect} from 'util'
import {v4 as uuidv4} from 'uuid'

async function run(): Promise<void> {
  try {
    const inputs = {
      token: core.getInput('token'),
      repository: core.getInput('repository'),
      head: core.getInput('head'),
      base: core.getInput('base').startsWith('refs/heads/')
        ? core.getInput('base').substr('refs/heads/'.length)
        : core.getInput('base')
    }
    core.info(`Inputs: ${inspect(inputs)}`)
    console.log(`Inputs: ${inspect(inputs)}`)

    const [headOwner, head] = inputValidator.parseHead(inputs.head)

    const pullsHelper = new PullsHelper(inputs.token)
    const pulls = await pullsHelper.get(
      inputs.repository,
      head,
      headOwner,
      inputs.base
    )
    core.info('info')
    core.info(head)
    core.info(headOwner)
    core.info(inspect(inputs))
    if (pulls.length > 0) {
      core.info(`${pulls.length} pull request(s) found.`)

      // Checkout
      const path = uuidv4()
      process.env['INPUT_PATH'] = path
      process.env['INPUT_REF'] = inputs.base
      process.env['INPUT_FETCH-DEPTH'] = '0'
      process.env['INPUT_PERSIST-CREDENTIALS'] = 'true'
      const sourceSettings = inputHelper.getInputs()
      core.debug(`sourceSettings: ${inspect(sourceSettings)}`)
      await gitSourceProvider.getSource(sourceSettings)

      // Rebase
      // Create a git command manager
      const git = await GitCommandManager.create(sourceSettings.repositoryPath)
      const rebaseHelper = new RebaseHelper(git)
      let rebasedCount = 0
      for (const pull of pulls) {
        try {
          core.info(`Pulls: ${inspect(pull)}`)
          if (pull.headRepoName !== 'ethereum/remix-project') {
            core.info('skipping PR')
            continue
          }
          let found = false
          for (const label of pull.labels.edges) {     
            core.info(`Pulls: ${inspect(pull)}`)
            core.info(`Labels: ${inspect(pull.labels.edges)}`)
            if (label.node.name === 'autorebase') {
              found = true
              break
            }
          }         
         
          if (!found) {
            core.info('skipping PR, autorebase label not set')
            continue
          }

          const result = await rebaseHelper.rebase(pull)
          if (result) rebasedCount++          
        } catch (e) {
          core.info('rebasing failed ' + e.message)
        }        
      }

      // Output count of successful rebases
      core.setOutput('rebased-count', rebasedCount)

      // Delete the repository
      core.debug(`Removing repo at '${sourceSettings.repositoryPath}'`)
      try {
        await io.rmRF(sourceSettings.repositoryPath)
      } catch (e) {
        core.info('cleanup failed ' + e.message)
      }
    } else {
      core.info('No pull requests found.')
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
