import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Tenant Connection Manager
 *
 * Manages TypeORM DataSource instances per tenant (farm).
 * Instead of one huge database connection pool, we create
 * specific connections mapped to specific PostgreSQL schemas.
 */
@Injectable()
export class TenantConnectionManager {
  private readonly logger = new Logger(TenantConnectionManager.name);

  // Cache of existing connections: Record<SchemaName, DataSource>
  private readonly tenantDataSources: Record<string, DataSource> = {};

  constructor(private readonly baseDataSource: DataSource) {}

  private isValidUuid(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  private getLegacySchemaName(tenantId: string): string {
    return `farm_${tenantId.replace(/-/g, '_')}`;
  }

  private async resolveSchemaName(tenantId: string): Promise<string> {
    try {
      // Use SELECT * to avoid hard-coding one column naming style.
      // Some environments use camelCase (schemaName), others snake_case (schema_name).
      const farms = await this.baseDataSource.query(
        `SELECT * FROM public.farms WHERE id = $1 LIMIT 1`,
        [tenantId],
      );

      const schemaName = farms?.[0]?.schemaName ?? farms?.[0]?.schema_name;
      if (schemaName) {
        return schemaName as string;
      }
    } catch (e) {
      this.logger.debug(
        `Could not query public.farms for tenant resolution (likely because this service uses an isolated database). Falling back to deterministic naming.`,
      );
    }

    if (this.isValidUuid(tenantId)) {
      return this.getLegacySchemaName(tenantId);
    }

    throw new Error(`Cannot resolve schema for tenant: ${tenantId}`);
  }

  /**
   * Return a list of all active tenant UUIDs by introspecting Postgres
   * and extracting the UUID from `farm_<uuid>` schemas.
   */
  async getAllTenantSchemas(): Promise<string[]> {
    const result = await this.baseDataSource.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'farm_%'`,
    );
    const tenants: string[] = [];
    for (const r of result) {
      if (typeof r.schema_name === 'string') {
        const id = r.schema_name.replace('farm_', '').replace(/_/g, '-');
        if (this.isValidUuid(id)) {
          tenants.push(id);
        }
      }
    }
    return tenants;
  }

  /**
   * Get or create a DataSource for a specific tenant schema.
   *
   * JIT provisioning: if the schema does not exist yet it is created
   * automatically so the caller always gets a working connection with
   * synchronised tables (empty data on first access).
   */
  async getTenantConnection(tenantId: string): Promise<DataSource> {
    const schemaName = await this.resolveSchemaName(tenantId);

    // 1. Check if we already have a cached connection
    if (this.tenantDataSources[schemaName]) {
      const dataSource = this.tenantDataSources[schemaName];
      if (dataSource.isInitialized) {
        return dataSource;
      }
      // Dead connection – remove from cache so we recreate below
      delete this.tenantDataSources[schemaName];
    }

    // 2. We don't have it (or it disconnected), so create a new one
    this.logger.debug(`Creating new DataSource for schema: ${schemaName}`);

    // 2.a Ensure the schema exists in the local database (JIT provisioning)
    await this.baseDataSource.query(
      `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`,
    );

    // 2.b Extract entity classes that NestJS registered with the base DataSource.
    //     `autoLoadEntities` is a NestJS abstraction – it populates
    //     baseDataSource.entityMetadatas at startup. We pull the concrete
    //     classes from there so the tenant DataSource has the same metadata.
    const entities = this.baseDataSource.entityMetadatas.map(
      (m) => m.target as Function,
    );

    // 2.c Build clean TypeORM-only options (no NestJS flags like autoLoadEntities)
    const base = this.baseDataSource.options as Record<string, any>;

    const tenantDataSource = new DataSource({
      type: 'postgres',
      host: base.host,
      port: base.port,
      username: base.username,
      password: base.password,
      database: base.database,
      ssl: base.ssl,
      name: schemaName,
      schema: schemaName,
      entities,
      // Always synchronize tenant schemas so tables are auto-created.
      // The base DataSource should have synchronize: false to avoid
      // creating tables in the public schema.
      synchronize: true,
      logging: base.logging ?? false,
    });

    await tenantDataSource.initialize();

    // Cache the connection
    this.tenantDataSources[schemaName] = tenantDataSource;

    return tenantDataSource;
  }
}
