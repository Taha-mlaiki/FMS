import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantConnectionManager } from './tenant-connection.manager';

/**
 * Cross-Schema Query Service
 *
 * Used EXCLUSIVELY by platform administrators for global analytics.
 * This service runs SQL queries across multiple farm schemas
 * concurrently and aggregates the results.
 */
@Injectable()
export class CrossSchemaService {
  private readonly logger = new Logger(CrossSchemaService.name);

  constructor(
    private readonly baseDataSource: DataSource,
    private readonly connectionManager: TenantConnectionManager,
  ) {}

  /**
   * Discovers all dynamically created tenant schemas in the database.
   */
  async getAllTenantSchemas(): Promise<string[]> {
    const result = await this.baseDataSource.query(`
      SELECT schema_name 
      FROM public.farms
      WHERE schema_name IS NOT NULL
      AND status <> 'DELETED'
    `);
    return result.map((r: { schema_name: string }) => r.schema_name);
  }

  /**
   * Executes a raw SQL query down into EVERY tenant schema.
   * Note: The query should use the `$$SCHEMA$$` placeholder for schema names.
   * e.g. `SELECT count(*) as count FROM "$$SCHEMA$$"."users"`
   */
  async executeQueryAcrossAllSchemas<T = any>(
    queryTemplate: string,
  ): Promise<{ schema: string; result: T[] }[]> {
    const schemas = await this.getAllTenantSchemas();
    this.logger.log(
      `Executing cross-schema query across ${schemas.length} schemas...`,
    );

    // Run queries concurrently across all schemas
    // Each query gets its own QueryRunner (connection) to avoid
    // concurrent query calls on the same pg client
    const promises = schemas.map(async (schema) => {
      // Replace placeholder with the actual schema name
      const query = queryTemplate.replace(/\$\$SCHEMA\$\$/g, schema);
      const queryRunner = this.baseDataSource.createQueryRunner();

      try {
        await queryRunner.connect();
        const result = await queryRunner.query(query);
        return { schema, result };
      } catch (error: any) {
        this.logger.error(
          `Error executing cross-schema query on schema ${schema}`,
          error,
        );
        // We catch and return error details rather than failing the entire aggregation
        return { schema, result: [], error: error.message };
      } finally {
        await queryRunner.release();
      }
    });

    return Promise.all(promises);
  }
}
