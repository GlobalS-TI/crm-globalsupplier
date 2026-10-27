import type {
  IIntegrationRepository,
  IntegrationLookupResult,
  IntegrationCompany,
  IntegrationContact,
  IntegrationOpportunity,
} from '@/lib/repositories/interfaces/IIntegrationRepository'
import {
  integrationIdSchema,
  integrationLookupSchema,
  integrationCreateCompanySchema,
  integrationCreateContactSchema,
  integrationCreateOpportunitySchema,
  integrationUpdateOpportunitySchema,
  integrationListOpportunitiesSchema,
  integrationCreateActivitySchema,
  integrationUpdateActivitySchema,
} from '@/lib/validations/integration'

// API de integración externa (ADR-007). El alcance (unidad, dueño, etapas, registros
// autorizados) lo aplica la DB por cliente; aquí sólo se valida la forma de los datos.
export class IntegrationService {
  constructor(private readonly repo: IIntegrationRepository) {}

  async findDuplicates(keyHash: string, raw: unknown): Promise<IntegrationLookupResult> {
    return this.repo.lookup(keyHash, integrationLookupSchema.parse(raw))
  }

  async getCompany(keyHash: string, id: string): Promise<IntegrationCompany> {
    return this.repo.findCompany(keyHash, integrationIdSchema.parse(id))
  }

  async getContact(keyHash: string, id: string): Promise<IntegrationContact> {
    return this.repo.findContact(keyHash, integrationIdSchema.parse(id))
  }

  async createCompany(keyHash: string, raw: unknown): Promise<IntegrationCompany> {
    return this.repo.createCompany(keyHash, integrationCreateCompanySchema.parse(raw))
  }

  async createContact(keyHash: string, raw: unknown): Promise<IntegrationContact> {
    return this.repo.createContact(keyHash, integrationCreateContactSchema.parse(raw))
  }

  async listOpportunities(keyHash: string, raw: unknown): Promise<IntegrationOpportunity[]> {
    return this.repo.findOpportunities(keyHash, integrationListOpportunitiesSchema.parse(raw))
  }

  async getOpportunity(keyHash: string, id: string): Promise<IntegrationOpportunity> {
    return this.repo.findOpportunity(keyHash, integrationIdSchema.parse(id))
  }

  async createOpportunity(keyHash: string, raw: unknown): Promise<IntegrationOpportunity> {
    return this.repo.createOpportunity(keyHash, integrationCreateOpportunitySchema.parse(raw))
  }

  async updateOpportunity(keyHash: string, id: string, raw: unknown): Promise<IntegrationOpportunity> {
    return this.repo.updateOpportunity(
      keyHash,
      integrationIdSchema.parse(id),
      integrationUpdateOpportunitySchema.parse(raw),
    )
  }

  async createActivity(keyHash: string, raw: unknown): Promise<IntegrationOpportunity> {
    return this.repo.createActivity(keyHash, integrationCreateActivitySchema.parse(raw))
  }

  async updateActivity(keyHash: string, id: string, raw: unknown): Promise<IntegrationOpportunity> {
    return this.repo.updateActivity(
      keyHash,
      integrationIdSchema.parse(id),
      integrationUpdateActivitySchema.parse(raw),
    )
  }
}
