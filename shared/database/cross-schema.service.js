'use strict';
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return (c > 3 && r && Object.defineProperty(target, key, r), r);
  };
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v);
  };
var CrossSchemaService_1;
Object.defineProperty(exports, '__esModule', { value: true });
exports.CrossSchemaService = void 0;
const common_1 = require('@nestjs/common');
const typeorm_1 = require('typeorm');
const tenant_connection_manager_1 = require('./tenant-connection.manager');
/**
 * Cross-Schema Query Service
 *
 * Used EXCLUSIVELY by platform administrators for global analytics.
 * This service runs SQL queries across multiple farm schemas
 * concurrently and aggregates the results.
 */
let CrossSchemaService = (CrossSchemaService_1 = class CrossSchemaService {
  constructor(baseDataSource, connectionManager) {
    this.baseDataSource = baseDataSource;
    this.connectionManager = connectionManager;
    this.logger = new common_1.Logger(CrossSchemaService_1.name);
  }
  /**
   * Discovers all dynamically created tenant schemas in the database.
   */
  async getAllTenantSchemas() {
    const result = await this.baseDataSource.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'farm_%'
    `);
    return result.map((r) => r.schema_name);
  }
  /**
   * Executes a raw SQL query down into EVERY tenant schema.
   * Note: The query should use the `$$SCHEMA$$` placeholder for schema names.
   * e.g. `SELECT count(*) as count FROM "$$SCHEMA$$"."users"`
   */
  async executeQueryAcrossAllSchemas(queryTemplate) {
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
      } catch (error) {
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
});
exports.CrossSchemaService = CrossSchemaService;
exports.CrossSchemaService =
  CrossSchemaService =
  CrossSchemaService_1 =
    __decorate(
      [
        (0, common_1.Injectable)(),
        __metadata('design:paramtypes', [
          typeorm_1.DataSource,
          tenant_connection_manager_1.TenantConnectionManager,
        ]),
      ],
      CrossSchemaService,
    );
//# sourceMappingURL=cross-schema.service.js.map
