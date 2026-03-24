import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Schema Service
 *
 * Handles the physical creation and validation of PostgreSQL schemas.
 */
@Injectable()
export class SchemaService {
  private readonly logger = new Logger(SchemaService.name);
  private static readonly PG_IDENTIFIER_MAX_LENGTH = 63;

  constructor(private readonly baseDataSource: DataSource) {}

  private isValidUuid(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  private slugifyTenantName(name: string): string {
    const normalized = name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_{2,}/g, '_');

    return normalized || 'farm';
  }

  /**
   * Format a UUID into a valid PostgreSQL schema name.
   *
   * - Default/legacy format (if tenantName not provided): farm_uuid_with_underscores
   * - Name-first format: tenant_name_uuidwithoutdashes
   */
  formatSchemaName(tenantId: string, tenantName?: string): string {
    if (!this.isValidUuid(tenantId)) {
      throw new Error(
        `Invalid tenant ID format: ${tenantId}. Must be a valid UUID.`,
      );
    }

    if (!tenantName) {
      return `farm_${tenantId.replace(/-/g, '_')}`;
    }

    const uuidPart = tenantId.replace(/-/g, '').toLowerCase();
    const safeName = this.slugifyTenantName(tenantName);
    const maxPrefixLength = Math.max(
      1,
      SchemaService.PG_IDENTIFIER_MAX_LENGTH - uuidPart.length - 1,
    );
    const prefix = safeName.slice(0, maxPrefixLength);

    return `${prefix}_${uuidPart}`;
  }

  /**
   * Physically create the schema in the PostgreSQL database
   */
  async createSchema(schemaName: string): Promise<string> {
    this.logger.log(`Creating database schema: ${schemaName}`);

    // We must execute raw SQL to create a schema
    await this.baseDataSource.query(
      `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`,
    );

    return schemaName;
  }

  /**
   * Delete a schema permanently (DANGER)
   */
  async dropSchema(schemaName: string): Promise<void> {
    this.logger.warn(`DROPPING database schema and all data: ${schemaName}`);

    // CASCADE means all tables inside the schema will be deleted too
    await this.baseDataSource.query(
      `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`,
    );
  }
}
