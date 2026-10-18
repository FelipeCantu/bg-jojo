import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'wssoiuia',
    dataset: 'production'
  },
  // Asset URLs in the built Studio start with this path (served at givebackjojo.org/studio)
  project: {
    basePath: '/studio',
  },
  /**
   * Enable auto-updates for studios.
   * Learn more at https://www.sanity.io/docs/cli#auto-updates
   */
  autoUpdates: true,
})
