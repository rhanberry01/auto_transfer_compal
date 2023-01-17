import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { GetBranches } from 'App/Models/StockTransfer'
import { CheckConnection } from 'App/Utils'

export default class TenantDb {
  public async handle ({ request }: HttpContextContract, next: () => Promise<void>) {
    
    const branches = await GetBranches()
    const connections = await Promise.all(branches.map(async (row) => {
      return CheckConnection(row.ip)
    }))

    branches.map((branch, index) => {
      if(connections[index].host === branch.ip) {
        branch.connectionStatus = connections[index].alive
        return branch
      }
    })
    
    for (const branch of branches) {
      
      if (branch.connectionStatus) { // create database if connection is okay

   /*      if(branch.code === 'srssanana') { branch.ms_mov_db = 'COMSANANA' }
        if(branch.code === 'srsdeparo') { branch.ms_mov_db = 'COMDEPARO' }
        if(branch.code === 'srsllano') { branch.ms_mov_db = 'COMLLANO' }
        if(branch.code === 'srstala') { branch.ms_mov_db = 'COMTALA' } */

        const tenantConnectionConfig: any = {
          client: 'mssql' as const,
          connection: {
            user: branch.ms_mov_user,
            port: 1433,
            server: branch.ms_mov_host,
            password: branch.ms_mov_pass,
            database: branch.ms_mov_db,
          },
          pool: { min: 2, max: 30, acquireTimeoutMillis: 60 * 1000 }
        }

        const connectionName = `tenant_ms_${branch.code}`
     
        await Database.manager.close(connectionName)
        if (!Database.manager.has(connectionName)) {
          Database.manager.add(connectionName, tenantConnectionConfig)
          Database.manager.connect(connectionName)
        }
        let branch_db_receiving = branch.rs_db;
        
        /* let branch_db_receiving = 'receiving_new'
        if(branch.code === 'srssanana') {
          branch_db_receiving = 'cmpalengke_sanana'
        }

        if(branch.code === 'srsdeparo') {
          branch_db_receiving = 'cmpalengke_deparo'
        }

        if(branch.code === 'srsllano') {
          branch_db_receiving = 'cmpalengke_llano'
        }

        if(branch.code === 'srstala') {
          branch_db_receiving = 'cmpalengke_tala'
        } */

        const tenantConnectionConfigMy: any = {
          client: 'mysql' as const,
          connection: {
            user: 'root',
            port: 3306,
            host: branch.ip,
            password: 'srsnova',
            database: branch_db_receiving,
          }
        }

        const connectionNameMy = `tenant_my_${branch.code}`
        await Database.manager.close(connectionNameMy)
        if (!Database.manager.has(connectionNameMy)) {
          Database.manager.add(connectionNameMy, tenantConnectionConfigMy)
          Database.manager.connect(connectionNameMy)
        }

        let branch_db_transfer = branch.transfer_db;


        const tenantConnectionConfigMyTransfer: any = {
          client: 'mysql' as const,
          connection: {
            user: 'root',
            port: 3306,
            host: branch.ip,
            password: 'srsnova',
            database: branch_db_transfer,
          }
        }


        const connectionNameMyTransfer = `tenant_my_transfer_${branch.code}`
        await Database.manager.close(connectionNameMyTransfer)
        if (!Database.manager.has(connectionNameMyTransfer)) {
          Database.manager.add(connectionNameMyTransfer, tenantConnectionConfigMyTransfer)
          Database.manager.connect(connectionNameMyTransfer)
        }




      } // end if checking connection
    } // end loop branches

    request.connections = branches
    await next()
  }
}

