import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

// Each legal page is a single fixed document, so editors open it from the
// sidebar instead of creating (and possibly duplicating) legal documents.
const LEGAL_PAGES = [
  {id: 'privacyPolicy', title: 'Privacy Policy', docType: 'privacy'},
  {id: 'termsOfService', title: 'Terms of Service', docType: 'terms'},
]
const LEGAL_TEMPLATE_IDS = LEGAL_PAGES.map((page) => `legal-${page.docType}`)

export default defineConfig({
  name: 'default',
  title: 'gb-jojo',

  projectId: 'wssoiuia',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Legal Pages')
              .child(
                S.list()
                  .title('Legal Pages')
                  .items(
                    LEGAL_PAGES.map((page) =>
                      S.listItem()
                        .title(page.title)
                        .id(page.id)
                        .child(
                          S.document()
                            .schemaType('legalDocument')
                            .documentId(page.id)
                            .initialValueTemplate(`legal-${page.docType}`)
                            .title(page.title),
                        ),
                    ),
                  ),
              ),
            S.divider(),
            ...S.documentTypeListItems().filter((item) => item.getId() !== 'legalDocument'),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
    templates: (prev) => [
      ...prev.filter((template) => template.schemaType !== 'legalDocument'),
      ...LEGAL_PAGES.map((page) => ({
        id: `legal-${page.docType}`,
        title: page.title,
        schemaType: 'legalDocument',
        value: {docType: page.docType, title: page.title},
      })),
    ],
  },

  document: {
    // Keep legal pages out of the global "Create new" menu
    newDocumentOptions: (prev, {creationContext}) =>
      creationContext.type === 'global'
        ? prev.filter((item) => !LEGAL_TEMPLATE_IDS.includes(item.templateId))
        : prev,
    // Legal pages can be edited and published, not duplicated or deleted
    actions: (prev, {schemaType}) =>
      schemaType === 'legalDocument'
        ? prev.filter(({action}) => !['duplicate', 'delete'].includes(action))
        : prev,
  },
})
