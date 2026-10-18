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

// Types edited only through their fixed sidebar entries (no create/duplicate/delete).
const SINGLE_PAGE_TYPES = ['legalDocument', 'aboutPage']
const HIDDEN_TEMPLATE_IDS = [...LEGAL_TEMPLATE_IDS, 'aboutPage']

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
              .title('About Page')
              .id('aboutPage')
              .child(S.document().schemaType('aboutPage').documentId('aboutPage').title('About Page')),
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
            ...S.documentTypeListItems().filter((item) => !SINGLE_PAGE_TYPES.includes(item.getId())),
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
    // Keep single pages out of the global "Create new" menu
    newDocumentOptions: (prev, {creationContext}) =>
      creationContext.type === 'global'
        ? prev.filter((item) => !HIDDEN_TEMPLATE_IDS.includes(item.templateId))
        : prev,
    // Single pages can be edited and published, not duplicated or deleted
    actions: (prev, {schemaType}) =>
      SINGLE_PAGE_TYPES.includes(schemaType)
        ? prev.filter(({action}) => !['duplicate', 'delete'].includes(action))
        : prev,
  },
})
